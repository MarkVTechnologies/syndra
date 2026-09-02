"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, ScrollText, Wallet, LogOut, Command, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo-mark";
import { UserAvatar } from "@/components/brand/user-avatar";
import { CommandPalette } from "./command-palette";

const SIDEBAR_NAV = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/waitlist", label: "Waitlist", icon: Users },
  { href: "/admin/opportunities", label: "Opportunities", icon: LayoutDashboard },
  { href: "/admin/ambassadors", label: "Ambassadors", icon: Users },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Mobile bottom tab bar stays at 5 destinations max (PRD §11.1).
const MOBILE_NAV = [
  { href: "/admin/waitlist", label: "Waitlist", icon: Users },
  { href: "/admin/opportunities", label: "Deals", icon: LayoutDashboard },
  { href: "/admin/ambassadors", label: "Ambassadors", icon: Users },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
  { href: "/admin/audit-log", label: "Log", icon: ScrollText },
];

export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="relative min-h-dvh bg-surface-muted md:flex">
      <div aria-hidden className="texture-ledger-contained-dark pointer-events-none absolute inset-0 -z-10" />
      <aside className="relative hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <Link href="/admin" className="flex h-16 items-center px-5">
          <LogoMark wordmark="Syndran Admin" />
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {SIDEBAR_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "sweep sweep-dark bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(240,163,95,0.25)]"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-3 border-t border-border p-3">
          <div className="flex items-center gap-2.5 px-2">
            <UserAvatar email={userEmail} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{userEmail}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Command className="size-3" /> K to search
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>

      {/* Bottom tab bar — mobile (PRD §11.1) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {MOBILE_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1">
        <main className="mx-auto max-w-[1200px] px-5 py-6 pb-24 md:px-8 md:pb-6">{children}</main>
      </div>

      <CommandPalette />
    </div>
  );
}
