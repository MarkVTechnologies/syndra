import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * PRD §14 Day 5 Block 6 accessibility pass, automated portion. Axe catches
 * contrast/labeling/landmark/ARIA violations mechanically; it does not
 * replace a manual screen-reader and keyboard-navigation pass (tracked in
 * the launch runbook), but it's a real regression gate for what it does
 * check — wired into CI, not just run once by hand.
 */

const PUBLIC_PAGES = ["/", "/login", "/signup", "/forgot"];

for (const path of PUBLIC_PAGES) {
  test(`${path} has no automatically detectable a11y violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
