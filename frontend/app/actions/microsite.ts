"use server";

import * as ambassador from "@san/service-ambassador";
import { track } from "@san/service-analytics";
import { setReferralCookie } from "@/lib/attribution";
import { getClientIp, hashIp } from "@/lib/request-context";

/**
 * Fire-and-forget: sets/refreshes the san_ref cookie (R4), increments the
 * fast view counter, and logs the raw event for the funnel. Called from a
 * client-side effect on the microsite page so it never blocks render (PRD
 * §3.3 "recorded asynchronously... never blocking render").
 */
export async function recordMicrositeVisit(input: {
  ambassadorId: string;
  slug: string;
  sessionId: string;
}): Promise<void> {
  await setReferralCookie(input.ambassadorId);

  const ip = await getClientIp();
  const trackResult = await track({
    name: "microsite_view",
    ambassadorId: input.ambassadorId,
    props: { slug: input.slug },
    sessionId: input.sessionId,
    ipHash: hashIp(ip),
  });

  // Only bump the fast counter on a fresh (non-deduped) view.
  if (trackResult.ok && trackResult.data.recorded) {
    await ambassador.recordView(input.ambassadorId);
  }
}
