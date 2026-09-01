import { notFound } from "next/navigation";
import { signAttributionToken } from "@san/service-syndicator";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/brand/logo-mark";
import { getCachedMicrosite } from "@/lib/microsite-cache";
import { JoinForm } from "@/components/syndicator/join-form";
import { LineArt } from "@/components/decor/line-art";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCachedMicrosite(slug);
  if (!result.ok) notFound();

  // R3 — signed hidden form token, HMAC(slug + issuedAt), 24h validity.
  // Generated fresh on every render so it's always within its window.
  const signedToken = signAttributionToken(slug);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 15% 15%, rgba(192,88,0,0.28), transparent 60%), radial-gradient(520px circle at 85% 85%, rgba(113,54,0,0.3), transparent 60%)",
        }}
      />
      <LineArt variant="blueprint-corner" position="top-left" className="text-[var(--estate-amber-300)]" />
      <div aria-hidden className="texture-ledger-contained-dark pointer-events-none absolute inset-0" />
      <Container className="relative max-w-[480px]">
        <div className="glass-panel-dark rounded-2xl p-8">
          <LogoMark />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Invest with {result.data.ambassador.fullName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your account to browse opportunities and track your portfolio.
          </p>
          <JoinForm signedToken={signedToken} />
        </div>
      </Container>
    </div>
  );
}
