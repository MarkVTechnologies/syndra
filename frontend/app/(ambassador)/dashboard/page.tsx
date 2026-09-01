import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as ambassador from "@san/service-ambassador";
import * as syndicator from "@san/service-syndicator";
import { StatCard } from "@/components/data/stat-card";
import { Card } from "@/components/ui/card";
import { MicrositeLinkCard } from "@/components/ambassador/microsite-link-card";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { Users, Eye, TrendingUp } from "lucide-react";

export default async function AmbassadorDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await ambassador.getByUserId(session.user.id);
  if (!profile.ok) redirect("/dashboard/onboarding");

  const promoted = await ambassador.listPromotedIds(profile.data._id.toString());
  const hasPromoted = promoted.ok && promoted.data.length > 0;
  if (!profile.data.headline || !hasPromoted) redirect("/dashboard/onboarding");

  const stats = profile.data.stats ?? {
    views: 0,
    referrals: 0,
    investments: 0,
    totalEarnedMinor: 0,
    pendingMinor: 0,
    paidMinor: 0,
  };

  const referralsResult = await syndicator.listReferrals(profile.data._id.toString(), 5);
  const referrals = referralsResult.ok ? referralsResult.data : [];

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner
        eyebrow="Ambassador dashboard"
        title={`Welcome back, ${profile.data.fullName.split(" ")[0]}`}
        subtitle="Every referral, every naira earned — tracked automatically from your microsite."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Microsite views" value={stats.views} icon={Eye} />
        <StatCard label="Referrals" value={stats.referrals} icon={Users} />
        <StatCard label="Investments" value={stats.investments} icon={TrendingUp} />
        <StatCard
          label="Total earned"
          value={stats.totalEarnedMinor}
          accent
          format="money"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <MicrositeLinkCard slug={profile.data.slug} />

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent referrals</h2>
            <Link href="/dashboard/opportunities" className="text-xs font-medium text-primary hover:underline">
              Promote more
            </Link>
          </div>
          {referrals.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <EmptyStateIllustration className="h-24 w-28" />
              <p className="max-w-[220px] text-sm text-muted-foreground">
                No referrals yet. Share your microsite to start earning.
              </p>
            </div>
          ) : (
            <div className="mt-3 flex flex-col divide-y divide-border">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-foreground">{r.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.referredAt ? new Date(r.referredAt).toLocaleDateString("en-NG") : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
