import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import * as syndicator from "@san/service-syndicator";
import * as investment from "@san/service-investment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { fmt, type Minor } from "@san/core/money";
import { MessageCircle, Store } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  confirmed: "success",
  awaiting_payment: "warning",
  awaiting_confirmation: "warning",
  pending: "neutral",
  cancelled: "danger",
  refunded: "danger",
};

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await syndicator.getByUserId(session.user.id);
  const ambassadorResult = profile.ok ? await syndicator.getAttributedAmbassador(profile.data.id) : null;
  const contact = ambassadorResult?.ok ? ambassadorResult.data : null;

  const investmentsResult = await investment.listFor(session.user.id);
  const investments = investmentsResult.ok ? investmentsResult.data : [];
  const totalInvestedMinor = investments
    .filter((i) => i.status === "confirmed")
    .reduce((sum, i) => sum + i.amountMinor, 0);

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner
        eyebrow="Syndicator portfolio"
        title={`Welcome${profile.ok ? `, ${profile.data.fullName.split(" ")[0]}` : ""}`}
        subtitle={
          <>
            Total invested: <span className="font-semibold text-foreground">{fmt(totalInvestedMinor as Minor)}</span>
          </>
        }
      >
        <Link href="/portfolio/opportunities">
          <Button className="sweep relative overflow-hidden">
            <Store className="size-4" /> Marketplace
          </Button>
        </Link>
      </WelcomeBanner>

      {contact && (
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Your ambassador
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{contact.fullName}</p>
          <a
            href={buildWhatsAppLink(contact.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <MessageCircle className="size-4" /> Message on WhatsApp
          </a>
        </Card>
      )}

      <Card>
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">Your investments</h2>
        </div>
        {investments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <EmptyStateIllustration className="h-24 w-28" />
            <p className="text-sm text-muted-foreground">
              No investments yet. Browse the marketplace to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {investments.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{i.opportunityTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.units} unit(s) · {new Date(i.createdAt).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {fmt(i.amountMinor as Minor)}
                  </span>
                  <Badge variant={STATUS_VARIANT[i.status] ?? "neutral"}>{i.status.replace("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
