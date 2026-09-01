"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronRight, Camera, Copy, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { ImageUpload, type UploadedImage } from "@/components/admin/image-upload";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";
import { updateMicrositeAction, promoteOpportunityAction } from "@/app/actions/ambassador";

interface OpportunityOption {
  id: string;
  title: string;
  summary: string;
  city: string;
  state: string;
  coverImage: string | null;
}

const STEPS = ["Photo", "Profile", "WhatsApp", "Promote"] as const;

export function OnboardingWizard({
  slug,
  whatsapp,
  opportunities,
}: {
  slug: string;
  whatsapp: string;
  opportunities: OpportunityOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState<UploadedImage[]>([]);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [whatsappConfirm, setWhatsappConfirm] = useState(whatsapp);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const toggleOpportunity = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const finish = async () => {
    if (selected.size === 0) {
      toast.error("Pick at least one opportunity to promote");
      return;
    }
    setSubmitting(true);
    try {
      const profileResult = await updateMicrositeAction({
        headline,
        bio,
        whatsapp: whatsappConfirm,
        avatarUrl: avatar[0]?.url ?? null,
      });
      if (!profileResult.ok) {
        toast.error(profileResult.error.message);
        return;
      }
      await Promise.all(Array.from(selected).map((id) => promoteOpportunityAction(id)));
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const url = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`;
    return (
      <div className="relative mt-8 overflow-hidden rounded-2xl border border-amber-80 bg-surface p-8 text-center shadow-[var(--san-e3)]">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-40 to-rust-20 shadow-[0_4px_20px_rgba(192,88,0,0.4)]">
          <Check className="size-8 text-white" strokeWidth={2.5} />
          <svg viewBox="0 0 20 20" aria-hidden className="absolute -right-3 -top-3 size-5 text-amber-50">
            <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" fill="currentColor" />
          </svg>
          <svg viewBox="0 0 20 20" aria-hidden className="absolute -bottom-2 -left-4 size-3 text-amber-60">
            <circle cx="10" cy="10" r="10" fill="currentColor" />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-foreground">Your microsite is live</h2>
        <p className="mt-1 text-sm text-muted-foreground">Share it anywhere — it&apos;s yours from now on.</p>
        <div className="mt-4 rounded-lg bg-brass-100 px-4 py-3">
          <p className="font-mono text-sm font-semibold text-brass-600">san.com/{slug}</p>
        </div>
        <div className="mt-6 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success("Copied");
            }}
          >
            <Copy className="size-4" /> Copy link
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigator.share?.({ title: "My SAN microsite", url }).catch(() => {})}
          >
            <Share2 className="size-4" /> Share
          </Button>
        </div>
        <Button variant="ghost" className="mt-3 w-full" onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 ${
                i <= step
                  ? "bg-gradient-to-br from-amber-40 to-rust-20 text-white shadow-[0_2px_8px_rgba(192,88,0,0.35)]"
                  : "bg-surface-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 bg-border">
                <div
                  className="h-px bg-gradient-to-r from-amber-40 to-rust-20 transition-all duration-300"
                  style={{ width: i < step ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--san-e1)]">
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add a profile photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Investors trust a face. Optional but recommended.</p>
            <div className="mt-4 flex justify-center">
              <div className="w-32">
                <ImageUpload value={avatar} onChange={setAvatar} folder="avatars" max={1} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">Tell investors about you</h2>
            <FormField label="Headline" htmlFor="headline" required hint="e.g. Lagos real estate specialist, 5+ years">
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120} />
            </FormField>
            <FormField label="Bio" htmlFor="bio">
              <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">Confirm your WhatsApp number</h2>
            <p className="text-sm text-muted-foreground">
              Investors will message you here from your microsite.
            </p>
            <FormField label="WhatsApp number" htmlFor="whatsapp" required>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsappConfirm}
                onChange={(e) => setWhatsappConfirm(e.target.value)}
              />
            </FormField>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Pick your first opportunities</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose at least one to promote on your microsite.</p>
            <div className="mt-4 flex flex-col gap-2">
              {opportunities.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
                  <EmptyStateIllustration className="h-20 w-24" />
                  <p className="text-sm text-muted-foreground">No published opportunities yet — check back soon.</p>
                </div>
              )}
              {opportunities.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleOpportunity(o.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selected.has(o.id) ? "border-primary bg-emerald-50" : "border-border hover:bg-surface-muted"
                  }`}
                >
                  <div className="size-12 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                    {o.coverImage && (
                      <img src={o.coverImage} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.city}, {o.state}</p>
                  </div>
                  {selected.has(o.id) && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !headline.trim()}>
              Next <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={finish} loading={submitting}>
              Finish <Camera className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
