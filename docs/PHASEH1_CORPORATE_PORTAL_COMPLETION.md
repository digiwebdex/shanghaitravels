# Phase H1 — Corporate Portal Completion Report

**Completed:** 2026-07-31  
**Branch:** `feature/phase-h-corporate-portal`  
**Baseline:** `v3.0-agent-portal`  
**Module:** Corporate Portal  
**Status:** Production-complete for Phase H1 scope  

---

## Business model

Secure B2B Corporate Travel Portal — company profile, employee directory, multi-level travel request approvals, ERP booking handoff, consolidated finance, communications, and reports. Reuses Authentication patterns, RBAC (`corporate:manage` invite), Branch mapping, CRM `CorporateClient`, Application spine (`corporateClientId`), Travel Operations, Finance (Invoice/Payment via billing `Customer`), Documents, Timeline, Notifications, Communications, AuditLog. Does **not** reuse HR `Employee` for travellers.

---

## Scope delivered

| Area | Delivery |
|---|---|
| Authentication | Corporate login, staff invitation, password reset, OTP, mustChangePassword, multi-company isolation |
| Company profile | Billing address, contacts, credit limit, payment terms, preferred services, branch mapping |
| Employee directory | Employees, departments, designations, passport, frequent travellers, emergency contacts |
| Travel requests | Visa / air ticket / hotel / transport / tour — draft → submitted → approved/rejected/cancelled/completed |
| Approval workflow | Configurable chain (default Manager → Dept Head → Finance → Travel Desk → ERP Application) |
| Booking tracking | Applications with progress, documents, timeline |
| Finance | Corporate invoices, outstanding, payment history, credit utilization |
| Communications | Messages, announcements, support tickets |
| Reports | Travel / bookings / finance utilization summaries |
| Isolation | `JWT_CORPORATE_SECRET` + `st_corporate` / `st_corporate_refresh` + `aud:"corporate"` |

---

## Product rules honored

- Strict tenant isolation by `corporateClientId`  
- No redesign of completed modules  
- HR / AI / Mobile / schedule execution **not** started  

---

## Database (additive)

- Extended `CorporateClient` (`billingAddress`, `preferredServices`, `billingCustomerId`)  
- `Application.corporateClientId`  
- `CorporateUser`, refresh tokens, auth codes  
- `CorporateEmployee` + emergency contacts  
- Approval chain / steps, travel requests / approvals  
- Support requests, announcements  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260801020000_027_corporate_portal/`  
- Applied staging + production  

## Backend

- Nest SoT: `/opt/shanghai-erp-api/src/corporate-portal/`  
- Controllers: `portal/corporate` (public auth + `CorporateJwtGuard`), `corporate-accounts` (staff invite)  
- Deployed staging `:4201` + prod `:4200` / `/api2`  
- Env: `JWT_CORPORATE_SECRET`  

---

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/portal/corporate/login` | Login (+ OTP) |
| `/#/portal/corporate/forgot` | Password reset |
| `/#/portal/corporate` | Dashboard |
| `/#/portal/corporate/company` | Company profile |
| `/#/portal/corporate/employees` | Employee directory |
| `/#/portal/corporate/requests` | Travel requests |
| `/#/portal/corporate/approvals` | Approval queue |
| `/#/portal/corporate/bookings` | ERP bookings |
| `/#/portal/corporate/finance` | Finance / credit |
| `/#/portal/corporate/communications` | Messages / support |
| `/#/portal/corporate/reports` | Reports |

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (43 unit tests)
npm run test:api      ✅  311/311 staging
npm run test:api:prod ✅  311/311
npm run test:e2e      ✅  portal-corporate Playwright
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASEH1_CORPORATE_PORTAL_DESIGN.md`

---

## Explicit stop

Do **not** begin HR, AI, Mobile, or the report schedule execution engine.
