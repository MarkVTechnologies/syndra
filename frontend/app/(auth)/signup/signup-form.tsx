"use client";

import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTurnstileSiteKey } from "@/lib/use-turnstile-site-key";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { NIGERIAN_STATES, EXPERIENCE_BANDS } from "@san/core/schemas/waitlist";
import { registerAmbassadorAction } from "@/app/actions/auth";

const FormSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80).regex(/^[a-zA-Z\s'-]+$/),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().min(10, "Enter a valid phone number"),
    sameAsPhone: z.boolean(),
    whatsapp: z.string().optional(),
    city: z.string().trim().min(2),
    state: z.string().min(1, "Select a state"),
    yearsExperience: z.string().min(1, "Select an option"),
    desiredSlug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]{3,30}$/, "3-30 chars: lowercase letters, numbers, hyphens"),
    password: z.string().min(10, "Minimum 10 characters"),
    consent: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
    honeypot: z.string().max(0).optional(),
  })
  .refine((v) => v.sameAsPhone || (v.whatsapp && v.whatsapp.length >= 10), {
    message: "Enter a WhatsApp number",
    path: ["whatsapp"],
  });

type FormValues = z.infer<typeof FormSchema>;

function toNigerianPhone(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `+234${digits}`;
}

export function SignupForm() {
  const [submitted, setSubmitted] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const turnstileSiteKey = useTurnstileSiteKey();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { sameAsPhone: true, consent: undefined as unknown as true, honeypot: "" },
  });

  const sameAsPhone = watch("sameAsPhone");

  const onSubmit = async (values: FormValues) => {
    const token = turnstileRef.current?.getResponse();
    if (!token) {
      toast.error("Please complete the verification challenge");
      return;
    }

    const result = await registerAmbassadorAction({
      ...values,
      phone: toNigerianPhone(values.phone),
      whatsapp: values.sameAsPhone ? toNigerianPhone(values.phone) : toNigerianPhone(values.whatsapp ?? ""),
      turnstileToken: token,
    });

    if (!result.ok) {
      toast.error(result.error.message);
      turnstileRef.current?.reset();
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-success/25 bg-success/10 p-6 text-center">
        <Mail className="size-8 text-success" />
        <p className="text-sm font-medium text-foreground">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a verification link. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        {...register("honeypot")}
      />

      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" invalid={!!errors.fullName} {...register("fullName")} />
      </FormField>

      <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
      </FormField>

      <FormField label="Phone" htmlFor="phone" required error={errors.phone?.message}>
        <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+234 801 234 5678" invalid={!!errors.phone} {...register("phone")} />
      </FormField>

      <div className="flex items-center gap-2">
        <Controller
          control={control}
          name="sameAsPhone"
          render={({ field }) => (
            <Checkbox id="sameAsPhone" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <label htmlFor="sameAsPhone" className="text-sm text-foreground">
          WhatsApp number is the same as my phone number
        </label>
      </div>

      {!sameAsPhone && (
        <FormField label="WhatsApp number" htmlFor="whatsapp" required error={errors.whatsapp?.message}>
          <Input id="whatsapp" type="tel" inputMode="tel" invalid={!!errors.whatsapp} {...register("whatsapp")} />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="City" htmlFor="city" required error={errors.city?.message}>
          <Input id="city" autoComplete="address-level2" invalid={!!errors.city} {...register("city")} />
        </FormField>

        <FormField label="State" htmlFor="state" required error={errors.state?.message}>
          <Controller
            control={control}
            name="state"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <FormField label="Years in real estate" htmlFor="yearsExperience" required error={errors.yearsExperience?.message}>
        <Controller
          control={control}
          name="yearsExperience"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="yearsExperience">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_BANDS.map((band) => (
                  <SelectItem key={band} value={band}>
                    {band} years
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField
        label="Desired page name"
        htmlFor="desiredSlug"
        required
        error={errors.desiredSlug?.message}
        hint="This becomes san.com/yourname"
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            san.com/
          </span>
          <Input id="desiredSlug" className="pl-[68px] font-mono" invalid={!!errors.desiredSlug} {...register("desiredSlug")} />
        </div>
      </FormField>

      <FormField label="Password" htmlFor="password" required error={errors.password?.message} hint="Minimum 10 characters">
        <Input id="password" type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
      </FormField>

      <div className="flex items-start gap-2">
        <Controller
          control={control}
          name="consent"
          render={({ field }) => (
            <Checkbox
              id="consent"
              checked={field.value === true}
              onCheckedChange={(v) => field.onChange(v === true)}
              className="mt-0.5"
            />
          )}
        />
        <label htmlFor="consent" className="text-sm text-muted-foreground">
          I agree to the{" "}
          <Link href="/legal/terms" className="text-primary underline">Terms</Link> and{" "}
          <Link href="/legal/privacy" className="text-primary underline">Privacy Policy</Link>.
        </label>
      </div>
      {errors.consent && <p className="text-xs text-danger">{errors.consent.message}</p>}

      <Turnstile
        ref={turnstileRef}
        siteKey={turnstileSiteKey}
        options={{ size: "invisible" }}
      />

      <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
        Create account
      </Button>
    </form>
  );
}
