import { test, expect, request, type APIRequestContext } from "@playwright/test";

/**
 * Agent portal security regression (Playwright).
 * Proves cross-agent isolation, application-ID tampering denial, and cookie realm isolation
 * against production `/api2` (same realm as `/erp/` UI).
 */
function apiBase() {
  return process.env.ERP_PUBLIC_BASE || "https://shanghaitravels.com.bd/api2";
}

async function staffLogin(api: APIRequestContext, base: string) {
  const email = process.env.ERP_TEST_EMAIL;
  const pass = process.env.ERP_TEST_PASSWORD;
  test.skip(!email || !pass, "missing ERP_TEST_* credentials");
  const r = await api.post(`${base}/auth/login`, { data: { email, password: pass } });
  expect(r.ok(), `staff login ${r.status()}`).toBeTruthy();
}

async function inviteAgent(api: APIRequestContext, base: string, opts: { email: string; phone: string; branchId: string }) {
  const agentRes = await api.post(`${base}/agents`, {
    data: {
      name: `E2E Sec ${opts.email}`,
      phone: opts.phone,
      email: opts.email,
      commissionRateBps: 100,
    },
  });
  expect(agentRes.ok()).toBeTruthy();
  const agent = await agentRes.json();
  const inv = await api.post(`${base}/agent-accounts/${agent.id}`, {
    data: { email: opts.email, branchId: opts.branchId },
  });
  expect(inv.ok()).toBeTruthy();
  const body = await inv.json();
  return { agentId: agent.id as string, tempPassword: body.tempPassword as string };
}

async function agentSession(base: string, email: string, tempPassword: string) {
  const api = await request.newContext();
  const login = await api.post(`${base}/portal/agent/login`, { data: { email, password: tempPassword } });
  expect(login.ok()).toBeTruthy();
  const ch = await api.post(`${base}/portal/agent/change-password`, {
    data: { currentPassword: tempPassword, newPassword: "AgentSecE2e1!" },
  });
  expect(ch.ok()).toBeTruthy();
  return api;
}

test.describe("Agent portal security", () => {
  test("cross-agent isolation + cookie realms", async () => {
    const base = apiBase();
    const staff = await request.newContext();
    await staffLogin(staff, base);

    const ts = Date.now();
    const emailA = `e2e.sec.a.${ts}@example.com`;
    const emailB = `e2e.sec.b.${ts}@example.com`;
    const phoneA = `018${String(ts).slice(-8)}`;

    const a = await inviteAgent(staff, base, {
      email: emailA,
      phone: `019${String(ts).slice(-8)}`,
      branchId: "br-corporate",
    });
    const b = await inviteAgent(staff, base, {
      email: emailB,
      phone: `017${String(ts).slice(-8)}`,
      branchId: "br-head",
    });

    const agentA = await agentSession(base, emailA, a.tempPassword);
    const cust = await agentA.post(`${base}/portal/agent/customers`, {
      data: { fullName: "E2E Sec Customer A", phone: phoneA },
    });
    expect(cust.ok()).toBeTruthy();
    const customer = await cust.json();

    const booking = await agentA.post(`${base}/portal/agent/cases`, {
      data: {
        serviceType: "visa",
        customerName: "E2E Sec Customer A",
        customerPhone: phoneA,
        title: "E2E sec booking",
      },
    });
    expect(booking.ok()).toBeTruthy();
    const caseRow = await booking.json();

    const pdf = Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
    const upload = await agentA.post(`${base}/portal/agent/documents`, {
      multipart: {
        file: { name: "sec.pdf", mimeType: "application/pdf", buffer: pdf },
        applicationId: caseRow.id,
        category: "passport",
      },
    });
    expect(upload.ok()).toBeTruthy();
    const doc = await upload.json();

    const inv = await staff.post(`${base}/invoices`, {
      data: {
        customerId: customer.id,
        applicationId: caseRow.id,
        items: [{ description: "E2E sec fee", quantity: 1, unitPrice: 25000 }],
      },
    });
    expect(inv.ok()).toBeTruthy();
    const invoice = await inv.json();
    await staff.post(`${base}/invoices/${invoice.id}/issue`);

    const agentB = await agentSession(base, emailB, b.tempPassword);

    expect((await agentB.get(`${base}/portal/agent/customers/${customer.id}`)).status()).toBe(404);
    expect((await agentB.get(`${base}/portal/agent/cases/${caseRow.id}`)).status()).toBe(404);
    expect((await agentB.get(`${base}/portal/agent/documents/${doc.id}/download`)).status()).toBe(404);

    const finB = await agentB.get(`${base}/portal/agent/finance`);
    expect(finB.ok()).toBeTruthy();
    const finBody = await finB.json();
    const invIds = (finBody.invoices || []).map((i: { id: string }) => i.id);
    expect(invIds).not.toContain(invoice.id);

    const hijack = await agentB.post(`${base}/portal/agent/cases`, {
      data: {
        serviceType: "hotel",
        customerName: "Hijack",
        customerPhone: phoneA,
        title: "should fail",
      },
    });
    expect(hijack.status()).toBeGreaterThanOrEqual(400);
    expect(hijack.status()).toBeLessThan(500);

    const idor = await agentB.post(`${base}/portal/agent/cases`, {
      data: {
        serviceType: "visa",
        customerId: customer.id,
        customerName: "IDOR",
        customerPhone: `016${String(ts).slice(-8)}`,
        title: "should reject",
      },
    });
    expect(idor.status()).toBeGreaterThanOrEqual(400);

    expect((await agentB.get(`${base}/auth/me`)).status()).toBe(401);

    const staffOnly = await request.newContext();
    await staffLogin(staffOnly, base);
    expect((await staffOnly.get(`${base}/portal/agent/me`)).status()).toBe(401);

    const custEmail = `e2e.sec.cust.${ts}@example.com`;
    const custPass = "PortalSecE2e1!";
    const reg = await staff.post(`${base}/portal/customer/register`, {
      data: {
        email: custEmail,
        password: custPass,
        fullName: "E2E Sec Cust",
        phone: `015${String(ts).slice(-8)}`,
      },
    });
    const regBody = await reg.json();
    test.skip(!regBody.devCode, "PORTAL_RETURN_CODES required");
    await staff.post(`${base}/portal/customer/verify-email`, {
      data: { email: custEmail, code: regBody.devCode },
    });
    const custApi = await request.newContext();
    await custApi.post(`${base}/portal/customer/login`, {
      data: { email: custEmail, password: custPass },
    });
    expect((await custApi.get(`${base}/portal/agent/me`)).status()).toBe(401);

    await agentA.dispose();
    await agentB.dispose();
    await staff.dispose();
    await staffOnly.dispose();
    await custApi.dispose();
  });
});
