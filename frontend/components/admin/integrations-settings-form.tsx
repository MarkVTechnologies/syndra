"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateIntegrationSettingsAction } from "@/app/actions/settings";
import type { IntegrationFieldStatus, IntegrationStatus, IntegrationUpdateInput } from "@san/service-settings";

type FieldKey = keyof IntegrationUpdateInput;

interface FieldConfig {
  key: FieldKey;
  label: string;
  secret: boolean;
  hint?: string;
}

interface SectionConfig {
  title: string;
  description: string;
  fields: FieldConfig[];
}

const SECTIONS: SectionConfig[] = [
  {
    title: "Email (Resend)",
    description: "Outbound transactional email — verification links, payout notices, digests.",
    fields: [
      { key: "resendApiKey", label: "API key", secret: true },
      { key: "resendWebhookSecret", label: "Webhook signing secret", secret: true },
      { key: "emailFrom", label: "From address", secret: false, hint: "e.g. SAN <hello@sanhq.com>" },
      { key: "emailReplyTo", label: "Reply-to address", secret: false },
    ],
  },
  {
    title: "Cloudinary",
    description: "Image uploads for opportunity listings and ambassador profiles.",
    fields: [
      { key: "cloudinaryCloudName", label: "Cloud name", secret: false },
      { key: "cloudinaryApiKey", label: "API key", secret: true },
      { key: "cloudinaryApiSecret", label: "API secret", secret: true },
    ],
  },
  {
    title: "Paystack",
    description: "Investment checkout and payout verification.",
    fields: [
      { key: "paystackSecretKey", label: "Secret key", secret: true },
      { key: "paystackWebhookSecret", label: "Webhook secret", secret: true },
    ],
  },
  {
    title: "Cloudflare Turnstile",
    description: "Bot protection on signup, join, and waitlist forms.",
    fields: [
      { key: "turnstileSiteKey", label: "Site key", secret: false, hint: "Public — safe to expose client-side" },
      { key: "turnstileSecretKey", label: "Secret key", secret: true },
    ],
  },
];

function SourceBadge({ status }: { status: IntegrationFieldStatus }) {
  if (status.source === "unset") return <Badge variant="warning">Not set</Badge>;
  if (status.source === "database") return <Badge variant="success">Database</Badge>;
  return <Badge variant="neutral">Environment</Badge>;
}

export function IntegrationsSettingsForm({ status }: { status: IntegrationStatus }) {
  const router = useRouter();
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (key: FieldKey, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only send fields the admin actually typed something into — an
    // untouched field must never be sent as "", since that would overwrite
    // a plain-text value (like emailFrom) with a blank one server-side.
    const payload: IntegrationUpdateInput = {};
    for (const [key, value] of Object.entries(values)) {
      if (value.trim() !== "") payload[key as FieldKey] = value;
    }

    if (Object.keys(payload).length === 0) {
      toast.error("Nothing to save — enter a value first");
      return;
    }

    setSubmitting(true);
    const result = await updateIntegrationSettingsAction(payload);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    toast.success(`Updated ${result.data.updatedFields.length} credential${result.data.updatedFields.length === 1 ? "" : "s"}`);
    setValues({});
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted-foreground">
        A value entered here overrides the matching <code className="font-mono text-xs">.env</code> variable
        immediately, for every environment reading it. Leave a field blank to keep its current value — saving never
        clears a credential you didn&apos;t type into.
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {section.fields.map((field) => {
              const fieldStatus = status[field.key];
              return (
                <FormField
                  key={field.key}
                  label={field.label}
                  htmlFor={field.key}
                  hint={field.hint}
                >
                  <div className="flex items-center gap-2">
                    {field.secret ? (
                      <PasswordInput
                        id={field.key}
                        autoComplete="off"
                        placeholder={fieldStatus.masked ?? "Not set"}
                        value={values[field.key] ?? ""}
                        onChange={(e) => setField(field.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        type="text"
                        autoComplete="off"
                        placeholder={fieldStatus.masked ?? "Not set"}
                        value={values[field.key] ?? ""}
                        onChange={(e) => setField(field.key, e.target.value)}
                      />
                    )}
                    <SourceBadge status={fieldStatus} />
                  </div>
                </FormField>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted-foreground">
        Kept environment-only for safety and architectural reasons — not manageable here: database connection
        string, session auth secret, encryption key, Redis credentials, background-job (Inngest) keys, and the
        referral attribution secret.
      </div>

      <CardFooter className="justify-end gap-2 px-0">
        <Button type="submit" loading={submitting}>
          Save changes
        </Button>
      </CardFooter>
    </form>
  );
}
