import { Suspense } from "react";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { LogoMark } from "@/components/brand/logo-mark";
import { LineArt } from "@/components/decor/line-art";

// See (marketing)/page.tsx for why: middleware.ts's nonce-based CSP is
// meaningless (and a latent security no-op) on a statically cached page.
export const dynamic = "force-dynamic";

/**
 * Served at the public URL /admin/login via a next.config.ts rewrite — it
 * lives here, outside app/(admin)/admin/, specifically so it does NOT
 * inherit that segment's layout.tsx (which redirects any unauthenticated
 * visitor straight to /login, which would make an admin-only login page
 * unreachable). middleware.ts excludes the literal /admin/login path from
 * its RBAC gate for the same reason.
 */
export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 15% 15%, rgba(192,88,0,0.28), transparent 60%), radial-gradient(520px circle at 85% 85%, rgba(113,54,0,0.3), transparent 60%)",
        }}
      />
      <LineArt variant="blueprint-corner" position="top-left" className="text-[var(--estate-amber-300)]" />
      <LineArt variant="blueprint-corner" position="bottom-right" className="text-[var(--estate-amber-300)]" />
      <div aria-hidden className="texture-ledger-contained-dark pointer-events-none absolute inset-0" />

      <div className="glass-panel-dark relative w-full max-w-[400px] rounded-2xl p-8">
        <LogoMark wordmark="SAN Admin" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restricted to administrator accounts.
        </p>
        <Suspense fallback={null}>
          <LoginForm restrictToRole="admin" />
        </Suspense>
      </div>
    </div>
  );
}
