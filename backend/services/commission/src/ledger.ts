/**
 * Pure decision logic extracted from the DB-touching parts of the ledger
 * (index.ts), so the RULES are exhaustively unit-testable independent of a
 * live MongoDB replica set. PRD §14 Day 4 Block 7.
 */

export type CommissionState = "pending" | "confirmed" | "payable" | "paid" | "reversed";

/**
 * Which denormalised ambassador.stats bucket a reversal must debit — the
 * SAME bucket the original entry currently sits in, so the reversal nets
 * to zero for that specific commission without ever mutating the original.
 */
export function reversalBucketFor(originalState: CommissionState): "stats.paidMinor" | "stats.pendingMinor" {
  return originalState === "paid" ? "stats.paidMinor" : "stats.pendingMinor";
}

/**
 * Whether a reversal is even legal against a given entry. Only an accrual
 * can be reversed — reversing a reversal (or an adjustment) would make the
 * ledger's meaning ambiguous. PRD §8.3.
 */
export function canReverse(entryType: "accrual" | "reversal" | "adjustment"): boolean {
  return entryType === "accrual";
}

export function isValidReversalReason(reason: string): boolean {
  return reason.trim().length >= 10;
}
