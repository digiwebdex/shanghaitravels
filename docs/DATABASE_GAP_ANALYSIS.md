# Database Gap Analysis — TravelOS

**Audit date:** 2026-07-30  
**Schema source:** `/opt/shanghai-erp-api/prisma/schema.prisma`  
**Prod DB:** `st_erp_prod` (Postgres)  
**Migrations applied:** `001` … `011` (foundation → reference/direction)

---

## 1. Snapshot (prod)

| Metric | Value (audit) |
|---|---|
| User tables | ~55 (+ `_prisma_migrations`) |
| Users | 17 |
| Customers | 5 |
| Applications | 8 |
| Invoices | 2 |
| Permissions | 55 |
| Workflow templates | 15 |
| Countries | 199 |

Database is **production-capable and sparsely populated** — suitable for proving real workflows.

---

## 2. Model coverage vs product modules

### 2.1 Platform / RBAC — COMPLETE

Organization, Branch, Role, Permission, RolePermission, UserPermission, User, RefreshToken, PasswordReset, AuditLog.

### 2.2 Case spine — COMPLETE

Application (+ direction, agentId, soft-delete), ApplicationStage, ApplicationEvent, ApplicationDocument, Document, Task, WorkflowTemplate, WorkflowTemplateStage.

**Service detail tables — COMPLETE for 13 service types:**

VisaDetail, AirTicketDetail, HotelDetail, TourPackageDetail, TransportDetail, HajjUmrahDetail, StudentDetail, MedicalDetail, ImmigrationDetail, InsuranceDetail, WorkDetail.

### 2.3 CRM / customers — COMPLETE

Customer, Passport, Lead, Communication.

### 2.4 Finance — COMPLETE (cash-basis scope)

Account, Invoice, InvoiceItem, Payment, Expense, LedgerEntry.

### 2.5 Partners — COMPLETE (staff-managed)

Supplier, Agent, AgentWalletTxn, Commission, CorporateClient.

### 2.6 Agent portal auth — COMPLETE

AgentUser, AgentRefreshToken.

### 2.7 HR — COMPLETE

Employee, SalaryPayment.

### 2.8 CMS / settings / notifications — COMPLETE

CmsPage, Setting, Notification.

### 2.9 OCR — COMPLETE

OcrScan + OcrStatus / OcrDocType / OcrSource enums.

### 2.10 Reference data — COMPLETE

Country, Airline, Hotel, University.

---

## 3. Gaps vs Figma / product wish-list

| Needed concept (Figma / spec) | DB status | Recommendation |
|---|---|---|
| Customer portal users | MISSING | New `CustomerUser` + refresh tokens (mirror AgentUser) when portal prioritized |
| Corporate portal users | MISSING | Deferred with portal |
| Supplier portal users | MISSING | Deferred with portal |
| Agent passengers book | MISSING | Optional `Passenger` model or reuse Customer linked to agent |
| Internal chat threads/messages | MISSING | New module or cut from scope |
| Staff calendar / appointments | MISSING | Could reuse Task.dueAt initially; dedicated CalendarEvent later |
| Payment gateway intents | MISSING | `PaymentIntent` / provider refs when online pay added |
| Document verification checklist per case | PARTIAL | Settings `china_visa_checklist` + docs; no per-item checklist table |
| Notification templates | MISSING | Optional; outbox stores ad-hoc messages today |
| Multi-currency amounts | OUT OF SCOPE | `Organization.currency` default BDT |
| Inventory / GDS cache | OUT OF SCOPE | — |
| Manpower job orders / BMET | ON HOLD | Do not add until owner decides |
| Soft-delete on all entities | PARTIAL | Present on critical ones; audit when adding models |
| Full immutable audit of money edits | PARTIAL | LedgerEntry + AuditLog; strengthen if accountants require |

---

## 4. Enum alignment notes

| Enum | Notes |
|---|---|
| ServiceType | Includes `work` and `corporate`; Figma admin lacks dedicated Work module screen |
| CaseStatus | Richer than Figma pills (includes `docs_required`, `on_hold`, `submitted`) — UI must support |
| CaseDirection | inbound/outbound — visa-admin uses; Figma mocks often ignore |
| CommissionStatus / WalletTxnType | Match agent wallet UX |
| InvoiceStatus | Includes void/cancelled — wire carefully |

---

## 5. Data quality / operational risks

1. **Sparse prod data** — good for clean go-live; bad if UI assumes dense dashboards (use empty states).  
2. **OCR storage growth** — when enabled, need retention policy (TTL on `OcrScan` + files).  
3. **Branch model underused** — Figma shows UAE branches; seed likely Bangladesh HQ — align seed/settings.  
4. **Legacy auth users** — separate from Nest `User` table until cutover.  
5. **Money integrity** — amounts are Int minor units; frontend must never send floats.  
6. **Agent.email vs AgentUser.email** — documented reserved use; keep distinct.

---

## 6. Migration hygiene

| Item | Status |
|---|---|
| Additive migrations 001–011 | Present on staging source |
| Prod migrate deploy | Applied through 011 historically |
| Shadow-DB verified chain | Documented through phase 7/8 |
| Agent portal / OCR | Have numbered migrations (009, 010) |
| Seed idempotency | `prisma/seed.ts` designed idempotent |

**Rule for new work:** additive migrations only; staging first; backup before prod migrate.

---

## 7. Recommended schema work by roadmap phase

| Phase | Schema change |
|---|---|
| Admin ERP wiring (visa → finance) | **None** |
| Agent portal UI | **None** (invite AgentUsers) |
| Customer portal | `CustomerUser`, `CustomerRefreshToken` (+ optional link to Customer) |
| Notifications go-live | Optional `NotificationTemplate`; delivery attempt fields |
| OCR go-live | Retention columns / cleanup job (may be ops-only) |
| Online payments | Provider tables |
| Chat / calendar | New models only if owner keeps those Figma screens in scope |

---

## 8. Verdict

The database **already supports the TravelOS Application-spine product** described in the phase specs. Gaps are concentrated in **external portal identity**, **collaboration features (chat/calendar)**, and **payment-provider** concerns — not in the core ERP schema.
