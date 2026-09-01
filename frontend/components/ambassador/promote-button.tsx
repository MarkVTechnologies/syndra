"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { promoteOpportunityAction, unpromoteOpportunityAction } from "@/app/actions/ambassador";

/**
 * Spring scale + check-mark morph, optimistic state — feels instant
 * regardless of network. PRD §10.5 "Promote toggle".
 */
export function PromoteButton({ opportunityId, initialPromoted }: { opportunityId: string; initialPromoted: boolean }) {
  const [promoted, setPromoted] = useState(initialPromoted);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !promoted;
    setPromoted(next); // optimistic
    startTransition(async () => {
      const result = next
        ? await promoteOpportunityAction(opportunityId)
        : await unpromoteOpportunityAction(opportunityId);
      if (!result.ok) {
        setPromoted(!next); // revert on failure
        toast.error(result.error.message);
      }
    });
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      disabled={isPending}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
        promoted ? "bg-emerald-50 text-emerald-700" : "bg-surface-muted text-muted-foreground hover:bg-border/60"
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isPending ? (
          <motion.span key="loading" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Loader2 className="size-3.5 animate-spin" />
          </motion.span>
        ) : promoted ? (
          <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Check className="size-3.5" />
          </motion.span>
        ) : (
          <motion.span key="plus" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Plus className="size-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
      {promoted ? "Promoted" : "Promote"}
    </motion.button>
  );
}
