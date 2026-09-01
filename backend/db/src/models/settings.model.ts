import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

/**
 * Admin-entered integration credentials (PRD: "an admin area where an
 * admin can enter credentials meant to be in .env"). Only fields that are
 * genuinely runtime-configurable live here — see backend/db/src/integrations.ts
 * for the full explanation of why MongoDB URI, AUTH_SECRET, ENCRYPTION_KEY,
 * Upstash Redis, Inngest, and ATTRIBUTION_SECRET are deliberately excluded
 * and stay .env-only. Secret-shaped fields (marked below) are stored
 * AES-256-GCM encrypted via @san/core/crypto, never in plaintext.
 */
const IntegrationsSchema = new Schema(
  {
    // Resend (email)
    resendApiKeyEnc: { type: String, default: null }, // encrypted
    resendWebhookSecretEnc: { type: String, default: null }, // encrypted
    emailFrom: { type: String, default: null },
    emailReplyTo: { type: String, default: null },
    // Cloudinary
    cloudinaryCloudName: { type: String, default: null },
    cloudinaryApiKeyEnc: { type: String, default: null }, // encrypted
    cloudinaryApiSecretEnc: { type: String, default: null }, // encrypted
    // Paystack
    paystackSecretKeyEnc: { type: String, default: null }, // encrypted
    paystackWebhookSecretEnc: { type: String, default: null }, // encrypted
    // Turnstile — the site key is meant to be public (embedded in HTML),
    // only the secret key is sensitive.
    turnstileSecretKeyEnc: { type: String, default: null }, // encrypted
    turnstileSiteKey: { type: String, default: null },
  },
  { _id: false }
);

const SettingsSchema = new Schema(
  {
    singleton: { type: String, required: true, unique: true, default: "singleton" },
    autoApproveAmbassadors: { type: Boolean, default: true },
    defaultCommissionBps: { type: Number, default: 500 },
    defaultCoolingDays: { type: Number, default: 7 },
    waitlistOpen: { type: Boolean, default: true },
    appLaunched: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
    integrations: { type: IntegrationsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;
export const SettingsModel: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) || model<SettingsDoc>("Settings", SettingsSchema);

export async function getSettings(): Promise<SettingsDoc> {
  const existing = await SettingsModel.findOne({ singleton: "singleton" }).lean();
  if (existing) return existing;
  const created = await SettingsModel.create({ singleton: "singleton" });
  return created.toObject();
}

/** PRD §13.4 — the go-live switch. */
export async function setAppLaunched(value: boolean): Promise<void> {
  await SettingsModel.updateOne(
    { singleton: "singleton" },
    { $set: { appLaunched: value } },
    { upsert: true }
  );
}
