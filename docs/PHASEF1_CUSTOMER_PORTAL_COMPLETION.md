# Phase F1 — Customer Portal Completion Report

**Completed:** 2026-07-31  
**Branch:** `feature/phase-f-customer-portal`  
**Baseline:** `v2.8-website-cms`  
**Module:** Customer Portal  
**Status:** Production-complete for Phase F1 scope  

---

## Business model

Secure self-service portal for customers — applications, documents, finance, communications, and profile — integrated with the ERP Application spine. Reuses Auth patterns, RBAC (staff invite), CRM Customer, Travel Operations cases, Finance invoices/payments, Documents storage, Communications timeline, Notifications outbox, and AuditLog. No redesign of completed modules.

---

## Scope delivered

| Area | Delivery |
|---|---|
| Authentication | Register, login, password reset, email verification, OTP login, change password, profile |
| Dashboard | Active apps, invoices, outstanding, communications, notifications, support |
| Applications | Visa / air ticket / hotel / transport / tour / Hajj & Umrah — list, detail, create |
| Documents | Upload, download, version history, status |
| Finance | Invoices, receipts, payment history, outstanding balances |
| Communications | Messages timeline, support requests |
| Profile | Passport, family, saved travellers, emergency contacts |
| Reports | Booking history, payment history, downloadable documents |
| Isolation | `JWT_CUSTOMER_SECRET` + `st_customer` / `st_customer_refresh` + `aud:"customer"` |

---

## Product rules honored

- Staff and agent auth realms untouched  
- Agent Portal UI / Corporate Portal / HR / AI / Mobile / schedule execution **not** started  
- Email/SMS delivery remains outbox-only (`PORTAL_RETURN_CODES` for QA code echo)  

---

## Database (additive)

- `CustomerUser`, `CustomerRefreshToken`, `CustomerAuthCode`  
- `CustomerFamilyMember`, `CustomerSavedTraveller`, `CustomerEmergencyContact`  
- `CustomerSupportRequest`, `DocumentVersion`  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260731340000_025_customer_portal/`  
- Applied staging + production  

## Backend

- Nest SoT: `/opt/shanghai-erp-api/src/customer-portal/`  
- Controllers: `portal/customer` (public + CustomerJwtGuard), `customer-accounts` (staff invite)  
- Deployed staging `:4201` + prod `:4200` / `/api2`  

---

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/portal/customer/login` | Login (+ OTP) |
| `/#/portal/customer/register` | Registration |
| `/#/portal/customer/verify` | Email verification |
| `/#/portal/customer/forgot` | Password reset |
| `/#/portal/customer` | Dashboard |
| `/#/portal/customer/applications` | Applications |
| `/#/portal/customer/documents` | Documents |
| `/#/portal/customer/finance` | Finance |
| `/#/portal/customer/communications` | Messages / support |
| `/#/portal/customer/profile` | Profile |
| `/#/portal/customer/reports` | Reports |

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (41 unit tests)
npm run test:api      ✅  234/234 staging
npm run test:api:prod ✅  234/234
npm run test:e2e      ✅  portal-customer Playwright
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASEF1_CUSTOMER_PORTAL_DESIGN.md`

---

## Explicit stop

Do **not** begin Agent Portal UI, Corporate Portal, HR, AI, Mobile, or the report schedule execution engine.
