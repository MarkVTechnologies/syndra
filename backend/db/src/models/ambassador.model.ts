import mongoose, { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const AmbassadorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, unique: true, ref: "User" },
    slug: { type: String, required: true, unique: true, lowercase: true },
    fullName: { type: String, required: true },
    headline: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: null },
    phone: { type: String, required: true },
    whatsapp: {
      number: { type: String, required: true },
      verified: { type: Boolean, default: false },
    },
    city: { type: String },
    state: { type: String },
    yearsExperience: { type: String, enum: ["<1", "1-3", "3-5", "5+"] },
    socials: { type: Schema.Types.Mixed, default: {} },
    stats: {
      views: { type: Number, default: 0 },
      referrals: { type: Number, default: 0 },
      investments: { type: Number, default: 0 },
      totalEarnedMinor: { type: Number, default: 0 },
      pendingMinor: { type: Number, default: 0 },
      paidMinor: { type: Number, default: 0 },
    },
    payoutDetails: { type: String, default: null }, // AES-256-GCM ciphertext
    tier: { type: Number, default: 1 },
    approvedAt: { type: Date, default: null },
    slugHistory: [{ slug: String, redirectUntil: Date, changedAt: Date }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AmbassadorSchema.index({ "stats.totalEarnedMinor": -1 });

export type AmbassadorDoc = InferSchemaType<typeof AmbassadorSchema> & { _id: Types.ObjectId };
export const AmbassadorModel: Model<AmbassadorDoc> =
  (models.Ambassador as Model<AmbassadorDoc>) ||
  model<AmbassadorDoc>("Ambassador", AmbassadorSchema);
