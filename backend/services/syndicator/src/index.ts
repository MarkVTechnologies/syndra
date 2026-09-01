import { connectDb, SyndicatorModel, AmbassadorModel, UserModel } from "@san/db";
import { ok, err, type Result } from "@san/core/result";
import { getEnv } from "@san/core/env";
import type { SyndicatorOnboardInputType } from "@san/core/schemas/syndicator";
import * as identity from "@san/service-identity";
import { sendEvent } from "@san/service-notification";
import { audit } from "@san/service-analytics";
import { resolveAttributionSource } from "./attribution";

export { signAttributionToken, verifyAttributionToken, resolveAttributionSource } from "./attribution";
export type { AttributionResolution } from "./attribution";

/**
 * Public interface — PRD §4.3. Owns: syndicators. Implements the R1-R7
 * attribution rules from PRD §8.1. Portfolio views compose this service
 * with @san/service-investment directly at the call site rather than
 * through a getPortfolio() wrapper here — the frontend already needs both
 * for the page, so a wrapper would just be a pass-through.
 */

export interface AmbassadorContact {
  fullName: string;
  whatsapp: string;
  avatarUrl: string | null;
}

interface AttributionInput {
  signedToken?: string | null;
  cookieAmbassadorId?: string | null;
  queryRef?: string | null;
}

export interface OnboardResult {
  syndicatorId: string;
  alreadyRegistered: boolean;
}

export async function onboard(
  input: SyndicatorOnboardInputType,
  attribution: AttributionInput
): Promise<Result<OnboardResult>> {
  await connectDb();
  const env = getEnv();
  const email = input.email.toLowerCase().trim();

  // R2 — resolve which raw signal to trust, then turn it into an ambassadorId.
  const resolution = resolveAttributionSource(attribution);
  let ambassadorId: string | null = null;

  if (resolution.valueType === "slug" && resolution.value) {
    const amb = await AmbassadorModel.findOne({ slug: resolution.value }).lean();
    ambassadorId = amb?._id.toString() ?? null;
  } else if (resolution.valueType === "ambassadorId" && resolution.value) {
    const exists = await AmbassadorModel.exists({ _id: resolution.value });
    ambassadorId = exists ? resolution.value : null;
  }

  // R6 — self-referral guard: a user cannot be attributed to their own
  // ambassador account (checked on email and phone match).
  let selfReferralBlocked = false;
  if (ambassadorId) {
    const amb = await AmbassadorModel.findById(ambassadorId).lean();
    if (amb) {
      const ambUser = await UserModel.findById(amb.userId).lean();
      if (ambUser?.email === email || amb.phone === input.phone) {
        selfReferralBlocked = true;
        ambassadorId = null;
      }
    } else {
      ambassadorId = null; // dangling reference — fall back to house
    }
  }

  // identity owns users/verification_tokens — reused here rather than
  // duplicating registration logic (role is already generic there).
  const registerResult = await identity.register({ email, password: input.password, role: "syndicator" });
  if (!registerResult.ok) return registerResult;

  if (registerResult.data.alreadyRegistered) {
    return ok({ syndicatorId: registerResult.data.userId, alreadyRegistered: true });
  }

  // R1 — written exactly once, right here, at creation. Nothing else in
  // this codebase is permitted to touch referredBy afterward (enforced at
  // the DB layer too — see syndicator.model.ts pre-hooks).
  const syndicator = await SyndicatorModel.create({
    userId: registerResult.data.userId,
    fullName: input.fullName,
    phone: input.phone,
    whatsapp: input.sameAsPhone ? input.phone : input.whatsapp,
    referredBy: ambassadorId,
    referralSource: resolution.source,
    referredAt: ambassadorId ? new Date() : null,
    lastTouchAmbassadorId: ambassadorId,
    investmentRange: input.investmentRange,
  });

  if (selfReferralBlocked) {
    await audit({
      actorId: registerResult.data.userId,
      actorRole: "syndicator",
      action: "attribution.self_referral_blocked",
      targetType: "syndicator",
      targetId: syndicator._id.toString(),
    });
  }

  let ambassadorContact: AmbassadorContact | null = null;
  if (ambassadorId) {
    const amb = await AmbassadorModel.findByIdAndUpdate(
      ambassadorId,
      { $inc: { "stats.referrals": 1 } },
      { new: true }
    ).lean();
    if (amb) {
      ambassadorContact = {
        fullName: amb.fullName,
        whatsapp: amb.whatsapp?.number ?? "",
        avatarUrl: amb.avatarUrl ?? null,
      };
      const ambUser = await UserModel.findById(amb.userId).lean();
      if (ambUser) {
        await sendEvent({
          name: "syndicator/referred",
          data: {
            ambassadorEmail: ambUser.email,
            syndicatorFirstName: input.fullName.split(" ")[0] ?? input.fullName,
            referralCount: amb.stats?.referrals ?? 1,
            dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
          },
        });
      }
    }
  }

  await sendEvent({
    name: "syndicator/onboarded",
    data: {
      syndicatorId: syndicator._id.toString(),
      email,
      dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/portfolio`,
      ambassador: ambassadorContact,
    },
  });

  return ok({ syndicatorId: syndicator._id.toString(), alreadyRegistered: false });
}

export async function getAttributedAmbassador(syndicatorId: string): Promise<Result<AmbassadorContact | null>> {
  await connectDb();
  const syndicator = await SyndicatorModel.findById(syndicatorId).lean();
  if (!syndicator) return err("NOT_FOUND", "Syndicator not found");
  if (!syndicator.referredBy) return ok(null);

  const amb = await AmbassadorModel.findById(syndicator.referredBy).lean();
  if (!amb) return ok(null);
  return ok({ fullName: amb.fullName, whatsapp: amb.whatsapp?.number ?? "", avatarUrl: amb.avatarUrl ?? null });
}

export async function getByUserId(userId: string): Promise<Result<{ id: string; fullName: string }>> {
  await connectDb();
  const doc = await SyndicatorModel.findOne({ userId }).lean();
  if (!doc) return err("NOT_FOUND", "Syndicator profile not found");
  return ok({ id: doc._id.toString(), fullName: doc.fullName });
}

export interface ReferralRow {
  id: string;
  fullName: string;
  investmentRange: string | null;
  referredAt: string | null;
}

/** The ambassador dashboard's referral list — PRD §14 Day 3 Block 2. */
export async function listReferrals(ambassadorId: string, limit = 50): Promise<Result<ReferralRow[]>> {
  await connectDb();
  const docs = await SyndicatorModel.find({ referredBy: ambassadorId })
    .sort({ referredAt: -1 })
    .limit(limit)
    .lean();
  return ok(
    docs.map((d) => ({
      id: d._id.toString(),
      fullName: d.fullName,
      investmentRange: d.investmentRange ?? null,
      referredAt: d.referredAt?.toISOString() ?? null,
    }))
  );
}
