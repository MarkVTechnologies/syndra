import mongoose, { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const WaitlistSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    yearsExperience: { type: String, enum: ["<1", "1-3", "3-5", "5+"], required: true },
    desiredSlug: { type: String, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    source: { type: String, default: "landing" },
    utm: {
      source: { type: String },
      medium: { type: String },
      campaign: { type: String },
    },
    ipHash: { type: String },
    status: { type: String, enum: ["registered", "converted"], default: "registered" },
    convertedUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    spamFlagged: { type: Boolean, default: false },
    internalNote: { type: String, default: "" },
    // Launch broadcast (PRD §13.4): issued when settings.appLaunched flips
    // to true, before any User document exists for this row — cannot live
    // on VerificationToken (which requires an existing userId).
    launchTokenHash: { type: String, default: null },
    launchTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

WaitlistSchema.index({ createdAt: -1 });
WaitlistSchema.index({ status: 1 });

export type WaitlistDoc = InferSchemaType<typeof WaitlistSchema> & { _id: Types.ObjectId };
export const WaitlistModel: Model<WaitlistDoc> =
  (models.Waitlist as Model<WaitlistDoc>) || model<WaitlistDoc>("Waitlist", WaitlistSchema);
