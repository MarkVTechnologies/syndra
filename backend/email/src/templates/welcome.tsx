import { Text, Button } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface WelcomeProps {
  role: "admin" | "ambassador" | "syndicator";
  dashboardUrl: string;
}

const COPY: Record<WelcomeProps["role"], { title: string; body: string; cta: string }> = {
  admin: {
    title: "Welcome to Syndran",
    body: "Your admin console is ready.",
    cta: "Open admin console",
  },
  ambassador: {
    title: "Welcome to Syndran",
    body: "Complete your profile, claim your slug, and pick your first opportunity to promote.",
    cta: "Complete onboarding",
  },
  syndicator: {
    title: "Welcome to Syndran",
    body: "Browse vetted opportunities and track your portfolio from your dashboard.",
    cta: "Open dashboard",
  },
};

export default function Welcome({ role, dashboardUrl }: WelcomeProps) {
  const copy = COPY[role];
  return (
    <EmailLayout preview={copy.title}>
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        {copy.title}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        {copy.body}
      </Text>
      <Button
        href={dashboardUrl}
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
        {copy.cta}
      </Button>
    </EmailLayout>
  );
}
