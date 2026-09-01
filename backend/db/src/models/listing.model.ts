import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const ListingSchema = new Schema(
  {
    ambassadorId: { type: Schema.Types.ObjectId, required: true, ref: "Ambassador" },
    opportunityId: { type: Schema.Types.ObjectId, required: true, ref: "Opportunity" },
    promotedAt: { type: Date, default: Date.now },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ListingSchema.index({ ambassadorId: 1, opportunityId: 1 }, { unique: true });
ListingSchema.index({ ambassadorId: 1, active: 1, order: 1 });

export type ListingDoc = InferSchemaType<typeof ListingSchema>;
export const ListingModel: Model<ListingDoc> =
  (models.Listing as Model<ListingDoc>) || model<ListingDoc>("Listing", ListingSchema);
