"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fmt, type Minor } from "@san/core/money";
import { markPayoutPaidAction } from "@/app/actions/payouts";
import type { PayoutRow as PayoutRowType } from "@san/service-commission";

const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  paid: "success",
  requested: "warning",
  approved: "warning",
  rejected: "danger",
};

export function PayoutRow({ payout }: { payout: PayoutRowType }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const expected = (payout.amountMinor / 100).toString();

  const confirm = async () => {
    setSubmitting(true);
    try {
      const result = await markPayoutPaidAction(payout.id);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Payout marked paid");
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-foreground">{payout.ambassadorName}</td>
      <td className="px-4 py-3 font-semibold tabular-nums text-money">{fmt(payout.amountMinor as Minor)}</td>
      <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[payout.status] ?? "neutral"}>{payout.status}</Badge></td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(payout.requestedAt).toLocaleDateString("en-NG")}
      </td>
      <td className="px-4 py-3 text-right">
        {payout.status === "requested" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Mark paid
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm payout</DialogTitle>
                <DialogDescription>
                  Type the amount ({expected}) to confirm you paid {payout.ambassadorName} {fmt(payout.amountMinor as Minor)} out-of-band.
                </DialogDescription>
              </DialogHeader>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={expected} />
              <Button
                className="mt-4 w-full"
                disabled={confirmText.trim() !== expected}
                loading={submitting}
                onClick={confirm}
              >
                Confirm payout
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </td>
    </tr>
  );
}
