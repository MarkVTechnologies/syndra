import { unstable_cache } from "next/cache";
import * as ambassador from "@san/service-ambassador";

/** Tag-based revalidation on promote/unpromote, PRD §14 Day 3 Block 3. */
export function getCachedMicrosite(slug: string) {
  return unstable_cache(() => ambassador.getMicrosite(slug), ["microsite", slug], {
    tags: [`microsite:${slug}`],
    revalidate: 60,
  })();
}
