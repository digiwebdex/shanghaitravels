# Phase H1 — Corporate Portal Technical Design

**Branch:** `feature/phase-h-corporate-portal`  
**Baseline:** `v3.0-agent-portal`  
**Goal:** Secure B2B Corporate Travel Portal  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Reuse | Auth patterns, RBAC (`corporate:manage` invite), Branch, CRM CorporateClient, Application spine, Travel Ops, Finance (Invoice/Payment on billing Customer), Documents, Timeline, Notifications, Communications, AuditLog, Analytics read models |
| Isolation | Separate JWT realm; all queries scoped by `corporateClientId` |
| Staff invite | `POST /corporate-accounts/:corporateClientId` |
| UI | TravelOS `/#/portal/corporate/*` |

### Explicit non-goals

- HR module redesign, AI, Mobile, report schedule execution  
- Redesign of completed portals / CRM / Ops / Finance  

---

## 2. Auth

| Item | Value |
|---|---|
| Cookies | `st_corporate` / `st_corporate_refresh` |
| Secret | `JWT_CORPORATE_SECRET` + `aud:"corporate"` |
| Flows | Login, staff invitation, password reset, OTP, mustChangePassword |
| Tenant | Multi-company via `CorporateUser.corporateClientId` |

---

## 3. Domain model (additive)

- Extend `CorporateClient` — billing address, preferred services, `billingCustomerId`, branch mapping  
- `CorporateUser` / refresh / auth codes — portal login + role  
- `CorporateEmployee` — directory (≠ HR `Employee`), passports, emergency, frequent flag  
- `CorporateApprovalChain` + steps — configurable multi-level approval  
- `CorporateTravelRequest` + `CorporateTravelApproval` — request lifecycle  
- `Application.corporateClientId` — ERP booking after Travel Desk approval  
- `CorporateSupportRequest`, `CorporateAnnouncement`  

Billing reuses Finance via a corporate `Customer` (`type=corporate`) linked as `billingCustomerId`.

---

## 4. API (`/portal/corporate`)

```
Auth: login, refresh, logout, forgot/reset, otp
GET  me, dashboard, company (profile)
GET|PATCH company
GET|POST employees, passports, emergency
GET|POST|PATCH travel-requests (+ submit)
GET|POST approvals (approve/reject)
GET  bookings / applications (ERP cases)
GET|POST documents
GET  finance (invoices, statements, credit utilization)
GET|POST communications / support / announcements
GET  reports
GET|PUT approval-chain (admin)
```

Staff: `POST /corporate-accounts/:id`

---

## 5. Approval flow

Employee → Manager → Department Head → Finance → Travel Desk → ERP Application (`source=corporate_portal`).

Configurable chain per company; default seeded on first invite.

Statuses: `draft | submitted | approved | rejected | cancelled | completed`

---

## 6. Frontend routes

`/#/portal/corporate/login|forgot` + layout: dashboard, company, employees, requests, approvals, bookings, finance, communications, reports.
