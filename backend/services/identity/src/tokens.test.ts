import { describe, it, expect } from "vitest";
import { generateToken, hashToken, newSessionId } from "./tokens";

describe("tokens", () => {
  it("generates a token whose hash matches a separate hashToken() call", () => {
    const { token, tokenHash } = generateToken();
    expect(hashToken(token)).toBe(tokenHash);
  });

  it("never stores the plaintext token as its own hash", () => {
    const { token, tokenHash } = generateToken();
    expect(tokenHash).not.toBe(token);
  });

  it("generates unique tokens across calls", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it("produces a 64-char hex token (32 bytes)", () => {
    const { token } = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("newSessionId returns a well-formed UUID", () => {
    const id = newSessionId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
