import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";
import { fmt, type Minor } from "@san/core/money";

export interface PayoutPaidProps {
  amountMinor: number;
  method: string;
  reference: string;
  commissionCount: number;
  dashboardUrl: string;
}

export default function PayoutPaid({ amountMinor, method, reference, commissionCount, dashboardUrl }: PayoutPaidProps) {
  return (
    <EmailLayout preview="Your payout has been sent">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Payout sent
      </Text>
      <Section style={{ backgroundColor: "#FAF3DC", borderRadius: 12, padding: "16px 20px", margin: "20px 0", textAlign: "center" }}>
        <Text style={{ fontSize: 32, fontWeight: 800, color: emailColors.brass500, margin: 0 }}>
          {fmt(amountMinor as Minor)}
        </Text>
        <Text style={{ fontSize: 12, color: emailColors.slate600, margin: "8px 0 0" }}>
          {commissionCount} commission entr{commissionCount === 1 ? "y" : "ies"} · {method} · Ref {reference}
        </Text>
      </Section>
      <Button
        href={dashboardUrl}
        style={{ backgroundColor: emailColors.emerald600, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
      >
        View statement
      </Button>
    </EmailLayout>
  );
}
