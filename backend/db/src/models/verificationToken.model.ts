import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const VerificationTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    tokenHash: { type: String, required: true, unique: true },
    purpose: { type: String, enum: ["verify_email", "password_reset"], required: true },
    usedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

VerificationTokenSchema.index({ userId: 1, purpose: 1 });
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type VerificationTokenDoc = InferSchemaType<typeof VerificationTokenSchema>;
export const VerificationTokenModel: Model<VerificationTokenDoc> =
  (models.VerificationToken as Model<VerificationTokenDoc>) ||
  model<VerificationTokenDoc>("VerificationToken", VerificationTokenSchema);
