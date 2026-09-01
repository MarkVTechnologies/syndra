import { Suspense } from "react";
import { VerifyClient } from "./verify-client";
import { LogoMark } from "@/components/brand/logo-mark";

// See (marketing)/page.tsx for why: middleware.ts's nonce-based CSP is
// meaningless (and a latent security no-op) on a statically cached page.
export const dynamic = "force-dynamic";

export default function VerifyPage() {
  return (
    <div className="glass-panel-dark rounded-2xl p-8 text-center">
      <LogoMark className="justify-center" />
      <Suspense fallback={null}>
        <VerifyClient />
      </Suspense>
    </div>
  );
}
