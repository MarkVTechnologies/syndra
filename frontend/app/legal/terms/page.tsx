import { Container } from "@/components/layout/container";

export const metadata = { title: "Terms of Service" };

// See (marketing)/page.tsx for why: middleware.ts's nonce-based CSP is
// meaningless (and a latent security no-op) on a statically cached page.
export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <Container className="max-w-[720px] py-16">
      <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Placeholder — final terms to be reviewed by SEC-Nigeria counsel
        before launch (PRD §17, Regulatory scrutiny risk). Investing in
        real-estate syndication carries risk, including loss of principal.
        This platform does not provide investment advice.
      </p>
    </Container>
  );
}
