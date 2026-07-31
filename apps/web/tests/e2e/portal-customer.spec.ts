import { test, expect } from "@playwright/test";

test.describe("Customer portal", () => {
  test("register verify login dashboard", async ({ page, request }) => {
    const email = `e2e.portal.${Date.now()}@example.com`;
    const password = "PortalE2e1!";

    // API register + verify (uses staging/prod via same-origin ERP cookies when on /erp/)
    await page.goto("./#/portal/customer/register");
    await expect(page.getByRole("heading", { name: /Create customer account/i })).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder("Full name").fill("E2E Portal User");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Phone").fill("01710002000");
    await page.getByPlaceholder(/Password/).fill(password);
    await page.getByRole("button", { name: /Register/i }).click();
    await expect(page.getByRole("heading", { name: /Verify email/i })).toBeVisible({ timeout: 20_000 });

    // code may be prefilled from query when PORTAL_RETURN_CODES
    const codeInput = page.getByPlaceholder("Verification code");
    await expect(codeInput).toBeVisible();
    const code = await codeInput.inputValue();
    test.skip(!code, "devCode not returned — set PORTAL_RETURN_CODES");
    await page.getByRole("button", { name: /^Verify$/i }).click();
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible({ timeout: 20_000 });

    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 20_000 });

    await page.goto("./#/portal/customer/applications");
    await expect(page.getByRole("heading", { name: /Applications/i })).toBeVisible({ timeout: 15_000 });
  });
});
