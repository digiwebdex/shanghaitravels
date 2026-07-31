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

test.describe("Tour packages module", () => {
  test("login and open tours bookings + packages + destinations", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("./#/tours");
    await expect(page.getByRole("heading", { name: /Tour Packages/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/supplier-curated packages/i)).toBeVisible();

    await page.goto("./#/tours/packages");
    await expect(page.getByRole("heading", { name: /Package master/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Not an OTA/i)).toBeVisible();

    await page.goto("./#/tours/destinations");
    await expect(page.getByRole("heading", { name: /Destinations/i })).toBeVisible({ timeout: 20_000 });
  });
});
