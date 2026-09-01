import { describe, it, expect } from "vitest";
import { reversalBucketFor, canReverse, isValidReversalReason } from "./ledger";

describe("reversalBucketFor — refund after payout", () => {
  it("debits the paid bucket when reversing a paid commission", () => {
    expect(reversalBucketFor("paid")).toBe("stats.paidMinor");
  });

  it("debits the pending bucket when reversing a still-pending commission", () => {
    expect(reversalBucketFor("pending")).toBe("stats.pendingMinor");
  });

  it("debits the pending bucket when reversing a payable (not-yet-paid) commission", () => {
    expect(reversalBucketFor("payable")).toBe("stats.pendingMinor");
  });
});

describe("canReverse", () => {
  it("allows reversing an accrual", () => {
    expect(canReverse("accrual")).toBe(true);
  });

  it("rejects reversing a reversal (no double-reversal)", () => {
    expect(canReverse("reversal")).toBe(false);
  });

  it("rejects reversing an adjustment", () => {
    expect(canReverse("adjustment")).toBe(false);
  });
});

describe("isValidReversalReason", () => {
  it("rejects a reason under 10 characters", () => {
    expect(isValidReversalReason("too short")).toBe(false);
  });

  it("accepts a reason of exactly 10 characters", () => {
    expect(isValidReversalReason("chargeback")).toBe(true);
  });

  it("trims whitespace before checking length", () => {
    expect(isValidReversalReason("   short   ")).toBe(false);
  });

  it("accepts a real-world reason", () => {
    expect(isValidReversalReason("Customer disputed the charge with their bank")).toBe(true);
  });
});
