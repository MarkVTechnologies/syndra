"use server";

import { revalidatePath } from "next/cache";
import type { Result } from "@san/core/result";
import * as commission from "@san/service-commission";
import { audit } from "@san/service-analytics";
import { auth } from "@/auth";

export async function markPayoutPaidAction(
  payoutId: string
): Promise<Result<{ amountMinor: number; commissionCount: number }>> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  const result = await commission.markPaid(payoutId, session.user.id);
  if (!result.ok) return result;

  await audit({
    actorId: session.user.id,
    actorRole: "admin",
    action: "payout.mark_paid",
    targetType: "payout",
    targetId: payoutId,
    after: result.data,
  });

  revalidatePath("/admin/payouts");
  return result;
}
