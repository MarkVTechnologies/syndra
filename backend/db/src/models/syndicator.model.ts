import mongoose, { Schema, model, Types, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const SyndicatorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, unique: true, ref: "User" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    // R1: immutable after first write. Only ever set via create() (see the
    // pre-hooks below, which reject any attempt to change it through an
    // update path) — the update-guard pattern PRD §8.1 describes.
    referredBy: { type: Schema.Types.ObjectId, ref: "Ambassador", default: null },
    referralSource: { type: String, default: null },
    referredAt: { type: Date, default: null },
    lastTouchAmbassadorId: { type: Schema.Types.ObjectId, ref: "Ambassador", default: null },
    investmentRange: { type: String, default: null },
    totalInvestedMinor: { type: Number, default: 0 },
    kycStatus: { type: String, enum: ["not_started", "pending", "verified"], default: "not_started" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SyndicatorSchema.index({ referredBy: 1, createdAt: -1 });

// R1 immutability, enforced at the DB layer (defense in depth beyond "no
// code path calls this"): a save() on an EXISTING document may never touch
// referredBy — only the initial create() (isNew: true) may set it.
SyndicatorSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("referredBy")) {
    next(new Error("referredBy is immutable after creation (PRD §8.1 R1)"));
    return;
  }
  next();
});

// Same guarantee for query-based updates (updateOne/findOneAndUpdate/etc.)
// — referredBy may never appear in an update document, full stop.
function rejectReferredByInUpdate(this: { getUpdate: () => Record<string, unknown> | null }, next: (err?: Error) => void) {
  const update = this.getUpdate();
  const touchesReferredBy =
    !!update &&
    ("referredBy" in update ||
      Object.values(update).some((v) => v && typeof v === "object" && "referredBy" in v));
  if (touchesReferredBy) {
    next(new Error("referredBy is immutable after creation (PRD §8.1 R1)"));
    return;
  }
  next();
}
SyndicatorSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], rejectReferredByInUpdate);

export type SyndicatorDoc = InferSchemaType<typeof SyndicatorSchema> & { _id: Types.ObjectId };
export const SyndicatorModel: Model<SyndicatorDoc> =
  (models.Syndicator as Model<SyndicatorDoc>) ||
  model<SyndicatorDoc>("Syndicator", SyndicatorSchema);
