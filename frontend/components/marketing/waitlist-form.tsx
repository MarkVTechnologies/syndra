"use client";

import { forwardRef, useState, useCallback, useRef, type ElementType, type ComponentPropsWithoutRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTurnstileSiteKey } from "@/lib/use-turnstile-site-key";
import {
  Check,
  X,
  Loader2,
  Copy,
  Share2,
  User,
  Mail,
  Phone as PhoneIcon,
  MapPin,
  Lock,
  Sparkles,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { registerAmbassadorAction } from "@/app/actions/waitlist";
import { NIGERIAN_STATES, EXPERIENCE_BANDS } from "@san/core/schemas/waitlist";
import { useDebouncedSlugCheck } from "./use-slug-check";

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

/**
 * Leading-icon wrapper for Input — a shared component with no icon slot of
 * its own. Must forward its ref through to the underlying <input> or
 * react-hook-form's register() ref silently fails to attach (a plain
 * function component drops refs passed via JSX).
 */
const IconInput = forwardRef<
  HTMLInputElement,
  { icon: ElementType } & ComponentPropsWithoutRef<typeof Input>
>(({ icon: Icon, className, ...props }, ref) => (
  <div className="relative">
    <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
    <Input ref={ref} className={`pl-10 ${className ?? ""}`} {...props} />
  </div>
));
IconInput.displayName = "IconInput";

export function WaitlistForm() {
  const [success, setSuccess] = useState<{
    position: number;
    reservedSlug: string;
    shareUrl: string;
  } | null>(null);
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

  const desiredSlug = watch("desiredSlug");
  const sameAsPhone = watch("sameAsPhone");
  const slugStatus = useDebouncedSlugCheck(desiredSlug);

  const onSubmit = useCallback(
    async (values: FormValues) => {
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

      setSuccess(result.data);
    },
    []
  );

  return (
    <section id="waitlist-form" className="relative scroll-mt-8 overflow-hidden bg-background py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 50% 0%, var(--estate-amber-100), transparent 65%), radial-gradient(420px circle at 100% 100%, var(--estate-cream-200), transparent 60%)",
        }}
      />
      <Container className="relative max-w-[560px]">
        <AnimatePresence mode="wait">
          {success ? (
            <SuccessPanel key="success" {...success} />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel-dark rounded-3xl p-6 sm:p-9"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--estate-rust-700)]">
                <Sparkles className="size-3.5" strokeWidth={2} />
                Ambassador waitlist
              </div>
              <h2 className="mt-2 font-display text-[clamp(1.5rem,2.5vw+1rem,2rem)] font-bold tracking-[-0.01em] text-foreground">
                Join the ambassador waitlist
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Takes under 90 seconds. Your reserved microsite goes live at launch.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5" noValidate>
                {/* Honeypot — hidden from real users, bots fill every field */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  {...register("honeypot")}
                />

                <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
                  <IconInput icon={User} id="fullName" autoComplete="name" invalid={!!errors.fullName} {...register("fullName")} />
                </FormField>

                <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
                  <IconInput icon={Mail} id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register("email")} />
                </FormField>

                <FormField label="Phone" htmlFor="phone" required error={errors.phone?.message}>
                  <IconInput
                    icon={PhoneIcon}
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+234 801 234 5678"
                    invalid={!!errors.phone}
                    {...register("phone")}
                  />
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
                    <IconInput icon={PhoneIcon} id="whatsapp" type="tel" inputMode="tel" invalid={!!errors.whatsapp} {...register("whatsapp")} />
                  </FormField>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="City" htmlFor="city" required error={errors.city?.message}>
                    <IconInput icon={MapPin} id="city" autoComplete="address-level2" invalid={!!errors.city} {...register("city")} />
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
                  hint={desiredSlug ? undefined : "This becomes san.com/yourname"}
                >
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
                    <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      san.com/
                    </span>
                    <Input
                      id="desiredSlug"
                      className="pl-[104px] pr-9 font-mono"
                      invalid={!!errors.desiredSlug}
                      {...register("desiredSlug")}
                    />
                    <SlugStatusIcon status={slugStatus} />
                  </div>
                </FormField>

                <FormField label="Password" htmlFor="password" required error={errors.password?.message} hint="Minimum 10 characters — this becomes your login at launch">
                  <IconInput icon={Lock} id="password" type="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
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
                    <Link href="/legal/privacy" className="text-primary underline">Privacy Policy</Link>, and consent to be contacted by email.
                  </label>
                </div>
                {errors.consent && <p className="text-xs text-danger">{errors.consent.message}</p>}

                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  options={{ size: "invisible" }}
                />

                <Button type="submit" size="lg" loading={isSubmitting} className="sweep relative mt-2 w-full overflow-hidden">
                  {isSubmitting ? "Submitting" : "Join the waitlist"}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
}

function SlugStatusIcon({ status }: { status: "idle" | "checking" | "available" | "taken" }) {
  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2">
      <AnimatePresence mode="wait">
        {status === "checking" && (
          <motion.span key="checking" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </motion.span>
        )}
        {status === "available" && (
          <motion.span key="available" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Check className="size-4 text-success" />
          </motion.span>
        )}
        {status === "taken" && (
          <motion.span key="taken" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <X className="size-4 text-danger" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function SuccessPanel({
  position,
  reservedSlug,
  shareUrl,
}: {
  position: number;
  reservedSlug: string;
  shareUrl: string;
}) {
  const fullShareUrl = typeof window !== "undefined" ? `${window.location.origin}${shareUrl}` : shareUrl;

  const copy = () => {
    navigator.clipboard.writeText(fullShareUrl);
    toast.success("Link copied");
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Join me on SAN", url: fullShareUrl }).catch(() => {});
    } else {
      copy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-dark rounded-3xl p-8 text-center"
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--estate-amber-500)] to-[var(--estate-rust-700)] shadow-[0_8px_24px_-6px_rgba(192,88,0,0.55)]">
        <Check className="size-7 text-[var(--estate-cream-50)]" strokeWidth={2.5} />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold text-foreground">You&apos;re on the list</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        You&apos;re number <span className="font-semibold text-foreground tabular-nums">{position}</span> in line.
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--estate-amber-100)] px-4 py-3 text-left">
        <Link2 className="size-4 shrink-0 text-[var(--estate-rust-700)]" strokeWidth={1.75} />
        <div>
          <p className="text-xs text-muted-foreground">Your reserved microsite</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-[var(--estate-rust-700)]">san.com/{reservedSlug}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={copy}>
          <Copy className="size-4" /> Copy link
        </Button>
        <Button className="sweep relative flex-1 overflow-hidden" onClick={share}>
          <Share2 className="size-4" /> Share
        </Button>
      </div>
    </motion.div>
  );
}
