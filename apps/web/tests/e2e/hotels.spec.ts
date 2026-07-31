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

test.describe("Hotels module", () => {
  test("login and open hotels bookings + catalog", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("./#/hotels");
    await expect(page.getByRole("heading", { name: /^Hotels$/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/manual property/i)).toBeVisible();

    await page.goto("./#/hotels/catalog");
    await expect(page.getByRole("heading", { name: /Hotel master/i })).toBeVisible({
      timeout: 20_000,
    });

    const caseLink = page.locator('a[href*="#/hotels/"]').filter({ hasText: /^APP-/ }).first();
    // from bookings list if any
    await page.goto("./#/hotels");
    if (await caseLink.count()) {
      await caseLink.click();
      await expect(page.getByRole("heading", { name: /Hotel operations/i })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByRole("heading", { name: /Hotel booking details/i })).toBeVisible();
    }
  });
});
