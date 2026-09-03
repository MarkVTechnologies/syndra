import { unstable_cache } from "next/cache";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Benefits } from "@/components/marketing/benefits";
import { OpportunityPreview } from "@/components/marketing/opportunity-preview";
import { CommissionSlider } from "@/components/marketing/commission-slider";
import { GetStartedCta } from "@/components/marketing/get-started-cta";
import { FAQ } from "@/components/marketing/faq";
import { Footer } from "@/components/marketing/footer";
import { getAmbassadorCount } from "@/lib/ambassador-count";

const getCachedCount = unstable_cache(getAmbassadorCount, ["ambassador-count"], {
  revalidate: 60,
});

// middleware.ts's CSP is nonce-based ('strict-dynamic') — a nonce baked
// into a statically cached page is stale forever and matches nothing
// (worse: it's a real security no-op, not just a display bug, since
// anyone can read the same frozen nonce from the cached HTML). Per Next's
// own docs, a fresh per-request nonce requires dynamic rendering. The
// underlying data fetch above still uses its own 60s cache regardless —
// this only stops the *page shell* from being statically cached.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // The hero counter is decorative, not critical path — a transient DB
  // hiccup at build/ISR-revalidation time must never fail the whole page.
  const registeredCount = await getCachedCount().catch(() => 0);

  return (
    <>
      <Hero registeredCount={registeredCount} />
      <HowItWorks />
      <Benefits />
      <OpportunityPreview />
      <CommissionSlider />
      <GetStartedCta />
      <FAQ />
      <Footer />
    </>
  );
}
