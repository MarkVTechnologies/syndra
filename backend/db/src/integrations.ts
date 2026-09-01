import { getEnv } from "@san/core/env";
import { encryptSecret, decryptSecret, maskSecret } from "@san/core/crypto";
import { connectDb } from "./client";
import { SettingsModel } from "./models/settings.model";

/**
 * Admin-configurable integration credentials, resolved DB-first with a
 * .env fallback — an admin entering a key in the settings UI overrides
 * whatever is in the environment, but a deployment that only ever used
 * .env keeps working with zero admin action required.
 *
 * Deliberately NOT here (stay .env-only, see README/RUNBOOK for why):
 *   - MONGODB_URI / MONGODB_DB — bootstrap: you need the DB connection
 *     working before you could ever read a DB-stored override of it.
 *   - AUTH_SECRET — verified on every request inside Edge Middleware,
 *     which cannot do a Mongo round-trip; rotating it also invalidates
 *     every session instantly, which shouldn't be one form-save away.
 *   - ENCRYPTION_KEY — it's the key that unlocks everything stored here;
 *     storing it in the vault it unlocks is circular.
 *   - UPSTASH_REDIS_REST_URL/TOKEN — also read inside Edge Middleware
 *     (session revocation) and on the rate-limiting hot path; adding a
 *     Mongo lookup ahead of every request to resolve Redis's own
 *     credentials defeats the point of Redis being the fast path.
 *   - INNGEST_EVENT_KEY/SIGNING_KEY — the Inngest client is constructed
 *     once at module load (`new Inngest(...)`), synchronously, before any
 *     DB connection exists; making this DB-configurable would need a
 *     broader client-lifecycle refactor across ~15 call sites for a key
 *     that (thanks to sendEvent()'s fail-open wrapper) never blocks a
 *     user-facing action if it's wrong anyway.
 *   - ATTRIBUTION_SECRET — rotating it invalidates any attribution token
 *     issued in the last 24h; kept .env-only to avoid an admin
 *     accidentally breaking in-flight referral links from a settings form.
 */

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: unknown; expiresAt: number }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const value = await load();
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

/** Call after any settings update so the next read reflects it within this process immediately, not after TTL. */
export function invalidateIntegrationCache(): void {
  cache.clear();
}

async function getIntegrations() {
  await connectDb();
  const doc = await SettingsModel.findOne({ singleton: "singleton" }).select("integrations").lean();
  return doc?.integrations ?? {};
}

function decryptOrNull(enc: string | null | undefined): string | null {
  if (!enc) return null;
  try {
    return decryptSecret(enc);
  } catch {
    return null; // corrupted/foreign-key-encrypted value — treat as unset rather than crash the caller
  }
}

export interface ResendConfig {
  apiKey: string;
  webhookSecret: string | undefined;
  from: string;
  replyTo: string;
}

export async function getResendConfig(): Promise<ResendConfig> {
  return cached("resend", async () => {
    const env = getEnv();
    const db = await getIntegrations();
    return {
      apiKey: decryptOrNull(db.resendApiKeyEnc) ?? env.RESEND_API_KEY,
      webhookSecret: decryptOrNull(db.resendWebhookSecretEnc) ?? env.RESEND_WEBHOOK_SECRET,
      from: db.emailFrom ?? env.EMAIL_FROM,
      replyTo: db.emailReplyTo ?? env.EMAIL_REPLY_TO,
    };
  });
}

export interface CloudinaryConfig {
  cloudName: string | undefined;
  apiKey: string | undefined;
  apiSecret: string | undefined;
}

export async function getCloudinaryConfig(): Promise<CloudinaryConfig> {
  return cached("cloudinary", async () => {
    const env = getEnv();
    const db = await getIntegrations();
    return {
      cloudName: db.cloudinaryCloudName ?? env.CLOUDINARY_CLOUD_NAME,
      apiKey: decryptOrNull(db.cloudinaryApiKeyEnc) ?? env.CLOUDINARY_API_KEY,
      apiSecret: decryptOrNull(db.cloudinaryApiSecretEnc) ?? env.CLOUDINARY_API_SECRET,
    };
  });
}

export interface PaystackConfig {
  secretKey: string | undefined;
  webhookSecret: string | undefined;
}

export async function getPaystackConfig(): Promise<PaystackConfig> {
  return cached("paystack", async () => {
    const env = getEnv();
    const db = await getIntegrations();
    return {
      secretKey: decryptOrNull(db.paystackSecretKeyEnc) ?? env.PAYSTACK_SECRET_KEY,
      webhookSecret: decryptOrNull(db.paystackWebhookSecretEnc) ?? env.PAYSTACK_WEBHOOK_SECRET,
    };
  });
}

export interface TurnstileConfig {
  secretKey: string;
  siteKey: string;
}

export async function getTurnstileConfig(): Promise<TurnstileConfig> {
  return cached("turnstile", async () => {
    const env = getEnv();
    const db = await getIntegrations();
    return {
      secretKey: decryptOrNull(db.turnstileSecretKeyEnc) ?? env.TURNSTILE_SECRET_KEY,
      siteKey: db.turnstileSiteKey ?? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    };
  });
}

// ---------------------------------------------------------------------------
// Admin settings UI support — status (masked, never the real value) + update
// ---------------------------------------------------------------------------

export interface IntegrationFieldStatus {
  configured: boolean;
  source: "database" | "environment" | "unset";
  masked: string | null;
}

export interface IntegrationStatus {
  resendApiKey: IntegrationFieldStatus;
  resendWebhookSecret: IntegrationFieldStatus;
  emailFrom: IntegrationFieldStatus;
  emailReplyTo: IntegrationFieldStatus;
  cloudinaryCloudName: IntegrationFieldStatus;
  cloudinaryApiKey: IntegrationFieldStatus;
  cloudinaryApiSecret: IntegrationFieldStatus;
  paystackSecretKey: IntegrationFieldStatus;
  paystackWebhookSecret: IntegrationFieldStatus;
  turnstileSecretKey: IntegrationFieldStatus;
  turnstileSiteKey: IntegrationFieldStatus;
}

function statusFor(dbValue: string | null | undefined, envValue: string | undefined, isSecret: boolean): IntegrationFieldStatus {
  if (dbValue) {
    return { configured: true, source: "database", masked: isSecret ? maskSecret(dbValue) : dbValue };
  }
  if (envValue) {
    return { configured: true, source: "environment", masked: isSecret ? maskSecret(envValue) : envValue };
  }
  return { configured: false, source: "unset", masked: null };
}

/** Never returns a real secret — only whether each is set, where from, and a masked preview. */
export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const env = getEnv();
  const db = await getIntegrations();
  return {
    resendApiKey: statusFor(decryptOrNull(db.resendApiKeyEnc), env.RESEND_API_KEY, true),
    resendWebhookSecret: statusFor(decryptOrNull(db.resendWebhookSecretEnc), env.RESEND_WEBHOOK_SECRET, true),
    emailFrom: statusFor(db.emailFrom, env.EMAIL_FROM, false),
    emailReplyTo: statusFor(db.emailReplyTo, env.EMAIL_REPLY_TO, false),
    cloudinaryCloudName: statusFor(db.cloudinaryCloudName, env.CLOUDINARY_CLOUD_NAME, false),
    cloudinaryApiKey: statusFor(decryptOrNull(db.cloudinaryApiKeyEnc), env.CLOUDINARY_API_KEY, true),
    cloudinaryApiSecret: statusFor(decryptOrNull(db.cloudinaryApiSecretEnc), env.CLOUDINARY_API_SECRET, true),
    paystackSecretKey: statusFor(decryptOrNull(db.paystackSecretKeyEnc), env.PAYSTACK_SECRET_KEY, true),
    paystackWebhookSecret: statusFor(decryptOrNull(db.paystackWebhookSecretEnc), env.PAYSTACK_WEBHOOK_SECRET, true),
    turnstileSecretKey: statusFor(decryptOrNull(db.turnstileSecretKeyEnc), env.TURNSTILE_SECRET_KEY, true),
    turnstileSiteKey: statusFor(db.turnstileSiteKey, env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, false),
  };
}

export interface IntegrationUpdateInput {
  resendApiKey?: string;
  resendWebhookSecret?: string;
  emailFrom?: string;
  emailReplyTo?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  paystackSecretKey?: string;
  paystackWebhookSecret?: string;
  turnstileSecretKey?: string;
  turnstileSiteKey?: string;
}

const SECRET_FIELDS = [
  "resendApiKey",
  "resendWebhookSecret",
  "cloudinaryApiKey",
  "cloudinaryApiSecret",
  "paystackSecretKey",
  "paystackWebhookSecret",
  "turnstileSecretKey",
] as const;
const PLAIN_FIELDS = ["emailFrom", "emailReplyTo", "cloudinaryCloudName", "turnstileSiteKey"] as const;

/**
 * Only fields actually present in `input` are touched — an empty settings
 * form re-submit never wipes out values the admin didn't mean to change.
 * Returns which field NAMES changed (never values) for audit logging.
 */
export async function updateIntegrationSettings(input: IntegrationUpdateInput): Promise<string[]> {
  await connectDb();
  const $set: Record<string, string> = {};
  const changed: string[] = [];

  for (const field of SECRET_FIELDS) {
    const value = input[field];
    if (value !== undefined && value.trim() !== "") {
      $set[`integrations.${field}Enc`] = encryptSecret(value.trim());
      changed.push(field);
    }
  }
  for (const field of PLAIN_FIELDS) {
    const value = input[field];
    if (value !== undefined) {
      $set[`integrations.${field}`] = value.trim();
      changed.push(field);
    }
  }

  if (Object.keys($set).length > 0) {
    await SettingsModel.updateOne({ singleton: "singleton" }, { $set }, { upsert: true });
    invalidateIntegrationCache();
  }
  return changed;
}
