"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { resetPasswordAction } from "@/app/actions/auth";

const FormSchema = z.object({
  password: z.string().min(10, "Minimum 10 characters"),
});
type FormValues = z.infer<typeof FormSchema>;

export function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  const onSubmit = async (values: FormValues) => {
    const result = await resetPasswordAction({ token, password: values.password });
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  if (!token) {
    return <p className="mt-4 text-sm text-danger">Missing reset token. Request a new link.</p>;
  }

  if (done) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="size-8 text-success" />
        <p className="text-sm font-medium text-foreground">Password updated</p>
        <p className="text-sm text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
      <FormField label="New password" htmlFor="password" required error={errors.password?.message} hint="Minimum 10 characters">
        <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
      </FormField>
      <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
        Update password
      </Button>
    </form>
  );
}
