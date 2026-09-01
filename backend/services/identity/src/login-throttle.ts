import { Redis } from "@upstash/redis";
import { getEnv } from "@san/core/env";

/**
 * Brute-force protection — PRD §12.1: 5 failed logins per email per 15 min,
 * 20 per IP per 15 min, progressive lock, email alert. Pure Redis, no
 * Mongo — cheap enough to check on every login attempt before touching
 * the DB at all.
 */
let _redis: Redis | null = null;
function client(): Redis {
  if (!_redis) {
    const env = getEnv();
    _redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  }
  return _redis;
}

const MAX_ATTEMPTS_PER_EMAIL = 5;
const MAX_ATTEMPTS_PER_IP = 20;
const WINDOW_SECONDS = 15 * 60;
const LOCK_SECONDS = 30 * 60;

/**
 * Every check here fails OPEN, not closed: if Upstash is unreachable, login
 * must still work off Mongo/argon2 alone (see docs/RUNBOOK.md §1 — "Login
 * throttling fails open to 'not limited'"). Failing closed would mean a
 * Redis blip takes down every login on the platform, which is a strictly
 * worse outcome than temporarily losing brute-force protection.
 */
export async function isLockedOut(email: string): Promise<boolean> {
  try {
    const locked = await client().get(`login:lock:${email}`);
    return locked !== null;
  } catch {
    return false;
  }
}

export async function isIpRateLimited(ip: string): Promise<boolean> {
  try {
    const count = await client().get<number>(`login:fail:ip:${ip}`);
    return (count ?? 0) >= MAX_ATTEMPTS_PER_IP;
  } catch {
    return false;
  }
}

export interface FailedAttemptResult {
  lockedOut: boolean;
  attemptCount: number;
}

/** Called after a failed password check. Locks the account on the 5th failure. */
export async function recordFailedAttempt(email: string, ip: string): Promise<FailedAttemptResult> {
  const emailKey = `login:fail:email:${email}`;
  const ipKey = `login:fail:ip:${ip}`;

  try {
    const [emailCount] = await Promise.all([client().incr(emailKey), client().incr(ipKey)]);
    await Promise.all([client().expire(emailKey, WINDOW_SECONDS), client().expire(ipKey, WINDOW_SECONDS)]);

    if (emailCount >= MAX_ATTEMPTS_PER_EMAIL) {
      await client().set(`login:lock:${email}`, 1, { ex: LOCK_SECONDS });
      return { lockedOut: true, attemptCount: emailCount };
    }
    return { lockedOut: false, attemptCount: emailCount };
  } catch {
    return { lockedOut: false, attemptCount: 0 };
  }
}

/** Called after a successful login — a real password reduces the count to zero. */
export async function clearFailedAttempts(email: string): Promise<void> {
  try {
    await client().del(`login:fail:email:${email}`);
  } catch {
    // Best-effort — a stale counter self-expires via WINDOW_SECONDS anyway.
  }
}
