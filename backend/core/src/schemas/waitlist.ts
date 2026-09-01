import { z } from "zod";
import {
  NIGERIAN_STATES,
  EXPERIENCE_BANDS,
  RESERVED_SLUGS,
  PHONE_REGEX,
  SLUG_REGEX,
} from "../constants";

export { NIGERIAN_STATES, EXPERIENCE_BANDS, RESERVED_SLUGS };

export const WaitlistInput = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-zA-Z\s'-]+$/, "Only letters, spaces and hyphens are allowed"),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().regex(PHONE_REGEX, "Enter a valid Nigerian phone number"),
    whatsapp: z.string().regex(PHONE_REGEX, "Enter a valid WhatsApp number"),
    sameAsPhone: z.boolean().default(true),
    city: z.string().trim().min(2).max(60),
    state: z.enum(NIGERIAN_STATES),
    yearsExperience: z.enum(EXPERIENCE_BANDS),
    desiredSlug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(SLUG_REGEX, "3-30 characters: lowercase letters, numbers, hyphens"),
    password: z.string().min(10, "Minimum 10 characters"),
    consent: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
    honeypot: z.string().max(0).optional().default(""),
    turnstileToken: z.string().min(1),
    utm: z
      .object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
      })
      .optional(),
  })
  .refine((v) => !RESERVED_SLUGS.has(v.desiredSlug), {
    message: "This page name is reserved",
    path: ["desiredSlug"],
  });

export type WaitlistInputType = z.infer<typeof WaitlistInput>;

export const SlugCheckQuery = z.object({
  slug: z.string().trim().toLowerCase().regex(SLUG_REGEX),
});
