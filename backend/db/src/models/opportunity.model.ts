import mongoose, { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const OpportunitySchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    summary: { type: String, required: true },
    description: { type: String, default: "" }, // sanitised HTML, DOMPurify at write + render
    type: { type: String, default: "residential" },
    location: {
      city: { type: String },
      state: { type: String },
      geo: { type: { lat: Number, lng: Number }, default: undefined },
    },
    media: [
      {
        publicId: String,
        url: String,
        width: Number,
        height: Number,
        alt: String,
        order: Number,
      },
    ],
    documents: [{ name: String, url: String, sizeBytes: Number }],
    pricing: {
      unitPriceMinor: { type: Number, required: true },
      minUnits: { type: Number, required: true },
      maxUnits: { type: Number, required: true },
      totalUnits: { type: Number, required: true },
      unitsSold: { type: Number, default: 0 },
      // Soft-reserved by pending/awaiting-payment investments — PRD §3.4 /
      // §14 Day 4 Block 1. Incremented atomically at commit() via a single
      // conditional findOneAndUpdate (no transaction needed for that step
      // alone); decremented on confirm (moves to unitsSold), cancel, or
      // reservation expiry.
      reservedUnits: { type: Number, default: 0 },
    },
    returns: {
      roiPercent: { type: Number },
      tenorMonths: { type: Number },
      payoutFrequency: { type: String },
    },
    commission: {
      model: { type: String, enum: ["percentage", "flat"], required: true },
      valueBps: { type: Number, default: null },
      valueMinor: { type: Number, default: null },
      coolingDays: { type: Number, default: 7 },
    },
    status: {
      type: String,
      enum: ["draft", "published", "paused", "closed", "sold_out"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date, default: null },
    featured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

OpportunitySchema.index({ status: 1, publishedAt: -1 });
OpportunitySchema.index({ featured: -1, publishedAt: -1 });

export type OpportunityDoc = InferSchemaType<typeof OpportunitySchema> & { _id: Types.ObjectId };
export const OpportunityModel: Model<OpportunityDoc> =
  (models.Opportunity as Model<OpportunityDoc>) ||
  model<OpportunityDoc>("Opportunity", OpportunitySchema);
