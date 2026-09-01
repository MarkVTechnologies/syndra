import { Redis } from "@upstash/redis";
import { getEnv } from "@san/core/env";

let _redis: Redis | null = null;
function client(): Redis {
  if (!_redis) {
    const env = getEnv();
    _redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  }
  return _redis;
}

/**
 * A webhook replayed ten times must produce one ledger entry (PRD §8.4).
 * This is the FIRST line of defense (fast, cheap); the partial unique
 * index on commissions{investmentId, entryType:"accrual"} is the second,
 * DB-level line of defense in case two webhook deliveries race past this
 * check concurrently.
 *
 * Fails OPEN (returns true — "treat as newly claimed") on a Redis error:
 * the route handler documents "always return 200, never trigger a Paystack
 * retry storm," and an uncaught exception here would do exactly that at
 * the worst possible moment (mid Redis outage). Falling through is safe
 * specifically because the Mongo unique index still catches any real
 * duplicate at the DB layer — this check failing open only means the fast
 * path was skipped, not that double-accrual protection is gone.
 */
export async function claimWebhookEvent(eventId: string): Promise<boolean> {
  try {
    const claimed = await client().set(`webhook:paystack:${eventId}`, 1, {
      nx: true,
      ex: 60 * 60 * 24 * 30, // 30 days — comfortably longer than Paystack's own retry window
    });
    return claimed !== null;
  } catch (e) {
    console.error("[claimWebhookEvent] Redis unreachable, falling open to the Mongo unique-index backstop:", e);
    return true;
  }
}
