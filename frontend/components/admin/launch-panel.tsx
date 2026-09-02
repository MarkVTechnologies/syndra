"use client";

import { useState } from "react";
import { Rocket, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { launchApp } from "@/app/actions/admin-waitlist";
import type { LaunchStatus } from "@/lib/admin/waitlist-queries";

const CONFIRMATION_PHRASE = "LAUNCH SYNDRAN";

export function LaunchPanel({ status }: { status: LaunchStatus }) {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status.appLaunched) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
        <CheckCircle2 className="size-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-semibold text-foreground">Syndran is live</p>
          <p className="text-sm text-muted-foreground">
            {status.convertedCount} account{status.convertedCount === 1 ? "" : "s"} converted from the waitlist.
          </p>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setSubmitting(true);
    const result = await launchApp(phrase);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(`Launched — ${result.data.invited} invite${result.data.invited === 1 ? "" : "s"} sent`);
    setOpen(false);
    setPhrase("");
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-brass/30 bg-brass/10 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Ready to launch</p>
        <p className="text-sm text-muted-foreground">
          {status.pendingCount} waitlist registrant{status.pendingCount === 1 ? "" : "s"} will receive a login link.
          This cannot be undone.
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button type="button" onClick={() => setOpen(true)} className="shrink-0 gap-2">
          <Rocket className="size-4" />
          Launch Syndran
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch Syndran to the waitlist</DialogTitle>
            <DialogDescription>
              This flips the app live and emails every registered waitlist entry a one-time login link. It cannot
              be reversed. Type <span className="font-mono font-semibold text-foreground">{CONFIRMATION_PHRASE}</span>{" "}
              to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder={CONFIRMATION_PHRASE}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={phrase !== CONFIRMATION_PHRASE}
              loading={submitting}
              onClick={handleConfirm}
            >
              Confirm launch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
