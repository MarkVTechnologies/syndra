import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";
import { fmt, type Minor } from "@san/core/money";

export interface AdminDigestProps {
  date: string;
  signups24h: number;
  referrals24h: number;
  investmentVolumeMinor: number;
  commissionsAccruedMinor: number;
  adminUrl: string;
}

export default function AdminDigest({
  date,
  signups24h,
  referrals24h,
  investmentVolumeMinor,
  commissionsAccruedMinor,
  adminUrl,
}: AdminDigestProps) {
  return (
    <EmailLayout preview={`Daily digest — ${date}`}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Daily digest — {date}
      </Text>
      <Section style={{ backgroundColor: emailColors.slate50, borderRadius: 12, padding: "16px 20px", margin: "20px 0" }}>
        <Row label="New signups (24h)" value={String(signups24h)} />
        <Row label="New referrals (24h)" value={String(referrals24h)} />
        <Row label="Investment volume" value={fmt(investmentVolumeMinor as Minor)} />
        <Row label="Commission accrued" value={fmt(commissionsAccruedMinor as Minor)} />
      </Section>
      <Button
        href={adminUrl}
        style={{ backgroundColor: emailColors.obsidian900, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
      >
        Open admin console
      </Button>
    </EmailLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ fontSize: 13, color: emailColors.slate600, margin: "4px 0" }}>
      <strong style={{ color: emailColors.obsidian900 }}>{label}:</strong> {value}
    </Text>
  );
}
