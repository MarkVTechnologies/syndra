import { Suspense } from "react";
import { ResetForm } from "./reset-form";
import { LogoMark } from "@/components/brand/logo-mark";

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
