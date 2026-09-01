import mongoose, { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const PayoutSchema = new Schema(
  {
    ambassadorId: { type: Schema.Types.ObjectId, required: true, ref: "Ambassador" },
    amountMinor: { type: Number, required: true },
    commissionIds: [{ type: Schema.Types.ObjectId, ref: "Commission" }],
    method: { type: String, default: "bank_transfer" },
    reference: { type: String, default: null },
    status: {
      type: String,
      enum: ["requested", "approved", "paid", "rejected"],
      default: "requested",
    },
    requestedAt: { type: Date, default: Date.now },
    paidAt: { type: Date, default: null },
    processedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

PayoutSchema.index({ ambassadorId: 1, createdAt: -1 });
PayoutSchema.index({ status: 1, createdAt: -1 });

export type PayoutDoc = InferSchemaType<typeof PayoutSchema> & { _id: Types.ObjectId };
export const PayoutModel: Model<PayoutDoc> =
  (models.Payout as Model<PayoutDoc>) || model<PayoutDoc>("Payout", PayoutSchema);
