import mongoose, { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const InvestmentSchema = new Schema(
  {
    syndicatorId: { type: Schema.Types.ObjectId, required: true, ref: "Syndicator" },
    opportunityId: { type: Schema.Types.ObjectId, required: true, ref: "Opportunity" },
    // Attribution snapshot — later changes to the syndicator record never
    // retroactively move historic commissions. PRD §8.1 R5. null = house
    // account (R7) — unattributed, no commission is accrued against it.
    ambassadorId: { type: Schema.Types.ObjectId, ref: "Ambassador", default: null },
    units: { type: Number, required: true },
    amountMinor: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: [
        "pending",
        "awaiting_payment",
        "awaiting_confirmation",
        "confirmed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    payment: {
      provider: { type: String, default: null },
      reference: { type: String, default: null },
      channel: { type: String, enum: ["card", "transfer"], default: null },
      paidAt: { type: Date, default: null },
      rawEventId: { type: String, default: null },
    },
    idempotencyKey: { type: String, required: true, unique: true },
    reservedUntil: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

InvestmentSchema.index({ syndicatorId: 1, createdAt: -1 });
InvestmentSchema.index({ opportunityId: 1, status: 1 });
InvestmentSchema.index({ ambassadorId: 1, status: 1 });

export type InvestmentDoc = InferSchemaType<typeof InvestmentSchema> & { _id: Types.ObjectId };
export const InvestmentModel: Model<InvestmentDoc> =
  (models.Investment as Model<InvestmentDoc>) ||
  model<InvestmentDoc>("Investment", InvestmentSchema);
