import { describe, it, expect } from "vitest";
import { calcCommission } from "./calc";

describe("calcCommission", () => {
  it("computes the PRD §8.2 worked example exactly", () => {
    // 5 units x N2,000,000 = N10,000,000 = 1_000_000_000 kobo, 500 bps (5%)
    const result = calcCommission(
      { amountMinor: 1_000_000_000, units: 5 },
      { model: "percentage", valueBps: 500 }
    );
    expect(result).toBe(50_000_000); // N500,000
  });

  it("computes a flat per-unit commission", () => {
    const result = calcCommission(
      { amountMinor: 1_000_000_000, units: 5 },
      { model: "flat", valueMinor: 10_000 }
    );
    expect(result).toBe(50_000);
  });

  it("never returns negative commission", () => {
    const result = calcCommission(
      { amountMinor: 1000, units: 1 },
      { model: "percentage", valueBps: -500 }
    );
    expect(result).toBe(0);
  });

  it("handles a zero-commission opportunity", () => {
    const result = calcCommission(
      { amountMinor: 1_000_000, units: 1 },
      { model: "percentage", valueBps: 0 }
    );
    expect(result).toBe(0);
  });

  it("rounds integer-safe at the boundary (bps that do not divide evenly)", () => {
    const result = calcCommission(
      { amountMinor: 333, units: 1 },
      { model: "percentage", valueBps: 333 }
    );
    // 333 * 333 / 10_000 = 11.0889 -> rounds to 11
    expect(result).toBe(11);
  });
});
