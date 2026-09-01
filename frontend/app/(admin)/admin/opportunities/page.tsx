import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import * as catalog from "@san/service-catalog";
import { fmt, type Minor } from "@san/core/money";

export default async function AdminOpportunitiesPage() {
  const result = await catalog.list({ pageSize: 100 });
  const rows = result.ok ? result.data.rows : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Opportunities"
        description="Manage the investment marketplace."
        actions={
          <Link href="/admin/opportunities/new">
            <Button>
              <Plus className="size-4" /> New opportunity
            </Button>
          </Link>
        }
      />

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <EmptyStateIllustration className="h-24 w-28" />
          <p className="text-sm text-muted-foreground">No opportunities yet. Create your first one.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((o) => (
            <Link key={o._id.toString()} href={`/admin/opportunities/${o._id.toString()}`}>
              <Card interactive className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{o.title}</h3>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{o.location?.city}, {o.location?.state}</p>
                <p className="mt-3 text-sm font-semibold tabular-nums text-foreground">
                  {fmt((o.pricing?.unitPriceMinor ?? 0) as Minor)} / unit
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {o.pricing?.unitsSold ?? 0} / {o.pricing?.totalUnits ?? 0} units sold
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant: "success" | "brass" | "danger" | "neutral" =
    status === "published" ? "success" : status === "sold_out" ? "brass" : status === "closed" ? "danger" : "neutral";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}
