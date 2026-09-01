import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a real, already-running SAN instance — never spins up its
 * own Mongo/Redis, since PRD ADR-001 rules out anything but managed
 * serverless infra, and CI has no such infra to give it. E2E_BASE_URL
 * points this at a Vercel preview deployment (wired with real Atlas/Upstash)
 * for CI; falling back to a local `next dev` for local iteration.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const usingLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  ],
  webServer: usingLocalServer
    ? {
        command: "pnpm --filter @san/frontend dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
        cwd: "..",
      }
    : undefined,
});
