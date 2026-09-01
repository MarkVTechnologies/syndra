import { z } from "zod";

export const OpportunityStatus = z.enum([
  "draft",
  "published",
  "paused",
  "closed",
  "sold_out",
]);

export const MediaItem = z.object({
  publicId: z.string(),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().max(200).default(""),
  order: z.number().int().nonnegative(),
});

export const DocumentItem = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  sizeBytes: z.number().int().positive(),
});

/** Drives the admin opportunity builder form and the create/update server actions. */
export const OpportunityInput = z.object({
  title: z.string().trim().min(4).max(140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,80}$/, "Lowercase letters, numbers, hyphens"),
  summary: z.string().trim().min(10).max(280),
  description: z.string().trim().max(20_000).default(""),
  type: z.enum(["residential", "commercial", "mixed_use", "land"]).default("residential"),
  location: z.object({
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
  }),
  media: z.array(MediaItem).max(20).default([]),
  documents: z.array(DocumentItem).max(10).default([]),
  pricing: z.object({
    unitPriceMinor: z.number().int().positive(),
    minUnits: z.number().int().positive(),
    maxUnits: z.number().int().positive(),
    totalUnits: z.number().int().positive(),
  }),
  returns: z.object({
    roiPercent: z.number().min(0).max(1000).optional(),
    tenorMonths: z.number().int().positive().optional(),
    payoutFrequency: z.enum(["monthly", "quarterly", "annually", "at_maturity"]).optional(),
  }),
  commission: z.object({
    model: z.enum(["percentage", "flat"]),
    valueBps: z.number().int().min(0).max(10_000).optional(),
    valueMinor: z.number().int().min(0).optional(),
    coolingDays: z.number().int().min(0).max(90).default(7),
  }),
  featured: z.boolean().default(false),
});
export type OpportunityInputType = z.infer<typeof OpportunityInput>;

/**
 * Publish requires: >=1 image, commission terms set, pricing complete —
 * enforced server-side, surfaced as a checklist in the UI. PRD §7.2.
 */
export function getPublishChecklist(input: {
  media: unknown[];
  commission: { model: string; valueBps?: number | null; valueMinor?: number | null };
  pricing: { unitPriceMinor: number; minUnits: number; maxUnits: number; totalUnits: number };
  summary: string;
}): { key: string; label: string; met: boolean }[] {
  const commissionValueSet =
    input.commission.model === "percentage"
      ? Boolean(input.commission.valueBps && input.commission.valueBps > 0)
      : Boolean(input.commission.valueMinor && input.commission.valueMinor > 0);

  return [
    { key: "image", label: "At least one image", met: input.media.length >= 1 },
    { key: "commission", label: "Commission terms set", met: commissionValueSet },
    {
      key: "pricing",
      label: "Pricing complete",
      met:
        input.pricing.unitPriceMinor > 0 &&
        input.pricing.minUnits > 0 &&
        input.pricing.maxUnits >= input.pricing.minUnits &&
        input.pricing.totalUnits >= input.pricing.maxUnits,
    },
    { key: "summary", label: "Summary written", met: input.summary.trim().length >= 10 },
  ];
}
