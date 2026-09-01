"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/** Spring-driven bottom sheet — mobile-first overlay for detail/actions. PRD §10.5. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  "glass-panel-dark fixed inset-x-0 bottom-0 z-50 rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] focus:outline-none",
                  "sm:inset-x-auto sm:left-1/2 sm:bottom-8 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-2xl"
                )}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
              >
                <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border sm:hidden" />
                {title && (
                  <DialogPrimitive.Title className="mb-3 text-lg font-semibold text-foreground">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
