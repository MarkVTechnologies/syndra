"use client";

import { useEffect, useState } from "react";

export type SlugStatus = "idle" | "checking" | "available" | "taken";

/** Live availability check with a 300ms debounce. PRD §10.5. */
export function useDebouncedSlugCheck(slug: string | undefined): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>("idle");

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug-check?slug=${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { available: boolean };
        setStatus(data.available ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [slug]);

  return status;
}
