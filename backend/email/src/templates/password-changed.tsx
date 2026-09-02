import { Text, Button } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface PasswordChangedProps {
  revokeAllUrl: string;
}

export default function PasswordChanged({ revokeAllUrl }: PasswordChangedProps) {
  return (
    <EmailLayout preview="Your Syndran password was changed">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Password changed
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        Your password was just changed and every other session has been
        signed out. If this wasn&apos;t you, secure your account immediately.
      </Text>
      <Button
        href={revokeAllUrl}
        style={{
          backgroundColor: emailColors.danger,
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
        This wasn&apos;t me
      </Button>
    </EmailLayout>
  );
}
