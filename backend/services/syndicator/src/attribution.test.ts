import { describe, it, expect } from "vitest";
import {
  signAttributionToken,
  verifyAttributionToken,
  resolveAttributionSource,
} from "./attribution";

describe("signAttributionToken / verifyAttributionToken", () => {
  it("round-trips a freshly signed token", () => {
    const token = signAttributionToken("janedoe");
    const verified = verifyAttributionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.slug).toBe("janedoe");
  });

  it("rejects a forged slug (R3 — arbitrary slug POST)", () => {
    const token = signAttributionToken("janedoe");
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [, issuedAt, signature] = decoded.split(":");
    const forged = Buffer.from(`attacker-slug:${issuedAt}:${signature}`).toString("base64url");
    expect(verifyAttributionToken(forged)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = signAttributionToken("janedoe");
    const tampered = token.slice(0, -4) + "aaaa";
    expect(verifyAttributionToken(tampered)).toBeNull();
  });

  it("accepts a token just under the 24h validity window", () => {
    const issuedAt = Date.now() - (24 * 60 * 60 * 1000 - 1000);
    const token = signAttributionToken("janedoe", issuedAt);
    expect(verifyAttributionToken(token, Date.now())).not.toBeNull();
  });

  it("rejects a token past the 24h validity window", () => {
    const issuedAt = Date.now() - (24 * 60 * 60 * 1000 + 1000);
    const token = signAttributionToken("janedoe", issuedAt);
    expect(verifyAttributionToken(token, Date.now())).toBeNull();
  });

  it("rejects a token issued in the future (clock skew abuse)", () => {
    const token = signAttributionToken("janedoe", Date.now() + 60_000);
    expect(verifyAttributionToken(token, Date.now())).toBeNull();
  });

  it("rejects malformed base64 garbage without throwing", () => {
    expect(() => verifyAttributionToken("not-a-real-token")).not.toThrow();
    expect(verifyAttributionToken("not-a-real-token")).toBeNull();
  });

  it("rejects a well-formed but incomplete payload", () => {
    const bogus = Buffer.from("onlyoneparts").toString("base64url");
    expect(verifyAttributionToken(bogus)).toBeNull();
  });
});

describe("resolveAttributionSource — R2 precedence order", () => {
  it("prefers the signed token over cookie and query", () => {
    const token = signAttributionToken("token-wins");
    const resolution = resolveAttributionSource({
      signedToken: token,
      cookieAmbassadorId: "cookie-ambassador-id",
      queryRef: "query-slug",
    });
    expect(resolution).toEqual({ source: "signed_token", valueType: "slug", value: "token-wins" });
  });

  it("falls back to the cookie when the token is missing", () => {
    const resolution = resolveAttributionSource({
      cookieAmbassadorId: "cookie-ambassador-id",
      queryRef: "query-slug",
    });
    expect(resolution).toEqual({ source: "cookie", valueType: "ambassadorId", value: "cookie-ambassador-id" });
  });

  it("falls back to the cookie when the token is invalid/expired (cookie loss simulation in reverse)", () => {
    const resolution = resolveAttributionSource({
      signedToken: "garbage-token",
      cookieAmbassadorId: "cookie-ambassador-id",
    });
    expect(resolution.source).toBe("cookie");
  });

  it("falls back to the query param when both token and cookie are absent (cookie loss)", () => {
    const resolution = resolveAttributionSource({ queryRef: "query-slug" });
    expect(resolution).toEqual({ source: "query", valueType: "slug", value: "query-slug" });
  });

  it("resolves to the house account when nothing is present", () => {
    const resolution = resolveAttributionSource({});
    expect(resolution).toEqual({ source: "house", valueType: null, value: null });
  });

  it("treats an empty-string signal the same as absent", () => {
    const resolution = resolveAttributionSource({ signedToken: "", cookieAmbassadorId: "", queryRef: "" });
    expect(resolution.source).toBe("house");
  });
});
