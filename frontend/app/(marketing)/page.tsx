import { unstable_cache } from "next/cache";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Benefits } from "@/components/marketing/benefits";
import { OpportunityPreview } from "@/components/marketing/opportunity-preview";
import { CommissionSlider } from "@/components/marketing/commission-slider";
import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { FAQ } from "@/components/marketing/faq";
import { Footer } from "@/components/marketing/footer";
import { getWaitlistCount } from "@/lib/waitlist-count";

const getCachedCount = unstable_cache(getWaitlistCount, ["waitlist-count"], {
  revalidate: 60,
});

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
      <WaitlistForm />
      <FAQ />
      <Footer />
    </>
  );
}
