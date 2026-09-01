import { Container } from "@/components/layout/container";

export const metadata = { title: "Privacy Policy" };

// See (marketing)/page.tsx for why: middleware.ts's nonce-based CSP is
// meaningless (and a latent security no-op) on a statically cached page.
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <Container className="max-w-[720px] py-16">
      <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Placeholder — final policy pending legal review (PRD §12.4 NDPR
        alignment). We collect the information you provide at signup to
        operate your account, never sell it, and honor data export/deletion
        requests. Contact support@san.com for data requests.
      </p>
    </Container>
  );
}
