"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changeSlugAction } from "@/app/actions/ambassador";

export function SlugChangeForm({ currentSlug }: { currentSlug: string }) {
  const router = useRouter();
  const [slug, setSlug] = useState(currentSlug);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slug === currentSlug) return;
    setSubmitting(true);
    const result = await changeSlugAction(slug);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Page name updated");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="mt-3 flex gap-2">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          syndran.com/
        </span>
        <Input
          className="pl-[96px] font-mono"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
        />
      </div>
      <Button type="submit" loading={submitting} disabled={slug === currentSlug}>
        Update
      </Button>
    </form>
  );
}
