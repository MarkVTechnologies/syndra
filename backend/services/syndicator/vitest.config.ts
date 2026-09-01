import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      AUTH_SECRET: "test-secret-at-least-32-characters-long",
      ENCRYPTION_KEY: "0".repeat(64),
      ATTRIBUTION_SECRET: "test-attribution-secret-32-chars-min",
      MONGODB_URI: "mongodb://localhost:27017",
      MONGODB_DB: "san_test",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "test",
      RESEND_API_KEY: "test",
      EMAIL_FROM: "SAN <noreply@mail.san.com>",
      EMAIL_REPLY_TO: "support@san.com",
      TURNSTILE_SECRET_KEY: "test",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "test",
      ADMIN_SEED_EMAIL: "admin@san.com",
      ADMIN_SEED_PASSWORD: "test-password-1234",
    },
  },
});
