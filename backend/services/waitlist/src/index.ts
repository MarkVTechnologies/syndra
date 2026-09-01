import { connectDb, WaitlistModel, UserModel, setAppLaunched, getSettings } from "@san/db";
import { WaitlistInput, type WaitlistInputType } from "@san/core/schemas/waitlist";
import { ok, err, type Result } from "@san/core/result";
import { escapeRegex } from "@san/core/sanitize";
import { getEnv } from "@san/core/env";
import { hashPassword } from "@san/service-identity";
import { sendEvent } from "@san/service-notification";
import { track, audit } from "@san/service-analytics";
import * as ambassador from "@san/service-ambassador";
import { createHash, randomBytes } from "node:crypto";

/**
 * Owns: waitlist. Phase 0 has no dedicated domain in PRD §4.3's eight-service
 * catalog (it converts into an ambassador/user record at launch — see PRD
 * §13.4), so it gets its own thin service package rather than letting any
 * caller reach into @san/db directly. Frontend code must go through here.
 */

export interface WaitlistSuccess {
  position: number;
  reservedSlug: string;
  shareUrl: string;
  alreadyRegistered: boolean;
}

export interface RegisterWaitlistInput extends WaitlistInputType {
  ipHash: string;
}

export async function register(input: RegisterWaitlistInput): Promise<Result<WaitlistSuccess>> {
  const parsed = WaitlistInput.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
    }
    return err("VALIDATION_FAILED", "Please check the highlighted fields", fields);
  }

  await connectDb();

  const existing = await WaitlistModel.findOne({ email: parsed.data.email });
  if (existing) {
    const positionIndex = await WaitlistModel.countDocuments({
      createdAt: { $lte: existing.createdAt },
    });
    await track({ name: "waitlist_duplicate_submit", props: { email: parsed.data.email } });
    return ok({
      position: positionIndex,
      reservedSlug: existing.desiredSlug,
      shareUrl: `/?ref=waitlist-${existing._id.toString()}`,
      alreadyRegistered: true,
    });
  }

  const slugTaken = await WaitlistModel.findOne({ desiredSlug: parsed.data.desiredSlug });
  if (slugTaken) {
    return err("CONFLICT", "This page name is already reserved", {
      desiredSlug: "Already taken — try another",
    });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const created = await WaitlistModel.create({
    email: parsed.data.email,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    whatsapp: parsed.data.sameAsPhone ? parsed.data.phone : parsed.data.whatsapp,
    city: parsed.data.city,
    state: parsed.data.state,
    yearsExperience: parsed.data.yearsExperience,
    desiredSlug: parsed.data.desiredSlug,
    passwordHash,
    source: "landing",
    utm: parsed.data.utm,
    ipHash: input.ipHash,
  });

  const position = await WaitlistModel.countDocuments({});

  await sendEvent({
    name: "waitlist/registered",
    data: {
      waitlistId: created._id.toString(),
      email: created.email,
      fullName: created.fullName,
      desiredSlug: created.desiredSlug,
      position,
    },
  });

  await track({ name: "waitlist_registered", props: { state: parsed.data.state, source: "landing" } });

  return ok({
    position,
    reservedSlug: created.desiredSlug,
    shareUrl: `/?ref=waitlist-${created._id.toString()}`,
    alreadyRegistered: false,
  });
}

export async function getCount(): Promise<number> {
  await connectDb();
  return WaitlistModel.countDocuments({});
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  await connectDb();
  const exists = await WaitlistModel.exists({ desiredSlug: slug });
  return !exists;
}

export interface WaitlistKpis {
  total: number;
  last24h: number;
  last7d: number;
  topStates: { state: string; count: number }[];
  conversionRate: number;
}

export async function getKpis(): Promise<WaitlistKpis> {
  await connectDb();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const [total, last24h, last7d, converted, topStatesAgg] = await Promise.all([
    WaitlistModel.countDocuments({}),
    WaitlistModel.countDocuments({ createdAt: { $gte: new Date(now - day) } }),
    WaitlistModel.countDocuments({ createdAt: { $gte: new Date(now - 7 * day) } }),
    WaitlistModel.countDocuments({ status: "converted" }),
    WaitlistModel.aggregate([
      { $group: { _id: "$state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return {
    total,
    last24h,
    last7d,
    topStates: topStatesAgg.map((s) => ({ state: s._id, count: s.count })),
    conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
  };
}

export interface WaitlistRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  yearsExperience: string;
  desiredSlug: string;
  source: string;
  createdAt: string;
  spamFlagged: boolean;
}

export async function list(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<{ rows: WaitlistRow[]; total: number }> {
  await connectDb();
  const { page, pageSize, search } = params;

  const filter = search
    ? {
        $or: [
          { fullName: { $regex: escapeRegex(search), $options: "i" } },
          { email: { $regex: escapeRegex(search), $options: "i" } },
          { desiredSlug: { $regex: escapeRegex(search), $options: "i" } },
        ],
      }
    : {};

  const [docs, total] = await Promise.all([
    WaitlistModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    WaitlistModel.countDocuments(filter),
  ]);

  return {
    rows: docs.map((d) => ({
      id: d._id.toString(),
      fullName: d.fullName,
      email: d.email,
      phone: d.phone,
      whatsapp: d.whatsapp,
      city: d.city,
      state: d.state,
      yearsExperience: d.yearsExperience,
      desiredSlug: d.desiredSlug,
      source: d.source ?? "landing",
      createdAt: d.createdAt?.toISOString() ?? "",
      spamFlagged: d.spamFlagged ?? false,
    })),
    total,
  };
}

export async function getGrowthSeries(days = 14): Promise<{ date: string; count: number }[]> {
  await connectDb();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const agg = await WaitlistModel.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return agg.map((a) => ({ date: a._id, count: a.count }));
}

export async function* streamAll(search?: string) {
  await connectDb();
  const filter = search
    ? {
        $or: [
          { fullName: { $regex: escapeRegex(search), $options: "i" } },
          { email: { $regex: escapeRegex(search), $options: "i" } },
        ],
      }
    : {};
  const cursor = WaitlistModel.find(filter).sort({ createdAt: -1 }).lean().cursor();
  for await (const doc of cursor) yield doc;
}

export async function resendConfirmation(waitlistId: string, actorId: string): Promise<Result<true>> {
  await connectDb();
  const entry = await WaitlistModel.findById(waitlistId);
  if (!entry) return err("NOT_FOUND", "Entry not found");

  const position = await WaitlistModel.countDocuments({ createdAt: { $lte: entry.createdAt } });
  await sendEvent({
    name: "waitlist/registered",
    data: {
      waitlistId: entry._id.toString(),
      email: entry.email,
      fullName: entry.fullName,
      desiredSlug: entry.desiredSlug,
      position,
    },
  });

  await audit({
    actorId,
    actorRole: "admin",
    action: "waitlist.resend_confirmation",
    targetType: "waitlist",
    targetId: waitlistId,
  });

  return ok(true);
}

export async function flagSpam(waitlistId: string, flagged: boolean, actorId: string): Promise<Result<true>> {
  await connectDb();
  const before = await WaitlistModel.findById(waitlistId).lean();
  await WaitlistModel.updateOne({ _id: waitlistId }, { $set: { spamFlagged: flagged } });

  await audit({
    actorId,
    actorRole: "admin",
    action: "waitlist.flag_spam",
    targetType: "waitlist",
    targetId: waitlistId,
    before: { spamFlagged: before?.spamFlagged },
    after: { spamFlagged: flagged },
  });

  return ok(true);
}

export async function addNote(waitlistId: string, note: string, actorId: string): Promise<Result<true>> {
  await connectDb();
  await WaitlistModel.updateOne({ _id: waitlistId }, { $set: { internalNote: note } });

  await audit({
    actorId,
    actorRole: "admin",
    action: "waitlist.add_note",
    targetType: "waitlist",
    targetId: waitlistId,
  });

  return ok(true);
}

// ---------------------------------------------------------------------------
// Launch (PRD §13.4) — every waitlist record with a password already has a
// usable identity. Flipping the flag + broadcasting converts the whole
// pipeline with no re-registration and no lost data.
// ---------------------------------------------------------------------------

const LAUNCH_TOKEN_VALIDITY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days — a bulk send, not a 30-min window

function hashLaunchToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface LaunchStatus {
  appLaunched: boolean;
  pendingCount: number;
  convertedCount: number;
}

export async function getLaunchStatus(): Promise<LaunchStatus> {
  await connectDb();
  const [settings, pendingCount, convertedCount] = await Promise.all([
    getSettings(),
    WaitlistModel.countDocuments({ status: "registered" }),
    WaitlistModel.countDocuments({ status: "converted" }),
  ]);
  return { appLaunched: settings.appLaunched, pendingCount, convertedCount };
}

/**
 * Flips settings.appLaunched and emails every still-registered waitlist
 * row a personalised login link. Idempotent to run twice: already-converted
 * rows are skipped, and a re-run only re-invites rows still pending.
 */
export async function launchAndBroadcast(actorId: string): Promise<Result<{ invited: number }>> {
  await connectDb();
  const env = getEnv();

  await setAppLaunched(true);
  await audit({
    actorId,
    actorRole: "admin",
    action: "settings.app_launched",
    targetType: "settings",
    targetId: "singleton",
    after: { appLaunched: true },
  });

  const registrants = await WaitlistModel.find({ status: "registered" }).lean();

  for (const w of registrants) {
    const token = randomBytes(32).toString("hex");
    await WaitlistModel.updateOne(
      { _id: w._id },
      {
        $set: {
          launchTokenHash: hashLaunchToken(token),
          launchTokenExpiresAt: new Date(Date.now() + LAUNCH_TOKEN_VALIDITY_MS),
        },
      }
    );

    await sendEvent({
      name: "waitlist/launch_invite",
      data: {
        waitlistId: w._id.toString(),
        email: w.email,
        fullName: w.fullName,
        reservedSlug: w.desiredSlug,
        loginUrl: `${env.NEXT_PUBLIC_APP_URL}/launch/${token}`,
      },
    });
  }

  return ok({ invited: registrants.length });
}

/**
 * Resolves a launch link: creates the User + Ambassador profile from the
 * waitlist row's already-hashed password (never re-hashed, never seen in
 * plaintext again), marks the row converted, and hands back the email so
 * the caller can route to /login. PRD §13.4 "First login converts the
 * waitlist row... provisions the ambassador profile with the reserved slug."
 */
export async function convertViaLaunchToken(token: string): Promise<Result<{ email: string }>> {
  await connectDb();
  const tokenHash = hashLaunchToken(token);

  const waitlistRow = await WaitlistModel.findOne({
    launchTokenHash: tokenHash,
    launchTokenExpiresAt: { $gt: new Date() },
  });
  if (!waitlistRow) return err("NOT_FOUND", "This link is invalid or has expired");
  if (waitlistRow.status === "converted") {
    const existingUser = await UserModel.findById(waitlistRow.convertedUserId).lean();
    if (existingUser) return ok({ email: existingUser.email });
  }

  const existingUser = await UserModel.findOne({ email: waitlistRow.email });
  const user =
    existingUser ??
    (await UserModel.create({
      email: waitlistRow.email,
      passwordHash: waitlistRow.passwordHash,
      role: "ambassador",
      status: "active",
      emailVerifiedAt: new Date(),
    }));

  const existingProfile = await ambassador.getByUserId(user._id.toString());
  if (!existingProfile.ok) {
    await ambassador.createProfile({
      userId: user._id.toString(),
      fullName: waitlistRow.fullName,
      phone: waitlistRow.phone,
      whatsapp: waitlistRow.whatsapp,
      city: waitlistRow.city,
      state: waitlistRow.state,
      yearsExperience: waitlistRow.yearsExperience,
      slug: waitlistRow.desiredSlug,
    });
  }

  await WaitlistModel.updateOne(
    { _id: waitlistRow._id },
    { $set: { status: "converted", convertedUserId: user._id, launchTokenHash: null, launchTokenExpiresAt: null } }
  );

  await track({ name: "waitlist_converted", props: { waitlistId: waitlistRow._id.toString() } });

  return ok({ email: user.email });
}
