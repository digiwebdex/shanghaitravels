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

test.describe("Communications hub", () => {
  test("login and open timeline, email, activities, reports", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("./#/comms");
    await expect(page.getByRole("heading", { name: /Communication timeline/i })).toBeVisible({ timeout: 20_000 });

    await page.goto("./#/comms/email");
    await expect(page.getByRole("heading", { name: /^Email$/i })).toBeVisible({ timeout: 20_000 });

    await page.goto("./#/comms/activities");
    await expect(page.getByRole("heading", { name: /Engagement activities/i })).toBeVisible({ timeout: 20_000 });

    await page.goto("./#/comms/reports");
    await expect(page.getByRole("heading", { name: /Communication reports/i })).toBeVisible({ timeout: 20_000 });
  });
});
