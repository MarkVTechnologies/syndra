import Link from "next/link";
import * as catalog from "@san/service-catalog";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { fmt, type Minor } from "@san/core/money";

export default async function SyndicatorMarketplacePage() {
  const result = await catalog.listPublished();
  const opportunities = result.ok ? result.data : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Marketplace" description="Vetted opportunities available to invest in." />

      {opportunities.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <EmptyStateIllustration className="h-24 w-28" />
          <p className="text-sm text-muted-foreground">No opportunities published yet — check back soon.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {opportunities.map((o) => {
            const remaining = (o.pricing?.totalUnits ?? 0) - (o.pricing?.unitsSold ?? 0) - (o.pricing?.reservedUnits ?? 0);
            return (
              <Link key={o._id.toString()} href={`/portfolio/opportunities/${o.slug}`}>
                <Card interactive className="overflow-hidden">
                  <div className="aspect-video bg-surface-muted">
                    {o.media[0]?.url && (
                      <img src={o.media[0].url} alt={o.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-foreground">{o.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{o.location?.city}, {o.location?.state}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {fmt((o.pricing?.unitPriceMinor ?? 0) as Minor)} / unit
                      </span>
                      {o.returns?.roiPercent && (
                        <span className="text-xs font-semibold text-brass-600">{o.returns.roiPercent}% ROI</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{Math.max(0, remaining)} units remaining</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
