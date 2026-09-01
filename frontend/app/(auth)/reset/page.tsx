import { Suspense } from "react";
import { ResetForm } from "./reset-form";
import { LogoMark } from "@/components/brand/logo-mark";

// See (marketing)/page.tsx for why: middleware.ts's nonce-based CSP is
// meaningless (and a latent security no-op) on a statically cached page.
export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <div className="glass-panel-dark rounded-2xl p-8">
      <LogoMark />
      <h1 className="mt-4 text-xl font-semibold text-foreground">Set a new password</h1>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
