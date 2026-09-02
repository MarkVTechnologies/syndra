"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, signOut, getSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
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

const NOTICES: Record<string, string> = {
  "session-killed": "That session has been signed out.",
  "link-expired": "That link has expired or was already used.",
  "invalid-link": "That link is invalid.",
  "launch-link-invalid": "That launch link is invalid or has expired. Try logging in directly, or use \"Forgot password?\".",
  "launch-converted": "Your account is live — log in with the password you set on the waitlist.",
};

export function LoginForm({ restrictToRole }: { restrictToRole?: "admin" } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const notice = searchParams.get("notice");
    if (notice && NOTICES[notice]) toast.info(NOTICES[notice]);
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInputType>({
    resolver: zodResolver(LoginInput),
    defaultValues: { email: searchParams.get("email") ?? "", password: "" },
  });

  const onSubmit = async (values: LoginInputType) => {
    setFormError(null);
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      setFormError("Invalid email or password");
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
      setFormError("This login is for administrators only.");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl");
    const fallback = session?.user?.role ? DASHBOARD_PATH[session.user.role] : "/";
    router.push(callbackUrl ?? fallback ?? "/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
      </FormField>
      <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} {...register("password")} />
      </FormField>
      {formError && <p className="text-sm text-danger">{formError}</p>}
      <div className="flex justify-end">
        <Link href="/forgot" className="text-xs font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
        Log in
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
