"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  OpportunityInput,
  getPublishChecklist,
  type OpportunityInputType,
} from "@san/core/schemas/opportunity";
import { toMinor } from "@san/core/money";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ImageUpload, type UploadedImage } from "@/components/admin/image-upload";
import { NIGERIAN_STATES } from "@san/core/constants";
import { createOpportunityAction, updateOpportunityAction, publishOpportunityAction } from "@/app/actions/opportunities";

const STEPS = ["Basics", "Media", "Pricing", "Review"] as const;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function OpportunityBuilder({
  opportunityId,
  defaultValues,
}: {
  opportunityId?: string;
  defaultValues?: Partial<OpportunityInputType>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [savedId, setSavedId] = useState<string | null>(opportunityId ?? null);
  const [slugTouched, setSlugTouched] = useState(!!defaultValues?.slug);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OpportunityInputType>({
    resolver: zodResolver(OpportunityInput),
    defaultValues: {
      type: "residential",
      media: [],
      documents: [],
      commission: { model: "percentage", coolingDays: 7 },
      featured: false,
      ...defaultValues,
    },
  });

  const values = watch();

  const stepFields: (keyof OpportunityInputType)[][] = [
    ["title", "slug", "summary", "description", "location"],
    ["media"],
    ["pricing", "returns", "commission"],
    [],
  ];

  const goNext = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  /** Returns the opportunity id on success, or null (and toasts) on failure. */
  const saveOpportunity = async (data: OpportunityInputType): Promise<string | null> => {
    if (savedId) {
      const result = await updateOpportunityAction(savedId, data);
      if (!result.ok) {
        toast.error(result.error.message);
        return null;
      }
      return savedId;
    }

    const result = await createOpportunityAction(data);
    if (!result.ok) {
      toast.error(result.error.message);
      return null;
    }
    setSavedId(result.data.id);
    return result.data.id;
  };

  const onSaveDraft = handleSubmit(async (data) => {
    const id = await saveOpportunity(data);
    if (id) toast.success("Saved as draft");
  });

  const onPublish = handleSubmit(async (data) => {
    const id = await saveOpportunity(data);
    if (!id) return;

    const publishResult = await publishOpportunityAction(id);
    if (!publishResult.ok) {
      toast.error(publishResult.error.message);
      return;
    }
    toast.success("Published");
    router.push("/admin/opportunities");
  });

  const checklist = getPublishChecklist({
    media: values.media ?? [],
    commission: values.commission ?? { model: "percentage" },
    pricing: values.pricing ?? { unitPriceMinor: 0, minUnits: 0, maxUnits: 0, totalUnits: 0 },
    summary: values.summary ?? "",
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <Card className="p-6">
        {/* Step progress — PRD §11.1 multi-step flows show a progress indicator */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span className={`hidden text-xs sm:block ${i === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        <form className="flex flex-col gap-5">
          {step === 0 && (
            <>
              <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
                <Input
                  id="title"
                  invalid={!!errors.title}
                  {...register("title", {
                    onChange: (e) => {
                      if (!slugTouched) setValue("slug", slugify(e.target.value));
                    },
                  })}
                />
              </FormField>
              <FormField label="Slug" htmlFor="slug" required error={errors.slug?.message} hint="san.com/opportunities/slug">
                <Input
                  id="slug"
                  className="font-mono"
                  invalid={!!errors.slug}
                  {...register("slug", { onChange: () => setSlugTouched(true) })}
                />
              </FormField>
              <FormField label="Summary" htmlFor="summary" required error={errors.summary?.message} hint="One or two sentences, shown on cards">
                <Textarea id="summary" rows={2} invalid={!!errors.summary} {...register("summary")} />
              </FormField>
              <FormField label="Description" htmlFor="description" error={errors.description?.message}>
                <Textarea id="description" rows={6} {...register("description")} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="City" htmlFor="location.city" required error={errors.location?.city?.message}>
                  <Input id="location.city" invalid={!!errors.location?.city} {...register("location.city")} />
                </FormField>
                <FormField label="State" htmlFor="location.state" required error={errors.location?.state?.message}>
                  <Controller
                    control={control}
                    name="location.state"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="location.state">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIGERIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>
              <FormField label="Type" htmlFor="type">
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="mixed_use">Mixed use</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </>
          )}

          {step === 1 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Images</p>
              <Controller
                control={control}
                name="media"
                render={({ field }) => (
                  <ImageUpload value={(field.value ?? []) as UploadedImage[]} onChange={field.onChange} folder="opportunities" />
                )}
              />
              {errors.media && <p className="mt-2 text-xs text-danger">{errors.media.message as string}</p>}
            </div>
          )}

          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-foreground">Pricing</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Unit price (N)" htmlFor="unitPrice" required error={errors.pricing?.unitPriceMinor?.message}>
                  <Controller
                    control={control}
                    name="pricing.unitPriceMinor"
                    render={({ field }) => (
                      <Input
                        id="unitPrice"
                        type="number"
                        inputMode="numeric"
                        value={field.value ? field.value / 100 : ""}
                        onChange={(e) => field.onChange(toMinor(Number(e.target.value)))}
                      />
                    )}
                  />
                </FormField>
                <FormField label="Total units" htmlFor="totalUnits" required error={errors.pricing?.totalUnits?.message}>
                  <Input id="totalUnits" type="number" inputMode="numeric" {...register("pricing.totalUnits", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Min units per investment" htmlFor="minUnits" required error={errors.pricing?.minUnits?.message}>
                  <Input id="minUnits" type="number" inputMode="numeric" {...register("pricing.minUnits", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Max units per investment" htmlFor="maxUnits" required error={errors.pricing?.maxUnits?.message}>
                  <Input id="maxUnits" type="number" inputMode="numeric" {...register("pricing.maxUnits", { valueAsNumber: true })} />
                </FormField>
              </div>

              <p className="mt-4 text-sm font-semibold text-foreground">Returns</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="ROI %" htmlFor="roiPercent">
                  <Input id="roiPercent" type="number" step="0.1" {...register("returns.roiPercent", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Tenor (months)" htmlFor="tenorMonths">
                  <Input id="tenorMonths" type="number" {...register("returns.tenorMonths", { valueAsNumber: true })} />
                </FormField>
              </div>

              <p className="mt-4 text-sm font-semibold text-foreground">Commission</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Model" htmlFor="commission.model">
                  <Controller
                    control={control}
                    name="commission.model"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="commission.model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="flat">Flat per unit</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                {values.commission?.model === "percentage" ? (
                  <FormField label="Rate %" htmlFor="valueBps">
                    <Controller
                      control={control}
                      name="commission.valueBps"
                      render={({ field }) => (
                        <Input
                          id="valueBps"
                          type="number"
                          step="0.1"
                          value={field.value ? field.value / 100 : ""}
                          onChange={(e) => field.onChange(Math.round(Number(e.target.value) * 100))}
                        />
                      )}
                    />
                  </FormField>
                ) : (
                  <FormField label="Flat amount (N) per unit" htmlFor="valueMinor">
                    <Controller
                      control={control}
                      name="commission.valueMinor"
                      render={({ field }) => (
                        <Input
                          id="valueMinor"
                          type="number"
                          value={field.value ? field.value / 100 : ""}
                          onChange={(e) => field.onChange(toMinor(Number(e.target.value)))}
                        />
                      )}
                    />
                  </FormField>
                )}
              </div>
              <FormField label="Cooling period (days)" htmlFor="coolingDays" hint="Default 7">
                <Input id="coolingDays" type="number" {...register("commission.coolingDays", { valueAsNumber: true })} />
              </FormField>

              <div className="flex items-center gap-2 pt-2">
                <Controller
                  control={control}
                  name="featured"
                  render={({ field }) => (
                    <Checkbox id="featured" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <label htmlFor="featured" className="text-sm text-foreground">Feature on marketplace</label>
              </div>
            </>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground">{values.title || "Untitled opportunity"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{values.summary}</p>
              <div className="mt-4 flex flex-col gap-2">
                {checklist.map((c) => (
                  <div key={c.key} className="flex items-center gap-2 text-sm">
                    <span
                      className={`flex size-5 items-center justify-center rounded-full ${
                        c.met ? "bg-emerald-50 text-emerald-600" : "bg-surface-muted text-muted-foreground"
                      }`}
                    >
                      {c.met && <Check className="size-3" />}
                    </span>
                    <span className={c.met ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onSaveDraft} loading={isSubmitting}>
                Save draft
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  Next <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onPublish}
                  loading={isSubmitting}
                  disabled={checklist.some((c) => !c.met)}
                >
                  Publish
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Live preview of the public card — PRD §14 Day 2 Block 4 */}
      <Card className="h-fit p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Card preview
        </p>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="aspect-video bg-surface-muted">
            {values.media?.[0] && (
              <img src={values.media[0].url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold text-foreground">{values.title || "Untitled opportunity"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {values.location?.city ? `${values.location.city}, ${values.location.state}` : "Location"}
            </p>
            {values.returns?.roiPercent && (
              <p className="mt-2 text-xs font-medium text-brass-600">{values.returns.roiPercent}% ROI</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
