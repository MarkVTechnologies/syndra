import mongoose, { Schema, model, type InferSchemaType, type Model } from "mongoose";
const { models } = mongoose;

const EmailLogSchema = new Schema(
  {
    to: { type: String, required: true },
    template: { type: String, required: true },
    subject: { type: String, required: true },
    providerId: { type: String, default: null },
    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "bounced", "complained", "failed"],
      default: "queued",
    },
    attempts: { type: Number, default: 0 },
    idempotencyKey: { type: String, required: true, unique: true },
    relatedTo: {
      type: { type: String },
      id: { type: String },
    },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

EmailLogSchema.index({ to: 1, createdAt: -1 });
EmailLogSchema.index({ status: 1, createdAt: -1 });

export type EmailLogDoc = InferSchemaType<typeof EmailLogSchema>;
export const EmailLogModel: Model<EmailLogDoc> =
  (models.EmailLog as Model<EmailLogDoc>) || model<EmailLogDoc>("EmailLog", EmailLogSchema);
