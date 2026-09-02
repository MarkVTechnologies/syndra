import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/container";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[var(--estate-espresso-950)] py-12 text-[var(--estate-sand-300)]">
      <div aria-hidden className="texture-ledger-dark pointer-events-none absolute inset-0 opacity-50" />
      <Container className="relative">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--estate-amber-600)] to-[var(--estate-rust-700)] text-[var(--estate-cream-50)]">
              <ShieldCheck className="size-4" strokeWidth={2.25} />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-[var(--estate-cream-50)]">Syndran</p>
              <p className="text-sm">Syndicators Ambassadors Network</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/legal/terms" className="transition-colors hover:text-[var(--estate-cream-50)]">Terms</Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-[var(--estate-cream-50)]">Privacy</Link>
            <a href="mailto:support@syndran.com" className="transition-colors hover:text-[var(--estate-cream-50)]">Contact</a>
          </nav>
        </div>
        <p className="mt-8 border-t border-[rgba(253,251,212,0.1)] pt-6 text-xs text-[var(--estate-sand-300)]/60">
          Investing in real-estate syndication carries risk, including loss of
          principal. This is not investment advice. &copy; {new Date().getFullYear()} Syndran.
        </p>
      </Container>
    </footer>
  );
}
