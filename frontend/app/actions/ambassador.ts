"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { UpdateMicrositeInput } from "@san/core/schemas/ambassador";
import type { Result } from "@san/core/result";
import * as ambassador from "@san/service-ambassador";
import { auth } from "@/auth";

async function requireAmbassadorProfile() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ambassador") {
    throw new Error("FORBIDDEN");
  }
  const profile = await ambassador.getByUserId(session.user.id);
  if (!profile.ok) throw new Error("NOT_FOUND");
  return profile.data;
}

export async function updateMicrositeAction(raw: unknown): Promise<Result<true>> {
  const profile = await requireAmbassadorProfile();
  const parsed = UpdateMicrositeInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: { code: "VALIDATION_FAILED", message: "Please check the form" } };
  }
  const result = await ambassador.updateProfile(profile._id.toString(), parsed.data);
  if (!result.ok) return result;
  revalidatePath("/dashboard");
  revalidateTag(`microsite:${profile.slug}`);
  return { ok: true, data: true };
}

export async function promoteOpportunityAction(opportunityId: string): Promise<Result<true>> {
  const profile = await requireAmbassadorProfile();
  const result = await ambassador.promote(profile._id.toString(), opportunityId);
  revalidatePath("/dashboard");
  revalidateTag(`microsite:${profile.slug}`);
  return result;
}

export async function unpromoteOpportunityAction(opportunityId: string): Promise<Result<true>> {
  const profile = await requireAmbassadorProfile();
  const result = await ambassador.unpromote(profile._id.toString(), opportunityId);
  revalidatePath("/dashboard");
  revalidateTag(`microsite:${profile.slug}`);
  return result;
}

export async function changeSlugAction(newSlug: string): Promise<Result<true>> {
  const profile = await requireAmbassadorProfile();
  const oldSlug = profile.slug;
  const result = await ambassador.changeSlug(profile._id.toString(), newSlug);
  if (!result.ok) return result;
  revalidatePath("/dashboard");
  revalidateTag(`microsite:${oldSlug}`);
  revalidateTag(`microsite:${newSlug}`);
  return result;
}
