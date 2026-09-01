import { z } from "zod";
import { PHONE_REGEX } from "../constants";

export const INVESTMENT_RANGES = [
  "under_1m",
  "1m_5m",
  "5m_20m",
  "20m_plus",
] as const;

/** Microsite onboarding form — PRD §3.3 Flow B. */
export const SyndicatorOnboardInput = z.object({
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
  password: z.string().min(10, "Minimum 10 characters"),
  investmentRange: z.enum(INVESTMENT_RANGES),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
  honeypot: z.string().max(0).optional().default(""),
  turnstileToken: z.string().min(1),
});
export type SyndicatorOnboardInputType = z.infer<typeof SyndicatorOnboardInput>;
