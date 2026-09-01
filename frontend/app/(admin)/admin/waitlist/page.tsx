import { Users, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/data/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { GrowthChart } from "@/components/admin/growth-chart";
import { WaitlistTable } from "@/components/admin/waitlist-table";
import { LaunchPanel } from "@/components/admin/launch-panel";
import { getWaitlistKpis, listWaitlist, getGrowthSeries, getLaunchStatus } from "@/lib/admin/waitlist-queries";

const PAGE_SIZE = 25;

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const search = params.search;

  const [kpis, { rows, total }, growth, launchStatus] = await Promise.all([
    getWaitlistKpis(),
    listWaitlist({ page, pageSize: PAGE_SIZE, search }),
    getGrowthSeries(14),
    getLaunchStatus(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Waitlist" description="Ambassador registrations before launch." />

      <LaunchPanel status={launchStatus} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total registered" value={kpis.total} icon={Users} />
        <StatCard label="Last 24h" value={kpis.last24h} icon={Clock} />
        <StatCard label="Last 7 days" value={kpis.last7d} icon={TrendingUp} />
        <StatCard
          label="Verified rate"
          value={kpis.conversionRate}
          icon={CheckCircle2}
          format="percent"
        />
      </div>

      <GrowthChart data={growth} />

      <WaitlistTable initialRows={rows} total={total} page={page} pageSize={PAGE_SIZE} />
    </div>
  );
}
