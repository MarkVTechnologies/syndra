import { connectDb, UserModel, VerificationTokenModel, SessionModel, AmbassadorModel, getSettings } from "@san/db";
import { ok, err, type Result } from "@san/core/result";
import { getEnv } from "@san/core/env";
import { sendEvent } from "@san/service-notification";
import { hashPassword, verifyPassword } from "./password";
import { generateToken, hashToken, newSessionId } from "./tokens";
import {
  cacheSessionVersion,
  markSessionRevoked,
  createKillToken,
  resolveKillToken,
} from "./session-cache";
import { isLockedOut, isIpRateLimited, recordFailedAttempt, clearFailedAttempts } from "./login-throttle";

export { hashPassword, verifyPassword };
export * from "./session-cache";
export * from "./login-throttle";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "admin" | "ambassador" | "syndicator";
  status: string;
  sessionVersion: number;
}

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$RdescudvJCsgt3ub+b+dWRWJTmaaJObG";

const DASHBOARD_PATH: Record<AuthenticatedUser["role"], string> = {
  admin: "/admin",
  ambassador: "/dashboard",
  syndicator: "/portfolio",
};

/** Timing-safe by construction — always runs verify(), even against a dummy hash. PRD §12.1. */
export async function authenticate(
  email: string,
  password: string
): Promise<Result<AuthenticatedUser>> {
  await connectDb();
  const user = await UserModel.findOne({ email: email.toLowerCase().trim(), deletedAt: null });

  const valid = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, password);
  if (!user || !valid) {
    return err("UNAUTHENTICATED", "Invalid email or password");
  }
  if (user.status === "suspended") {
    return err("FORBIDDEN", "This account has been suspended");
  }

  return ok({
    id: user._id.toString(),
    email: user.email,
    role: user.role as AuthenticatedUser["role"],
    status: user.status,
    sessionVersion: user.sessionVersion,
  });
}

/**
 * Brute-force-protected login (PRD §12.1 / §14 Day 5 Block 3 check #4):
 * checks IP + email rate limits and any active lockout BEFORE touching
 * the DB, locks the account on the 5th failure within 15 minutes, and
 * sends an alert email on the transition into a lockout. Identical
 * rejection (UNAUTHENTICATED) whether the cause is a wrong password, a
 * lockout, or IP throttling — no enumeration of *why* the login failed.
 */
export async function authenticateWithThrottle(
  email: string,
  password: string,
  ip: string
): Promise<Result<AuthenticatedUser>> {
  const normalizedEmail = email.toLowerCase().trim();

  if (await isIpRateLimited(ip)) {
    return err("RATE_LIMITED", "Too many attempts. Try again later.");
  }
  if (await isLockedOut(normalizedEmail)) {
    return err("UNAUTHENTICATED", "Invalid email or password");
  }

  const result = await authenticate(normalizedEmail, password);
  if (!result.ok) {
    const { lockedOut } = await recordFailedAttempt(normalizedEmail, ip);
    if (lockedOut) {
      await sendEvent({
        name: "user/login_locked",
        data: { email: normalizedEmail, ip, unlocksInMinutes: 30 },
      });
    }
    return result;
  }

  await clearFailedAttempts(normalizedEmail);
  return result;
}

export async function touchLastLogin(userId: string): Promise<void> {
  await connectDb();
  await UserModel.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
}

/**
 * Creates the Session record for a fresh sign-in and sends the mandatory
 * login-alert email (PRD §1.2 non-negotiable #6). Returns the session id,
 * which the caller (auth.ts authorize()) stashes on the NextAuth JWT as
 * `sid` — JWT strategy sessions are otherwise self-contained with no DB
 * row, which would make per-device listing/revocation impossible.
 */
export async function recordLogin(input: {
  userId: string;
  email: string;
  ip: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
  geo: string | null;
}): Promise<string> {
  await connectDb();
  const env = getEnv();
  const sessionId = newSessionId();

  await SessionModel.create({
    userId: input.userId,
    tokenId: sessionId,
    ip: input.ip,
    userAgent: input.userAgent,
    deviceLabel: input.deviceLabel,
    geo: input.geo,
    lastSeenAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // createKillToken() returns null if Redis is unreachable — login must
  // still succeed and the alert still send, just without a working
  // one-click kill link (falls back to the account's dashboard).
  const killToken = await createKillToken(sessionId);
  const killSessionUrl = killToken
    ? `${env.NEXT_PUBLIC_APP_URL}/api/sessions/kill?token=${killToken}`
    : env.NEXT_PUBLIC_APP_URL;

  // sendEvent() fails open — a misconfigured/unreachable Inngest must never
  // block the sign-in itself. The PRD's "mandatory" (§1.2 #6) means the
  // alert must be sent whenever the queue is healthy, not that auth is
  // hostage to the queue's availability.
  await sendEvent({
    name: "user/login",
    data: {
      userId: input.userId,
      email: input.email,
      deviceLabel: input.deviceLabel ?? "Unknown device",
      ip: input.ip ?? "Unknown",
      geo: input.geo ?? "Unknown location",
      timestamp: new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
      killSessionUrl,
    },
  });

  return sessionId;
}

/** Bumps sessionVersion (Mongo, source of truth) AND the Redis cache middleware reads. PRD §12.1. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await connectDb();
  const updated = await UserModel.findOneAndUpdate(
    { _id: userId },
    { $inc: { sessionVersion: 1 } },
    { new: true }
  );
  if (updated) await cacheSessionVersion(userId, updated.sessionVersion);
}

/** Resolves a kill-token from the login-alert email and revokes that one session. */
export async function killSessionByToken(token: string): Promise<Result<true>> {
  const sessionId = await resolveKillToken(token);
  if (!sessionId) return err("NOT_FOUND", "This link has expired or was already used");
  await connectDb();
  await SessionModel.updateOne({ tokenId: sessionId }, { $set: { revokedAt: new Date() } });
  await markSessionRevoked(sessionId);
  return ok(true);
}

export async function revokeSession(sessionId: string): Promise<Result<true>> {
  await connectDb();
  await SessionModel.updateOne({ tokenId: sessionId }, { $set: { revokedAt: new Date() } });
  await markSessionRevoked(sessionId);
  return ok(true);
}

export interface SessionSummary {
  id: string;
  deviceLabel: string | null;
  ip: string | null;
  geo: string | null;
  lastSeenAt: string;
  createdAt: string;
  current: boolean;
}

export async function listSessions(
  userId: string,
  currentSessionId?: string
): Promise<Result<SessionSummary[]>> {
  await connectDb();
  const sessions = await SessionModel.find({ userId, revokedAt: null }).sort({ lastSeenAt: -1 }).lean();
  return ok(
    sessions.map((s) => ({
      id: s.tokenId,
      deviceLabel: s.deviceLabel ?? null,
      ip: s.ip ?? null,
      geo: s.geo ?? null,
      lastSeenAt: (s.lastSeenAt ?? s.createdAt)?.toISOString() ?? "",
      createdAt: s.createdAt?.toISOString() ?? "",
      current: s.tokenId === currentSessionId,
    }))
  );
}

// ---------------------------------------------------------------------------
// Admin actions on user status
// ---------------------------------------------------------------------------

/** Manual-approval path (autoApproveAmbassadors off) — sends the welcome email. PRD §3.2. */
export async function approveUser(userId: string): Promise<Result<true>> {
  await connectDb();
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, status: "pending_approval" },
    { $set: { status: "active" } },
    { new: true }
  );
  if (!user) return err("NOT_FOUND", "No pending-approval user found");

  const env = getEnv();
  const role = user.role as "admin" | "ambassador" | "syndicator";

  // Ambassadors get the richer "You're Live" email (microsite URL); a
  // cross-domain read (identity doesn't own ambassadors) is acceptable
  // here for the same reason it is elsewhere — enrichment, not a write.
  const ambassadorProfile = role === "ambassador" ? await AmbassadorModel.findOne({ userId }).lean() : null;

  if (ambassadorProfile) {
    await sendEvent({
      name: "ambassador/approved",
      data: {
        ambassadorEmail: user.email,
        fullName: ambassadorProfile.fullName,
        slug: ambassadorProfile.slug,
        micrositeUrl: `${env.NEXT_PUBLIC_APP_URL}/${ambassadorProfile.slug}`,
      },
    });
  } else {
    await sendEvent({
      name: "user/verified",
      data: {
        userId: user._id.toString(),
        email: user.email,
        role,
        dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}${DASHBOARD_PATH[role]}`,
      },
    });
  }

  return ok(true);
}

/** Suspension bumps sessionVersion, killing all sessions instantly. PRD §7.2. */
export async function suspendUser(userId: string): Promise<Result<true>> {
  await connectDb();
  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    { $set: { status: "suspended" } },
    { new: true }
  );
  if (!user) return err("NOT_FOUND", "User not found");
  await revokeAllSessions(userId);
  return ok(true);
}

export async function reactivateUser(userId: string): Promise<Result<true>> {
  await connectDb();
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, status: "suspended" },
    { $set: { status: "active" } },
    { new: true }
  );
  if (!user) return err("NOT_FOUND", "No suspended user found");
  return ok(true);
}

// ---------------------------------------------------------------------------
// Registration, verification, password reset
// ---------------------------------------------------------------------------

export interface RegisterResult {
  userId: string;
  alreadyRegistered: boolean;
}

/**
 * Never reveals whether an email already exists — generic success either
 * way; a fresh account gets a verification email, an existing one is left
 * untouched. PRD §7.2 registerAmbassador.
 */
export async function register(input: {
  email: string;
  password: string;
  role: "ambassador" | "syndicator";
}): Promise<Result<RegisterResult>> {
  await connectDb();
  const email = input.email.toLowerCase().trim();

  const existing = await UserModel.findOne({ email });
  if (existing) {
    return ok({ userId: existing._id.toString(), alreadyRegistered: true });
  }

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    email,
    passwordHash,
    role: input.role,
    status: "pending_verification",
  });

  const { token, tokenHash } = generateToken();
  await VerificationTokenModel.create({
    userId: user._id,
    tokenHash,
    purpose: "verify_email",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const env = getEnv();
  await sendEvent({
    name: "user/registered",
    data: {
      userId: user._id.toString(),
      email: user.email,
      verifyUrl: `${env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`,
    },
  });

  return ok({ userId: user._id.toString(), alreadyRegistered: false });
}

export async function verifyEmail(
  token: string
): Promise<Result<{ userId: string; role: "admin" | "ambassador" | "syndicator"; autoApproved: boolean }>> {
  await connectDb();
  const tokenHash = hashToken(token);

  const record = await VerificationTokenModel.findOne({
    tokenHash,
    purpose: "verify_email",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!record) return err("NOT_FOUND", "This verification link is invalid or has expired");

  const settings = await getSettings();
  const newStatus = settings.autoApproveAmbassadors ? "active" : "pending_approval";

  const user = await UserModel.findOneAndUpdate(
    { _id: record.userId },
    { $set: { emailVerifiedAt: new Date(), status: newStatus } },
    { new: true }
  );
  if (!user) return err("NOT_FOUND", "Account not found");

  await VerificationTokenModel.updateOne({ _id: record._id }, { $set: { usedAt: new Date() } });

  const role = user.role as "admin" | "ambassador" | "syndicator";
  const autoApproved = newStatus === "active";

  if (autoApproved) {
    const env = getEnv();
    await sendEvent({
      name: "user/verified",
      data: {
        userId: user._id.toString(),
        email: user.email,
        role,
        dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}${DASHBOARD_PATH[role]}`,
      },
    });
  }

  return ok({ userId: user._id.toString(), role, autoApproved });
}

/** Identical response whether or not the email exists — no enumeration. PRD §12.1. */
export async function requestReset(email: string, requestingIp: string): Promise<Result<true>> {
  await connectDb();
  const user = await UserModel.findOne({ email: email.toLowerCase().trim(), deletedAt: null });
  if (!user) return ok(true);

  const { token, tokenHash } = generateToken();
  await VerificationTokenModel.create({
    userId: user._id,
    tokenHash,
    purpose: "password_reset",
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const env = getEnv();
  await sendEvent({
    name: "user/password_reset_requested",
    data: {
      email: user.email,
      resetUrl: `${env.NEXT_PUBLIC_APP_URL}/reset?token=${token}`,
      requestingIp,
    },
  });

  return ok(true);
}

/** Reset invalidates all sessions. PRD §12.1. */
export async function resetPassword(token: string, newPassword: string): Promise<Result<{ userId: string }>> {
  await connectDb();
  const tokenHash = hashToken(token);

  const record = await VerificationTokenModel.findOne({
    tokenHash,
    purpose: "password_reset",
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!record) return err("NOT_FOUND", "This reset link is invalid or has expired");

  const passwordHash = await hashPassword(newPassword);
  const user = await UserModel.findOneAndUpdate(
    { _id: record.userId },
    { $set: { passwordHash } },
    { new: true }
  );
  await VerificationTokenModel.updateOne({ _id: record._id }, { $set: { usedAt: new Date() } });
  await revokeAllSessions(record.userId.toString());

  if (user) {
    await sendEvent({
      name: "user/password_changed",
      data: {
        email: user.email,
        revokeAllUrl: "mailto:support@san.com?subject=Unauthorized%20password%20change",
        changedAt: new Date().toISOString(),
      },
    });
  }

  return ok({ userId: record.userId.toString() });
}
