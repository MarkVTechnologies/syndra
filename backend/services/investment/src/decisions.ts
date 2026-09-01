/**
 * Pure decision logic extracted from the DB-touching parts of the
 * investment service, so the RULES are exhaustively unit-testable
 * independent of a live MongoDB replica set. PRD §14 Day 4 Block 7.
 */

export type InvestmentPaymentState =
  | "pending"
  | "awaiting_payment"
  | "awaiting_confirmation"
  | "confirmed"
  | "cancelled"
  | "refunded";

export type ConfirmDecision = "process" | "already_confirmed" | "unexpected_state";

/**
 * Given the investment's CURRENT status when a charge.success webhook
 * arrives, decide what confirm() should do. A webhook replayed ten times
 * must produce the same decision every time after the first: "already
 * confirmed", never a second write. PRD §8.4.
 */
export function decideConfirmAction(currentStatus: InvestmentPaymentState): ConfirmDecision {
  if (currentStatus === "confirmed") return "already_confirmed";
  if (currentStatus === "awaiting_payment" || currentStatus === "awaiting_confirmation") return "process";
  return "unexpected_state";
}

/** Whether accruing new units would push an opportunity to sold_out. */
export function isNowSoldOut(unitsSold: number, unitsJustSold: number, totalUnits: number): boolean {
  return unitsSold + unitsJustSold >= totalUnits;
}
