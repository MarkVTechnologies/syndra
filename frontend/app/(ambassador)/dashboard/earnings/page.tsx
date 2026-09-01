import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as ambassador from "@san/service-ambassador";
import { ambassadorFunnel } from "@san/service-analytics";
import * as commission from "@san/service-commission";
import { StatCard } from "@/components/data/stat-card";
import { FunnelChart } from "@/components/ambassador/funnel-chart";
import { PayoutRequestButton } from "@/components/ambassador/payout-request-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { fmt, type Minor } from "@san/core/money";
import { DollarSign, Clock, CheckCircle2 } from "lucide-react";

export default async function EarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await ambassador.getByUserId(session.user.id);
  if (!profile.ok) redirect("/dashboard/onboarding");

  const ambassadorId = profile.data._id.toString();
  const [funnelResult, balanceResult, statementResult] = await Promise.all([
    ambassadorFunnel(ambassadorId),
    commission.balanceFor(ambassadorId),
    commission.statementFor(ambassadorId, 25),
  ]);
  const funnel = funnelResult.ok ? funnelResult.data : [];
  const balance = balanceResult.ok ? balanceResult.data : { pendingMinor: 0, payableMinor: 0, paidMinor: 0, totalMinor: 0 };
  const statement = statementResult.ok ? statementResult.data : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Earnings"
        description="Commission accrues once an investment you referred is confirmed."
        actions={<PayoutRequestButton payableMinor={balance.payableMinor} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Payable now" value={balance.payableMinor} icon={DollarSign} accent format="money" />
        <StatCard label="Pending (cooling)" value={balance.pendingMinor} icon={Clock} format="money" />
        <StatCard label="Paid out" value={balance.paidMinor} icon={CheckCircle2} format="money" />
      </div>

      <FunnelChart data={funnel} />

      <Card>
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Statement</h2>
        </div>
        {statement.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <EmptyStateIllustration className="h-24 w-28" />
            <p className="text-sm text-muted-foreground">No commission activity yet.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {statement.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium capitalize text-foreground">{s.entryType}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("en-NG")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold tabular-nums ${s.amountMinor < 0 ? "text-danger" : "text-brass-600"}`}>
                    {fmt(s.amountMinor as Minor)}
                  </span>
                  <Badge variant={s.state === "paid" ? "success" : s.state === "payable" ? "warning" : "neutral"}>
                    {s.state}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
