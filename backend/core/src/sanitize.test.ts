import { describe, it, expect } from "vitest";
import { escapeRegex } from "./sanitize";

describe("escapeRegex", () => {
  it("leaves plain text unchanged", () => {
    expect(escapeRegex("jane doe")).toBe("jane doe");
  });

  it("escapes a ReDoS-shaped pattern instead of interpreting it", () => {
    const input = "(a+)+$";
    const escaped = escapeRegex(input);
    expect(new RegExp(escaped).test("(a+)+$")).toBe(true);
    expect(new RegExp(escaped).test("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!")).toBe(false);
  });

  it("escapes every regex metacharacter", () => {
    expect(escapeRegex(".*+?^${}()|[]\\")).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  });
});
