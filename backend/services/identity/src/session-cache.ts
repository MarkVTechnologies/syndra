import { Redis } from "@upstash/redis";
import { getEnv } from "@san/core/env";

/**
 * Pure Redis, zero Mongo/native deps — safe to import from edge middleware
 * (auth-edge.ts) without pulling in mongoose/@node-rs/argon2. This is what
 * makes "sessionVersion compared on every request via middleware" (PRD
 * §12.1) actually cheap: a JWT is self-contained and only re-issued
 * periodically, so instant revocation needs a fast side-channel the
 * middleware CAN read on every request without a DB round-trip. Upstash's
 * REST client is fetch-based, so it works in both edge and Node runtimes.
 */
let _redis: Redis | null = null;
function client(): Redis {
  if (!_redis) {
    const env = getEnv();
    _redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  }
  return _redis;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // matches the 7-day cookie maxAge

/**
 * Every function here fails OPEN on a Redis error, never throws: login and
 * session validation must keep working off Mongo alone if Upstash is
 * unreachable (see docs/RUNBOOK.md §1). A cache write that's lost just means
 * revocation/kill-link checks fall back to their safe default until Redis
 * recovers — never that a Redis blip takes down login platform-wide.
 */
export async function cacheSessionVersion(userId: string, version: number): Promise<void> {
  try {
    await client().set(`sv:${userId}`, version, { ex: SESSION_TTL_SECONDS });
  } catch {
    // Best-effort — see file header.
  }
}

/**
 * Returns null on a cache miss (never written, evicted, or Redis
 * unreachable) — middleware treats a miss as "trust the token" rather than
 * mass-logging-out every session on a cold cache or an outage. The cache is
 * populated at login and on every bump, so a miss only happens for a
 * session issued before this system existed, after a Redis flush, or
 * during a Redis outage.
 */
export async function getCachedSessionVersion(userId: string): Promise<number | null> {
  try {
    const v = await client().get<number>(`sv:${userId}`);
    return v ?? null;
  } catch {
    return null;
  }
}

export async function markSessionRevoked(sessionId: string): Promise<void> {
  try {
    await client().set(`revoked:${sessionId}`, 1, { ex: SESSION_TTL_SECONDS });
  } catch {
    // Best-effort — see file header.
  }
}

export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  try {
    const v = await client().get(`revoked:${sessionId}`);
    return v !== null;
  } catch {
    return false;
  }
}

/**
 * One-click "this wasn't me" kill-session link (PRD §9.2 login alert):
 * needs to work without the recipient being signed in as themselves, so a
 * random single-use token maps to the session id rather than requiring
 * auth. GETDEL makes resolution atomic and single-use.
 *
 * Returns null if Redis is unreachable — the caller must still let login
 * itself succeed and just omit the kill-link from the alert email rather
 * than failing the whole sign-in over a non-essential feature.
 */
export async function createKillToken(sessionId: string): Promise<string | null> {
  try {
    const token = crypto.randomUUID().replace(/-/g, "");
    await client().set(`kill:${token}`, sessionId, { ex: SESSION_TTL_SECONDS });
    return token;
  } catch {
    return null;
  }
}

export async function resolveKillToken(token: string): Promise<string | null> {
  try {
    const sessionId = await client().getdel<string>(`kill:${token}`);
    return sessionId ?? null;
  } catch {
    return null;
  }
}
