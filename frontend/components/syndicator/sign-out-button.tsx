"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" /> Log out
    </button>
  );
}
