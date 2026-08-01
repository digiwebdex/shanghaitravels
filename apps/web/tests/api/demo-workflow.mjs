#!/usr/bin/env node
/**
 * End-to-end commercial demo seed + verification.
 *
 * Creates (or reuses) a demo agent, booking, admin approval path,
 * invoice, payment, and commission — then prints IDs for UI testing.
 *
 * Usage (from apps/web):
 *   node tests/api/demo-workflow.mjs
 *
 * Requires apps/web/.env.test with ERP_BASE, ERP_TEST_EMAIL, ERP_TEST_PASSWORD.
 * Never prints staff passwords.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const envPath = path.join(root, ".env.test");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) process.env[m[1]] ??= m[2];
  }
}

const BASE = process.env.ERP_BASE || "http://127.0.0.1:4200/api";
const EMAIL = process.env.ERP_TEST_EMAIL;
const PASS = process.env.ERP_TEST_PASSWORD;
const DEMO_AGENT_EMAIL = process.env.DEMO_AGENT_EMAIL || "demo.agent@shanghaitravels.com.bd";
const DEMO_AGENT_PASSWORD = process.env.DEMO_AGENT_PASSWORD || "DemoAgent#2026!";
const DEMO_AGENT_PHONE = process.env.DEMO_AGENT_PHONE || "01988001234";

if (!EMAIL || !PASS) {
  console.error("Missing ERP_TEST_EMAIL / ERP_TEST_PASSWORD in .env.test");
  process.exit(2);
}

const jar = new Map();
function storeCookies(res) {
  const raw = res.headers.getSetCookie?.() || [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function req(method, p, body) {
  const res = await fetch(`${BASE}${p}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      Cookie: cookieHeader(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  storeCookies(res);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

const steps = [];
function step(name, pass, detail = "") {
  steps.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}
const okHttp = (s) => s >= 200 && s < 300;

async function advanceAllStages(appId) {
  for (let i = 0; i < 20; i++) {
    const cur = await req("GET", `/applications/${appId}`);
    const stages = cur.data?.stages || [];
    if (!stages.length) return { ok: false, reason: "no stages" };
    if (stages.every((s) => s.status === "done")) return { ok: true, stages: stages.length };
    const adv = await req("POST", `/applications/${appId}/advance-stage`, { note: "Demo workflow advance" });
    if (!okHttp(adv.status)) {
      // Final stage may already be active with nothing next — mark remaining done via retry
      if (String(adv.data?.message || "").includes("final stage")) {
        // Try approve path after marking: fetch and see
        const again = await req("GET", `/applications/${appId}`);
        const st = again.data?.stages || [];
        if (st.every((s) => s.status === "done" || s.status === "active")) {
          // Force-complete last active by advancing once more or approve will fail —
          // mark done by completing one more advance that fails means only one left active
          const last = st.find((s) => s.status === "active");
          if (last && st.filter((s) => s.status !== "done").length === 1) {
            // Use note + patch status in_progress then approve needs all done —
            // Call advance again after manually... API won't mark final active as done.
            // Work around: advance once when next is null throws — so PATCH stages not available.
            // Re-read advanceStage: if no next, it marks current done and keeps status.
            // Wait — if cur is active and next is null, it DOES mark cur done:
            // "if (!cur) throw ... final" — so when ONLY final is active, cur exists, next is null,
            // it marks cur done. So one more advance should work when next is null...
            // Looking at code again: if (!cur) throw final. So if cur exists and next is null,
            // it marks cur done. The error "already at the final stage" is when NO active stage.
          }
        }
        return { ok: false, reason: adv.data?.message || `advance ${adv.status}` };
      }
      return { ok: false, reason: adv.data?.message || `advance ${adv.status}` };
    }
  }
  return { ok: false, reason: "too many stages" };
}

async function main() {
  console.log(`\nDemo workflow → ${BASE}\n`);

  {
    const r = await req("GET", "/health");
    step("health", r.status === 200 && r.data?.ok === true, `status=${r.status}`);
  }

  {
    const r = await req("POST", "/auth/login", { email: EMAIL, password: PASS });
    step("staff login", okHttp(r.status) && r.data?.ok === true, `status=${r.status}`);
  }

  {
    const r = await req("GET", "/auth/me");
    step("staff me", okHttp(r.status), r.data?.role || "");
  }

  // Ensure GL foundation
  {
    const r = await req("POST", "/gl/bootstrap", {});
    step("gl bootstrap", okHttp(r.status) || r.status === 409, `status=${r.status}`);
  }

  // Find or create demo agent
  let agentId = null;
  {
    const list = await req("GET", "/agents?limit=100");
    const rows = list.data?.data || list.data || [];
    const hit = Array.isArray(rows)
      ? rows.find((a) => a.email === DEMO_AGENT_EMAIL || a.phone === DEMO_AGENT_PHONE)
      : null;
    if (hit) {
      agentId = hit.id;
      step("demo agent exists", true, agentId);
    } else {
      const r = await req("POST", "/agents", {
        name: "Demo Travel Agent",
        phone: DEMO_AGENT_PHONE,
        email: DEMO_AGENT_EMAIL,
        commissionRateBps: 500,
      });
      agentId = r.data?.id || null;
      step("create demo agent", okHttp(r.status) && !!agentId, `status=${r.status}`);
    }
  }

  // Invite / reset portal account
  let agentTemp = null;
  {
    const r = await req("POST", `/agent-accounts/${agentId}`, { email: DEMO_AGENT_EMAIL });
    agentTemp = r.data?.tempPassword || null;
    step(
      "invite / reset agent portal",
      okHttp(r.status) && (r.data?.invited === true || r.data?.ok === true || !!agentTemp),
      `status=${r.status}`,
    );
  }

  // Agent login — try temp then known demo password
  let agentLoggedIn = false;
  for (const pwd of [agentTemp, DEMO_AGENT_PASSWORD].filter(Boolean)) {
    jar.delete("st_agent");
    const r = await req("POST", "/portal/agent/login", { email: DEMO_AGENT_EMAIL, password: pwd });
    if (okHttp(r.status) && r.data?.ok) {
      agentLoggedIn = true;
      if (r.data?.mustChangePassword) {
        const ch = await req("POST", "/portal/agent/change-password", {
          currentPassword: pwd,
          newPassword: DEMO_AGENT_PASSWORD,
        });
        step("agent set demo password", okHttp(ch.status), `status=${ch.status}`);
      } else {
        step("agent login", true, "using existing password");
      }
      break;
    }
  }
  if (!agentLoggedIn) {
    step("agent login", false, "could not login with temp or demo password");
  }

  // Agent creates customer + booking
  const stamp = Date.now().toString().slice(-8);
  let customerId = null;
  let caseId = null;
  let reference = null;
  {
    const r = await req("POST", "/portal/agent/customers", {
      fullName: `Demo Customer ${stamp}`,
      phone: `016${stamp}`,
      email: `demo.customer.${stamp}@example.com`,
    });
    customerId = r.data?.id || null;
    step("agent create customer", okHttp(r.status) && !!customerId, `status=${r.status}`);
  }
  {
    const r = await req("POST", "/portal/agent/cases", {
      serviceType: "visa",
      customerName: `Demo Case Customer ${stamp}`,
      customerPhone: `015${stamp}`,
      customerEmail: `demo.case.${stamp}@example.com`,
      title: `Demo Visa Booking ${stamp}`,
      message: "Full workflow demo — please process",
    });
    caseId = r.data?.id || null;
    reference = r.data?.reference || null;
    step("agent create booking", okHttp(r.status) && !!caseId, `ref=${reference || "?"} status=${r.status}`);
  }
  {
    const r = await req("GET", `/portal/agent/cases/${caseId}`);
    const stageCount = (r.data?.stages || []).length;
    step(
      "agent booking has workflow stages",
      okHttp(r.status) && stageCount > 0,
      `stages=${stageCount}`,
    );
  }
  await req("POST", "/portal/agent/logout", {});

  // Staff accepts: advance stages → approve
  {
    const r = await req("POST", "/auth/login", { email: EMAIL, password: PASS });
    step("staff re-login", okHttp(r.status), `status=${r.status}`);
  }

  {
    const r = await req("GET", `/applications/${caseId}`);
    step(
      "staff open agent booking",
      okHttp(r.status) && r.data?.agentId === agentId,
      `status=${r.data?.status} stages=${(r.data?.stages || []).length}`,
    );
  }

  {
    const r = await req("PUT", `/applications/${caseId}/visa`, {
      visaType: "tourist",
      destination: "China",
      embassy: "Chinese Embassy Dhaka",
      entryType: "single",
      durationDays: 30,
    });
    step("staff visa detail", okHttp(r.status), `status=${r.status}`);
  }

  {
    const adv = await advanceAllStages(caseId);
    step("staff advance all stages", adv.ok, adv.ok ? `stages=${adv.stages}` : adv.reason);
  }

  {
    const r = await req("POST", `/applications/${caseId}/approve`, {});
    step("staff approve booking", okHttp(r.status) && r.data?.status === "approved", `status=${r.data?.status || r.status}`);
  }

  // Finance: invoice + issue + payment
  let invoiceId = null;
  let accountId = null;
  {
    const acc = await req("GET", "/accounts");
    const rows = Array.isArray(acc.data) ? acc.data : acc.data?.data || [];
    accountId = rows[0]?.id || null;
    if (!accountId) {
      const gl = await req("GET", "/gl/accounts?active=true");
      const glRows = Array.isArray(gl.data) ? gl.data : [];
      accountId = glRows.find((a) => /cash|bank/i.test(a.name || a.code || ""))?.id || glRows[0]?.id;
    }
    step("finance account available", !!accountId, accountId ? "ok" : "none");
  }

  // Resolve customerId from application if agent customer path differed
  {
    const app = await req("GET", `/applications/${caseId}`);
    customerId = app.data?.customerId || customerId;
  }

  {
    const r = await req("POST", "/invoices", {
      customerId,
      applicationId: caseId,
      items: [
        { description: "China tourist visa processing", quantity: 1, unitPrice: 850000 },
        { description: "Service charge", quantity: 1, unitPrice: 150000 },
      ],
      notes: "Demo invoice for full workflow test",
    });
    invoiceId = r.data?.id || null;
    step("create invoice", okHttp(r.status) && !!invoiceId, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/invoices/${invoiceId}/issue`, {});
    step("issue invoice", okHttp(r.status), `status=${r.status} inv=${r.data?.status || ""}`);
  }
  {
    const r = await req("POST", "/payments", {
      invoiceId,
      amount: 1000000,
      method: "cash",
      accountId: accountId || undefined,
      note: "Demo customer payment",
    });
    step("record customer payment", okHttp(r.status), `status=${r.status}`);
  }

  // Optional AR bridge
  {
    const r = await req("POST", `/ar/bridge/invoice/${invoiceId}`, {});
    step(
      "AR bridge invoice",
      okHttp(r.status) || r.status === 404 || r.status === 409,
      `status=${r.status}`,
    );
  }

  // Commission
  let commissionId = null;
  {
    const r = await req("POST", "/commissions", {
      agentId,
      applicationId: caseId,
      invoiceId,
      amount: 50000,
      note: "Demo agent commission 5%",
    });
    commissionId = r.data?.id || null;
    step("create commission", okHttp(r.status) && !!commissionId, `status=${r.status}`);
  }
  {
    const r = await req("POST", `/commissions/${commissionId}/approve`, {});
    step("approve commission", okHttp(r.status), `status=${r.status}`);
  }
  {
    const r = await req("POST", `/commissions/${commissionId}/pay`, {});
    step("pay commission (wallet)", okHttp(r.status), `status=${r.status}`);
  }

  // Staff-created visa case (second booking) for dashboard volume
  let staffCaseId = null;
  {
    const cust = await req("POST", "/customers", {
      fullName: `Walk-in Demo ${stamp}`,
      phone: `017${stamp}`,
      email: `walkin.${stamp}@example.com`,
    });
    const cid = cust.data?.id;
    const app = await req("POST", "/applications", {
      serviceType: "visa",
      customerId: cid,
      title: `Staff Demo Visa ${stamp}`,
      source: "walkin",
    });
    staffCaseId = app.data?.id || null;
    step("staff create booking", okHttp(app.status) && !!staffCaseId, `status=${app.status}`);
  }

  // Agent finance view
  {
    await req("POST", "/portal/agent/login", {
      email: DEMO_AGENT_EMAIL,
      password: DEMO_AGENT_PASSWORD,
    });
    const fin = await req("GET", "/portal/agent/finance");
    step(
      "agent finance view",
      okHttp(fin.status) && Array.isArray(fin.data?.commissions) && Array.isArray(fin.data?.invoices),
      `commissions=${fin.data?.commissions?.length ?? "?"} invoices=${fin.data?.invoices?.length ?? "?"}`,
    );
    const dash = await req("GET", "/portal/agent/dashboard");
    step(
      "agent dashboard",
      okHttp(dash.status) && typeof dash.data?.walletBalance === "number",
      `wallet=${dash.data?.walletBalance}`,
    );
  }

  const failed = steps.filter((s) => !s.pass);
  console.log("\n========== DEMO DATA SUMMARY ==========");
  console.log(
    JSON.stringify(
      {
        agentId,
        agentEmail: DEMO_AGENT_EMAIL,
        agentPassword: DEMO_AGENT_PASSWORD,
        agentBookingId: caseId,
        agentBookingRef: reference,
        invoiceId,
        commissionId,
        staffCaseId,
        customerId,
        erpLogin: "https://shanghaitravels.com.bd/erp/#/login",
        agentPortal: "https://shanghaitravels.com.bd/erp/#/portal/agent/login",
      },
      null,
      2,
    ),
  );
  console.log(`\n${steps.length - failed.length}/${steps.length} checks passed`);
  if (failed.length) {
    console.log("Failed:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
  console.log("\nREADY — demo workflow completed successfully.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
