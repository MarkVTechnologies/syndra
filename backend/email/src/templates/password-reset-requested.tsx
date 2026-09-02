import { Text, Button } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface PasswordResetRequestedProps {
  resetUrl: string;
  requestingIp: string;
}

export default function PasswordResetRequested({
  resetUrl,
  requestingIp,
}: PasswordResetRequestedProps) {
  return (
    <EmailLayout preview="Reset your Syndran password">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Reset your password
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        We received a request from IP {requestingIp} to reset your password.
        This link expires in 30 minutes. If you didn&apos;t request this, you
        can safely ignore this email.
      </Text>
      <Button
        href={resetUrl}
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
        Reset password
      </Button>
    </EmailLayout>
  );
}
