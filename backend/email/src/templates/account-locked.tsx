import { Text, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface AccountLockedProps {
  ip: string;
  unlocksInMinutes: number;
}

/** PRD §12.1 brute-force control: alert on the transition into a lockout. */
export default function AccountLocked({ ip, unlocksInMinutes }: AccountLockedProps) {
  return (
    <EmailLayout preview="Your Syndran account was temporarily locked">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Account temporarily locked
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        We detected several failed sign-in attempts on your account and
        locked it for {unlocksInMinutes} minutes as a precaution.
      </Text>
      <Section style={{ backgroundColor: emailColors.slate50, borderRadius: 12, padding: "16px 20px", margin: "20px 0" }}>
        <Text style={{ fontSize: 13, color: emailColors.slate600, margin: 0 }}>
          <strong style={{ color: emailColors.obsidian900 }}>Source IP:</strong> {ip}
        </Text>
      </Section>
      <Text style={{ fontSize: 13, color: emailColors.slate600 }}>
        If this wasn&apos;t you, consider resetting your password once the
        lock lifts. If it was you, just wait and try again — no action needed.
      </Text>
    </EmailLayout>
  );
}
