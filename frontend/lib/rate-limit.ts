import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getEnv } from "@san/core/env";

let redis: Redis | null = null;
function getRedisClient(): Redis {
  if (!redis) {
    const env = getEnv();
    redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  }
  return redis;
}

const limiters = new Map<string, Ratelimit>();

/** Per-route sliding-window rate limit. PRD §12.3. */
export function getLimiter(key: string, limit: number, windowSeconds: number): Ratelimit {
  const cacheKey = `${key}:${limit}:${windowSeconds}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: `ratelimit:${key}`,
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

/**
 * Fails OPEN on a Redis error: every caller (waitlist registration, ambassador
 * signup, syndicator onboarding, password reset, slug-check, analytics
 * tracking) already completed its real work — connectDb() + a Mongo write —
 * by the time this gates anything downstream, so an Upstash outage or
 * misconfiguration must never turn "rate limiter is unreachable" into
 * "nobody can register." Losing rate-limiting temporarily is a strictly
 * smaller failure than losing onboarding entirely.
 */
export async function checkRateLimit(
  routeKey: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const { success, remaining } = await getLimiter(routeKey, limit, windowSeconds).limit(identifier);
    return { allowed: success, remaining };
  } catch (e) {
    console.error(`[checkRateLimit] Redis unreachable for "${routeKey}", failing open:`, e);
    return { allowed: true, remaining: limit };
  }
}
