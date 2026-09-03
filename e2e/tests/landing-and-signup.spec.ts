import { test, expect } from "@playwright/test";

/**
 * The app is launched — no waitlist. The homepage's "Get started" section
 * links straight to real registration at /signup, which is what this
 * suite exercises end to end.
 *
 * Requires the preview/target env's NEXT_PUBLIC_TURNSTILE_SITE_KEY to be set
 * to Cloudflare's documented always-pass test key
 * (1x00000000000000000000AA) — a real site key blocks headless automation
 * by design and there is no way to script around it, nor should there be.
 */

test.describe("Landing page", () => {
  test("renders hero and the get-started CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#get-started")).toBeVisible();
    await expect(page.getByRole("link", { name: /become an ambassador/i }).first()).toBeVisible();
  });

  test("hero CTA navigates straight to signup, no waitlist", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /become an ambassador/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe("Signup", () => {
  test("rejects an invalid submission before hitting the server", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/required|enter a valid/i).first()).toBeVisible();
  });

  test("a unique registrant completes real signup and is asked to verify their email", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/signup");

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

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 15_000 });
  });
});
