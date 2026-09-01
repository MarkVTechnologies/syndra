import {
  connectDb,
  CommissionModel,
  AmbassadorModel,
  PayoutModel,
  mongoose,
  type CommissionDoc,
} from "@san/db";
import { ok, err, type Result } from "@san/core/result";
import { calcCommission, type CommissionTerms } from "./calc";
import { reversalBucketFor, canReverse, isValidReversalReason, type CommissionState } from "./ledger";

export { calcCommission };
export type { CommissionTerms, ConfirmedInvestmentLike } from "./calc";

/**
 * Public interface — PRD §4.3 / §6.3. Owns: commissions, payouts.
 * The ledger is append-only for amountMinor: a correction is a NEW signed
 * entry (reverse()), never a mutation. `state` is the one field allowed to
 * transition in place (pending -> payable -> paid) — that's lifecycle, not
 * a historical fact being rewritten. balanceFor() is always a fresh
 * aggregation over the ledger, never the denormalised ambassador.stats
 * cache (which exists only for fast dashboard reads and is nightly-
 * reconciled against this source of truth). PRD §6.3 LEDGER INVARIANT.
 */

export interface ConfirmedInvestmentForAccrual {
  investmentId: string;
  ambassadorId: string | null; // null = house account (R7) — no one to pay
  opportunityId: string;
  syndicatorId: string;
  amountMinor: number;
  units: number;
}

/**
 * Called INSIDE the same MongoDB transaction as investment confirmation
 * (PRD §8.4 atomicity). Idempotent via a partial unique index on
 * {investmentId, entryType:"accrual"} — a webhook replayed ten times still
 * produces exactly one accrual; the duplicate-key path returns the
 * existing entry rather than erroring the whole transaction.
 */
export async function accrue(
  investment: ConfirmedInvestmentForAccrual,
  terms: CommissionTerms & { coolingDays: number },
  session: mongoose.ClientSession
): Promise<Result<CommissionDoc | null>> {
  // R7 house account — investment volume still reconciles (it counts
  // toward totals), but there is no ambassador to accrue a payable
  // commission against. Checked before connectDb(): a house-account
  // investment should never need a DB round trip to resolve.
  if (!investment.ambassadorId) return ok(null);

  await connectDb();

  const amountMinor = calcCommission(
    { amountMinor: investment.amountMinor, units: investment.units },
    terms
  );
  const maturesAt = new Date(Date.now() + terms.coolingDays * 24 * 60 * 60 * 1000);

  try {
    const [doc] = await CommissionModel.create(
      [
        {
          ambassadorId: investment.ambassadorId,
          investmentId: investment.investmentId,
          opportunityId: investment.opportunityId,
          syndicatorId: investment.syndicatorId,
          entryType: "accrual",
          amountMinor,
          rateBps: terms.model === "percentage" ? (terms.valueBps ?? null) : null,
          state: "pending",
          maturesAt,
        },
      ],
      { session }
    );

    await AmbassadorModel.updateOne(
      { _id: investment.ambassadorId },
      { $inc: { "stats.investments": 1, "stats.pendingMinor": amountMinor, "stats.totalEarnedMinor": amountMinor } },
      { session }
    );

    return ok(doc!.toObject());
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      const existing = await CommissionModel.findOne({
        investmentId: investment.investmentId,
        entryType: "accrual",
      })
        .session(session)
        .lean();
      return existing ? ok(existing) : err("IDEMPOTENT_REPLAY", "Commission already accrued");
    }
    throw e;
  }
}

/** Hourly cron: pending -> payable once the cooling period elapses. PRD §8.3. */
export async function markPayable(before: Date): Promise<Result<number>> {
  await connectDb();
  const result = await CommissionModel.updateMany(
    { state: "pending", entryType: "accrual", maturesAt: { $lte: before } },
    { $set: { state: "payable" } }
  );
  return ok(result.modifiedCount);
}

/**
 * Admin marks a payout batch paid. Wraps ledger writes in a transaction;
 * requires typed confirmation of the amount at the caller (frontend) layer
 * per PRD §7.2 — this function trusts its input has already been confirmed.
 */
export async function markPaid(
  payoutId: string,
  actorId: string
): Promise<Result<{ amountMinor: number; commissionCount: number }>> {
  await connectDb();
  const session = await mongoose.startSession();

  try {
    let result: { amountMinor: number; commissionCount: number } | null = null;

    await session.withTransaction(async () => {
      const payout = await PayoutModel.findById(payoutId).session(session);
      if (!payout) throw new AppFlowError("NOT_FOUND", "Payout not found");
      if (payout.status === "paid") throw new AppFlowError("CONFLICT", "Payout already marked paid");

      const commissions = await CommissionModel.find({
        _id: { $in: payout.commissionIds },
        state: "payable",
      }).session(session);

      await CommissionModel.updateMany(
        { _id: { $in: commissions.map((c) => c._id) } },
        { $set: { state: "paid", payoutId: payout._id } },
        { session }
      );

      const amountMinor = commissions.reduce((sum, c) => sum + c.amountMinor, 0);

      await AmbassadorModel.updateOne(
        { _id: payout.ambassadorId },
        { $inc: { "stats.pendingMinor": -amountMinor, "stats.paidMinor": amountMinor } },
        { session }
      );

      await PayoutModel.updateOne(
        { _id: payout._id },
        { $set: { status: "paid", paidAt: new Date(), processedBy: actorId } },
        { session }
      );

      result = { amountMinor, commissionCount: commissions.length };
    });

    return result ? ok(result) : err("INTERNAL", "Transaction produced no result");
  } catch (e) {
    if (e instanceof AppFlowError) return err(e.code, e.message);
    throw e;
  } finally {
    await session.endSession();
  }
}

export async function requestPayout(
  ambassadorId: string
): Promise<Result<{ payoutId: string; amountMinor: number }>> {
  await connectDb();
  const payableCommissions = await CommissionModel.find({ ambassadorId, state: "payable" }).lean();
  if (payableCommissions.length === 0) {
    return err("VALIDATION_FAILED", "No payable commission balance to request");
  }

  const amountMinor = payableCommissions.reduce((sum, c) => sum + c.amountMinor, 0);
  const payout = await PayoutModel.create({
    ambassadorId,
    amountMinor,
    commissionIds: payableCommissions.map((c) => c._id),
    status: "requested",
  });

  return ok({ payoutId: payout._id.toString(), amountMinor });
}

/**
 * Written as a NEW signed-negative entry, never a mutation of the
 * original (PRD §8.3 reversed state). The reversal carries the original's
 * CURRENT state so it nets against the correct balance bucket at
 * aggregation time, without ever touching the original record.
 */
export async function reverse(
  commissionId: string,
  reason: string,
  actorId: string
): Promise<Result<CommissionDoc>> {
  if (!isValidReversalReason(reason)) {
    return err("VALIDATION_FAILED", "Reason must be at least 10 characters", { reason: "Too short" });
  }

  await connectDb();
  const original = await CommissionModel.findById(commissionId).lean();
  if (!original) return err("NOT_FOUND", "Commission entry not found");
  if (!canReverse(original.entryType as "accrual" | "reversal" | "adjustment")) {
    return err("VALIDATION_FAILED", "Only an accrual entry can be reversed");
  }

  const session = await mongoose.startSession();
  try {
    let created: CommissionDoc | null = null;

    await session.withTransaction(async () => {
      const [doc] = await CommissionModel.create(
        [
          {
            ambassadorId: original.ambassadorId,
            investmentId: original.investmentId,
            opportunityId: original.opportunityId,
            syndicatorId: original.syndicatorId,
            entryType: "reversal",
            amountMinor: -original.amountMinor,
            rateBps: original.rateBps,
            state: original.state, // nets against the bucket the original currently sits in
            reversalOfId: original._id,
            reason,
            createdBy: actorId,
          },
        ],
        { session }
      );

      const bucket = reversalBucketFor(original.state as CommissionState);
      await AmbassadorModel.updateOne(
        { _id: original.ambassadorId },
        { $inc: { [bucket]: -original.amountMinor, "stats.totalEarnedMinor": -original.amountMinor } },
        { session }
      );

      created = doc!.toObject();
    });

    return created ? ok(created) : err("INTERNAL", "Transaction produced no result");
  } finally {
    await session.endSession();
  }
}

export interface Balance {
  pendingMinor: number;
  payableMinor: number;
  paidMinor: number;
  totalMinor: number;
}

/** Always a fresh aggregation over the ledger — never the cached counter. */
export async function balanceFor(ambassadorId: string): Promise<Result<Balance>> {
  await connectDb();
  const agg = await CommissionModel.aggregate([
    { $match: { ambassadorId: new mongoose.Types.ObjectId(ambassadorId) } },
    { $group: { _id: "$state", total: { $sum: "$amountMinor" } } },
  ]);

  const byState = new Map<string, number>(agg.map((r) => [r._id as string, r.total as number]));
  const pendingMinor = byState.get("pending") ?? 0;
  const payableMinor = byState.get("payable") ?? 0;
  const paidMinor = byState.get("paid") ?? 0;
  const reversedMinor = byState.get("reversed") ?? 0;

  return ok({
    pendingMinor,
    payableMinor,
    paidMinor,
    totalMinor: pendingMinor + payableMinor + paidMinor + reversedMinor,
  });
}

export interface StatementRow {
  id: string;
  entryType: string;
  amountMinor: number;
  state: string;
  opportunityId: string;
  createdAt: string;
}

export async function statementFor(ambassadorId: string, limit = 200): Promise<Result<StatementRow[]>> {
  await connectDb();
  const docs = await CommissionModel.find({ ambassadorId }).sort({ createdAt: -1 }).limit(limit).lean();
  return ok(
    docs.map((d) => ({
      id: d._id.toString(),
      entryType: d.entryType,
      amountMinor: d.amountMinor,
      state: d.state,
      opportunityId: d.opportunityId.toString(),
      createdAt: d.createdAt?.toISOString() ?? "",
    }))
  );
}

/** Nightly reconciliation (PRD §8.4 / Day 4 Block 8): ledger vs cached ambassador.stats. */
export async function reconcile(ambassadorId: string): Promise<
  Result<{ drift: boolean; ledger: Balance; cached: { pendingMinor: number; paidMinor: number } }>
> {
  await connectDb();
  const [balanceResult, amb] = await Promise.all([
    balanceFor(ambassadorId),
    AmbassadorModel.findById(ambassadorId).select("stats").lean(),
  ]);
  if (!balanceResult.ok) return balanceResult;
  if (!amb) return err("NOT_FOUND", "Ambassador not found");

  const cached = { pendingMinor: amb.stats?.pendingMinor ?? 0, paidMinor: amb.stats?.paidMinor ?? 0 };
  const ledgerPending = balanceResult.data.pendingMinor + balanceResult.data.payableMinor;
  const drift = ledgerPending !== cached.pendingMinor || balanceResult.data.paidMinor !== cached.paidMinor;

  return ok({ drift, ledger: balanceResult.data, cached });
}

export interface ReconciliationDrift {
  ambassadorId: string;
  ambassadorName: string;
  ledgerPendingMinor: number;
  ledgerPaidMinor: number;
  cachedPendingMinor: number;
  cachedPaidMinor: number;
}

/** Runs reconcile() across every ambassador. Backs the nightly reconciliation cron. */
export async function reconcileAll(): Promise<Result<ReconciliationDrift[]>> {
  await connectDb();
  const ambassadors = await AmbassadorModel.find({}).select("fullName").lean();

  const drifts: ReconciliationDrift[] = [];
  for (const amb of ambassadors) {
    const result = await reconcile(amb._id.toString());
    if (result.ok && result.data.drift) {
      drifts.push({
        ambassadorId: amb._id.toString(),
        ambassadorName: amb.fullName,
        ledgerPendingMinor: result.data.ledger.pendingMinor + result.data.ledger.payableMinor,
        ledgerPaidMinor: result.data.ledger.paidMinor,
        cachedPendingMinor: result.data.cached.pendingMinor,
        cachedPaidMinor: result.data.cached.paidMinor,
      });
    }
  }
  return ok(drifts);
}

export interface PayoutRow {
  id: string;
  ambassadorId: string;
  ambassadorName: string;
  amountMinor: number;
  status: string;
  requestedAt: string;
}

/** Admin view, optionally filtered by status — backs /admin/payouts' tabs + CSV export. */
export async function adminListPayouts(status?: string): Promise<Result<PayoutRow[]>> {
  await connectDb();
  const filter = status ? { status } : {};
  const payouts = await PayoutModel.find(filter).sort({ createdAt: -1 }).lean();
  const ambassadors = await AmbassadorModel.find({ _id: { $in: payouts.map((p) => p.ambassadorId) } })
    .select("fullName")
    .lean();
  const nameById = new Map(ambassadors.map((a) => [a._id.toString(), a.fullName]));

  return ok(
    payouts.map((p) => ({
      id: p._id.toString(),
      ambassadorId: p.ambassadorId.toString(),
      ambassadorName: nameById.get(p.ambassadorId.toString()) ?? "Unknown",
      amountMinor: p.amountMinor,
      status: p.status,
      requestedAt: p.requestedAt?.toISOString() ?? p.createdAt?.toISOString() ?? "",
    }))
  );
}

class AppFlowError extends Error {
  constructor(
    public code: "NOT_FOUND" | "CONFLICT",
    message: string
  ) {
    super(message);
  }
}

function isDuplicateKeyError(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === 11000;
}
