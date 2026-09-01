import {
  connectDb,
  EventModel,
  AuditLogModel,
  UserModel,
  AmbassadorModel,
  SyndicatorModel,
  InvestmentModel,
  CommissionModel,
  mongoose,
} from "@san/db";
import { ok, type Result } from "@san/core/result";
import { Redis } from "@upstash/redis";
import { getEnv } from "@san/core/env";

export interface TrackInput {
  name: string;
  actorId?: string | null;
  actorRole?: string | null;
  ambassadorId?: string | null;
  props?: Record<string, unknown>;
  sessionId?: string | null;
  ipHash?: string | null;
  ua?: string | null;
}

let _redis: Redis | null = null;
function redisClient(): Redis {
  if (!_redis) {
    const env = getEnv();
    _redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
  }
  return _redis;
}

const DEDUPE_WINDOW_SECONDS = 30 * 60; // 30 min — PRD §3.2 "deduped per session"

/**
 * Fire-and-forget beacon writer. Never throws into the request path.
 * `recorded: false` means this (sessionId, name, slug/ambassadorId) was
 * already seen within the dedupe window — the caller should skip anything
 * that shouldn't double-count (e.g. a view counter) too.
 */
export async function track(input: TrackInput): Promise<Result<{ recorded: boolean }>> {
  try {
    if (input.sessionId) {
      const dedupeKey = `track:dedupe:${input.sessionId}:${input.name}:${input.props?.slug ?? input.ambassadorId ?? ""}`;
      const claimed = await redisClient().set(dedupeKey, 1, { nx: true, ex: DEDUPE_WINDOW_SECONDS });
      if (claimed === null) return ok({ recorded: false });
    }

    await connectDb();
    await EventModel.create(input);
  } catch {
    // Analytics must never break the caller — swallow and move on.
  }
  return ok({ recorded: true });
}

export interface AuditInput {
  actorId?: string | null;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

/** Append-only. Used by every admin mutation that needs a paper trail. */
export async function audit(input: AuditInput): Promise<Result<true>> {
  await connectDb();
  await AuditLogModel.create(input);
  return ok(true);
}

export interface AuditLogRow {
  id: string;
  actorId: string | null;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  createdAt: string;
}

export async function listAuditLogs(params: {
  page: number;
  pageSize: number;
  targetType?: string;
}): Promise<Result<{ rows: AuditLogRow[]; total: number }>> {
  await connectDb();
  const { page, pageSize, targetType } = params;
  const filter = targetType ? { targetType } : {};

  const [docs, total] = await Promise.all([
    AuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLogModel.countDocuments(filter),
  ]);

  return ok({
    rows: docs.map((d) => ({
      id: d._id.toString(),
      actorId: d.actorId?.toString() ?? null,
      actorRole: d.actorRole,
      action: d.action,
      targetType: d.targetType,
      targetId: d.targetId,
      before: d.before,
      after: d.after,
      ip: d.ip ?? null,
      createdAt: d.createdAt?.toISOString() ?? "",
    })),
    total,
  });
}

export interface LeaderboardRow {
  ambassadorId: string;
  fullName: string;
  slug: string;
  totalEarnedMinor: number;
  referrals: number;
  investments: number;
}

export interface PipelineCounts {
  pending: number;
  awaiting_payment: number;
  awaiting_confirmation: number;
  confirmed: number;
  cancelled: number;
  refunded: number;
}

export interface AdminOverview {
  kpis: {
    totalAmbassadors: number;
    activeAmbassadors: number;
    activationRate: number; // active / total, 0-100
    totalSyndicators: number;
    totalInvestmentVolumeMinor: number;
    commissionLiabilityMinor: number; // pending + payable, not yet paid out
  };
  leaderboard: LeaderboardRow[];
  pipeline: PipelineCounts;
}

/** Platform KPIs, ambassador leaderboard, investment pipeline — PRD §14 Day 5 Block 1. */
export async function adminOverview(): Promise<Result<AdminOverview>> {
  await connectDb();

  const [
    totalAmbassadors,
    activeAmbassadorUserIds,
    totalSyndicators,
    volumeAgg,
    liabilityAgg,
    leaderboardDocs,
    pipelineAgg,
  ] = await Promise.all([
    AmbassadorModel.countDocuments({ deletedAt: null }),
    UserModel.find({ role: "ambassador", status: "active" }).select("_id").lean(),
    SyndicatorModel.countDocuments({ deletedAt: null }),
    InvestmentModel.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amountMinor" } } },
    ]),
    CommissionModel.aggregate([
      { $match: { state: { $in: ["pending", "payable"] } } },
      { $group: { _id: null, total: { $sum: "$amountMinor" } } },
    ]),
    AmbassadorModel.find({ deletedAt: null })
      .sort({ "stats.totalEarnedMinor": -1 })
      .limit(10)
      .select("fullName slug stats")
      .lean(),
    InvestmentModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  const activeUserIds = new Set(activeAmbassadorUserIds.map((u) => u._id.toString()));
  const activeAmbassadorProfiles = await AmbassadorModel.countDocuments({
    deletedAt: null,
    userId: { $in: [...activeUserIds].map((id) => new mongoose.Types.ObjectId(id)) },
  });

  const pipeline: PipelineCounts = {
    pending: 0,
    awaiting_payment: 0,
    awaiting_confirmation: 0,
    confirmed: 0,
    cancelled: 0,
    refunded: 0,
  };
  for (const row of pipelineAgg) {
    if (row._id in pipeline) pipeline[row._id as keyof PipelineCounts] = row.count;
  }

  return ok({
    kpis: {
      totalAmbassadors,
      activeAmbassadors: activeAmbassadorProfiles,
      activationRate: totalAmbassadors > 0 ? Math.round((activeAmbassadorProfiles / totalAmbassadors) * 100) : 0,
      totalSyndicators,
      totalInvestmentVolumeMinor: volumeAgg[0]?.total ?? 0,
      commissionLiabilityMinor: liabilityAgg[0]?.total ?? 0,
    },
    leaderboard: leaderboardDocs.map((a) => ({
      ambassadorId: a._id.toString(),
      fullName: a.fullName,
      slug: a.slug,
      totalEarnedMinor: a.stats?.totalEarnedMinor ?? 0,
      referrals: a.stats?.referrals ?? 0,
      investments: a.stats?.investments ?? 0,
    })),
    pipeline,
  });
}

export interface DigestStats {
  signups24h: number;
  referrals24h: number;
  investmentVolumeMinor: number;
  commissionsAccruedMinor: number;
}

/** Feeds the "Daily Digest" admin email — PRD §9.2 / §14 Day 4 Block 6. */
export async function getDigestStats(): Promise<Result<DigestStats>> {
  await connectDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [signups24h, referrals24h, investmentAgg, commissionAgg] = await Promise.all([
    UserModel.countDocuments({ createdAt: { $gte: since } }),
    SyndicatorModel.countDocuments({ referredAt: { $gte: since } }),
    InvestmentModel.aggregate([
      { $match: { status: "confirmed", confirmedAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: "$amountMinor" } } },
    ]),
    CommissionModel.aggregate([
      { $match: { entryType: "accrual", createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: "$amountMinor" } } },
    ]),
  ]);

  return ok({
    signups24h,
    referrals24h,
    investmentVolumeMinor: investmentAgg[0]?.total ?? 0,
    commissionsAccruedMinor: commissionAgg[0]?.total ?? 0,
  });
}

export interface FunnelPoint {
  date: string;
  views: number;
  clicks: number;
  leads: number;
}

/** view -> click (WhatsApp/call) -> lead (syndicator onboarded) funnel, 14-day daily series. */
export async function ambassadorFunnel(ambassadorId: string, days = 14): Promise<Result<FunnelPoint[]>> {
  await connectDb();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const agg = await EventModel.aggregate([
    {
      $match: {
        ambassadorId: new mongoose.Types.ObjectId(ambassadorId),
        createdAt: { $gte: since },
        name: { $in: ["microsite_view", "whatsapp_click", "syndicator_lead"] },
      },
    },
    {
      $group: {
        _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, name: "$name" },
        count: { $sum: 1 },
      },
    },
  ]);

  const byDate = new Map<string, FunnelPoint>();
  for (const row of agg) {
    const date: string = row._id.date;
    const point = byDate.get(date) ?? { date, views: 0, clicks: 0, leads: 0 };
    if (row._id.name === "microsite_view") point.views = row.count;
    else if (row._id.name === "whatsapp_click") point.clicks = row.count;
    else if (row._id.name === "syndicator_lead") point.leads = row.count;
    byDate.set(date, point);
  }

  return ok(Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)));
}
