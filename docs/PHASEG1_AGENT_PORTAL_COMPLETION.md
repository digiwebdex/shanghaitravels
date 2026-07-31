# Phase G1 — Agent Portal Completion Report

**Completed:** 2026-07-31  
**Branch:** `feature/phase-g-agent-portal`  
**Baseline:** `v2.9-customer-portal`  
**Module:** Agent Portal  
**Status:** Production-complete for Phase G1 scope  

---

## Business model

Secure B2B self-service portal for travel agents — bookings, customers, wallet/commissions, documents, communications, and reports — integrated with the ERP Application spine. Reuses Authentication patterns, staff RBAC (`agent:manage` invite), CRM Customer, Travel Operations cases, Finance (wallet / commission / invoices / payments), Documents + versions, Timeline events, Communications, Notifications outbox, and AuditLog. No redesign of completed modules.

---

## Scope delivered

| Area | Delivery |
|---|---|
| Authentication | Dedicated agent login, staff invitation, password reset, OTP login, mustChangePassword gate, multi-branch (`Agent.branchId`) |
| Dashboard | Active bookings, pending quotations, wallet, outstanding invoices, notifications, sales summary |
| Bookings | Visa, air ticket, hotel, transport, tour, Hajj & Umrah — list, detail, create (`source=agent_portal`) |
| Customers | Own customers only; passport profiles; traveller profiles (`CustomerSavedTraveller`) |
| Finance | Wallet, commission ledger, invoices, payments, statement |
| Documents | Upload, download, version history |
| Communications | Messages timeline, support tickets |
| Reports | Sales, commissions, outstanding, booking history |
| Isolation | `JWT_AGENT_SECRET` + `st_agent` / `st_agent_refresh` + `aud:"agent"` |

---

## Product rules honored

- Agents only access customers/bookings scoped by `agentId` / `createdBy=agent:{id}`  
- Branch-based permissions via optional `Agent.branchId` on new bookings  
- Customer Portal / staff realms untouched  
- Corporate Portal, HR, AI, Mobile, schedule execution **not** started  
- Email/SMS delivery remains outbox-only (`PORTAL_RETURN_CODES` for QA code echo)  

---

## Database (additive)

- `Agent.branchId` (optional FK)  
- `AgentAuthCode` (password_reset / login_otp)  
- `AgentSupportRequest`  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260801010000_026_agent_portal/`  
- Applied staging + production  

## Backend

- Nest SoT: `/opt/shanghai-erp-api/src/agent-portal/`  
- Controllers: `portal/agent` (public auth + `AgentJwtGuard`), `agent-accounts` (staff invite)  
- Deployed staging `:4201` + prod `:4200` (nginx `/api2`)  

---

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/portal/agent/login` | Login (+ OTP) |
| `/#/portal/agent/forgot` | Password reset |
| `/#/portal/agent` | Dashboard |
| `/#/portal/agent/bookings` | Bookings |
| `/#/portal/agent/customers` | Customers |
| `/#/portal/agent/finance` | Finance |
| `/#/portal/agent/documents` | Documents |
| `/#/portal/agent/communications` | Messages / support |
| `/#/portal/agent/reports` | Reports |

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (42 unit tests)
npm run test:api      ✅  260/260 staging
npm run test:api:prod ✅  260/260
npm run test:e2e      ✅  portal-agent Playwright
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASEG1_AGENT_PORTAL_DESIGN.md`

---

## Explicit stop

Do **not** begin Corporate Portal, HR, AI, Mobile, or the report schedule execution engine.
