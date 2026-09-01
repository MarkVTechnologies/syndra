import { describe, it, expect } from "vitest";
import { getPublishChecklist } from "./opportunity";

const baseValid = {
  media: [{ publicId: "x" }],
  commission: { model: "percentage" as const, valueBps: 500 },
  pricing: { unitPriceMinor: 1_000_000, minUnits: 1, maxUnits: 10, totalUnits: 100 },
  summary: "A solid opportunity with a real summary.",
};

describe("getPublishChecklist", () => {
  it("passes every check for a complete opportunity", () => {
    const checklist = getPublishChecklist(baseValid);
    expect(checklist.every((c) => c.met)).toBe(true);
  });

  it("fails the image check with zero media", () => {
    const checklist = getPublishChecklist({ ...baseValid, media: [] });
    expect(checklist.find((c) => c.key === "image")?.met).toBe(false);
  });

  it("fails the commission check when percentage bps is zero", () => {
    const checklist = getPublishChecklist({
      ...baseValid,
      commission: { model: "percentage", valueBps: 0 },
    });
    expect(checklist.find((c) => c.key === "commission")?.met).toBe(false);
  });

  it("accepts a flat commission model with a positive value", () => {
    const checklist = getPublishChecklist({
      ...baseValid,
      commission: { model: "flat", valueMinor: 5000 },
    });
    expect(checklist.find((c) => c.key === "commission")?.met).toBe(true);
  });

  it("fails pricing when maxUnits is below minUnits", () => {
    const checklist = getPublishChecklist({
      ...baseValid,
      pricing: { unitPriceMinor: 1000, minUnits: 10, maxUnits: 5, totalUnits: 100 },
    });
    expect(checklist.find((c) => c.key === "pricing")?.met).toBe(false);
  });

  it("fails pricing when totalUnits is below maxUnits", () => {
    const checklist = getPublishChecklist({
      ...baseValid,
      pricing: { unitPriceMinor: 1000, minUnits: 1, maxUnits: 50, totalUnits: 10 },
    });
    expect(checklist.find((c) => c.key === "pricing")?.met).toBe(false);
  });

  it("fails the summary check when too short", () => {
    const checklist = getPublishChecklist({ ...baseValid, summary: "short" });
    expect(checklist.find((c) => c.key === "summary")?.met).toBe(false);
  });
});
