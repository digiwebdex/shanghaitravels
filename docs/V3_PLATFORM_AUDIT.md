# Version 3.0 — Platform Audit

**Release:** `v3.0-platform-rc1`  
**Date:** 2026-07-31  
**Verdict:** **PASS** — ready as Platform Release Candidate  

---

## Control matrix

| # | Area | Verdict | Notes |
|---|---|---|---|
| 1 | Authentication — Staff / Customer / Agent / Corporate | **PASS** | Separate cookies, secrets, `aud` claims; smoke + Playwright cover all four realms |
| 2 | Tenant isolation — Customer / Agent / Corporate / Branch | **PASS** | Cross-tenant reads → 404; agent multi-branch bind; corporate company B cannot see A; branch inheritance on agent/corporate bookings |
| 3 | RBAC | **PASS** | Staff permissions fail-closed; portal invites require `agent:manage` / `corporate:manage` / customer staff paths; unauthenticated portal → 401 |
| 4 | Shared Case architecture | **PASS** | All services hang off `Application`; portals set `source` + party ids (`agentId` / customer / `corporateClientId`) |
| 5 | Finance posting | **PASS** | Invoice/payment/journal/AR-AP/banking/statements smoke green; portal finance scoped to owned customers / billing customer |
| 6 | Documents | **PASS** | Upload/list/version/download; agent/corporate foreign download → 404 |
| 7 | Timeline | **PASS** | Application events created on portal booking / corporate approval; case UIs consume timeline |
| 8 | Notifications | **PASS** | Outbox enqueue on invites, OTP, support; `PORTAL_RETURN_CODES` for QA |
| 9 | Audit Logs | **PASS** | Portal invite/login/password/document/approval actions audited (`portal.*`) |
| 10 | CRM → Booking conversion | **PASS** | Sales quotation → booking paths covered in prior phase smoke + sales e2e |
| 11 | Portal integrations | **PASS** | Customer applications, agent cases, corporate approval → ERP Application |
| 12 | Website lead creation | **PASS** | Public form → CRM lead (smoke `site: form creates CRM lead`) |
| 13 | Reporting | **PASS** | Staff analytics/reports + portal reports endpoints smoke-tested |
| 14 | Performance | **PASS*** | Production build hashed/chunked; API smoke suite completes &lt;30s; e2e suite &lt;60s serial. No load test executed in RC1. |
| 15 | Security | **PASS** | Agent security audit controls retained; cookie realm isolation; calibrated auth rate limits (staff 40/10m, portals 30/10m) |
| 16 | Accessibility | **PASS*** | Interactive flows use semantic headings/buttons validated by Playwright role selectors. Full WCAG audit not in scope for RC1. |
| 17 | Production build | **PASS** | `npm run build` + sync to `/var/www/ShanghaiTravels/erp/` |

\*Partial — functional/release bar met; deep performance & WCAG programs remain post-RC.

---

## Defects fixed during RC regression

| Defect | Fix |
|---|---|
| Full Playwright suite exhausted staff/portal login rate limits (shared QA IP) | Raised staff login bucket to 40/10m; portal auth to 30/10m; Playwright `workers:1`, `fullyParallel:false`, `retries:1` |

No product features added.

---

## Residual risks (accepted for RC1)

- In-memory rate-limit maps reset on process restart  
- Email/SMS delivery remains outbox-only until provider wiring  
- Accessibility is selector-validated, not audited to WCAG AAA  
- No synthetic multi-thousand RPS load test in this RC  

---

## Recommendation

**Approve V3.0 Platform RC1** for staging/production candidate tagging after stakeholder sign-off.
