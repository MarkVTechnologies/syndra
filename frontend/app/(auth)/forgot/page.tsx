import { ForgotForm } from "./forgot-form";
import { LogoMark } from "@/components/brand/logo-mark";

export default function ForgotPasswordPage() {
  return (
    <div className="glass-panel-dark rounded-2xl p-8">
      <LogoMark />
      <h1 className="mt-4 text-xl font-semibold text-foreground">Reset your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send a reset link.
      </p>
      <ForgotForm />
    </div>
  );
}
