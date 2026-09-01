import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const EventSchema = new Schema(
  {
    name: { type: String, required: true },
    actorId: { type: String, default: null },
    actorRole: { type: String, default: null },
    ambassadorId: { type: Schema.Types.ObjectId, ref: "Ambassador", default: null },
    props: { type: Schema.Types.Mixed, default: {} },
    sessionId: { type: String, default: null },
    ipHash: { type: String, default: null },
    ua: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

EventSchema.index({ name: 1, createdAt: -1 });
EventSchema.index({ ambassadorId: 1, createdAt: -1 });
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export type EventDoc = InferSchemaType<typeof EventSchema>;
export const EventModel: Model<EventDoc> =
  (models.Event as Model<EventDoc>) || model<EventDoc>("Event", EventSchema);
