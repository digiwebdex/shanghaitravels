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

test.describe("TravelOS Phase A e2e", () => {
  test("login, dashboard, customers, visa list", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible({ timeout: 30_000 });

    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();

    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole("link", { name: /Customer Management/i }).click();
    await expect(page.getByText(/Customer/i).first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole("link", { name: /Visa Management/i }).click();
    await expect(page.getByText(/Visa/i).first()).toBeVisible({ timeout: 20_000 });

    // Session cookies should include refresh on path /
    const cookies = await page.context().cookies();
    const refresh = cookies.find((c) => c.name === "st_refresh");
    expect(refresh, "st_refresh cookie").toBeTruthy();
    expect(refresh?.path || "/").toBe("/");
  });
});
