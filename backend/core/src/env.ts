import { z } from "zod";

/**
 * Every environment variable the platform needs, validated once at boot.
 * PRD §15.1 — the build must fail fast on a missing/malformed var rather
 * than failing at runtime in front of a user.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  AUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 32-byte hex
  ATTRIBUTION_SECRET: z.string().min(32),

  MONGODB_URI: z.string().startsWith("mongodb"),
  MONGODB_DB: z.string().min(1),

  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  INNGEST_EVENT_KEY: z.string().min(1).optional(),
  INNGEST_SIGNING_KEY: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1),
  EMAIL_REPLY_TO: z.string().email(),

  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),

  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1).optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().min(1).optional(),

  TURNSTILE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),

  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  ADMIN_SEED_EMAIL: z.string().email(),
  ADMIN_SEED_PASSWORD: z.string().min(10),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/** Validates process.env once and caches the result. Throws on boot if invalid. */
export function getEnv(): Env {
  if (cached) return cached;

  // A blank line in .env sets the var to "" rather than leaving it unset —
  // Zod's .optional() only treats `undefined` as absent, so without this an
  // unfilled optional var (Sentry, Cloudinary, Paystack, ...) fails
  // validation instead of being skipped.
  const withBlanksStripped = Object.fromEntries(
    Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v])
  );

  const parsed = EnvSchema.safeParse(withBlanksStripped);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
