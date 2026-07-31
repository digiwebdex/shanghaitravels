import { test, expect, request } from "@playwright/test";

function apiBase() {
  return process.env.ERP_PUBLIC_BASE || "https://shanghaitravels.com.bd/api2";
}

test.describe("Corporate portal", () => {
  test("invite login change-password dashboard", async ({ page }) => {
    const base = apiBase();
    const email = process.env.ERP_TEST_EMAIL;
    const pass = process.env.ERP_TEST_PASSWORD;
    test.skip(!email || !pass, "missing ERP_TEST_* credentials");

    const api = await request.newContext();
    const staffLogin = await api.post(`${base}/auth/login`, { data: { email, password: pass } });
    expect(staffLogin.ok()).toBeTruthy();

    const corpEmail = `e2e.corp.${Date.now()}@example.com`;
    const client = await api.post(`${base}/corporate-clients`, {
      data: {
        companyName: "E2E Corporate Co",
        phone: `018${String(Date.now()).slice(-8)}`,
        email: corpEmail,
        creditLimit: 1000000,
        paymentTermsDays: 30,
        branchId: "br-corporate",
      },
    });
    expect(client.ok()).toBeTruthy();
    const company = await client.json();
    const invite = await api.post(`${base}/corporate-accounts/${company.id}`, {
      data: { email: corpEmail, role: "admin" },
    });
    expect(invite.ok()).toBeTruthy();
    const inv = await invite.json();
    test.skip(!inv.tempPassword, "invite missing tempPassword");

    await page.goto("./#/portal/corporate/login");
    await expect(page.getByRole("heading", { name: /Corporate sign in/i })).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder("Email").fill(corpEmail);
    await page.getByPlaceholder("Password").fill(inv.tempPassword);
    await page.getByRole("button", { name: /Sign in/i }).click();

    await expect(page.getByRole("heading", { name: /Change temporary password/i })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByPlaceholder("Current password").fill(inv.tempPassword);
    await page.getByPlaceholder(/New password/).fill("CorpE2e1!");
    await page.getByRole("button", { name: /Save password/i }).click();

    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 20_000 });
    await page.goto("./#/portal/corporate/employees");
    await expect(page.getByRole("heading", { name: /Employees/i })).toBeVisible({ timeout: 15_000 });

    await api.dispose();
  });
});
