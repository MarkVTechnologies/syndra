import { Suspense } from "react";
import { VerifyClient } from "./verify-client";
import { LogoMark } from "@/components/brand/logo-mark";

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
