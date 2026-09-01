import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface AmbassadorApprovedProps {
  fullName: string;
  micrositeUrl: string;
}

export default function AmbassadorApproved({ fullName, micrositeUrl }: AmbassadorApprovedProps) {
  const firstName = fullName.split(" ")[0];
  return (
    <EmailLayout preview="You're live on SAN">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        You&apos;re live, {firstName}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        Your ambassador account is approved. Your microsite is ready to share.
      </Text>
      <Section style={{ backgroundColor: "#FAF3DC", borderRadius: 12, padding: "16px 20px", margin: "20px 0" }}>
        <Text style={{ fontSize: 12, color: emailColors.slate600, margin: 0 }}>Your microsite</Text>
        <Text style={{ fontSize: 16, fontWeight: 700, color: emailColors.obsidian900, margin: "4px 0 0", fontFamily: "monospace" }}>
          {micrositeUrl}
        </Text>
      </Section>
      <Button
        href={micrositeUrl}
        style={{ backgroundColor: emailColors.emerald600, color: "#FFFFFF", fontSize: 15, fontWeight: 600, padding: "12px 24px", borderRadius: 10, textDecoration: "none", display: "inline-block" }}
      >
        View your microsite
      </Button>
    </EmailLayout>
  );
}
