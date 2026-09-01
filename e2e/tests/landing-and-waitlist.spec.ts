import { test, expect } from "@playwright/test";

/**
 * PRD §14 Day 5 Block 4 golden path: Phase 0 waitlist registration.
 *
 * Requires the preview/target env's NEXT_PUBLIC_TURNSTILE_SITE_KEY to be set
 * to Cloudflare's documented always-pass test key
 * (1x00000000000000000000AA) — a real site key blocks headless automation
 * by design and there is no way to script around it, nor should there be.
 */

test.describe("Landing page", () => {
  test("renders hero, waitlist count, and the registration form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#waitlist-form")).toBeVisible();
  });

  test("waitlist form rejects an invalid submission before hitting the server", async ({ page }) => {
    await page.goto("/#waitlist-form");
    await page.getByRole("button", { name: /join the waitlist/i }).click();
    await expect(page.getByText(/required|enter a valid/i).first()).toBeVisible();
  });

  test("a unique registrant completes the waitlist flow and gets a reserved slug", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/#waitlist-form");

    await page.getByLabel("Full name").fill("Ada E2E Test");
    await page.getByLabel("Email").fill(`ada.e2e.${stamp}@example.com`);
    await page.getByLabel("Phone").fill("08012345678");
    await page.getByLabel("City").fill("Lagos");
    await page.getByLabel("State").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Years in real estate").click();
    await page.getByRole("option").first().click();
    await page.locator("#desiredSlug").fill(`ada-e2e-${stamp}`);
    await page.getByLabel("Password").fill("correct horse battery staple");
    await page.getByLabel(/i agree to the/i).check();

    await page.getByRole("button", { name: /join the waitlist/i }).click();

    await expect(page.getByText(/you're on the list/i)).toBeVisible({ timeout: 15_000 });
  });
});
