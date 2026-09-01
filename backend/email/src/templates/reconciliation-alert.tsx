import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";
import { fmt, type Minor } from "@san/core/money";

export interface ReconciliationDriftRow {
  ambassadorName: string;
  ledgerPendingMinor: number;
  ledgerPaidMinor: number;
  cachedPendingMinor: number;
  cachedPaidMinor: number;
}

export interface ReconciliationAlertProps {
  date: string;
  drifts: ReconciliationDriftRow[];
  adminUrl: string;
}

/**
 * PRD §8.4 / Day 5 Block 8 nightly reconciliation. The ledger
 * (`commissions` collection) is the source of truth; `ambassador.stats` is
 * a cached counter kept for fast reads. Any mismatch means the cache drifted
 * from a write that skipped the counter update — this never corrects it
 * automatically, only flags it, since silently "fixing" a balance is exactly
 * the kind of thing that must be a deliberate, audited action.
 */
export default function ReconciliationAlert({ date, drifts, adminUrl }: ReconciliationAlertProps) {
  return (
    <EmailLayout preview={`Ledger reconciliation drift detected — ${date}`}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Reconciliation drift detected
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        The nightly reconciliation run on {date} found {drifts.length} ambassador
        {drifts.length === 1 ? "" : "s"} whose cached balance no longer matches the
        commission ledger. The ledger is always the source of truth — this needs a
        manual look, not an auto-fix.
      </Text>
      {drifts.map((d) => (
        <Section
          key={d.ambassadorName}
          style={{ backgroundColor: emailColors.slate50, borderRadius: 12, padding: "16px 20px", margin: "12px 0" }}
        >
          <Text style={{ fontSize: 14, fontWeight: 600, color: emailColors.obsidian900, margin: "0 0 8px" }}>
            {d.ambassadorName}
          </Text>
          <Text style={{ fontSize: 13, color: emailColors.slate600, margin: "2px 0" }}>
            Ledger: {fmt(d.ledgerPendingMinor as Minor)} pending · {fmt(d.ledgerPaidMinor as Minor)} paid
          </Text>
          <Text style={{ fontSize: 13, color: emailColors.slate600, margin: "2px 0" }}>
            Cached: {fmt(d.cachedPendingMinor as Minor)} pending · {fmt(d.cachedPaidMinor as Minor)} paid
          </Text>
        </Section>
      ))}
      <Button
        href={adminUrl}
        style={{ backgroundColor: emailColors.obsidian900, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
      >
        Review in admin console
      </Button>
    </EmailLayout>
  );
}
