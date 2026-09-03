import Link from "next/link";
import { Sparkles, Store, TrendingUp, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

/**
 * Replaces the pre-launch WaitlistForm section — the app is live, so new
 * visitors go straight to real registration (/signup, /join) instead of a
 * queue. WaitlistForm itself, its backend (@san/service-waitlist), and the
 * admin launch panel are deliberately left in place, unused by this page,
 * in case a future closed-beta phase needs them again.
 */
export function GetStartedCta() {
  return (
    <section id="get-started" className="relative scroll-mt-8 overflow-hidden bg-background py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 50% 0%, var(--estate-amber-100), transparent 65%), radial-gradient(420px circle at 100% 100%, var(--estate-cream-200), transparent 60%)",
        }}
      />
      <Container className="relative max-w-[720px] text-center">
        <div className="glass-panel-dark rounded-3xl p-6 sm:p-9">
          <div className="mx-auto flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--estate-rust-700)]">
            <Sparkles className="size-3.5" strokeWidth={2} />
            We&apos;re live
          </div>
          <h2 className="mt-2 font-display text-[clamp(1.5rem,2.5vw+1rem,2rem)] font-bold tracking-[-0.01em] text-foreground">
            Get started today
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            No waitlist — create your account and you&apos;re in.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="sweep relative w-full overflow-hidden sm:w-auto">
              <Link href="/signup">
                <Store className="size-4" />
                Become an Ambassador
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href="/join">
                <TrendingUp className="size-4" />
                Start Investing
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
