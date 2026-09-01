import { createHmac, timingSafeEqual } from "node:crypto";
import { getPaystackConfig } from "@san/db";

const PAYSTACK_BASE = "https://api.paystack.co";

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Adapter pattern (PRD §5) — Paystack is one file. A Flutterwave fallback
 * would implement the same shape.
 */
export async function initializeTransaction(input: {
  email: string;
  amountMinor: number;
  reference: string;
  callbackUrl: string;
}): Promise<InitializeResult> {
  const { secretKey } = await getPaystackConfig();
  if (!secretKey) {
    throw new Error("Paystack is not configured (PAYSTACK_SECRET_KEY missing)");
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor, // Paystack's minor unit (kobo) matches ours exactly
      reference: input.reference,
      callback_url: input.callbackUrl,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? "Paystack initialize failed");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    reference: json.data.reference,
  };
}

/** HMAC-SHA512 over the raw body, timing-safe compare. PRD §7.1 / §12.3. */
export async function verifyPaystackSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false;
  const { secretKey } = await getPaystackConfig();
  if (!secretKey) return false;

  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export interface PaystackChargeEvent {
  event: string;
  eventId: string;
  reference: string;
  amountMinor: number;
  status: string;
  paidAt: string | null;
}

/** Parses only the fields we act on — never trust the full payload blindly. */
export function parsePaystackEvent(rawBody: string): PaystackChargeEvent | null {
  try {
    const json = JSON.parse(rawBody);
    if (!json?.event || !json?.data?.reference) return null;
    return {
      event: json.event,
      eventId: String(json.data.id ?? `${json.event}:${json.data.reference}`),
      reference: json.data.reference,
      amountMinor: json.data.amount,
      status: json.data.status,
      paidAt: json.data.paid_at ?? null,
    };
  } catch {
    return null;
  }
}
