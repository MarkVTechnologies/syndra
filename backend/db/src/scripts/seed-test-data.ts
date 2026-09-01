/**
 * Seeds 5 ambassadors, 5 investors (syndicators), and 5 published
 * opportunities so the full platform can be exercised end to end —
 * referral microsites, investment checkout, commissions, admin views.
 *
 * Bypasses the normal registration flow (email verification, admin
 * approval, referral-attribution resolution) on purpose: these are
 * test fixtures, not real signups, so every account is created already
 * `active` with a fixed password. Safe to re-run — existing emails are
 * skipped rather than duplicated.
 */
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../.env") });

import { hash } from "@node-rs/argon2";
import {
  connectDb,
  mongoose,
  UserModel,
  AmbassadorModel,
  SyndicatorModel,
  OpportunityModel,
} from "../index";

const PASSWORD = "Password123!";
const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

const AMBASSADORS = [
  {
    email: "adaeze.okafor@sanhq.test",
    fullName: "Adaeze Okafor",
    phone: "+2348011110001",
    city: "Lagos",
    state: "Lagos",
    yearsExperience: "3-5",
    slug: "adaeze-okafor",
    headline: "Helping Lagos professionals build real estate portfolios.",
  },
  {
    email: "tunde.bakare@sanhq.test",
    fullName: "Tunde Bakare",
    phone: "+2348011110002",
    city: "Ibadan",
    state: "Oyo",
    yearsExperience: "5+",
    slug: "tunde-bakare",
    headline: "Trusted real estate ambassador across South-West Nigeria.",
  },
  {
    email: "chinwe.eze@sanhq.test",
    fullName: "Chinwe Eze",
    phone: "+2348011110003",
    city: "Enugu",
    state: "Enugu",
    yearsExperience: "1-3",
    slug: "chinwe-eze",
    headline: "Connecting diaspora investors to vetted South-East projects.",
  },
  {
    email: "ibrahim.musa@sanhq.test",
    fullName: "Ibrahim Musa",
    phone: "+2348011110004",
    city: "Kano",
    state: "Kano",
    yearsExperience: "5+",
    slug: "ibrahim-musa",
    headline: "Northern Nigeria's bridge to premium property investment.",
  },
  {
    email: "ngozi.adeyemi@sanhq.test",
    fullName: "Ngozi Adeyemi",
    phone: "+2348011110005",
    city: "Abuja",
    state: "FCT",
    yearsExperience: "<1",
    slug: "ngozi-adeyemi",
    headline: "New ambassador, big network — Abuja civil service circles.",
  },
];

const INVESTORS = [
  { email: "femi.adebayo@sanhq.test", fullName: "Femi Adebayo", phone: "+2348022220001", investmentRange: "1m_5m" },
  { email: "grace.okonkwo@sanhq.test", fullName: "Grace Okonkwo", phone: "+2348022220002", investmentRange: "5m_20m" },
  { email: "yusuf.danjuma@sanhq.test", fullName: "Yusuf Danjuma", phone: "+2348022220003", investmentRange: "under_1m" },
  { email: "blessing.chukwu@sanhq.test", fullName: "Blessing Chukwu", phone: "+2348022220004", investmentRange: "20m_plus" },
  { email: "ahmed.lawal@sanhq.test", fullName: "Ahmed Lawal", phone: "+2348022220005", investmentRange: "1m_5m" },
] as const;

function media(slug: string, count = 3) {
  return Array.from({ length: count }, (_, i) => ({
    publicId: `seed/${slug}-${i + 1}`,
    url: `https://picsum.photos/seed/${slug}-${i + 1}/1200/800`,
    width: 1200,
    height: 800,
    alt: "",
    order: i,
  }));
}

const PROJECTS = [
  {
    title: "Lekki Waterview Villas",
    slug: "lekki-waterview-villas",
    summary: "Waterfront 4-bedroom villas in a gated Lekki Phase 2 estate.",
    description: "A gated development of 4-bedroom waterfront villas in Lekki Phase 2, targeting completion in 12 months.",
    type: "residential",
    location: { city: "Lagos", state: "Lagos" },
    pricing: { unitPriceMinor: 75_000_000, minUnits: 1, maxUnits: 10, totalUnits: 200 }, // ₦750,000/unit
    returns: { roiPercent: 18, tenorMonths: 12, payoutFrequency: "quarterly" },
    commission: { model: "percentage" as const, valueBps: 500, coolingDays: 7 },
    featured: true,
  },
  {
    title: "Abuja Heights Apartments",
    slug: "abuja-heights-apartments",
    summary: "Mid-rise serviced apartments minutes from the Abuja CBD.",
    description: "150-unit serviced apartment block in Guzape, Abuja, aimed at short-let and corporate rental demand.",
    type: "residential",
    location: { city: "Abuja", state: "FCT" },
    pricing: { unitPriceMinor: 100_000_000, minUnits: 1, maxUnits: 8, totalUnits: 150 }, // ₦1,000,000/unit
    returns: { roiPercent: 20, tenorMonths: 18, payoutFrequency: "quarterly" },
    commission: { model: "percentage" as const, valueBps: 400, coolingDays: 7 },
    featured: false,
  },
  {
    title: "Port Harcourt Business Hub",
    slug: "port-harcourt-business-hub",
    summary: "Mixed-tenant commercial complex along the Trans-Amadi corridor.",
    description: "An 80-unit commercial office and retail complex on Trans-Amadi, Port Harcourt, pre-let to regional operators.",
    type: "commercial",
    location: { city: "Port Harcourt", state: "Rivers" },
    pricing: { unitPriceMinor: 200_000_000, minUnits: 1, maxUnits: 5, totalUnits: 80 }, // ₦2,000,000/unit
    returns: { roiPercent: 22, tenorMonths: 24, payoutFrequency: "annually" },
    commission: { model: "flat" as const, valueMinor: 2_000_000, coolingDays: 10 }, // ₦20,000 flat/unit
    featured: true,
  },
  {
    title: "Enugu Green Estate",
    slug: "enugu-green-estate",
    summary: "Serviced residential plots with titled documentation in Enugu.",
    description: "300 serviced plots with C-of-O-track titling in a fast-growing Enugu suburb, sold in flexible unit sizes.",
    type: "land",
    location: { city: "Enugu", state: "Enugu" },
    pricing: { unitPriceMinor: 30_000_000, minUnits: 1, maxUnits: 20, totalUnits: 300 }, // ₦300,000/unit
    returns: { roiPercent: 15, tenorMonths: 9, payoutFrequency: "at_maturity" },
    commission: { model: "percentage" as const, valueBps: 600, coolingDays: 7 },
    featured: false,
  },
  {
    title: "Kano Trade Plaza",
    slug: "kano-trade-plaza",
    summary: "Mixed-use retail and warehousing plaza serving Kano's trade corridor.",
    description: "A 100-unit mixed-use plaza combining ground-floor retail with upper-floor warehousing near Kano's central market.",
    type: "mixed_use",
    location: { city: "Kano", state: "Kano" },
    pricing: { unitPriceMinor: 150_000_000, minUnits: 1, maxUnits: 6, totalUnits: 100 }, // ₦1,500,000/unit
    returns: { roiPercent: 25, tenorMonths: 24, payoutFrequency: "quarterly" },
    commission: { model: "percentage" as const, valueBps: 450, coolingDays: 7 },
    featured: false,
  },
];

async function main() {
  await connectDb();
  const passwordHash = await hash(PASSWORD, ARGON2_OPTS);
  const admin = await UserModel.findOne({ role: "admin" }).lean();

  console.log("\n=== Ambassadors ===");
  const ambassadorIds: string[] = [];
  for (const a of AMBASSADORS) {
    let user = await UserModel.findOne({ email: a.email });
    if (!user) {
      user = await UserModel.create({
        email: a.email,
        passwordHash,
        role: "ambassador",
        status: "active",
        emailVerifiedAt: new Date(),
      });
    }
    ambassadorIds.push(user._id.toString());

    const existingProfile = await AmbassadorModel.findOne({ userId: user._id });
    if (!existingProfile) {
      await AmbassadorModel.create({
        userId: user._id,
        slug: a.slug,
        fullName: a.fullName,
        headline: a.headline,
        phone: a.phone,
        whatsapp: { number: a.phone, verified: true },
        city: a.city,
        state: a.state,
        yearsExperience: a.yearsExperience,
        approvedAt: new Date(),
      });
    }
    console.log(`  ${a.email}  (san.com/${a.slug})`);
  }

  console.log("\n=== Investors (syndicators) ===");
  for (const [i, inv] of INVESTORS.entries()) {
    let user = await UserModel.findOne({ email: inv.email });
    if (!user) {
      user = await UserModel.create({
        email: inv.email,
        passwordHash,
        role: "syndicator",
        status: "active",
        emailVerifiedAt: new Date(),
      });
    }

    const referringAmbassador = AMBASSADORS[i % AMBASSADORS.length]!;
    const ambassadorId = ambassadorIds[i % ambassadorIds.length]!;

    const existingProfile = await SyndicatorModel.findOne({ userId: user._id });
    if (!existingProfile) {
      await SyndicatorModel.create({
        userId: user._id,
        fullName: inv.fullName,
        phone: inv.phone,
        whatsapp: inv.phone,
        referredBy: ambassadorId,
        referralSource: "seed",
        referredAt: new Date(),
        lastTouchAmbassadorId: ambassadorId,
        investmentRange: inv.investmentRange,
      });
      await AmbassadorModel.updateOne({ _id: ambassadorId }, { $inc: { "stats.referrals": 1 } });
    }
    console.log(`  ${inv.email}  (referred by ${referringAmbassador.fullName})`);
  }

  console.log("\n=== Projects (opportunities) ===");
  for (const p of PROJECTS) {
    const existing = await OpportunityModel.findOne({ slug: p.slug });
    if (!existing) {
      await OpportunityModel.create({
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        description: p.description,
        type: p.type,
        location: p.location,
        media: media(p.slug),
        pricing: { ...p.pricing, unitsSold: 0, reservedUnits: 0 },
        returns: p.returns,
        commission: p.commission,
        status: "published",
        publishedAt: new Date(),
        featured: p.featured,
        createdBy: admin?._id ?? undefined,
      });
    }
    console.log(`  ${p.title}  (san.com/opportunities/${p.slug})`);
  }

  console.log(`\nAll seeded accounts share the password: ${PASSWORD}`);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
