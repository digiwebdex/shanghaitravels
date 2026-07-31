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

test.describe("CRM foundation", () => {
  test("login and open CRM leads, opportunities, reports", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("./#/crm");
    await expect(page.getByRole("heading", { name: /CRM leads/i })).toBeVisible({ timeout: 20_000 });

    await page.goto("./#/crm/opportunities");
    await expect(page.getByRole("heading", { name: /Opportunities/i })).toBeVisible({ timeout: 20_000 });

    await page.goto("./#/crm/reports");
    await expect(page.getByRole("heading", { name: /CRM reports/i })).toBeVisible({ timeout: 20_000 });
  });
});
