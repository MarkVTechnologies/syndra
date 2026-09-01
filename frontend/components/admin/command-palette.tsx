"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Users, LayoutDashboard, ScrollText, Wallet, Plus, Search, BarChart3 } from "lucide-react";

const ITEMS = [
  { label: "Overview", href: "/admin", icon: BarChart3 },
  { label: "Waitlist", href: "/admin/waitlist", icon: Users },
  { label: "Opportunities", href: "/admin/opportunities", icon: LayoutDashboard },
  { label: "New opportunity", href: "/admin/opportunities/new", icon: Plus },
  { label: "Ambassadors", href: "/admin/ambassadors", icon: Users },
  { label: "Payouts", href: "/admin/payouts", icon: Wallet },
  { label: "Audit log", href: "/admin/audit-log", icon: ScrollText },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      <Command
        className="glass-panel-dark w-full max-w-lg overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <Command.Input
            autoFocus
            placeholder="Jump to..."
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results.
          </Command.Empty>
          {ITEMS.map((item) => (
            <Command.Item
              key={item.href}
              value={item.label}
              onSelect={() => {
                router.push(item.href);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground data-[selected=true]:bg-surface-muted"
            >
              <item.icon className="size-4 text-muted-foreground" />
              {item.label}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
