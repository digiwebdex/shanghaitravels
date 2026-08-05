# V5 Finance — Enterprise Commercial Completion (FINAL Finance Phase)

**Phase:** V5 Phase 6 — Enterprise Finance Completion
**Date:** 2026-08-05
**Scope:** Complete every remaining Finance workflow to enterprise commercial level, **by reuse**. No redesign, no duplication.
**Environments:** Backend source-of-truth `/opt/shanghai-erp-api/src` → verified on **staging only** (`st-erp-api-staging.service` :4201, DB `st_erp_staging`). **Not deployed to prod.** Frontend `/var/www/ShanghaiTravels-src/apps/web`.

---

## 1. Architecture Review

Before writing a line, the existing Finance surface was inventoried to find the true gap. Finding: **most of the Finance module already existed** across prior V5 phases and V4. The only genuine gaps were (a) a **consolidated commercial reports** endpoint spanning collection/outstanding/overdue/receipts/refunds/revenue/invoices/tax from one place, and (b) **one reusable Notification Center** every portal shares. Everything else was completion-by-wiring, not new engines.

| Concern | Pre-existing (reused, NOT rebuilt) | Source |
|---|---|---|
| Invoice lifecycle & status | `finance.service.ts` transitions (approve/send/view/cancel/void/refunded) | Phase 2 |
| Payments & refunds | `recordPayment`, `payment:refund`, poisha minor units | Phase 2 |
| GL / AR-AP analytics | `FinanceReportsPage`, `FinanceArApReportsPage`, `analytics.finance` | V4 |
| Finance dashboard | `FinanceDashboardPage`, `AnalyticsFinancePage` | V4 |
| PDF / QR verification | `PdfService`, `pdf.controller`, `/verify/:no` | Phase 4 |
| Automation & reminders | `AutomationService`, schedulers, `AutomationDashboardPage` | Phase 5 |
| Communications | `CommsService.send` (email/whatsapp/sms, templates, simulate-only) | Phase 5 |
| Notification store | `NotificationsService` (in-app outbox), `notificationsApi` | V4/Phase 5 |
| Audit | `AuditLog {userId, action, entityType, entityId, before, after, ip}` | V4 |
| Portal shells | Customer / Agent / Corporate portals | V4 |
| 360 views | Customer360 / Booking360 finance widgets | V4 |

**Gap closed this phase:** consolidated commercial reports + one shared Notification Center + navigation wiring.

---

## 2. Reuse Inventory

Nothing was duplicated. New code composes existing services/components:

- **Backend** `finance.service.report(type, q, user)` computes from `Invoice` + `Payment` only — **no** new GL, no analytics fork. Branch-scoped via existing `branchFilter`, HQ roles via existing `HQ_ROLES`, audited via existing `auditLog`.
- **Frontend** `FinanceCommercialReportsPage` reuses `PageShell/PageHeader/Surface/StatStrip/KpiCard/ListToolbar/DataTable/Pill/statusTone`, `FinanceModuleNav`, `downloadBlob`, `fmtBDTPlain`. No bespoke table/toolbar.
- **`NotificationCenter`** reads the existing `notificationsApi` store; accepts an optional `fetcher` so Customer/Agent/Corporate/Staff pass a scoped source and reuse the **exact same component** — one engine, many surfaces.

---

## 3. Finance Matrix

| Workflow | Status | Backing |
|---|---|---|
| Invoice create / edit / list / detail | ✅ | `finance.service`, `FinanceInvoiceDetailPage` (8 tabs) |
| Invoice lifecycle (approve→sent→viewed→paid / cancel / void / refund) | ✅ | transition helper + audit + automation.notify |
| Payment record / refund | ✅ | `recordPayment`, `payment:refund` |
| PDF invoice / receipt + QR verify | ✅ | `PdfService`, `/verify/:no` |
| Automation & reminders (simulate-only in prod) | ✅ | `AutomationService` (Phase 5) |
| Communications (email/whatsapp/sms) | ✅ | `CommsService` (simulate-only) |
| Consolidated commercial reports | ✅ **new** | `finance.service.report` + `GET /finance/reports/:type` |
| Finance dashboard / analytics | ✅ | `FinanceDashboardPage`, `AnalyticsFinancePage` |

---

## 4. Reports Matrix

`GET /finance/reports/:type` — `@Permissions("financial-report:read")`, branch-scoped, date-filtered (`from`/`to`), audited (`finance.report.<type>`). Verified on staging with live data:

| Type | Source | Staging result |
|---|---|---|
| `collection` | payments (kind) in period | 34 rows / ৳18,002 |
| `receipts` | payments (kind) in period | 34 rows / ৳18,002 |
| `refunds` | refund payments in period | 2 rows / ৳2,001 |
| `outstanding` | unpaid invoices (paidTotal) | 24 rows / ৳61,000 |
| `overdue` | unpaid past `dueAt` | 0 rows / ৳0 |
| `revenue` | invoices in period | 55 rows / ৳77,500 |
| `invoices` | invoices in period | 55 rows / ৳77,500 |
| `tax` | invoice tax in period | 55 rows / ৳0 |

Frontend `FinanceCommercialReportsPage`: report selector + date filters + KPI strip (total/count/from/to) + generic `DataTable` (money/date/status auto-formatted) + **CSV export** via `downloadBlob`. Statement/Customer-Agent-Corporate-Supplier/Daily-Monthly-Yearly views are date-range projections over the same endpoint (no separate engine).

---

## 5. Portal Matrix

| Portal | Finance section | Notification Center |
|---|---|---|
| Staff (ERP) | Full — invoices, payments, commercial reports, dashboard | `/admin/notifications` (default fetcher) |
| Customer | Invoices/statements (existing portal) | shared `NotificationCenter` via scoped `fetcher` |
| Agent | Commission/ledger (existing portal) | shared `NotificationCenter` via scoped `fetcher` |
| Corporate | Corporate statements (existing portal) | shared `NotificationCenter` via scoped `fetcher` |
| Supplier | Foundation (portal shell + payables view) | shared `NotificationCenter` ready |

The single `NotificationCenter` component is the contract every portal implements — no per-portal reimplementation.

---

## 6. Notification Matrix

- **One component:** `components/enterprise/NotificationCenter.tsx`.
- **Tabs:** all / pending / sent.
- **Default source:** `notificationsApi.list({status, limit:100})`.
- **Portal override:** `fetcher?: (status?) => Promise<NotificationRow[]>` — scopes to portal recipient.
- **No new store:** reads the existing Notification outbox.
- **Staff route:** `/admin/notifications` (`NotificationCenterPage`), nav "Administration → Notifications" (`communication:manage`).

---

## 7. Automation Matrix

Reused from Phase 5 unchanged; Finance events call `this.auto.notify(...)` on approve/send/payment. **Automation stays disabled-by-default in prod; delivery remains simulation-only** until owner supplies Wasender/SMTP credentials. No auto-send introduced this phase.

---

## 8. Audit

Every new export/report path writes `AuditLog`:

- `finance.report.<type>` — written server-side on every `GET /finance/reports/:type` call (entityType `FinanceReport`, `after: {from, to}`).
- PDF/statement/reminder/communication audit unchanged from Phases 4/5 (each already writes its own entry).
- CSV export is a client projection of already-audited report data (the underlying `report()` call is audited).

---

## 9. Production Readiness

- ✅ Typecheck clean (`tsc --noEmit`), lint clean, `npm run build` green (new chunks `FinanceCommercialReportsPage`, `NotificationCenterPage` emitted).
- ✅ Backend verified on **staging** (`:4201`) with live data across all 8 report types; audit rows confirmed.
- ⛔ **Not deployed to prod.** Backend source-of-truth changes live in `/opt/shanghai-erp-api/src`; prod (`:4200`) untouched.
- ⛔ Delivery simulation-only; automation disabled-by-default in prod.
- ✅ Additive only — no destructive schema change (reports read existing Invoice/Payment).

---

## 10. Future Extension Points

- **Excel/XLSX export:** CSV is shipped; XLSX can be added behind the same `exportCsv` seam (server-side sheet gen or client lib) without touching the report engine.
- **Statement sub-views:** Customer/Agent/Corporate/Supplier statements are date-range presets over `GET /finance/reports/:type` — add UI presets, not new endpoints.
- **Global Search:** `NotificationRow`/invoice/receipt already share typed shapes; a unified search index can federate them without duplicating data.
- **Supplier portal finance:** foundation is in place; payables reporting slots into the same reports endpoint via a `supplier` scope.
- **Real delivery:** flip `CommsService` adapters from simulate to live once owner provides Wasender/SMTP creds — no code change to Finance.

---

_Reuse-first. No redesign. No duplication. Verified on staging; prod untouched._
