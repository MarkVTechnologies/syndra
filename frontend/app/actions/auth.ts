"use server";

import { ok, err, type Result } from "@san/core/result";
import { RegisterAmbassadorInput } from "@san/core/schemas/ambassador";
import { RequestResetInput, ResetPasswordInput } from "@san/core/schemas/auth";
import * as identity from "@san/service-identity";
import * as ambassador from "@san/service-ambassador";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";

export async function registerAmbassadorAction(raw: unknown): Promise<Result<{ alreadyRegistered: boolean }>> {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit("signup", ip, 5, 60);
  if (!allowed) return err("RATE_LIMITED", "Too many attempts. Try again in a minute.");

  const parsed = RegisterAmbassadorInput.safeParse(raw);
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

  const registerResult = await identity.register({
    email: input.email,
    password: input.password,
    role: "ambassador",
  });
  if (!registerResult.ok) return registerResult;

  // Best-effort: an existing account without an ambassador profile yet
  // (e.g. a retry after a slug conflict) still gets one created here.
  const existingProfile = await ambassador.getByUserId(registerResult.data.userId);
  if (!existingProfile.ok) {
    const profileResult = await ambassador.createProfile({
      userId: registerResult.data.userId,
      fullName: input.fullName,
      phone: input.phone,
      whatsapp: input.sameAsPhone ? input.phone : input.whatsapp,
      city: input.city,
      state: input.state,
      yearsExperience: input.yearsExperience,
      slug: input.desiredSlug,
    });
    if (!profileResult.ok && !registerResult.data.alreadyRegistered) {
      return profileResult;
    }
  }

  return ok({ alreadyRegistered: registerResult.data.alreadyRegistered });
}

export async function verifyEmailAction(token: string): Promise<Result<{ role: string }>> {
  const result = await identity.verifyEmail(token);
  if (!result.ok) return result;
  return ok({ role: result.data.role });
}

export async function requestResetAction(raw: unknown): Promise<Result<true>> {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit("forgot-password", ip, 5, 15 * 60);
  if (!allowed) return err("RATE_LIMITED", "Too many attempts. Try again later.");

  const parsed = RequestResetInput.safeParse(raw);
  if (!parsed.success) return err("VALIDATION_FAILED", "Enter a valid email");

  return identity.requestReset(parsed.data.email, ip);
}

export async function resetPasswordAction(raw: unknown): Promise<Result<true>> {
  const parsed = ResetPasswordInput.safeParse(raw);
  if (!parsed.success) return err("VALIDATION_FAILED", "Please check the form");

  const result = await identity.resetPassword(parsed.data.token, parsed.data.password);
  if (!result.ok) return result;
  return ok(true);
}
