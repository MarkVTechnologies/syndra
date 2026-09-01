import Link from "next/link";
import * as commission from "@san/service-commission";
import { PayoutRow } from "@/components/admin/payout-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { cn } from "@/lib/utils";
import { fmt, type Minor } from "@san/core/money";
import { Download } from "lucide-react";

const TABS = [
  { value: undefined, label: "All" },
  { value: "requested", label: "Requested" },
  { value: "paid", label: "Paid" },
] as const;

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [allResult, filteredResult] = await Promise.all([
    commission.adminListPayouts(),
    status ? commission.adminListPayouts(status) : Promise.resolve(null),
  ]);
  const all = allResult.ok ? allResult.data : [];
  const payouts = filteredResult ? (filteredResult.ok ? filteredResult.data : []) : all;
  const requested = all.filter((p) => p.status === "requested");
  const totalRequestedMinor = requested.reduce((sum, p) => sum + p.amountMinor, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payouts"
        description={
          <>
            {requested.length} requested ·{" "}
            <span className="font-semibold text-brass-600">{fmt(totalRequestedMinor as Minor)}</span> awaiting payment
          </>
        }
        actions={
          <a href={`/api/export/payouts${status ? `?status=${status}` : ""}`}>
            <Button variant="secondary" size="sm">
              <Download className="size-4" /> Export CSV
            </Button>
          </a>
        }
      />

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/admin/payouts?status=${tab.value}` : "/admin/payouts"}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              status === tab.value
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Ambassador</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <PayoutRow key={p.id} payout={p} />
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <EmptyStateIllustration className="h-24 w-28" />
                    <p className="text-sm text-muted-foreground">No payout requests yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
