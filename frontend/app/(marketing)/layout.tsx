import Link from "next/link";
import { ChevronDown, Store, TrendingUp } from "lucide-react";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/brand/logo-mark";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/**
 * Two persona-picker menus, not one generic "Log in" — admin is
 * deliberately excluded (it has its own unlisted /admin/login entry, not a
 * public marketing CTA). Login lands both personas on the same shared
 * /login page (role is resolved after auth), but presenting it per persona
 * — rather than one undifferentiated link — is what makes a visitor
 * immediately see "this product is for people like me."
 */
const PERSONAS = [
  { label: "Ambassador", icon: Store, signup: "/signup", login: "/login" },
  { label: "Investor", icon: TrendingUp, signup: "/join", login: "/login" },
] as const;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-[rgba(253,251,212,0.1)] bg-[var(--estate-espresso-950)]/85 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/">
            <LogoMark textClassName="text-[var(--estate-cream-50)]" />
          </Link>
          <nav className="flex items-center gap-2">
            {PERSONAS.map((persona) => (
              <DropdownMenu key={persona.label}>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--estate-cream-200)] transition-colors hover:bg-white/5 hover:text-[var(--estate-cream-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <persona.icon className="size-3.5" strokeWidth={1.75} />
                  {persona.label}
                  <ChevronDown className="size-3.5" strokeWidth={1.75} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-panel-dark min-w-[160px] border-0">
                  <DropdownMenuItem asChild>
                    <Link href={persona.signup}>Sign up</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={persona.login}>Log in</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </nav>
        </Container>
      </header>
      <main>{children}</main>
    </div>
  );
}
