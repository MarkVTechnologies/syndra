import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
  Font,
} from "@react-email/components";
import type { ReactNode } from "react";

// SAN Obsidian tokens, table-safe subset for email clients. PRD §9.3.
const colors = {
  obsidian950: "#05080D",
  obsidian900: "#0B1220",
  slate600: "#475569",
  slate200: "#E2E8F0",
  slate50: "#F8FAFC",
  emerald900: "#064E3B",
  emerald600: "#059669",
  brass500: "#D4AF37",
  danger: "#EF4444",
  warning: "#F59E0B",
};

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.slate50, margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: 600,
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            fontFamily: "Inter, Helvetica, Arial, sans-serif",
          }}
        >
          <Section
            style={{
              backgroundColor: colors.obsidian950,
              padding: "28px 32px",
            }}
          >
            <Text
              style={{
                color: colors.brass500,
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Syndran
            </Text>
            <Text style={{ color: colors.slate200, fontSize: 12, margin: "2px 0 0" }}>
              Syndicators Ambassadors Network
            </Text>
          </Section>

          <Section style={{ padding: "32px" }}>{children}</Section>

          <Hr style={{ borderColor: colors.slate200, margin: 0 }} />
          <Section style={{ padding: "20px 32px" }}>
            <Text style={{ color: colors.slate600, fontSize: 12, lineHeight: "18px" }}>
              You are receiving this because you have an account with Syndran. If this
              wasn&apos;t you, contact{" "}
              <Link href="mailto:support@syndran.com" style={{ color: colors.emerald600 }}>
                support@syndran.com
              </Link>
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailColors = colors;
