import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as ambassador from "@san/service-ambassador";
import * as catalog from "@san/service-catalog";
import { PromoteButton } from "@/components/ambassador/promote-button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { fmt, type Minor } from "@san/core/money";

export default async function OpportunityMarketplacePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await ambassador.getByUserId(session.user.id);
  if (!profile.ok) redirect("/dashboard/onboarding");

  const [opportunitiesResult, promotedResult] = await Promise.all([
    catalog.listPublished(),
    ambassador.listPromotedIds(profile.data._id.toString()),
  ]);
  const opportunities = opportunitiesResult.ok ? opportunitiesResult.data : [];
  const promotedIds = new Set(promotedResult.ok ? promotedResult.data : []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Promote opportunities" description="Toggle which opportunities appear on your microsite." />

      {opportunities.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <EmptyStateIllustration className="h-24 w-28" />
          <p className="text-sm text-muted-foreground">No published opportunities yet — check back soon.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((o) => (
            <Card key={o._id.toString()} className="overflow-hidden">
              <div className="aspect-video bg-surface-muted">
                {o.media[0]?.url && (
                  <img src={o.media[0].url} alt={o.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground">{o.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{o.location?.city}, {o.location?.state}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {fmt((o.pricing?.unitPriceMinor ?? 0) as Minor)}
                  </span>
                  <PromoteButton
                    opportunityId={o._id.toString()}
                    initialPromoted={promotedIds.has(o._id.toString())}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
