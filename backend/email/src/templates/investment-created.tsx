import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";
import { fmt, type Minor } from "@san/core/money";

export interface InvestmentCreatedProps {
  opportunityTitle: string;
  units: number;
  amountMinor: number;
  reservedUntil: string;
  summaryUrl: string;
}

export default function InvestmentCreated({
  opportunityTitle,
  units,
  amountMinor,
  reservedUntil,
  summaryUrl,
}: InvestmentCreatedProps) {
  const minutesLeft = Math.max(0, Math.round((new Date(reservedUntil).getTime() - Date.now()) / 60000));
  return (
    <EmailLayout preview="Complete your investment">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Complete your investment
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        Your allocation is reserved for {minutesLeft} minutes. Complete payment to confirm it.
      </Text>
      <Section style={{ backgroundColor: emailColors.slate50, borderRadius: 12, padding: "16px 20px", margin: "20px 0" }}>
        <Text style={{ fontSize: 13, color: emailColors.slate600, margin: "4px 0" }}>
          <strong style={{ color: emailColors.obsidian900 }}>Opportunity:</strong> {opportunityTitle}
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.slate600, margin: "4px 0" }}>
          <strong style={{ color: emailColors.obsidian900 }}>Units:</strong> {units}
        </Text>
        <Text style={{ fontSize: 13, color: emailColors.slate600, margin: "4px 0" }}>
          <strong style={{ color: emailColors.obsidian900 }}>Amount:</strong> {fmt(amountMinor as Minor)}
        </Text>
      </Section>
      <Button
        href={summaryUrl}
        style={{ backgroundColor: emailColors.emerald600, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
      >
        Complete payment
      </Button>
    </EmailLayout>
  );
}
