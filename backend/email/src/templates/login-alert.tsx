import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface LoginAlertProps {
  deviceLabel: string;
  ip: string;
  geo: string;
  timestamp: string; // pre-formatted WAT
  killSessionUrl: string;
}

/** MANDATORY on every login. PRD §9.2. */
export default function LoginAlert({
  deviceLabel,
  ip,
  geo,
  timestamp,
  killSessionUrl,
}: LoginAlertProps) {
  return (
    <EmailLayout preview="New sign-in to your SAN account">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        New sign-in detected
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        Your account was just accessed. If this was you, no action is needed.
      </Text>

      <Section
        style={{
          backgroundColor: emailColors.slate50,
          borderRadius: 12,
          padding: "16px 20px",
          margin: "20px 0",
        }}
      >
        <Row label="Device" value={deviceLabel} />
        <Row label="Location" value={geo} />
        <Row label="IP address" value={ip} />
        <Row label="Time" value={`${timestamp} WAT`} />
      </Section>

      <Button
        href={killSessionUrl}
        style={{
          backgroundColor: emailColors.obsidian900,
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 600,
          padding: "12px 24px",
          borderRadius: 10,
          textDecoration: "none",
          display: "inline-block",
          marginTop: 8,
        }}
      >
        This wasn&apos;t me — secure my account
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
