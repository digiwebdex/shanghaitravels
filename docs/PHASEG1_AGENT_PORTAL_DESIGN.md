# Phase G1 — Agent Portal Technical Design

**Branch:** `feature/phase-g-agent-portal`  
**Baseline:** `v2.9-customer-portal`  
**Goal:** Secure B2B self-service portal for travel agents  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Reuse | Existing `/portal/agent` JWT realm (`JWT_AGENT_SECRET`, `st_agent`), AgentUser invite, Application spine (`agentId`), Commission, AgentWalletTxn, Documents, Communications, Notifications, AuditLog |
| Isolation | Agent tokens never satisfy staff/customer guards; all queries scoped by `agentId` |
| Staff invite | `POST /agent-accounts/:agentId` (`agent:manage`) — invitation / password reset seed |
| UI | TravelOS `/#/portal/agent/*` |

### Explicit non-goals

- Corporate Portal, HR, AI, Mobile, schedule execution  
- Redesign of CRM / Ops / Finance / Customer Portal modules  

---

## 2. Auth

| Item | Value |
|---|---|
| Cookies | `st_agent` / `st_agent_refresh` (unchanged paths) |
| Flows | Login, invite (staff), password reset, OTP, mustChangePassword gate |
| Multi-branch | Optional `Agent.branchId`; new bookings inherit agent branch |

New: `AgentAuthCode` for password_reset / login_otp (codes echoed when `PORTAL_RETURN_CODES=true`).

---

## 3. API additions (`/portal/agent`)

```
# Auth
POST forgot-password, reset-password, otp/request, otp/verify

# Portal
GET  dashboard (bookings, quotes, wallet, outstanding, notifications, sales)
GET|POST customers[/:id], passports, travellers (CustomerSavedTraveller)
GET|POST cases (bookings) — all service types
GET  finance (wallet, commissions, invoices, payments, statement)
GET|POST documents[+ versions/download]
GET|POST communications / support
GET  reports (sales, commissions, outstanding, booking history)
```

---

## 4. Business rules

- Agents only see customers linked via their applications or `createdBy=agent:{id}`  
- Bookings always set `agentId` + `source=agent_portal`  
- Branch filter: applications use agent’s `branchId` when set  

---

## 5. Frontend routes

`/#/portal/agent/login|forgot` + authenticated layout: dashboard, bookings, customers, finance, documents, communications, reports.
