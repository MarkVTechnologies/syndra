import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Phone, MapPin, ShieldCheck } from "lucide-react";
import * as ambassador from "@san/service-ambassador";
import { fmt, type Minor } from "@san/core/money";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { WhatsAppButton } from "@/components/microsite/whatsapp-button";
import { VisitTracker } from "@/components/microsite/visit-tracker";
import { buildTelLink } from "@/lib/whatsapp";
import { getCachedMicrosite } from "@/lib/microsite-cache";
import { LineArt } from "@/components/decor/line-art";

export const revalidate = 60;

async function loadMicrosite(slug: string) {
  const result = await getCachedMicrosite(slug);
  if (result.ok) return result.data;

  const redirectTo = await ambassador.resolveSlugRedirect(slug);
  if (redirectTo) permanentRedirect(`/${redirectTo}`);

  notFound();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCachedMicrosite(slug);
  if (!result.ok) return {};

  const { ambassador: amb } = result.data;
  const title = `${amb.fullName} — Syndran Ambassador`;
  const description = amb.headline || "Invest in vetted real-estate syndication deals.";

  return {
    title,
    description,
    openGraph: { title, description, type: "profile", images: amb.avatarUrl ? [amb.avatarUrl] : undefined },
    twitter: { card: "summary", title, description },
  };
}

export default async function MicrositePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { ambassador: amb, opportunities } = await loadMicrosite(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: amb.fullName,
    jobTitle: "Real Estate Investment Ambassador",
    ...(amb.city && { address: { "@type": "PostalAddress", addressLocality: amb.city, addressRegion: amb.state ?? undefined } }),
  };

  return (
    <div className="min-h-dvh bg-background pb-28">
      <VisitTracker ambassadorId={amb.id} slug={slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden bg-[var(--estate-espresso-950)] pb-10 pt-16 text-[var(--estate-cream-50)]">
        <LineArt variant="skyline" className="text-[var(--estate-amber-300)]" />
        <div aria-hidden className="texture-ledger-dark pointer-events-none absolute inset-0 opacity-50" />
        <Container className="relative flex flex-col items-center text-center">
          <div className="size-24 overflow-hidden rounded-full border-4 border-white/10 bg-white/5">
            {amb.avatarUrl ? (
              <img src={amb.avatarUrl} alt={amb.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-muted-foreground">
                {amb.fullName.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">{amb.fullName}</h1>
          {amb.headline && <p className="mt-1 max-w-md text-[var(--estate-sand-300)]">{amb.headline}</p>}
          {amb.city && (
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {amb.city}, {amb.state}
            </p>
          )}
          {amb.bio && <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--estate-sand-300)]">{amb.bio}</p>}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="sweep relative overflow-hidden">
              <Link href={`/${slug}/join`}>Invest with me</Link>
            </Button>
            <WhatsAppButton whatsapp={amb.whatsapp} ambassadorId={amb.id}>
              WhatsApp me
            </WhatsAppButton>
            <a
              href={buildTelLink(amb.whatsapp)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-[var(--estate-cream-50)] transition-colors hover:bg-white/10"
            >
              <Phone className="size-4" /> Call
            </a>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          Every opportunity below is vetted and published by the Syndran admin team.
        </div>

        {opportunities.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 border-dashed p-12 text-center">
            <EmptyStateIllustration className="h-24 w-28" />
            <p className="text-sm text-muted-foreground">No opportunities promoted yet — check back soon.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => (
              <Link key={o._id.toString()} href={`/${slug}/${o.slug}`}>
                <Card interactive className="overflow-hidden rounded-xl">
                  <div className="aspect-video bg-surface-muted">
                    {o.media[0]?.url && (
                      <img src={o.media[0].url} alt={o.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-foreground">{o.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{o.summary}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {fmt((o.pricing?.unitPriceMinor ?? 0) as Minor)}
                      </span>
                      {o.returns?.roiPercent && (
                        <span className="text-xs font-semibold text-money">{o.returns.roiPercent}% ROI</span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>

      {/* Sticky WhatsApp CTA — PRD §14 Day 3 Block 3 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur sm:hidden">
        <WhatsAppButton whatsapp={amb.whatsapp} ambassadorId={amb.id} className="w-full">
          Message {amb.fullName.split(" ")[0]} on WhatsApp
        </WhatsAppButton>
      </div>
    </div>
  );
}
