"use server";

import { revalidatePath } from "next/cache";
import {
  resendConfirmation,
  flagSpam,
  addNote,
  launchAndBroadcast,
} from "@san/service-waitlist";
import { err, type Result } from "@san/core/result";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

export async function resendWaitlistConfirmation(waitlistId: string): Promise<Result<true>> {
  const admin = await requireAdmin();
  return resendConfirmation(waitlistId, admin.id);
}

export async function flagWaitlistSpam(waitlistId: string, flagged: boolean): Promise<Result<true>> {
  const admin = await requireAdmin();
  const result = await flagSpam(waitlistId, flagged, admin.id);
  revalidatePath("/admin/waitlist");
  return result;
}

export async function addWaitlistNote(waitlistId: string, note: string): Promise<Result<true>> {
  const admin = await requireAdmin();
  const result = await addNote(waitlistId, note, admin.id);
  revalidatePath("/admin/waitlist");
  return result;
}

const LAUNCH_CONFIRMATION_PHRASE = "LAUNCH SYNDRAN";

/**
 * Irreversible: flips the app live and emails every pending waitlist row a
 * one-time login link. Requires the admin to type an exact confirmation
 * phrase client-side (see LaunchPanel) — this server action re-checks it so
 * the guard can't be bypassed by calling the action directly.
 */
export async function launchApp(confirmationPhrase: string): Promise<Result<{ invited: number }>> {
  const admin = await requireAdmin();
  if (confirmationPhrase !== LAUNCH_CONFIRMATION_PHRASE) {
    return err("VALIDATION_FAILED", "Confirmation phrase did not match");
  }
  const result = await launchAndBroadcast(admin.id);
  revalidatePath("/admin/waitlist");
  revalidatePath("/admin");
  return result;
}
