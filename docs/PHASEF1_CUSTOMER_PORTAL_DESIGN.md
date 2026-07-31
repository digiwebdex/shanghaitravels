# Phase F1 — Customer Portal Technical Design

**Branch:** `feature/phase-f-customer-portal`  
**Baseline:** `v2.8-website-cms`  
**Goal:** Secure self-service portal for customers, integrated with ERP data  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Reuse | Auth patterns (argon2, opaque refresh), RBAC (staff admin), CRM Customer, Applications spine, Finance invoices/payments, Documents storage, Comms timeline, Notifications outbox, AuditLog |
| Isolation | Separate JWT secret + cookies + `aud:"customer"` — never staff/agent tokens |
| Admin API | Staff `POST /customer-accounts/:customerId` (`customer:manage`) invite/reset |
| Portal API | Nest `@Controller("portal/customer")` — `@Public()` + `CustomerJwtGuard` |
| UI | TravelOS hash routes `/#/portal/customer/*` |

### Explicit non-goals

- Agent Portal UI work, Corporate Portal, HR, AI, Mobile apps  
- Analytics schedule execution engine  
- Redesign of CRM / Ops / Finance / CMS modules  
- Live email/SMS delivery (outbox enqueue only; codes echoable when `PORTAL_RETURN_CODES=true`)

---

## 2. Auth realm

| Item | Value |
|---|---|
| Access cookie | `st_customer` path `/` |
| Refresh cookie | `st_customer_refresh` path `/api/portal/customer` |
| Secret | `JWT_CUSTOMER_SECRET` |
| Claim | `{ sub: customerUserId, customerId, aud: "customer" }` |

Flows: register → email verify (OTP/code) → login; password reset via code; optional SMS/email OTP login assist; profile + change password.

---

## 3. Domain (additive)

| Entity | Purpose |
|---|---|
| `CustomerUser` | Portal login linked to `Customer` |
| `CustomerRefreshToken` | Session rotation |
| `CustomerAuthCode` | email_verify / password_reset / otp (hashed, TTL) |
| `CustomerFamilyMember` | Family members |
| `CustomerSavedTraveller` | Saved travellers |
| `CustomerEmergencyContact` | Emergency contacts |
| `CustomerSupportRequest` | Support tickets → staff notifications |
| `DocumentVersion` | Document version history snapshots |

---

## 4. API surface

```
# Public auth
POST /portal/customer/register
POST /portal/customer/verify-email
POST /portal/customer/login
POST /portal/customer/refresh
POST /portal/customer/logout
POST /portal/customer/forgot-password
POST /portal/customer/reset-password
POST /portal/customer/otp/request
POST /portal/customer/otp/verify

# Authenticated (CustomerJwtGuard)
GET  /portal/customer/me
POST /portal/customer/change-password
PATCH /portal/customer/profile
GET  /portal/customer/dashboard
GET|POST /portal/customer/applications[/:id]
GET|POST /portal/customer/documents[/:id/download]
GET  /portal/customer/finance/*
GET  /portal/customer/communications
POST /portal/customer/support
GET|POST /portal/customer/profile/*
GET  /portal/customer/reports/*

# Staff
POST /customer-accounts/:customerId
```

All portal data queries scoped by `customerId` from JWT.

---

## 5. Frontend routes

| Path | Purpose |
|---|---|
| `/#/portal/customer/login` | Login |
| `/#/portal/customer/register` | Registration |
| `/#/portal/customer/verify` | Email verification |
| `/#/portal/customer/forgot` | Password reset request |
| `/#/portal/customer` | Dashboard |
| `/#/portal/customer/applications` | Applications list/detail/new |
| `/#/portal/customer/documents` | Documents |
| `/#/portal/customer/finance` | Invoices / payments |
| `/#/portal/customer/communications` | Messages / support |
| `/#/portal/customer/profile` | Passport, family, travellers, emergency |
| `/#/portal/customer/reports` | Booking / payment history |

---

## 6. Forms → ERP

New applications create real `Application` rows (`source=customer_portal`). Document uploads write `Document` (+ version). Support requests notify staff via Notifications outbox.
