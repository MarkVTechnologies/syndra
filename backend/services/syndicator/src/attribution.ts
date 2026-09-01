import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@san/core/env";

/**
 * R3 — Signed token: HMAC(slug + issuedAt) with 24h validity. Embedded as a
 * hidden field on the microsite's onboarding form so attribution survives
 * cookie loss, and prevents a competitor from forging referrals by posting
 * to the endpoint with an arbitrary slug. PRD §8.1.
 *
 * Pure functions, dependency-free beyond the env secret — kept in their own
 * module so they're exhaustively unit-testable ahead of being wired to the
 * ledger (PRD §14 Day 3 Block 8: "all must pass before Day 4 starts").
 */

const VALIDITY_MS = 24 * 60 * 60 * 1000;

function sign(payload: string): string {
  const env = getEnv();
  return createHmac("sha256", env.ATTRIBUTION_SECRET).update(payload).digest("hex");
}

export function signAttributionToken(slug: string, issuedAt: number = Date.now()): string {
  const payload = `${slug}:${issuedAt}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export interface VerifiedToken {
  slug: string;
  issuedAt: number;
}

/** Returns null on any malformed, expired, or tampered token — never throws. */
export function verifyAttributionToken(token: string, now: number = Date.now()): VerifiedToken | null {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const parts = decoded.split(":");
  if (parts.length !== 3) return null;
  const [slug, issuedAtStr, signature] = parts;
  if (!slug || !issuedAtStr || !signature) return null;

  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return null;

  const expected = sign(`${slug}:${issuedAtStr}`);
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }

  if (now - issuedAt > VALIDITY_MS || now < issuedAt) return null;

  return { slug, issuedAt };
}

export type AttributionSourceKind = "signed_token" | "cookie" | "query" | "house";

export interface AttributionResolution {
  source: AttributionSourceKind;
  /** "slug" for signed_token/query (human-shareable), "ambassadorId" for the
   *  cookie (PRD §3.3: `san_ref={ambassadorId}`). null only for "house". */
  valueType: "slug" | "ambassadorId" | null;
  value: string | null;
}

/**
 * R2 — Resolution order: signed hidden form token -> san_ref cookie ->
 * ?ref= query param -> house account (null). First-touch wins permanently
 * at the caller (immutable referredBy write); this function only picks
 * which raw signal to trust for THIS request. Pure — no DB, no I/O, fully
 * unit-testable independent of Mongo. PRD §8.1.
 */
export function resolveAttributionSource(input: {
  signedToken?: string | null;
  cookieAmbassadorId?: string | null;
  queryRef?: string | null;
  now?: number;
}): AttributionResolution {
  if (input.signedToken) {
    const verified = verifyAttributionToken(input.signedToken, input.now);
    if (verified) return { source: "signed_token", valueType: "slug", value: verified.slug };
  }
  if (input.cookieAmbassadorId) {
    return { source: "cookie", valueType: "ambassadorId", value: input.cookieAmbassadorId };
  }
  if (input.queryRef) {
    return { source: "query", valueType: "slug", value: input.queryRef };
  }
  return { source: "house", valueType: null, value: null };
}
