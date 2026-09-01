import { Text, Button } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";
import { fmt, type Minor } from "@san/core/money";

export interface AdminInvestmentAlertProps {
  opportunityTitle: string;
  amountMinor: number;
  units: number;
  adminUrl: string;
}

export default function AdminInvestmentAlert({
  opportunityTitle,
  amountMinor,
  units,
  adminUrl,
}: AdminInvestmentAlertProps) {
  return (
    <EmailLayout preview={`New investment: ${fmt(amountMinor as Minor)}`}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        New investment confirmed
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        {units} unit(s) of <strong>{opportunityTitle}</strong> — {fmt(amountMinor as Minor)}.
      </Text>
      <Button
        href={adminUrl}
        style={{ backgroundColor: emailColors.obsidian900, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
      >
        Open admin console
      </Button>
    </EmailLayout>
  );
}
