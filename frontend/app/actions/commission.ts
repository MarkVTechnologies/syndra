"use server";

import { revalidatePath } from "next/cache";
import type { Result } from "@san/core/result";
import * as commission from "@san/service-commission";
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

export async function requestPayoutAction(): Promise<Result<{ payoutId: string; amountMinor: number }>> {
  const profile = await requireAmbassadorProfile();
  const result = await commission.requestPayout(profile._id.toString());
  if (result.ok) revalidatePath("/dashboard/earnings");
  return result;
}
