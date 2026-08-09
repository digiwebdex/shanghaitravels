# FINAL WORKFLOW AUDIT — Shanghai Travels ERP

Read-only audit performed against the running production system before any change.
Date: 2026-08-09. Baseline commit: `f8f04c8`.

---

## 1. Current architecture (measured, not assumed)

| Layer | Measured |
|---|---|
| Backend | NestJS 11 + Prisma 6.3.0 + PostgreSQL 16 · `/opt/st-erp-api` · `st-erp-api.service` :4200 as `www-data` |
| API surface | **617 routes** across 49 controllers · 76 distinct permission guards |
| Permissions | **88** keys · **7** roles (super_admin 88 → visa_executive 13) |
| Schema | **155 tables**, 2,118 columns, 490 indexes, 145 FKs (all validated), 39 migrations |
| Workflows | 15 templates; the 9 main services run **11 stages** each |
| Frontend | `apps/web` React 18 + Vite, 149 pages, ~200 routes, hash router, served at `/erp/` |
| Messaging | Gmail SMTP **LIVE** (`COMMS_SIMULATE_DELIVERY=0`); WhatsApp/SMS adapters present, **not configured** |
| Money | integer poisha (100 = ৳1) |

---

## 2. Final architecture mapping — what already exists vs what is missing

| Final workflow step | Status | Evidence |
|---|---|---|
| LEAD (7 sources, statuses, follow-up) | **A — exists** | `Lead` + `/crm/leads`, sources `web/walkin/phone/whatsapp/facebook/referral` |
| QUALIFY (opportunity, activities) | **A — exists** | `Opportunity` stages, `CrmActivity` types |
| CONVERT → CUSTOMER | **A — exists, limited** | `POST /crm/convert` (`crm:convert`) — accepts only visa, air_ticket, hotel, tour, hajj, umrah |
| CUSTOMER | **A — exists** | `Customer`, CUS- code, Customer 360 |
| **ASSIGN AGENT (ownership)** | **A — exists, complete** | `GET/POST /customers/:id/ownership[/assign|/release|/secondary]` (`agent:manage`) + `CustomerOwnershipCard.tsx` with history |
| DOCUMENTS + OCR | **A — exists** | 11 doc types, duplicate check, `ocr:use`→scan / `ocr:apply`→write, Document Intelligence |
| BOOKING | **A — exists** | `Application` + 10-step unified wizard |
| SERVICE (8 verticals) | **A — exists** | dedicated queues + 11-stage templates |
| **SUPPLIER per booking/service** | **🔴 C — MISSING** | `Application` has **no** `supplierId`, **no** cost, **no** selling price. Booking 360 "Supplier" tab is a **placeholder stub** that links to `/suppliers` (a route that does not exist; real route is `/partners/suppliers`). Only `HajjUmrahDetail` carries `supplierCostPoisha`/`sellingPricePoisha` |
| SUPPLIER COST → SUPPLIER DUE | **B — partially exists** | `ApDocument` **already has `supplierId` AND `applicationId`**, and `createApDocument` already accepts `applicationId` — but nothing in the booking UI creates it |
| SUPPLIER PAYMENT / SETTLEMENT | **A — exists** | `/ar`,`/ap` (`ap:read`/`ap:manage`), supplier ledger |
| SELLING PRICE | **🔴 C — MISSING** on the booking (only on Hajj/Umrah detail) |
| QUOTATION | **A — exists, limited** | `Quotation` QT- series; `QUOTE_SERVICES` = visa, air_ticket, hotel, tour, hajj, umrah only |
| INVOICE (+QR, redesigned PDF) | **A — exists** | INV- series, full lifecycle, single pdfkit engine, `verifyUrl()` QR |
| CUSTOMER PAYMENT | **A — exists** | `POST /payments` (`payment:record`) |
| **Payment method vs Receive Account** | **A — already separate** | `Payment.method` (free text: cash/bank/bkash/…) **and** `Payment.accountId` (FK → `Account`) are distinct columns; `accountId` is mandatory |
| RECEIVE ACCOUNT types | **B — data-only gap** | `Account.type` is an unconstrained string (validated `ACCOUNT_TYPES` is for `GlAccount`, a different table). Only 2 accounts exist (`bank`, `cash`). bKash/Nagad accounts need **creating as data**, no code change |
| AGENT COMMISSION | **A — exists** | `CommissionRule`, `Commission`, `AgentTier`, `/commissions` (`commission:read/manage`) |
| AGENT WALLET | **A — exists** | wallet ledger, topup/withdraw, reconcile, requests |
| OPERATIONS queue | **A — exists** | `/operations` overview/workflow/calendar |
| NOTIFICATIONS | **A — exists** | NotificationsService + outbox + `@Cron` scheduler + adapters |
| AFTER SALES | **A — exists** | timeline, customer history, repeat booking |
| REPORTS | **A — exists** | executive/finance/customer/sales/comms + per-service |

---

## 3. Obsolete / duplicate elements found

| Item | Classification | Action |
|---|---|---|
| Booking 360 "Supplier" tab — static placeholder text + dead `/suppliers` link | **C — obsolete stub** | **Replace** with the real supplier + commercials panel |
| `ai` and `ai/*` routes — stubs that `Navigate to="/"` | **C — dead** | Leave (harmless, zero UI surface); removing changes routing behaviour for bookmarked URLs |
| Sidebar: services nested under `Bookings` rather than their own group | **D** | Reorganise into a `Services` group per §21 |
| Sidebar: `Document Intelligence` group naming | **D** | Rename to `Documents & OCR` per §21 |
| Duplicate customer/booking list entry points | **F — none found** | Audit found single canonical list per entity; no consolidation needed |

**Nothing was found that is safe *and* worth deleting.** No module, engine, API or page is a true functional duplicate. The only genuinely obsolete artefact is the placeholder Supplier tab, which is replaced (not deleted) in this change.

---

## 4. Elements explicitly RETAINED (E / F — dangerous or must-not-touch)

Invoice PDF engine + QR verification · OCR engine · NotificationsService/scheduler/adapters · Gmail SMTP config · Customer & Booking frozen reference patterns · all 8 service workspaces and their 11-stage templates · WorkflowTemplate copy-on-create semantics · CMS/home-page tables · users/roles/permissions · master data · accounting master (GlAccount, periods, fiscal year) · AuditLog.

---

## 5. Changes required

### Database (additive only — no destructive operation)
Migration `20260809_booking_commercials`:
```sql
ALTER TABLE "Application"
  ADD COLUMN "supplierId"          TEXT,
  ADD COLUMN "supplierCostPoisha"  INTEGER,
  ADD COLUMN "sellingPricePoisha"  INTEGER;
ALTER TABLE "Application"
  ADD CONSTRAINT "Application_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Application_supplierId_idx" ON "Application"("supplierId");
```
All three columns are **nullable** — every existing row remains valid, nothing is rewritten, and the change is reversible by dropping the columns.

### Backend
- `applications.service.ts` — accept/return `supplierId`, `supplierCostPoisha`, `sellingPricePoisha` on update; include supplier in reads.
- New `POST /applications/:id/supplier-bill` — raises the supplier payable for the booking by **reusing `ArapService.createApDocument`** (no new AP engine), guarded by `ap:manage`.
- No change to invoice, payment, OCR, PDF, messaging or workflow engines.

### Frontend
- Replace the Booking 360 Supplier placeholder with a real **Supplier & Commercials** panel: supplier search/select, supplier cost, selling price, computed margin, and "Raise supplier bill".
- Sidebar restructure per §21.
- No change to any frozen module's business logic.

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| Migration touches the busiest table (`Application`) | Columns are nullable with no default backfill → `ADD COLUMN` is metadata-only in PG 16; no table rewrite |
| FK to `Supplier` could block supplier deletion | `ON DELETE SET NULL` — deleting a supplier clears the link instead of failing |
| Double-billing a supplier | Endpoint refuses if an AP document already exists for that application+supplier |
| Menu changes hiding a needed screen | Every current leaf is mapped to a destination before the change; nothing is dropped, only regrouped |
| Prod deploy breaking runtime | Full backup + verified restore assets before deploy; backend and frontend deployed together |

---

## 7. Migration plan

1. Read-only audit (this document).
2. Verified production backup (DB + backend artifact + frontend bundle + commit + health + homepage checksum).
3. Additive migration on production.
4. Deploy backend, restart `st-erp-api.service` only.
5. Deploy frontend bundle.
6. End-to-end test on one temporary transaction, then delete only those temporary records.
7. Production smoke test + homepage checksum re-verification.

## 8. Rollback plan

| Failure point | Action |
|---|---|
| Migration fails | It runs in a transaction; PostgreSQL rolls it back. Nothing else has changed yet. |
| Backend regression | Restore previous `dist` from the artifact backup, `systemctl restart st-erp-api`. Columns are additive and ignored by the old build. |
| Frontend regression | `tar xzf` the frontend backup over `/var/www/ShanghaiTravels/erp/`. |
| Data regression | Restore `pg_restore` from the verified dump. |

The additive columns are backward compatible: the **previous backend build runs unchanged against the new schema**, so a backend-only rollback needs no database rollback.
