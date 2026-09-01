import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  // getEnv() validates the FULL schema on first call, caching only on
  // success — every required field needs a stub value, not just the one
  // this test cares about, or every call re-validates and re-fails.
  Object.assign(process.env, {
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    AUTH_SECRET: "test-auth-secret-32-chars-minimum!!",
    ENCRYPTION_KEY: "0".repeat(64), // 32 bytes hex
    ATTRIBUTION_SECRET: "test-attribution-secret-32-chars!!",
    MONGODB_URI: "mongodb://localhost:27017",
    MONGODB_DB: "test",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "test-token",
    RESEND_API_KEY: "re_test",
    EMAIL_FROM: "test@example.com",
    EMAIL_REPLY_TO: "test@example.com",
    TURNSTILE_SECRET_KEY: "test-secret",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "test-site-key",
    ADMIN_SEED_EMAIL: "admin@example.com",
    ADMIN_SEED_PASSWORD: "test-password-min-10-chars",
  });
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a plaintext value", async () => {
    const { encryptSecret, decryptSecret } = await import("./crypto");
    const packed = encryptSecret("re_live_abc123");
    expect(packed).not.toContain("re_live_abc123");
    expect(decryptSecret(packed)).toBe("re_live_abc123");
  });

  it("produces a different ciphertext each time (random IV)", async () => {
    const { encryptSecret } = await import("./crypto");
    const a = encryptSecret("same-input");
    const b = encryptSecret("same-input");
    expect(a).not.toBe(b);
  });

  it("rejects a tampered ciphertext", async () => {
    const { encryptSecret, decryptSecret } = await import("./crypto");
    const packed = encryptSecret("sensitive-value");
    const [iv, authTag, ciphertext] = packed.split(":");
    const tampered = `${iv}:${authTag}:${ciphertext!.slice(0, -2)}00`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws on a malformed packed value", async () => {
    const { decryptSecret } = await import("./crypto");
    expect(() => decryptSecret("not-a-valid-packed-value")).toThrow();
  });
});

describe("maskSecret", () => {
  it("keeps only the last 4 characters visible", async () => {
    const { maskSecret } = await import("./crypto");
    expect(maskSecret("re_live_abc123")).toBe("••••c123");
  });

  it("fully masks very short values", async () => {
    const { maskSecret } = await import("./crypto");
    expect(maskSecret("abc")).toBe("••••");
  });
});
