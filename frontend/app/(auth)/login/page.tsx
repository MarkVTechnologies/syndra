import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/brand/logo-mark";

export default function LoginPage() {
  return (
    <div className="glass-panel-dark rounded-2xl p-8">
      <LogoMark />
      <h1 className="mt-4 text-xl font-semibold text-foreground">Log in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Use the credentials for your admin, ambassador or syndicator account.
      </p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
