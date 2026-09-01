"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, CreditCard, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/ui/card";
import { fmt, type Minor } from "@san/core/money";
import { commitInvestmentAction, initiatePaymentAction } from "@/app/actions/investment";

const STEPS = ["Units", "Summary", "Payment"] as const;

export function CommitFlow({
  opportunityId,
  opportunityTitle,
  unitPriceMinor,
  minUnits,
  maxUnits,
  remaining,
}: {
  opportunityId: string;
  opportunityTitle: string;
  unitPriceMinor: number;
  minUnits: number;
  maxUnits: number;
  remaining: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState(minUnits);
  const [submitting, setSubmitting] = useState(false);
  const [bankDetails, setBankDetails] = useState<{ accountName: string; note: string } | null>(null);

  if (remaining < minUnits) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        This opportunity is fully allocated.
      </div>
    );
  }

  const amountMinor = units * unitPriceMinor;

  const goNext = () => {
    if (step === 0 && (units < minUnits || units > maxUnits)) {
      toast.error(`Enter between ${minUnits} and ${maxUnits} units`);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const pay = async (channel: "card" | "transfer") => {
    setSubmitting(true);
    try {
      const commitResult = await commitInvestmentAction({ opportunityId, units, channel });
      if (!commitResult.ok) {
        toast.error(commitResult.error.message);
        return;
      }

      const paymentResult = await initiatePaymentAction(commitResult.data.id, channel);
      if (!paymentResult.ok) {
        toast.error(paymentResult.error.message);
        return;
      }

      if (paymentResult.data.redirectUrl) {
        window.location.href = paymentResult.data.redirectUrl;
        return;
      }
      if (paymentResult.data.bankTransfer) {
        setBankDetails(paymentResult.data.bankTransfer);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (bankDetails) {
    return (
      <Card className="p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-40 to-rust-20">
          <Landmark className="size-6 text-white" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Complete via bank transfer</h3>
        <p className="mt-2 text-sm text-muted-foreground">{bankDetails.accountName}</p>
        <p className="mt-1 font-mono text-sm text-foreground">{bankDetails.note}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Your investment will confirm once the admin team verifies your transfer.
        </p>
        <Button className="mt-4" onClick={() => router.push("/portfolio")}>
          Go to portfolio
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
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
            <span className={`hidden text-xs sm:block ${i === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <FormField label="Units" htmlFor="units" hint={`Between ${minUnits} and ${maxUnits} units — ${fmt(unitPriceMinor as Minor)} each`}>
          <Input
            id="units"
            type="number"
            inputMode="numeric"
            min={minUnits}
            max={maxUnits}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
          />
        </FormField>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <Row label="Opportunity" value={opportunityTitle} />
          <Row label="Units" value={String(units)} />
          <Row label="Unit price" value={fmt(unitPriceMinor as Minor)} />
          <div className="mt-2 border-t border-border pt-3">
            <Row label="Total" value={fmt(amountMinor as Minor)} bold />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => pay("card")}
            disabled={submitting}
            className="flex items-center gap-3 rounded-lg border border-border p-4 text-left hover:bg-surface-muted disabled:opacity-50"
          >
            <CreditCard className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Pay with card</p>
              <p className="text-xs text-muted-foreground">Instant confirmation via Paystack</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => pay("transfer")}
            disabled={submitting}
            className="flex items-center gap-3 rounded-lg border border-border p-4 text-left hover:bg-surface-muted disabled:opacity-50"
          >
            <Landmark className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Pay by bank transfer</p>
              <p className="text-xs text-muted-foreground">Confirmed manually by the admin team</p>
            </div>
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="size-4" /> Back
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 && (
          <Button onClick={goNext}>Continue</Button>
        )}
      </div>
    </Card>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "text-lg font-bold text-foreground" : "font-medium text-foreground"}>{value}</span>
    </div>
  );
}
