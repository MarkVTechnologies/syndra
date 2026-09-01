import { notFound } from "next/navigation";
import * as catalog from "@san/service-catalog";
import { OpportunityBuilder } from "@/components/admin/opportunity-builder";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import type { OpportunityInputType } from "@san/core/schemas/opportunity";

const STATUS_VARIANT: Record<string, "success" | "brass" | "danger" | "neutral"> = {
  published: "success",
  sold_out: "brass",
  closed: "danger",
};

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await catalog.getById(id);
  if (!result.ok) notFound();

  const o = result.data;
  const defaultValues: Partial<OpportunityInputType> = {
    title: o.title,
    slug: o.slug,
    summary: o.summary,
    description: o.description,
    type: o.type as OpportunityInputType["type"],
    location: { city: o.location?.city ?? "", state: o.location?.state ?? "" },
    media: o.media as OpportunityInputType["media"],
    documents: o.documents as OpportunityInputType["documents"],
    pricing: {
      unitPriceMinor: o.pricing?.unitPriceMinor ?? 0,
      minUnits: o.pricing?.minUnits ?? 0,
      maxUnits: o.pricing?.maxUnits ?? 0,
      totalUnits: o.pricing?.totalUnits ?? 0,
    },
    returns: {
      roiPercent: o.returns?.roiPercent ?? undefined,
      tenorMonths: o.returns?.tenorMonths ?? undefined,
      payoutFrequency: (o.returns?.payoutFrequency ?? undefined) as OpportunityInputType["returns"]["payoutFrequency"],
    },
    commission: o.commission as OpportunityInputType["commission"],
    featured: o.featured,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={o.title}
        description={
          <span className="inline-flex items-center gap-1.5">
            Status: <Badge variant={STATUS_VARIANT[o.status] ?? "neutral"}>{o.status.replace("_", " ")}</Badge>
          </span>
        }
      />
      <OpportunityBuilder opportunityId={id} defaultValues={defaultValues} />
    </div>
  );
}
