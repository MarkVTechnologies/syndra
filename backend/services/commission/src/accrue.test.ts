import { describe, it, expect } from "vitest";
import { accrue } from "./index";

describe("accrue — R7 house account", () => {
  it("returns ok(null) without touching the database when ambassadorId is null", async () => {
    // No DB/session is ever used on this path — proven by the fact this
    // test passes with no MongoDB available and a deliberately-broken
    // session stand-in that would throw if accrue() ever tried to use it.
    const poisonedSession = {
      startTransaction: () => {
        throw new Error("accrue() touched the session on the house-account path");
      },
    } as unknown as Parameters<typeof accrue>[2];

    const result = await accrue(
      {
        investmentId: "000000000000000000000001",
        ambassadorId: null,
        opportunityId: "000000000000000000000002",
        syndicatorId: "000000000000000000000003",
        amountMinor: 1_000_000,
        units: 5,
      },
      { model: "percentage", valueBps: 500, coolingDays: 7 },
      poisonedSession
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBeNull();
  });
});
