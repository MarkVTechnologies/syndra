import { notFound } from "next/navigation";
import * as catalog from "@san/service-catalog";
import { Card } from "@/components/ui/card";
import { fmt, type Minor } from "@san/core/money";
import { CommitFlow } from "./commit-flow";

export default async function OpportunityCommitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await catalog.getBySlug(slug);
  if (!result.ok || result.data.status !== "published") notFound();
  const o = result.data;

  const remaining = Math.max(
    0,
    (o.pricing?.totalUnits ?? 0) - (o.pricing?.unitsSold ?? 0) - (o.pricing?.reservedUnits ?? 0)
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden rounded-2xl">
        <div className="aspect-video bg-surface-muted">
          {o.media[0]?.url && (
            <img src={o.media[0].url} alt={o.title} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="p-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{o.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{o.location?.city}, {o.location?.state}</p>
          <p className="mt-4 text-sm leading-relaxed text-foreground">{o.summary}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-surface-muted p-4 sm:grid-cols-4">
            <Stat label="Unit price" value={fmt((o.pricing?.unitPriceMinor ?? 0) as Minor)} />
            {o.returns?.roiPercent && <Stat label="Projected ROI" value={`${o.returns.roiPercent}%`} accent />}
            {o.returns?.tenorMonths && <Stat label="Tenor" value={`${o.returns.tenorMonths} months`} />}
            <Stat label="Units remaining" value={String(remaining)} />
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Investing in real-estate syndication carries risk, including loss of
            principal. This is not investment advice.
          </p>
        </div>
      </Card>

      <CommitFlow
        opportunityId={o._id.toString()}
        opportunityTitle={o.title}
        unitPriceMinor={o.pricing?.unitPriceMinor ?? 0}
        minUnits={o.pricing?.minUnits ?? 1}
        maxUnits={Math.min(o.pricing?.maxUnits ?? 1, remaining)}
        remaining={remaining}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${accent ? "text-brass-600" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
