import { NextResponse } from "next/server";
import * as investment from "@san/service-investment";

/**
 * HMAC-SHA512 over the raw body, event-id dedupe, transactional confirm.
 * PRD §7.1. Always returns 200 once the signature is valid — Paystack
 * retries on non-2xx, and a NOT_FOUND/CONFLICT here is not something a
 * retry will fix, so we acknowledge and let the reconciliation cron catch
 * anything genuinely stuck (PRD §17 risk: "payment webhook missed or delayed").
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const result = await investment.confirm(rawBody, signature);

  if (!result.ok) {
    if (result.error.code === "FORBIDDEN") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    // Logged for admin visibility; still 200 so Paystack doesn't hammer retries.
    console.error("[paystack webhook]", result.error);
    return NextResponse.json({ ok: false, error: result.error.code }, { status: 200 });
  }

  return NextResponse.json({ ok: true, status: result.data.status }, { status: 200 });
}
