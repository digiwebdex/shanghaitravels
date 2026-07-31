import { test, expect } from "@playwright/test";

/**
 * Agent portal E2E: staff invite via API, then UI login → change temp password → dashboard.
 * Requires ERP_TEST_EMAIL / ERP_TEST_PASSWORD and PORTAL_RETURN_CODES on API for OTP flows elsewhere.
 */
test.describe("Agent portal", () => {
  test("invite login change-password dashboard", async ({ page, request }) => {
    // UI on /erp/ talks to production `/api2` — invite must hit the same realm.
    const base = process.env.ERP_PUBLIC_BASE || "https://shanghaitravels.com.bd/api2";
    const email = process.env.ERP_TEST_EMAIL;
    const pass = process.env.ERP_TEST_PASSWORD;
    test.skip(!email || !pass, "missing ERP_TEST_* credentials");

    const staffLogin = await request.post(`${base}/auth/login`, {
      data: { email, password: pass },
    });
    expect(staffLogin.ok()).toBeTruthy();

    const agentEmail = `e2e.agent.${Date.now()}@example.com`;
    const agentRes = await request.post(`${base}/agents`, {
      data: { name: "E2E Agent Co", phone: `018${String(Date.now()).slice(-8)}`, email: agentEmail, commissionRateBps: 500 },
    });
    expect(agentRes.ok()).toBeTruthy();
    const agent = await agentRes.json();
    const invite = await request.post(`${base}/agent-accounts/${agent.id}`, {
      data: { email: agentEmail },
    });
    expect(invite.ok()).toBeTruthy();
    const inv = await invite.json();
    const tempPassword = inv.tempPassword as string;
    test.skip(!tempPassword, "invite did not return tempPassword");

    await page.goto("./#/portal/agent/login");
    await expect(page.getByRole("heading", { name: /Agent sign in/i })).toBeVisible({ timeout: 20_000 });
    await page.getByPlaceholder("Email").fill(agentEmail);
    await page.getByPlaceholder("Password").fill(tempPassword);
    await page.getByRole("button", { name: /Sign in/i }).click();

    await expect(page.getByRole("heading", { name: /Change temporary password/i })).toBeVisible({
      timeout: 20_000,
    });
    const newPassword = "AgentE2e1!";
    await page.getByPlaceholder("Current password").fill(tempPassword);
    await page.getByPlaceholder(/New password/).fill(newPassword);
    await page.getByRole("button", { name: /Save password/i }).click();

    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible({ timeout: 20_000 });
    await page.goto("./#/portal/agent/bookings");
    await expect(page.getByRole("heading", { name: /Bookings/i })).toBeVisible({ timeout: 15_000 });
  });
});
