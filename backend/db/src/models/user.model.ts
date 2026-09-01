import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "ambassador", "syndicator"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending_verification", "pending_approval", "active", "suspended"],
      required: true,
      default: "pending_verification",
      index: true,
    },
    emailVerifiedAt: { type: Date, default: null },
    sessionVersion: { type: Number, required: true, default: 0 },
    lastLoginAt: { type: Date, default: null },
    mfaEnabled: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, status: 1, createdAt: -1 });

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const UserModel: Model<UserDoc> =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", UserSchema);
