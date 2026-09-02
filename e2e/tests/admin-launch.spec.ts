import { test, expect } from "@playwright/test";

/**
 * PRD §13.4 launch panel. Deliberately never completes the confirm click —
 * launchAndBroadcast() is a one-way door (flips settings.appLaunched and
 * emails every pending waitlist row) and this suite must be safe to run
 * repeatedly against a shared preview environment. This only proves the
 * confirmation gate can't be bypassed by an accidental double-click or a
 * near-miss phrase.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@san.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "ci-placeholder-password";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
});

test("launch confirm button stays disabled until the exact phrase is typed", async ({ page }) => {
  await page.goto("/admin/waitlist");

  const launchButton = page.getByRole("button", { name: /^launch syndran$/i });

  // Already launched in this environment — nothing to gate.
  if (!(await launchButton.isVisible().catch(() => false))) {
    test.skip();
  }

  await launchButton.click();
  const confirmButton = page.getByRole("button", { name: /confirm launch/i });
  await expect(confirmButton).toBeDisabled();

  const phraseInput = page.getByPlaceholder("LAUNCH SYNDRAN");
  await phraseInput.fill("launch syndran");
  await expect(confirmButton).toBeDisabled();

  await phraseInput.fill("LAUNCH SYNDRAN");
  await expect(confirmButton).toBeEnabled();

  await page.getByRole("button", { name: /cancel/i }).click();
});
