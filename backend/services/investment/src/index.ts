import {
  connectDb,
  InvestmentModel,
  OpportunityModel,
  SyndicatorModel,
  AmbassadorModel,
  UserModel,
  mongoose,
  type InvestmentDoc,
} from "@san/db";
import { ok, err, type Result } from "@san/core/result";
import { getEnv } from "@san/core/env";
import type { CommitInputType } from "@san/core/schemas/investment";
import * as commission from "@san/service-commission";
import { sendEvent } from "@san/service-notification";
import { audit } from "@san/service-analytics";
import { reserveUnits, releaseReservation, commitReservationToSale, RESERVATION_MINUTES } from "./reservation";
import { initializeTransaction, verifyPaystackSignature, parsePaystackEvent } from "./paystack";
import { claimWebhookEvent } from "./webhook-dedupe";
import { decideConfirmAction, isNowSoldOut, type InvestmentPaymentState } from "./decisions";

export { verifyPaystackSignature, parsePaystackEvent } from "./paystack";

/**
 * Public interface — PRD §4.3. Owns: investments, reservations.
 * confirm() runs the confirmation + allocation + commission accrual
 * inside ONE MongoDB transaction — a failure anywhere rolls back all
 * three (PRD §8.4). This requires a replica set (Atlas M10, PRD §1.2 #4);
 * a standalone mongod does not support transactions.
 */

function newIdempotencyKey(): string {
  return `inv_${crypto.randomUUID().replace(/-/g, "")}`;
}

export async function commit(
  input: CommitInputType,
  syndicatorId: string
): Promise<Result<InvestmentDoc>> {
  await connectDb();

  const opportunity = await OpportunityModel.findOne({
    _id: input.opportunityId,
    status: "published",
    deletedAt: null,
  }).lean();
  if (!opportunity) return err("NOT_FOUND", "Opportunity not found or no longer available");
  if (!opportunity.pricing) return err("VALIDATION_FAILED", "This opportunity has no pricing configured");

  if (input.units < opportunity.pricing.minUnits || input.units > opportunity.pricing.maxUnits) {
    return err(
      "VALIDATION_FAILED",
      `Units must be between ${opportunity.pricing.minUnits} and ${opportunity.pricing.maxUnits}`,
      { units: "Out of range" }
    );
  }

  const syndicator = await SyndicatorModel.findOne({ userId: syndicatorId }).lean();
  if (!syndicator) return err("NOT_FOUND", "Syndicator profile not found");

  const reserved = await reserveUnits(input.opportunityId, input.units);
  if (!reserved) return err("ALLOCATION_EXCEEDED", "Not enough units remain in this opportunity");

  const amountMinor = input.units * opportunity.pricing.unitPriceMinor;
  const idempotencyKey = newIdempotencyKey();

  const investment = await InvestmentModel.create({
    syndicatorId: syndicator._id,
    opportunityId: opportunity._id,
    ambassadorId: syndicator.referredBy ?? null, // R5 — snapshot at commit time
    units: input.units,
    amountMinor,
    currency: "NGN",
    status: "pending",
    idempotencyKey,
    reservedUntil: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000),
  });

  const env = getEnv();
  const syndicatorUser = await UserModel.findById(syndicator.userId).lean();
  if (syndicatorUser) {
    await sendEvent({
      name: "investment/created",
      data: {
        investmentId: investment._id.toString(),
        syndicatorEmail: syndicatorUser.email,
        opportunityTitle: opportunity.title,
        units: input.units,
        amountMinor,
        reservedUntil: investment.reservedUntil!.toISOString(),
        summaryUrl: `${env.NEXT_PUBLIC_APP_URL}/portfolio`,
      },
    });
  }

  return ok(investment.toObject());
}

export async function initiatePayment(
  investmentId: string,
  channel: "card" | "transfer",
  syndicatorEmail: string
): Promise<Result<{ redirectUrl?: string; bankTransfer?: { accountName: string; note: string } }>> {
  await connectDb();
  const env = getEnv();
  const investment = await InvestmentModel.findOne({ _id: investmentId, status: "pending" });
  if (!investment) return err("NOT_FOUND", "Investment not found or already in progress");

  if (channel === "transfer") {
    investment.status = "awaiting_confirmation";
    investment.payment = { ...investment.payment, channel: "transfer", reference: investment.idempotencyKey };
    await investment.save();
    return ok({
      bankTransfer: {
        accountName: "SAN Escrow (see admin for account details)",
        note: `Reference: ${investment.idempotencyKey}`,
      },
    });
  }

  try {
    const result = await initializeTransaction({
      email: syndicatorEmail,
      amountMinor: investment.amountMinor,
      reference: investment.idempotencyKey,
      callbackUrl: `${env.NEXT_PUBLIC_APP_URL}/portfolio`,
    });
    investment.status = "awaiting_payment";
    investment.payment = {
      ...investment.payment,
      provider: "paystack",
      channel: "card",
      reference: investment.idempotencyKey,
    };
    await investment.save();
    return ok({ redirectUrl: result.authorizationUrl });
  } catch (e) {
    return err("PAYMENT_FAILED", e instanceof Error ? e.message : "Payment could not be initiated");
  }
}

/**
 * The transactional core (PRD §8.4). Signature verification and dedupe
 * happen before the transaction opens — the transaction itself only ever
 * runs once per real payment event.
 */
export async function confirm(
  rawBody: string,
  signatureHeader: string | null
): Promise<Result<{ status: "confirmed" | "ignored" | "replayed" }>> {
  if (!(await verifyPaystackSignature(rawBody, signatureHeader))) {
    return err("FORBIDDEN", "Invalid webhook signature");
  }

  const event = parsePaystackEvent(rawBody);
  if (!event) return err("VALIDATION_FAILED", "Malformed webhook payload");
  if (event.event !== "charge.success") return ok({ status: "ignored" });

  const claimed = await claimWebhookEvent(event.eventId);
  if (!claimed) return ok({ status: "replayed" });

  await connectDb();
  const investment = await InvestmentModel.findOne({ idempotencyKey: event.reference });
  if (!investment) return err("NOT_FOUND", "No matching investment for this payment reference");

  const action = decideConfirmAction(investment.status as InvestmentPaymentState);
  if (action === "already_confirmed") return ok({ status: "replayed" });
  if (action === "unexpected_state") {
    return err("CONFLICT", `Investment is in unexpected state: ${investment.status}`);
  }

  const opportunity = await OpportunityModel.findById(investment.opportunityId).lean();
  if (!opportunity) return err("NOT_FOUND", "Opportunity not found");
  if (!opportunity.pricing) return err("VALIDATION_FAILED", "This opportunity has no pricing configured");
  const pricing = opportunity.pricing;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await InvestmentModel.updateOne(
        { _id: investment._id },
        {
          $set: {
            status: "confirmed",
            confirmedAt: new Date(),
            "payment.paidAt": new Date(),
            "payment.rawEventId": event.eventId,
          },
        },
        { session }
      );

      await commitReservationToSale(investment.opportunityId.toString(), investment.units, session);

      if (opportunity.commission) {
        await commission.accrue(
          {
            investmentId: investment._id.toString(),
            ambassadorId: investment.ambassadorId?.toString() ?? null,
            opportunityId: investment.opportunityId.toString(),
            syndicatorId: investment.syndicatorId.toString(),
            amountMinor: investment.amountMinor,
            units: investment.units,
          },
          {
            model: opportunity.commission.model as "percentage" | "flat",
            valueBps: opportunity.commission.valueBps,
            valueMinor: opportunity.commission.valueMinor,
            coolingDays: opportunity.commission.coolingDays ?? 7,
          },
          session
        );
      }

      if (isNowSoldOut(pricing.unitsSold, investment.units, pricing.totalUnits)) {
        await OpportunityModel.updateOne(
          { _id: opportunity._id },
          { $set: { status: "sold_out" } },
          { session }
        );
      }
    });
  } finally {
    await session.endSession();
  }

  await fanOutConfirmationEmails(investment._id.toString());

  return ok({ status: "confirmed" });
}

async function fanOutConfirmationEmails(investmentId: string): Promise<void> {
  const env = getEnv();
  const investment = await InvestmentModel.findById(investmentId).lean();
  if (!investment) return;

  const [opportunity, syndicator, admins] = await Promise.all([
    OpportunityModel.findById(investment.opportunityId).lean(),
    SyndicatorModel.findById(investment.syndicatorId).lean(),
    UserModel.find({ role: "admin", status: "active" }).select("email").lean(),
  ]);
  const syndicatorUser = syndicator ? await UserModel.findById(syndicator.userId).lean() : null;

  const commissionAmountMinor = Math.round(
    opportunity?.commission?.model === "percentage"
      ? (investment.amountMinor * (opportunity.commission.valueBps ?? 0)) / 10_000
      : (opportunity?.commission?.valueMinor ?? 0) * investment.units
  );

  if (syndicatorUser) {
    await sendEvent({
      name: "investment/confirmed",
      data: {
        investmentId,
        syndicatorEmail: syndicatorUser.email,
        units: investment.units,
        amountMinor: investment.amountMinor,
        opportunityTitle: opportunity?.title ?? "",
        roiPercent: opportunity?.returns?.roiPercent ?? null,
        documentUrls: (opportunity?.documents ?? []).map((d) => d.url).filter((u): u is string => !!u),
        statementUrl: `${env.NEXT_PUBLIC_APP_URL}/portfolio`,
      },
    });
  }

  if (investment.ambassadorId) {
    const ambassador = await AmbassadorModel.findById(investment.ambassadorId).lean();
    const ambassadorUser = ambassador ? await UserModel.findById(ambassador.userId).lean() : null;
    if (ambassadorUser) {
      await sendEvent({
        name: "commission/accrued",
        data: {
          ambassadorEmail: ambassadorUser.email,
          opportunityTitle: opportunity?.title ?? "",
          syndicatorFirstName: syndicator?.fullName.split(" ")[0] ?? "A syndicator",
          amountMinor: commissionAmountMinor,
          maturesInDays: opportunity?.commission?.coolingDays ?? 7,
          dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/earnings`,
        },
      });
    }
  }

  for (const admin of admins) {
    await sendEvent({
      name: "admin/investment_alert",
      data: {
        adminEmail: admin.email,
        opportunityTitle: opportunity?.title ?? "",
        amountMinor: investment.amountMinor,
        units: investment.units,
        adminUrl: `${env.NEXT_PUBLIC_APP_URL}/admin/opportunities`,
      },
    });
  }

  await audit({
    actorId: null,
    actorRole: "system",
    action: "investment.confirmed",
    targetType: "investment",
    targetId: investmentId,
    after: { amountMinor: investment.amountMinor, units: investment.units },
  });
}

export async function cancel(investmentId: string): Promise<Result<true>> {
  await connectDb();
  const investment = await InvestmentModel.findOneAndUpdate(
    { _id: investmentId, status: { $in: ["pending", "awaiting_payment", "awaiting_confirmation"] } },
    { $set: { status: "cancelled" } }
  );
  if (!investment) return err("NOT_FOUND", "Investment not found or already resolved");
  await releaseReservation(investment.opportunityId.toString(), investment.units);
  return ok(true);
}

/**
 * TTL release job (PRD §14 Day 4 Block 1) — an Inngest cron calls this.
 * MongoDB TTL indexes only delete documents; releasing the reservation
 * counter on the opportunity needs real logic, hence a scheduled function
 * rather than a native TTL index.
 */
export async function releaseExpiredReservations(before: Date = new Date()): Promise<Result<number>> {
  await connectDb();
  const expired = await InvestmentModel.find({
    status: { $in: ["pending", "awaiting_payment", "awaiting_confirmation"] },
    reservedUntil: { $lte: before },
  }).lean();

  for (const inv of expired) {
    await InvestmentModel.updateOne({ _id: inv._id }, { $set: { status: "cancelled" } });
    await releaseReservation(inv.opportunityId.toString(), inv.units);
  }

  return ok(expired.length);
}

export interface InvestmentRow {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  units: number;
  amountMinor: number;
  status: string;
  createdAt: string;
}

export async function listFor(syndicatorUserId: string): Promise<Result<InvestmentRow[]>> {
  await connectDb();
  const syndicator = await SyndicatorModel.findOne({ userId: syndicatorUserId }).lean();
  if (!syndicator) return err("NOT_FOUND", "Syndicator profile not found");

  const investments = await InvestmentModel.find({ syndicatorId: syndicator._id }).sort({ createdAt: -1 }).lean();
  const opportunities = await OpportunityModel.find({
    _id: { $in: investments.map((i) => i.opportunityId) },
  })
    .select("title")
    .lean();
  const titleById = new Map(opportunities.map((o) => [o._id.toString(), o.title]));

  return ok(
    investments.map((i) => ({
      id: i._id.toString(),
      opportunityId: i.opportunityId.toString(),
      opportunityTitle: titleById.get(i.opportunityId.toString()) ?? "Unknown",
      units: i.units,
      amountMinor: i.amountMinor,
      status: i.status,
      createdAt: i.createdAt?.toISOString() ?? "",
    }))
  );
}
