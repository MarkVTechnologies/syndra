import type { ReactElement } from "react";
import { connectDb, EmailLogModel, getResendConfig } from "@san/db";
import { renderEmail } from "@san/email";
import { getResend, getRedis } from "./clients";

export interface SendEmailInput {
  to: string;
  template: string;
  subject: string;
  element: ReactElement;
  idempotencyKey: string; // (template, recipient, relatedId)
  relatedTo?: { type: string; id: string };
}

/**
 * Renders, dispatches via Resend, and logs to email_log. Idempotency key is
 * checked in Redis (24h TTL) before we touch Mongo or Resend at all, so a
 * retried Inngest step never double-sends. PRD §9.1 / §9.3.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; providerId?: string }> {
  const redis = getRedis();
  const dedupeKey = `email:idem:${input.idempotencyKey}`;
  const claimed = await redis.set(dedupeKey, "1", { nx: true, ex: 60 * 60 * 24 });
  if (claimed === null) {
    return { sent: false }; // already sent — replay
  }

  await connectDb();
  const { from, replyTo } = await getResendConfig();
  const { html, text } = await renderEmail(input.element);

  const logEntry = await EmailLogModel.create({
    to: input.to,
    template: input.template,
    subject: input.subject,
    status: "queued",
    idempotencyKey: input.idempotencyKey,
    relatedTo: input.relatedTo,
  });

  try {
    const resend = await getResend();
    const result = await resend.emails.send({
      from,
      to: input.to,
      replyTo,
      subject: input.subject,
      html,
      text,
    });

    if (result.error) {
      await EmailLogModel.updateOne(
        { _id: logEntry._id },
        { $set: { status: "failed", error: result.error.message }, $inc: { attempts: 1 } }
      );
      throw new Error(result.error.message);
    }

    await EmailLogModel.updateOne(
      { _id: logEntry._id },
      { $set: { status: "sent", providerId: result.data?.id }, $inc: { attempts: 1 } }
    );
    return { sent: true, providerId: result.data?.id };
  } catch (error) {
    await EmailLogModel.updateOne(
      { _id: logEntry._id },
      { $set: { status: "failed", error: String(error) }, $inc: { attempts: 1 } }
    );
    throw error;
  }
}

export async function getDeliveryStatus(idempotencyKey: string) {
  await connectDb();
  return EmailLogModel.findOne({ idempotencyKey }).lean();
}
