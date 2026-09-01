import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { LogoMark } from "@/components/brand/logo-mark";
import { UserAvatar } from "@/components/brand/user-avatar";
import { SignOutButton } from "@/components/syndicator/sign-out-button";

export default async function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "syndicator") {
    redirect("/login");
  }

  return (
    <div className="relative min-h-dvh bg-surface-muted">
      <div aria-hidden className="texture-ledger-contained-dark pointer-events-none absolute inset-0 -z-10" />
      <header className="relative flex h-16 items-center justify-between border-b border-border bg-surface px-5 shadow-[var(--san-e1)] md:px-8">
        <div className="flex items-center gap-6">
          <LogoMark />
          <nav className="hidden gap-4 text-sm font-medium text-muted-foreground sm:flex">
            <Link href="/portfolio" className="hover:text-foreground">Portfolio</Link>
            <Link href="/portfolio/opportunities" className="hover:text-foreground">Marketplace</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <UserAvatar email={session.user.email ?? ""} className="hidden sm:flex" />
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-[800px] px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
