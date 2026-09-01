import { bpsOf, type Minor } from "@san/core/money";

export interface CommissionTerms {
  model: "percentage" | "flat";
  valueBps?: number | null;
  valueMinor?: number | null;
}

export interface ConfirmedInvestmentLike {
  amountMinor: number;
  units: number;
}

/**
 * Pure accrual calculation — PRD §8.2. Kept dependency-free (no DB, no I/O)
 * so it can be unit-tested exhaustively, including rounding-boundary cases,
 * before anything is wired to the ledger transaction in Day 4.
 *
 * Worked example: 5 units x N2,000,000 = N10,000,000 = 1_000_000_000 kobo,
 * 500 bps (5%) -> 50_000_000 kobo = N500,000.
 */
export function calcCommission(inv: ConfirmedInvestmentLike, terms: CommissionTerms): Minor {
  const gross =
    terms.model === "percentage"
      ? bpsOf(inv.amountMinor as Minor, terms.valueBps ?? 0)
      : ((terms.valueMinor ?? 0) * inv.units);
  return Math.max(0, gross) as Minor;
}
