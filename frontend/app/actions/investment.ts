"use server";

import { CommitInput } from "@san/core/schemas/investment";
import type { Result } from "@san/core/result";
import { err } from "@san/core/result";
import * as investment from "@san/service-investment";
import { auth } from "@/auth";

async function requireSyndicator() {
  const session = await auth();
  if (!session?.user || session.user.role !== "syndicator") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

export async function commitInvestmentAction(raw: unknown): Promise<Result<{ id: string }>> {
  const user = await requireSyndicator();
  const parsed = CommitInput.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_FAILED", "Please check your investment amount");
  }

  const result = await investment.commit(parsed.data, user.id);
  if (!result.ok) return result;

  return { ok: true, data: { id: result.data._id.toString() } };
}

export async function initiatePaymentAction(
  investmentId: string,
  channel: "card" | "transfer"
): Promise<Result<{ redirectUrl?: string; bankTransfer?: { accountName: string; note: string } }>> {
  const user = await requireSyndicator();
  if (!user.email) return err("VALIDATION_FAILED", "Account email missing");

  return investment.initiatePayment(investmentId, channel, user.email);
}

export async function cancelInvestmentAction(investmentId: string): Promise<Result<true>> {
  await requireSyndicator();
  return investment.cancel(investmentId);
}
