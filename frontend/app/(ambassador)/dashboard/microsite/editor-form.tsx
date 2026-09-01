"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UpdateMicrositeInput, type UpdateMicrositeInputType } from "@san/core/schemas/ambassador";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { updateMicrositeAction } from "@/app/actions/ambassador";

export function MicrositeEditorForm({
  headline,
  bio,
  whatsapp,
}: {
  headline: string;
  bio: string;
  whatsapp: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMicrositeInputType>({
    resolver: zodResolver(UpdateMicrositeInput),
    defaultValues: { headline, bio, whatsapp },
  });

  const onSubmit = async (values: UpdateMicrositeInputType) => {
    const result = await updateMicrositeAction(values);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Saved");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4" noValidate>
      <FormField label="Headline" htmlFor="headline" required error={errors.headline?.message}>
        <Input id="headline" maxLength={120} invalid={!!errors.headline} {...register("headline")} />
      </FormField>
      <FormField label="Bio" htmlFor="bio" error={errors.bio?.message}>
        <Textarea id="bio" rows={4} maxLength={1000} {...register("bio")} />
      </FormField>
      <FormField label="WhatsApp number" htmlFor="whatsapp" required error={errors.whatsapp?.message}>
        <Input id="whatsapp" type="tel" invalid={!!errors.whatsapp} {...register("whatsapp")} />
      </FormField>
      <Button type="submit" loading={isSubmitting} className="self-start">
        Save changes
      </Button>
    </form>
  );
}
