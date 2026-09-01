"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { RequestResetInput } from "@san/core/schemas/auth";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { requestResetAction } from "@/app/actions/auth";

type FormValues = z.infer<typeof RequestResetInput>;

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(RequestResetInput) });

  const onSubmit = async (values: FormValues) => {
    await requestResetAction(values);
    // Identical response whether or not the email exists — no enumeration.
    setSent(true);
  };

  if (sent) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-success/25 bg-success/10 p-6 text-center">
        <Mail className="size-8 text-success" />
        <p className="text-sm font-medium text-foreground">Check your email</p>
        <p className="text-sm text-muted-foreground">
          If an account exists for that address, a reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
      </FormField>
      <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
        Send reset link
      </Button>
    </form>
  );
}
