import { Text, Button, Section, Link } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";
import { fmt, type Minor } from "@san/core/money";

export interface InvestmentConfirmedProps {
  opportunityTitle: string;
  units: number;
  amountMinor: number;
  roiPercent: number | null;
  documentUrls: string[];
  statementUrl: string;
}

export default function InvestmentConfirmed({
  opportunityTitle,
  units,
  amountMinor,
  roiPercent,
  documentUrls,
  statementUrl,
}: InvestmentConfirmedProps) {
  return (
    <EmailLayout preview="Your investment is confirmed">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Investment confirmed
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        Your payment has been received and your investment is now confirmed.
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
        {roiPercent && (
          <Text style={{ fontSize: 13, color: emailColors.slate600, margin: "4px 0" }}>
            <strong style={{ color: emailColors.obsidian900 }}>Projected ROI:</strong> {roiPercent}%
          </Text>
        )}
      </Section>
      {documentUrls.length > 0 && (
        <Text style={{ fontSize: 13, color: emailColors.slate600 }}>
          Documents:{" "}
          {documentUrls.map((url, i) => (
            <span key={url}>
              <Link href={url} style={{ color: emailColors.emerald600 }}>Document {i + 1}</Link>
              {i < documentUrls.length - 1 ? ", " : ""}
            </span>
          ))}
        </Text>
      )}
      <Button
        href={statementUrl}
        style={{ backgroundColor: emailColors.emerald600, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block", marginTop: 8 }}
      >
        View portfolio
      </Button>
    </EmailLayout>
  );
}
