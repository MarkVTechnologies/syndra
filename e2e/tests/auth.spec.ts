import { test, expect } from "@playwright/test";

/**
 * PRD §14 Day 5 Block 4: auth + RBAC golden paths. Admin credentials come
 * from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD, which must match whatever
 * `pnpm db:seed` (backend/db/src/scripts/seed-admin.ts) seeded into the
 * target environment — the CI job's ADMIN_SEED_EMAIL/PASSWORD for a local
 * run, or the preview environment's rotated admin creds otherwise.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@san.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "ci-placeholder-password";

test.describe("RBAC route protection", () => {
  for (const path of ["/admin", "/dashboard", "/portfolio"]) {
    test(`unauthenticated visit to ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("Login", () => {
  test("shows an error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("admin logs in and lands on the admin overview", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
  });

  test("a launch-link notice pre-fills the email and shows a toast", async ({ page }) => {
    await page.goto("/login?notice=launch-converted&email=someone%40example.com");
    await expect(page.getByLabel("Email")).toHaveValue("someone@example.com");
    await expect(page.getByText(/your account is live/i)).toBeVisible();
  });
});
