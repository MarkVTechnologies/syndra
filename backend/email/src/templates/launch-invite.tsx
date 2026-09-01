import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface LaunchInviteProps {
  fullName: string;
  reservedSlug: string;
  loginUrl: string;
}

/** PRD §13.4 — the launch broadcast. First login converts the waitlist row. */
export default function LaunchInvite({ fullName, reservedSlug, loginUrl }: LaunchInviteProps) {
  const firstName = fullName.split(" ")[0];
  return (
    <EmailLayout preview="SAN is live — your page is ready">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        We&apos;re live, {firstName}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        SAN has launched. Your reserved microsite is ready — log in with the
        password you set to activate it.
      </Text>
      <Section style={{ backgroundColor: "#FAF3DC", borderRadius: 12, padding: "16px 20px", margin: "20px 0" }}>
        <Text style={{ fontSize: 12, color: emailColors.slate600, margin: 0 }}>Your reserved microsite</Text>
        <Text style={{ fontSize: 16, fontWeight: 700, color: emailColors.obsidian900, margin: "4px 0 0", fontFamily: "monospace" }}>
          san.com/{reservedSlug}
        </Text>
      </Section>
      <Button
        href={loginUrl}
        style={{ backgroundColor: emailColors.emerald600, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
      >
        Log in and activate
      </Button>
      <Text style={{ fontSize: 13, color: emailColors.slate600, marginTop: 16 }}>
        No re-registration needed — use the same email and password from the waitlist.
      </Text>
    </EmailLayout>
  );
}
