import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/brand/logo-mark";
import { JoinForm } from "@/components/syndicator/join-form";
import { LineArt } from "@/components/decor/line-art";

/**
 * Ambassador-independent syndicator signup. Every other onboarding path
 * (`/[slug]/join`) carries a specific ambassador's signed attribution
 * token; this route carries none, so resolution (R2, PRD §8.1 — signed
 * token -> san_ref cookie -> ?ref= -> house) falls through to whichever of
 * those the visitor actually has: a `san_ref` cookie from a prior microsite
 * visit still wins (first-touch), a raw `?ref=slug` link still attributes,
 * and otherwise the signup lands on the house account. No new attribution
 * rule — this exposes a path that already existed for the "nothing found"
 * case, since until now it was only reachable through a specific
 * ambassador's page.
 */
export default function JoinPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 15% 15%, rgba(192,88,0,0.28), transparent 60%), radial-gradient(520px circle at 85% 85%, rgba(113,54,0,0.3), transparent 60%)",
        }}
      />
      <LineArt variant="blueprint-corner" position="top-left" className="text-[var(--estate-amber-300)]" />
      <div aria-hidden className="texture-ledger-contained-dark pointer-events-none absolute inset-0" />
      <Container className="relative flex min-h-[calc(100dvh-5rem)] max-w-[480px] items-center">
        <div className="glass-panel-dark w-full rounded-2xl p-8">
          <LogoMark />
          <h1 className="mt-4 text-xl font-semibold text-foreground">Create your investor account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse vetted real-estate syndication opportunities and track your portfolio.
          </p>
          <Suspense fallback={null}>
            <JoinForm />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
