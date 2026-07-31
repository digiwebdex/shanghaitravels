# Phase G1 — Agent Portal Security Audit

**Date:** 2026-07-31  
**Branch:** `feature/phase-g-agent-portal`  
**Scope:** Security verification only (no feature work)  
**Verdict:** **PASS** — approved for production from a security-control standpoint after defect remediation below  

---

## Verification matrix

| # | Control | Result | Evidence |
|---|---|---|---|
| 1 | Agent cannot access another agent's customers | **PASS** | `GET /portal/agent/customers/:id` scoped via `ownedCustomerIds` + `assertCustomer`; foreign ID → **404**. Smoke `agent-sec: B cannot read A customer`; Playwright security. |
| 2 | Agent cannot access another branch's data unless permitted | **PASS** | New bookings inherit agent `branchId`; Agent A=`br-corporate`, B=`br-head`. Cross-agent reads still blocked by `agentId`. Smoke branch bind + booking `branchId` checks. |
| 3 | Agent cannot download another agent's documents | **PASS** | `assertDocAccess` requires document owner application with matching `agentId`. Foreign download/versions → **404**. Smoke + Playwright. |
| 4 | Agent cannot access another customer's invoices | **PASS** | Finance invoices filtered to `ownedCustomerIds`. B's finance excludes A's invoice. Smoke `agent-sec: B cannot see A customer invoices`. |
| 5 | Agent cannot manipulate Application IDs | **PASS** | `caseGet` / document upload require `{ id, agentId }`. Foreign `applicationId` upload → **400**. Client `customerId` on create rejected. |
| 6 | All portal APIs validate `agentId` on the server | **PASS** | `AgentJwtGuard` loads `agentId` from DB (`AgentUser`), not client body. JWT `payload.agentId` must match DB when present. Controllers pass `a.agentId` into service queries. |
| 7 | File downloads are permission checked | **PASS** | Download path calls `assertDocAccess` before `storage.get`. |
| 8 | Audit log records every agent action | **PASS*** | Mutating + auth + download actions audited (`portal.agent.*`). Read-only list/get endpoints intentionally not audited (same pattern as Customer Portal). |
| 9 | Session cookies isolated from Staff / Customer | **PASS** | Cookies: `st_agent` / `st_agent_refresh` vs `st_access` / `st_refresh` vs `st_customer` / `st_customer_refresh`. Distinct JWT secrets + `aud:"agent"`. Cross-realm → **401**. |
| 10 | RBAC enforced on every endpoint | **PASS** | Public auth routes rate-limited; portal routes `@UseGuards(AgentJwtGuard)`; staff invite `POST /agent-accounts/:id` requires `agent:manage`. Unauthenticated portal → **401**. |

\*“Every action” interpreted as security-relevant write/auth/download events; not every GET list.

---

## Defects found and fixed

| Defect | Risk | Fix |
|---|---|---|
| `createCase` reused any customer matching phone | Cross-agent ownership + invoice leakage | Reuse only if already owned; else **400** `Customer phone already exists` |
| Client could send `customerId` on booking create | Future IDOR footgun | Reject `customerId` in body (**400**) |
| Document denial returned **403** | Existence oracle | Foreign/unauthorized docs → **404** |
| Customer denial returned **403** | Existence oracle | Foreign customers → **404** |
| Document version upload path missing audit | Incomplete audit trail | Audit on versioned upload |
| Document download not audited | Incomplete audit trail | `portal.agent.document_download` |
| Passport upsert not audited | Incomplete audit trail | `portal.agent.passport_upsert` |
| Auth events not audited | Incomplete audit trail | login / logout / password_change / password_reset / otp_login |
| JWT `agentId` claim unused | Token/agent reassignment drift | Guard requires `payload.agentId === au.agentId` when claim present |

---

## Cookie / token isolation model

| Realm | Access cookie | Refresh cookie | JWT secret | `aud` |
|---|---|---|---|---|
| Staff | `st_access` | `st_refresh` | `JWT_ACCESS_SECRET` | staff (default) |
| Customer | `st_customer` | `st_customer_refresh` | `JWT_CUSTOMER_SECRET` | `customer` |
| Agent | `st_agent` | `st_agent_refresh` | `JWT_AGENT_SECRET` | `agent` |

Agent portal controllers are `@Public()` for the global staff guard, then explicitly protected by `AgentJwtGuard`.

---

## Quality gates (this audit)

```
npm run test:api           ✅  283/283 staging (includes agent-sec:*)
npm run test:api:prod      ✅  283/283
npx playwright test \
  tests/e2e/portal-agent-security.spec.ts   ✅
```

API redeployed to staging `:4201` and production `:4200` after security fixes.

---

## Residual notes (non-blocking)

- Agent auth endpoints share an in-memory IP rate limit (8 / 10 min). Heavy QA runs can **429** until process restart or window expiry — availability control, not authz bypass.
- Read-only GETs (dashboard, lists) are not individually audit-logged; creates/uploads/downloads/auth are.
- Branch isolation is enforced primarily via per-agent `agentId` scoping plus booking `branchId` inheritance; agents do not receive staff multi-branch role expansion.

---

## Explicit stop

No Corporate Portal, HR, AI, Mobile, or schedule-execution work performed.
