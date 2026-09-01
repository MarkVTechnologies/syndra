"use client";

import { useEffect, useRef } from "react";
import { useSessionId } from "@/lib/use-session-id";
import { recordMicrositeVisit } from "@/app/actions/microsite";

/** Invisible — fires the async, non-blocking visit record on mount. PRD §3.3. */
export function VisitTracker({ ambassadorId, slug }: { ambassadorId: string; slug: string }) {
  const sessionId = useSessionId();
  const fired = useRef(false);

  useEffect(() => {
    if (!sessionId || fired.current) return;
    fired.current = true;
    void recordMicrositeVisit({ ambassadorId, slug, sessionId });
  }, [ambassadorId, slug, sessionId]);

  return null;
}
