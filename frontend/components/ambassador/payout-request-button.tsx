"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmt, type Minor } from "@san/core/money";
import { requestPayoutAction } from "@/app/actions/commission";

export function PayoutRequestButton({ payableMinor }: { payableMinor: number }) {
  const [submitting, setSubmitting] = useState(false);

  const onClick = async () => {
    setSubmitting(true);
    try {
      const result = await requestPayoutAction();
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`Payout requested: ${fmt(result.data.amountMinor as Minor)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button onClick={onClick} loading={submitting} disabled={payableMinor <= 0}>
      <Wallet className="size-4" /> Request payout
    </Button>
  );
}
