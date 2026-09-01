import { Text, Button, Section } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface WaitlistConfirmedProps {
  fullName: string;
  position: number;
  reservedSlug: string;
  appUrl: string;
  shareUrl: string;
}

export default function WaitlistConfirmed({
  fullName,
  position,
  reservedSlug,
  appUrl,
  shareUrl,
}: WaitlistConfirmedProps) {
  const firstName = fullName.split(" ")[0];
  return (
    <EmailLayout preview={`You're #${position} on the SAN ambassador waitlist`}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        You&apos;re on the list, {firstName}.
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        Thanks for joining the SAN ambassador waitlist. You are number{" "}
        <strong style={{ color: emailColors.brass500 }}>{position}</strong> in line.
      </Text>

      <Section
        style={{
          backgroundColor: "#FAF3DC",
          borderRadius: 12,
          padding: "16px 20px",
          margin: "20px 0",
        }}
      >
        <Text style={{ fontSize: 12, color: emailColors.slate600, margin: 0 }}>
          Your reserved microsite
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: emailColors.obsidian900,
            margin: "4px 0 0",
            fontFamily: "monospace",
          }}
        >
          san.com/{reservedSlug}
        </Text>
      </Section>

      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        When SAN launches, we&apos;ll send you a direct login link — no
        re-registration needed. In the meantime, refer other realtors to move up
        the line.
      </Text>

      <Button
        href={shareUrl}
        style={{
          backgroundColor: emailColors.emerald600,
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
        Share your referral link
      </Button>

      <Text style={{ fontSize: 13, color: emailColors.slate600, marginTop: 24 }}>
        Or visit{" "}
        <a href={appUrl} style={{ color: emailColors.emerald600 }}>
          {appUrl}
        </a>
      </Text>
    </EmailLayout>
  );
}
