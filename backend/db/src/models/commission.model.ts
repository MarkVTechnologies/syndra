import mongoose, { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

// Append-only ledger. A correction is a new signed entry, never a mutation
// of amountMinor — `state` is the one field allowed to transition in place
// (pending -> payable -> paid), since that's lifecycle, not history.
const CommissionSchema = new Schema(
  {
    ambassadorId: { type: Schema.Types.ObjectId, required: true, ref: "Ambassador" },
    investmentId: { type: Schema.Types.ObjectId, required: true, ref: "Investment" },
    opportunityId: { type: Schema.Types.ObjectId, required: true, ref: "Opportunity" },
    syndicatorId: { type: Schema.Types.ObjectId, required: true, ref: "Syndicator" },
    entryType: { type: String, enum: ["accrual", "reversal", "adjustment"], required: true },
    amountMinor: { type: Number, required: true }, // signed
    rateBps: { type: Number, default: null },
    state: {
      type: String,
      enum: ["pending", "confirmed", "payable", "paid", "reversed"],
      required: true,
      default: "pending",
    },
    maturesAt: { type: Date, default: null },
    payoutId: { type: Schema.Types.ObjectId, ref: "Payout", default: null },
    reason: { type: String, default: null },
    // Set only on entryType="reversal" — points at the original accrual.
    // The original is never mutated; this is how a reversal nets against
    // the right balance bucket at aggregation time. PRD §6.3 LEDGER INVARIANT.
    reversalOfId: { type: Schema.Types.ObjectId, ref: "Commission", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CommissionSchema.index({ ambassadorId: 1, state: 1 });
CommissionSchema.index({ investmentId: 1, entryType: 1 });
CommissionSchema.index({ maturesAt: 1, state: 1 });
CommissionSchema.index({ payoutId: 1 });
// Idempotency safety net at the DB layer, beyond the webhook event-id
// dedupe: at most one accrual per investment, full stop. PRD §8.4.
CommissionSchema.index(
  { investmentId: 1 },
  { unique: true, partialFilterExpression: { entryType: "accrual" } }
);

export type CommissionDoc = InferSchemaType<typeof CommissionSchema> & { _id: Types.ObjectId };
export const CommissionModel: Model<CommissionDoc> =
  (models.Commission as Model<CommissionDoc>) ||
  model<CommissionDoc>("Commission", CommissionSchema);
