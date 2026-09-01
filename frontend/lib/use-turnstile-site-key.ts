"use client";

import { useEffect, useState } from "react";

/**
 * The Turnstile site key can now be changed at runtime via the admin
 * settings UI, but NEXT_PUBLIC_* env vars are inlined into the JS bundle
 * at build time — reading process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * directly would never reflect an admin's change without a rebuild. This
 * fetches the current value from the server on mount instead. Falls back
 * to the build-time env var while the fetch is in flight (and forever, if
 * it fails) so a slow/offline request never blocks the widget entirely.
 */
export function useTurnstileSiteKey(): string {
  const [siteKey, setSiteKey] = useState(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config/public")
      .then((res) => res.json())
      .then((data: { turnstileSiteKey?: string }) => {
        if (!cancelled && data.turnstileSiteKey) setSiteKey(data.turnstileSiteKey);
      })
      .catch(() => {
        // Keep the build-time fallback — see file header.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return siteKey;
}
