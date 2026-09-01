import { NextResponse } from "next/server";
import { getTurnstileConfig } from "@san/service-settings";

/**
 * Public, non-secret runtime config for client components. Exists
 * specifically because NEXT_PUBLIC_* env vars are inlined into the JS
 * bundle at BUILD TIME — an admin changing the Turnstile site key in the
 * settings UI could never take effect that way without a full rebuild and
 * redeploy. Fetching it here instead means the change is live immediately,
 * same as every other admin-configurable integration credential.
 *
 * Only ever returns values that are safe to ship to any visitor's browser
 * (a Turnstile *site* key is meant to be public — it's embedded in HTML by
 * design). Never add a secret key here.
 */
export async function GET() {
  const { siteKey } = await getTurnstileConfig();
  return NextResponse.json(
    { turnstileSiteKey: siteKey },
    { headers: { "Cache-Control": "public, max-age=30" } }
  );
}
