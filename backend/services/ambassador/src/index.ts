import {
  connectDb,
  AmbassadorModel,
  ListingModel,
  UserModel,
  OpportunityModel,
  type AmbassadorDoc,
  type OpportunityDoc,
} from "@san/db";
import { ok, err, type Result } from "@san/core/result";
import { RESERVED_SLUGS } from "@san/core/constants";
import { escapeRegex } from "@san/core/sanitize";
import type { UpdateMicrositeInputType } from "@san/core/schemas/ambassador";

const SLUG_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // PRD §7.2: 1/30 days
const SLUG_REDIRECT_WINDOW_MS = 90 * 24 * 60 * 60 * 1000; // PRD §7.2: 301 for 90 days

/**
 * Public interface — PRD §4.3. Owns: ambassadors, listings, microsite_views.
 */

export interface CreateProfileInput {
  userId: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  yearsExperience: string;
  slug: string;
}

/** Total registered ambassadors — public trust-signal stat on the marketing homepage. */
export async function getCount(): Promise<number> {
  await connectDb();
  return AmbassadorModel.countDocuments({});
}

export async function createProfile(input: CreateProfileInput): Promise<Result<AmbassadorDoc>> {
  await connectDb();

  if (RESERVED_SLUGS.has(input.slug)) {
    return err("VALIDATION_FAILED", "This page name is reserved", { slug: "Reserved" });
  }

  try {
    const doc = await AmbassadorModel.create({
      userId: input.userId,
      slug: input.slug,
      fullName: input.fullName,
      phone: input.phone,
      whatsapp: { number: input.whatsapp, verified: false },
      city: input.city,
      state: input.state,
      yearsExperience: input.yearsExperience,
    });
    return ok(doc.toObject());
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      return err("CONFLICT", "This page name was just taken — try another", { slug: "Taken" });
    }
    throw e;
  }
}

export async function updateProfile(
  ambassadorId: string,
  input: UpdateMicrositeInputType
): Promise<Result<AmbassadorDoc>> {
  await connectDb();
  const updated = await AmbassadorModel.findByIdAndUpdate(
    ambassadorId,
    {
      $set: {
        headline: input.headline,
        bio: input.bio,
        "whatsapp.number": input.whatsapp,
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
    },
    { new: true }
  ).lean();
  if (!updated) return err("NOT_FOUND", "Ambassador profile not found");
  return ok(updated);
}

/** Initial slug claim (onboarding) — no cooldown, this is the first-ever set. */
export async function claimSlug(ambassadorId: string, slug: string): Promise<Result<true>> {
  await connectDb();
  if (RESERVED_SLUGS.has(slug)) {
    return err("VALIDATION_FAILED", "This page name is reserved", { slug: "Reserved" });
  }
  try {
    const updated = await AmbassadorModel.findByIdAndUpdate(ambassadorId, { $set: { slug } });
    if (!updated) return err("NOT_FOUND", "Ambassador profile not found");
    return ok(true);
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      return err("CONFLICT", "This page name is already taken", { slug: "Taken" });
    }
    throw e;
  }
}

/**
 * A later slug CHANGE (not the initial claim): rate-limited to 1/30 days,
 * and 301-redirects the old slug for 90 days. PRD §7.2 updateMicrosite.
 */
export async function changeSlug(ambassadorId: string, newSlug: string): Promise<Result<true>> {
  await connectDb();
  if (RESERVED_SLUGS.has(newSlug)) {
    return err("VALIDATION_FAILED", "This page name is reserved", { slug: "Reserved" });
  }

  const amb = await AmbassadorModel.findById(ambassadorId).lean();
  if (!amb) return err("NOT_FOUND", "Ambassador profile not found");
  if (amb.slug === newSlug) return ok(true);

  const lastChange = amb.slugHistory?.at(-1)?.changedAt;
  if (lastChange && Date.now() - new Date(lastChange).getTime() < SLUG_CHANGE_COOLDOWN_MS) {
    const daysLeft = Math.ceil(
      (SLUG_CHANGE_COOLDOWN_MS - (Date.now() - new Date(lastChange).getTime())) / (24 * 60 * 60 * 1000)
    );
    return err("RATE_LIMITED", `You can change your page name again in ${daysLeft} day(s)`);
  }

  const now = new Date();
  try {
    const updated = await AmbassadorModel.findByIdAndUpdate(ambassadorId, {
      $set: { slug: newSlug },
      $push: {
        slugHistory: {
          slug: amb.slug,
          redirectUntil: new Date(now.getTime() + SLUG_REDIRECT_WINDOW_MS),
          changedAt: now,
        },
      },
    });
    if (!updated) return err("NOT_FOUND", "Ambassador profile not found");
    return ok(true);
  } catch (e) {
    if (isDuplicateKeyError(e)) {
      return err("CONFLICT", "This page name is already taken", { slug: "Taken" });
    }
    throw e;
  }
}

/** Returns the current slug if `slug` is a still-valid 301 redirect target, else null. */
export async function resolveSlugRedirect(slug: string): Promise<string | null> {
  await connectDb();
  const now = new Date();
  const amb = await AmbassadorModel.findOne({
    "slugHistory.slug": slug,
    "slugHistory.redirectUntil": { $gt: now },
  })
    .select("slug slugHistory")
    .lean();
  if (!amb) return null;
  const stillValid = amb.slugHistory?.some((h) => h.slug === slug && h.redirectUntil && h.redirectUntil > now);
  return stillValid ? amb.slug : null;
}

export async function promote(ambassadorId: string, opportunityId: string): Promise<Result<true>> {
  await connectDb();
  await ListingModel.updateOne(
    { ambassadorId, opportunityId },
    { $set: { active: true, promotedAt: new Date() } },
    { upsert: true }
  );
  return ok(true);
}

export async function unpromote(ambassadorId: string, opportunityId: string): Promise<Result<true>> {
  await connectDb();
  await ListingModel.updateOne({ ambassadorId, opportunityId }, { $set: { active: false } });
  return ok(true);
}

export async function listPromotedIds(ambassadorId: string): Promise<Result<string[]>> {
  await connectDb();
  const listings = await ListingModel.find({ ambassadorId, active: true }).select("opportunityId").lean();
  return ok(listings.map((l) => l.opportunityId.toString()));
}

export async function getByUserId(userId: string): Promise<Result<AmbassadorDoc>> {
  await connectDb();
  const doc = await AmbassadorModel.findOne({ userId }).lean();
  if (!doc) return err("NOT_FOUND", "Ambassador profile not found");
  return ok(doc);
}

export async function getStats(ambassadorId: string): Promise<Result<AmbassadorDoc["stats"]>> {
  await connectDb();
  const doc = await AmbassadorModel.findById(ambassadorId).select("stats").lean();
  if (!doc) return err("NOT_FOUND", "Ambassador profile not found");
  return ok(doc.stats);
}

export interface MicrositeData {
  ambassador: {
    id: string;
    slug: string;
    fullName: string;
    headline: string;
    bio: string;
    avatarUrl: string | null;
    whatsapp: string;
    city: string | null;
    state: string | null;
  };
  opportunities: OpportunityDoc[];
}

/** The public /[slug] page's data assembly — ambassador + promoted, published opportunities. */
export async function getMicrosite(slug: string): Promise<Result<MicrositeData>> {
  await connectDb();
  const amb = await AmbassadorModel.findOne({ slug, deletedAt: null }).lean();
  if (!amb) return err("NOT_FOUND", "This page doesn't exist");

  const listings = await ListingModel.find({ ambassadorId: amb._id, active: true })
    .sort({ order: 1, promotedAt: -1 })
    .select("opportunityId")
    .lean();

  const opportunities = await OpportunityModel.find({
    _id: { $in: listings.map((l) => l.opportunityId) },
    status: "published",
    deletedAt: null,
  }).lean();

  // Preserve promotion order rather than the $in query's arbitrary order.
  const order = new Map(listings.map((l, i) => [l.opportunityId.toString(), i]));
  opportunities.sort((a, b) => (order.get(a._id.toString()) ?? 0) - (order.get(b._id.toString()) ?? 0));

  return ok({
    ambassador: {
      id: amb._id.toString(),
      slug: amb.slug,
      fullName: amb.fullName,
      headline: amb.headline ?? "",
      bio: amb.bio ?? "",
      avatarUrl: amb.avatarUrl ?? null,
      whatsapp: amb.whatsapp?.number ?? "",
      city: amb.city ?? null,
      state: amb.state ?? null,
    },
    opportunities,
  });
}

/**
 * Fire-and-forget view counter. Page views themselves are recorded in the
 * shared `events` collection (analytics domain) via /api/track — this is
 * just the fast denormalised counter shown on the ambassador dashboard,
 * rebuildable from `events` if it ever drifts (PRD §6.1).
 */
export async function recordView(ambassadorId: string): Promise<void> {
  await connectDb();
  await AmbassadorModel.updateOne({ _id: ambassadorId }, { $inc: { "stats.views": 1 } });
}

// ---------------------------------------------------------------------------
// Admin directory — reads the users collection for status/email enrichment.
// Lives here (not a new service) since the primary listed entity is the
// ambassador profile; identity still owns writes to user status.
// ---------------------------------------------------------------------------

export interface AmbassadorDirectoryRow {
  userId: string;
  ambassadorId: string | null;
  email: string;
  fullName: string;
  slug: string | null;
  status: string;
  city: string | null;
  state: string | null;
  totalEarnedMinor: number;
  createdAt: string;
}

export async function adminListAmbassadors(params: {
  page: number;
  pageSize: number;
  search?: string;
}): Promise<Result<{ rows: AmbassadorDirectoryRow[]; total: number }>> {
  await connectDb();
  const { page, pageSize, search } = params;

  const userFilter: Record<string, unknown> = { role: "ambassador" };
  if (search) userFilter.email = { $regex: escapeRegex(search), $options: "i" };

  const [users, total] = await Promise.all([
    UserModel.find(userFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    UserModel.countDocuments(userFilter),
  ]);

  const ambassadors = await AmbassadorModel.find({ userId: { $in: users.map((u) => u._id) } }).lean();
  const byUserId = new Map(ambassadors.map((a) => [a.userId.toString(), a]));

  return ok({
    rows: users.map((u) => {
      const a = byUserId.get(u._id.toString());
      return {
        userId: u._id.toString(),
        ambassadorId: a?._id.toString() ?? null,
        email: u.email,
        fullName: a?.fullName ?? "(profile pending)",
        slug: a?.slug ?? null,
        status: u.status,
        city: a?.city ?? null,
        state: a?.state ?? null,
        totalEarnedMinor: a?.stats?.totalEarnedMinor ?? 0,
        createdAt: u.createdAt?.toISOString() ?? "",
      };
    }),
    total,
  });
}

function isDuplicateKeyError(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === 11000;
}
