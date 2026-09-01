import Link from "next/link";
import { adminOverview } from "@san/service-analytics";
import { StatCard } from "@/components/data/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { fmt, type Minor } from "@san/core/money";
import { Users, TrendingUp, DollarSign, Activity } from "lucide-react";

export default async function AdminOverviewPage() {
  const result = await adminOverview();
  const overview = result.ok
    ? result.data
    : {
        kpis: {
          totalAmbassadors: 0,
          activeAmbassadors: 0,
          activationRate: 0,
          totalSyndicators: 0,
          totalInvestmentVolumeMinor: 0,
          commissionLiabilityMinor: 0,
        },
        leaderboard: [],
        pipeline: {
          pending: 0,
          awaiting_payment: 0,
          awaiting_confirmation: 0,
          confirmed: 0,
          cancelled: 0,
          refunded: 0,
        },
      };
  const { kpis, leaderboard, pipeline } = overview;

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner eyebrow="Admin" title="Overview" subtitle="Platform KPIs, at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ambassadors" value={kpis.totalAmbassadors} icon={Users} />
        <StatCard label="Activation rate" value={kpis.activationRate} icon={Activity} format="percent" />
        <StatCard label="Syndicators" value={kpis.totalSyndicators} icon={Users} />
        <StatCard
          label="Investment volume"
          value={kpis.totalInvestmentVolumeMinor}
          icon={TrendingUp}
          format="money"
        />
      </div>

      <StatCard
        label="Commission liability (pending + payable)"
        value={kpis.commissionLiabilityMinor}
        icon={DollarSign}
        accent
        format="money"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold text-foreground">Ambassador leaderboard</h2>
          </div>
          {leaderboard.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <EmptyStateIllustration className="h-24 w-28" />
              <p className="text-sm text-muted-foreground">No earnings yet.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {leaderboard.map((row, i) => (
                <Link
                  key={row.ambassadorId}
                  href={`/admin/ambassadors`}
                  className="flex items-center justify-between p-4 hover:bg-surface-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.fullName}</p>
                      <p className="text-xs text-muted-foreground">{row.referrals} referrals</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-brass-600">
                    {fmt(row.totalEarnedMinor as Minor)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold text-foreground">Investment pipeline</h2>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {Object.entries(pipeline).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-4">
                <Badge variant={status === "confirmed" ? "success" : status === "cancelled" || status === "refunded" ? "danger" : "neutral"}>
                  {status.replace("_", " ")}
                </Badge>
                <span className="text-sm font-semibold tabular-nums text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
