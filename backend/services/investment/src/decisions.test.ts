import { describe, it, expect } from "vitest";
import { decideConfirmAction, isNowSoldOut } from "./decisions";

describe("decideConfirmAction — double-webhook idempotency", () => {
  it("processes a fresh awaiting_payment investment", () => {
    expect(decideConfirmAction("awaiting_payment")).toBe("process");
  });

  it("processes a fresh awaiting_confirmation (bank transfer) investment", () => {
    expect(decideConfirmAction("awaiting_confirmation")).toBe("process");
  });

  it("treats an already-confirmed investment as a replay, not a re-process — a webhook fired ten times must decide the same way every time after the first", () => {
    expect(decideConfirmAction("confirmed")).toBe("already_confirmed");
  });

  it("flags a still-pending (never initiated payment) investment as unexpected", () => {
    expect(decideConfirmAction("pending")).toBe("unexpected_state");
  });

  it("flags a cancelled investment as unexpected — a stale reservation should never confirm", () => {
    expect(decideConfirmAction("cancelled")).toBe("unexpected_state");
  });

  it("flags a refunded investment as unexpected — cannot re-confirm after refund", () => {
    expect(decideConfirmAction("refunded")).toBe("unexpected_state");
  });
});

describe("isNowSoldOut", () => {
  it("is not sold out while units remain", () => {
    expect(isNowSoldOut(50, 10, 100)).toBe(false);
  });

  it("is sold out exactly at the boundary", () => {
    expect(isNowSoldOut(90, 10, 100)).toBe(true);
  });

  it("is sold out when it overshoots (should not happen given the reservation guard, but must not under-report)", () => {
    expect(isNowSoldOut(95, 10, 100)).toBe(true);
  });

  it("is not sold out for a zero-unit no-op", () => {
    expect(isNowSoldOut(0, 0, 100)).toBe(false);
  });
});
