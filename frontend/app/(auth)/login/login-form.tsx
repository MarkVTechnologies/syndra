"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, signOut, getSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { LoginInput, type LoginInputType } from "@san/core/schemas/auth";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

const DASHBOARD_PATH: Record<string, string> = {
  admin: "/admin",
  ambassador: "/dashboard",
  syndicator: "/portfolio",
};

const DASHBOARD_LABEL: Record<string, string> = {
  admin: "admin console",
  ambassador: "dashboard",
  syndicator: "portfolio",
};

const NOTICES: Record<string, string> = {
  "session-killed": "That session has been signed out.",
  "link-expired": "That link has expired or was already used.",
  "invalid-link": "That link is invalid.",
  "launch-link-invalid": "That launch link is invalid or has expired. Try logging in directly, or use \"Forgot password?\".",
  "launch-converted": "Your account is live — log in with the password you set on the waitlist.",
};

// A single discriminated banner (rather than separate formError/status
// booleans) so AnimatePresence always has exactly one child to diff
// against — two independent pieces of state flipping in the same commit
// (e.g. clearing an error while also entering "authenticating") let a
// stray exit animation get orphaned mid-transition, frozen at whatever
// opacity/offset it had reached, confirmed live in a dev server.
type LoginBanner =
  | { kind: "idle" }
  | { kind: "authenticating" }
  | { kind: "success"; destination: string }
  | { kind: "error"; message: string };

export function LoginForm({ restrictToRole }: { restrictToRole?: "admin" } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [banner, setBanner] = useState<LoginBanner>({ kind: "idle" });
  // A ref guard, not state — state updates from a fast double-click can
  // land after the second submit has already started, since the button's
  // own disabled state only takes effect on the next render. This is
  // synchronous and closes that race outright.
  const submittingRef = useRef(false);

  useEffect(() => {
    const notice = searchParams.get("notice");
    if (notice && NOTICES[notice]) toast.info(NOTICES[notice]);
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputType>({
    resolver: zodResolver(LoginInput),
    defaultValues: { email: searchParams.get("email") ?? "", password: "" },
  });

  const onSubmit = async (values: LoginInputType) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      setBanner({ kind: "authenticating" });
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      if (result?.error) {
        setBanner({ kind: "error", message: "Invalid email or password" });
        return;
      }

      const session = await getSession();

      // Admin-only entry point (/admin/login): a real ambassador/syndicator
      // account can authenticate fine (their credentials are valid), but this
      // page must not hand them an admin-flavored session. Sign back out
      // immediately rather than routing them anywhere — there's no partial
      // "logged in but wrong page" state to leave dangling.
      if (restrictToRole && session?.user?.role !== restrictToRole) {
        await signOut({ redirect: false });
        setBanner({ kind: "error", message: "This login is for administrators only." });
        return;
      }

      // Login can take longer than it looks like it should (a cold
      // serverless function, a slow downstream call) — the banner above is
      // what keeps that wait from reading as "the page is just stuck," and
      // this is the one moment worth naming the actual destination rather
      // than a generic "redirecting."
      const destination = (session?.user?.role && DASHBOARD_LABEL[session.user.role]) || "dashboard";
      setBanner({ kind: "success", destination });

      const callbackUrl = searchParams.get("callbackUrl");
      const fallback = session?.user?.role ? DASHBOARD_PATH[session.user.role] : "/";
      router.push(callbackUrl ?? fallback ?? "/");
      router.refresh();
    } finally {
      submittingRef.current = false;
    }
  };

  const busy = banner.kind === "authenticating" || banner.kind === "success";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} {...register("password")} />
      </FormField>
      <AnimatePresence mode="wait">
        {banner.kind !== "idle" && (
          <motion.div
            key={banner.kind}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className={
              banner.kind === "error"
                ? "text-sm text-danger"
                : banner.kind === "success"
                  ? "flex items-center gap-2 rounded-lg bg-success/10 px-3.5 py-2.5 text-sm font-medium text-success"
                  : "flex items-center gap-2 rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm text-muted-foreground"
            }
          >
            {banner.kind === "authenticating" && (
              <>
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                Signing you in — this can take a few seconds…
              </>
            )}
            {banner.kind === "success" && (
              <>
                <CheckCircle2 className="size-4 shrink-0" />
                You&apos;re in! Taking you to your {banner.destination}…
              </>
            )}
            {banner.kind === "error" && banner.message}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-end">
        <Link href="/forgot" className="text-xs font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={banner.kind === "authenticating"} disabled={busy} className="mt-2 w-full">
        {banner.kind === "success" ? (
          <>
            <CheckCircle2 className="size-4" />
            Success
          </>
        ) : (
          "Log in"
        )}
      </Button>
      {!restrictToRole && (
        <p className="text-center text-sm text-muted-foreground">
          New ambassador?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      )}
    </form>
  );
}
