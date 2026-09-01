import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import * as catalog from "@san/service-catalog";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/microsite/whatsapp-button";
import { fmt, type Minor } from "@san/core/money";
import { getCachedMicrosite } from "@/lib/microsite-cache";

export const revalidate = 60;

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string; opportunitySlug: string }>;
}) {
  const { slug, opportunitySlug } = await params;

  const micrositeResult = await getCachedMicrosite(slug);
  if (!micrositeResult.ok) notFound();
  const { ambassador: amb } = micrositeResult.data;

  const oppResult = await catalog.getBySlug(opportunitySlug);
  if (!oppResult.ok || oppResult.data.status !== "published") notFound();
  const o = oppResult.data;

  // Only show detail pages for opportunities this ambassador actually promotes.
  const isPromoted = micrositeResult.data.opportunities.some((p) => p.slug === opportunitySlug);
  if (!isPromoted) notFound();

  return (
    <div className="min-h-dvh bg-background pb-28">
      <Container className="py-6">
        <Link href={`/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to {amb.fullName}
        </Link>

        <Card className="mt-4 overflow-hidden rounded-2xl">
          <div className="aspect-video bg-surface-muted">
            {o.media[0]?.url && (
              <img src={o.media[0].url} alt={o.title} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="p-6">
            <h1 className="font-display text-2xl font-bold text-foreground">{o.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{o.location?.city}, {o.location?.state}</p>
            <p className="mt-4 text-sm leading-relaxed text-foreground">{o.summary}</p>
            {o.description && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {o.description}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-surface-muted p-4 sm:grid-cols-4">
              <Stat label="Unit price" value={fmt((o.pricing?.unitPriceMinor ?? 0) as Minor)} />
              {o.returns?.roiPercent && <Stat label="Projected ROI" value={`${o.returns.roiPercent}%`} accent />}
              {o.returns?.tenorMonths && <Stat label="Tenor" value={`${o.returns.tenorMonths} months`} />}
              <Stat label="Units available" value={`${(o.pricing?.totalUnits ?? 0) - (o.pricing?.unitsSold ?? 0)}`} />
            </div>

            {o.documents.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Documents
                </p>
                <div className="flex flex-col gap-2">
                  {o.documents.map((d) => (
                    <a
                      key={d.url ?? d.name}
                      href={d.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border p-3 text-sm text-foreground hover:bg-surface-muted"
                    >
                      {d.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              Investing in real-estate syndication carries risk, including loss of
              principal. This is not investment advice.
            </p>

            <div className="mt-6">
              <WhatsAppButton whatsapp={amb.whatsapp} ambassadorId={amb.id} opportunityTitle={o.title} className="w-full sm:w-auto">
                Ask {amb.fullName.split(" ")[0]} about this
              </WhatsAppButton>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${accent ? "text-money" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
