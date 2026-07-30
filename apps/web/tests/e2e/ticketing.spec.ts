import { test, expect } from "@playwright/test";
import fs from "node:fs";

function env(k: string) {
  if (process.env[k]) return process.env[k]!;
  try {
    const raw = fs.readFileSync(new URL("../../.env.test", import.meta.url), "utf8");
    const m = new RegExp(`^${k}=(.*)$`, "m").exec(raw);
    return m?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

test.describe("Air ticketing module", () => {
  test("login and open ticketing list", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    // Hash route — sidebar may be collapsed (icon-only) on narrow viewports
    await page.goto("./#/ticketing");
    await expect(page.getByRole("heading", { name: /Air Ticketing/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/manual PNR/i)).toBeVisible();

    // Open first case if present — ops panel must render for air_ticket workspace
    const caseLink = page.locator('a[href*="#/ticketing/"]').filter({ hasText: /^APP-/ }).first();
    if (await caseLink.count()) {
      await caseLink.click();
      await expect(page.getByRole("heading", { name: /Ticket operations/i })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("heading", { name: /Air ticket details/i })).toBeVisible();
    }
  });

  test("unauthenticated ticketing hash redirects to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("./#/ticketing");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Unexpected Application Error/i)).toHaveCount(0);
  });
});

