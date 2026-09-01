import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";
import { fmt, type Minor } from "@san/core/money";

export interface CommissionAccruedProps {
  opportunityTitle: string;
  syndicatorFirstName: string;
  amountMinor: number;
  maturesInDays: number;
  dashboardUrl: string;
}

export default function CommissionAccrued({
  opportunityTitle,
  syndicatorFirstName,
  amountMinor,
  maturesInDays,
  dashboardUrl,
}: CommissionAccruedProps) {
  const maturityDate = new Date(Date.now() + maturesInDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <EmailLayout preview="You earned a new commission">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Commission earned
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        {syndicatorFirstName}&apos;s investment in <strong>{opportunityTitle}</strong> just confirmed.
      </Text>
      <Section style={{ backgroundColor: "#FAF3DC", borderRadius: 12, padding: "16px 20px", margin: "20px 0", textAlign: "center" }}>
        <Text style={{ fontSize: 12, color: emailColors.slate600, margin: 0 }}>Commission earned</Text>
        <Text style={{ fontSize: 32, fontWeight: 800, color: emailColors.brass500, margin: "4px 0 0" }}>
          {fmt(amountMinor as Minor)}
        </Text>
        <Text style={{ fontSize: 12, color: emailColors.slate600, margin: "8px 0 0" }}>
          Payable on {maturityDate}
        </Text>
      </Section>
      <Button
        href={dashboardUrl}
        style={{ backgroundColor: emailColors.emerald600, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
      >
        View earnings
      </Button>
    </EmailLayout>
  );
}
