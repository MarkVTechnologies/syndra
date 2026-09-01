"use server";

import { SyndicatorOnboardInput } from "@san/core/schemas/syndicator";
import { ok, err, type Result } from "@san/core/result";
import * as syndicator from "@san/service-syndicator";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";
import { getReferralCookie } from "@/lib/attribution";

export async function onboardSyndicatorAction(
  raw: unknown,
  attribution: { signedToken?: string | null; queryRef?: string | null }
): Promise<Result<{ alreadyRegistered: boolean }>> {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit("syndicator-onboard", ip, 5, 60);
  if (!allowed) return err("RATE_LIMITED", "Too many attempts. Try again in a minute.");

  const parsed = SyndicatorOnboardInput.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
    }
    return err("VALIDATION_FAILED", "Please check the highlighted fields", fields);
  }
  const input = parsed.data;

  if (input.honeypot) return err("VALIDATION_FAILED", "Submission rejected");

  const humanVerified = await verifyTurnstile(input.turnstileToken, ip);
  if (!humanVerified) {
    return err("VALIDATION_FAILED", "Verification failed — please retry", {
      turnstileToken: "Verification failed",
    });
  }

  // R2 resolution order: signed token -> san_ref cookie -> ?ref= -> house.
  const cookieAmbassadorId = await getReferralCookie();

  const result = await syndicator.onboard(input, {
    signedToken: attribution.signedToken,
    cookieAmbassadorId,
    queryRef: attribution.queryRef,
  });
  if (!result.ok) return result;

  return ok({ alreadyRegistered: result.data.alreadyRegistered });
}
