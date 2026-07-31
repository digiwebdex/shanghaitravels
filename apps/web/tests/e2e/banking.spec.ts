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

test.describe("Banking & cash management", () => {
  test("login and open banking, movements, reports", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("./#/finance/banking");
    await expect(page.getByRole("heading", { name: /Banking & cash/i })).toBeVisible({ timeout: 20_000 });

    await page.goto("./#/finance/banking/movements");
    await expect(page.getByRole("heading", { name: /Bank & cash movements/i })).toBeVisible({
      timeout: 20_000,
    });

    await page.goto("./#/finance/banking/reports");
    await expect(page.getByRole("heading", { name: /Banking reports/i })).toBeVisible({ timeout: 20_000 });
  });
});
