import { SignupForm } from "./signup-form";
import { LogoMark } from "@/components/brand/logo-mark";

export default function SignupPage() {
  return (
    <div className="glass-panel-dark rounded-2xl p-8">
      <LogoMark />
      <h1 className="mt-4 text-xl font-semibold text-foreground">Become an ambassador</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your personal deal page goes live the moment you verify your email.
      </p>
      <SignupForm />
    </div>
  );
}
