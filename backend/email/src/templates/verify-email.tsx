import { Text, Button } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface VerifyEmailProps {
  verifyUrl: string;
}

export default function VerifyEmail({ verifyUrl }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verify your email to activate your Syndran account">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Verify your email
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        One click and you&apos;re verified. This link expires in 30 minutes.
      </Text>
      <Button
        href={verifyUrl}
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
        Verify email
      </Button>
      <Text style={{ fontSize: 13, color: emailColors.slate600, marginTop: 24 }}>
        If the button doesn&apos;t work, copy this link: {verifyUrl}
      </Text>
    </EmailLayout>
  );
}
