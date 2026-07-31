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

test.describe("Package Engine module", () => {
  test("login and open products packages admin", async ({ page }) => {
    const email = env("ERP_TEST_EMAIL");
    const password = env("ERP_TEST_PASSWORD");
    test.skip(!email || !password, "ERP_TEST_* missing");

    await page.goto("./#/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /Sign In/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 30_000 });

    await page.goto("./#/products/packages");
    await expect(page.getByRole("heading", { name: /Products & packages/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/PackageID is the source of truth/i)).toBeVisible();
  });

  test("public site package route renders shell", async ({ page }) => {
    await page.goto("./#/site");
    await expect(page.getByText(/Shanghai Travels/i).first()).toBeVisible({ timeout: 15_000 });
    await page.goto("./#/site/search");
    await expect(page.getByRole("heading", { name: /Package search/i })).toBeVisible({ timeout: 15_000 });
  });
});
