import type { Result } from "@san/core/result";
import { err } from "@san/core/result";
import { register, type WaitlistSuccess } from "@san/service-waitlist";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/request-context";

/**
 * HTTP-layer orchestration shared by the server action (used by the React
 * form) and the POST /api/waitlist route handler (PRD §7.1): rate limit,
 * honeypot, Turnstile. All data reads/writes happen in @san/service-waitlist
 * — this file never touches @san/db directly (boundary rule, PRD §4.4).
 */
export async function submitWaitlist(raw: unknown): Promise<Result<WaitlistSuccess>> {
  const ip = await getClientIp();

  const { allowed } = await checkRateLimit("waitlist", ip, 5, 60);
  if (!allowed) {
    return err("RATE_LIMITED", "Too many attempts. Try again in a minute.");
  }

  if (!raw || typeof raw !== "object") {
    return err("VALIDATION_FAILED", "Invalid submission");
  }

  // Honeypot — silent reject before Turnstile so a bot burns no challenge.
  if ("honeypot" in raw && (raw as { honeypot?: string }).honeypot) {
    return err("VALIDATION_FAILED", "Submission rejected");
  }

  const turnstileToken = (raw as { turnstileToken?: string }).turnstileToken ?? "";
  const humanVerified = await verifyTurnstile(turnstileToken, ip);
  if (!humanVerified) {
    return err("VALIDATION_FAILED", "Verification failed — please retry", {
      turnstileToken: "Verification failed",
    });
  }

  return register({ ...(raw as object), ipHash: hashIp(ip) } as Parameters<typeof register>[0]);
}
