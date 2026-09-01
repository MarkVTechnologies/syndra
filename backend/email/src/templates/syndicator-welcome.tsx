import { Text, Button, Section, Img } from "@react-email/components";
import { EmailLayout, emailColors } from "./layout";

export interface SyndicatorWelcomeProps {
  dashboardUrl: string;
  ambassador: { fullName: string; whatsapp: string; avatarUrl: string | null } | null;
}

export default function SyndicatorWelcome({ dashboardUrl, ambassador }: SyndicatorWelcomeProps) {
  return (
    <EmailLayout preview="Welcome to SAN — browse vetted opportunities">
      <Text style={{ fontSize: 20, fontWeight: 700, color: emailColors.obsidian900 }}>
        Welcome to SAN
      </Text>
      <Text style={{ fontSize: 15, lineHeight: "24px", color: emailColors.slate600 }}>
        Browse vetted real-estate syndication opportunities and track your
        portfolio from your dashboard.
      </Text>

      {ambassador && (
        <Section
          style={{
            backgroundColor: emailColors.slate50,
            borderRadius: 12,
            padding: "16px 20px",
            margin: "20px 0",
          }}
        >
          <Text style={{ fontSize: 12, color: emailColors.slate600, margin: 0 }}>
            Your ambassador
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            {ambassador.avatarUrl && (
              <Img
                src={ambassador.avatarUrl}
                width={40}
                height={40}
                style={{ borderRadius: 999 }}
                alt={ambassador.fullName}
              />
            )}
            <div>
              <Text style={{ fontSize: 14, fontWeight: 600, color: emailColors.obsidian900, margin: 0 }}>
                {ambassador.fullName}
              </Text>
              <Text style={{ fontSize: 13, color: emailColors.slate600, margin: 0 }}>
                {ambassador.whatsapp}
              </Text>
            </div>
          </div>
        </Section>
      )}

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
        Browse opportunities
      </Button>
    </EmailLayout>
  );
}
