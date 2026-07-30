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

test.describe("Hajj & Umrah module", () => {
  test("login and open hajj bookings + packages + pilgrims", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("./#/hajj");
    await expect(page.getByRole("heading", { name: /Hajj & Umrah/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/pilgrims, packages, groups/i)).toBeVisible();

    await page.goto("./#/hajj/packages");
    await expect(page.getByRole("heading", { name: /Hajj \/ Umrah packages/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/not an OTA catalog/i)).toBeVisible();

    await page.goto("./#/hajj/pilgrims");
    await expect(page.getByRole("heading", { name: /Pilgrim profiles/i })).toBeVisible({
      timeout: 20_000,
    });
  });
});
