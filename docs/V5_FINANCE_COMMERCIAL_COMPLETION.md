# V5 — Enterprise Commercial Finance & Invoice Lifecycle

**Status: Phase 1 (invoice detail page + list Actions) and Phase 2 (lifecycle states + approve/send/viewed/cancel/void/refunded transitions + per-invoice audit; additive migration 030 applied to staging, verified) — DONE. Phases 3–6 (send/templates → PDF → automation → reports/portals) pending.**
This is a completion program, not a redesign. Everything below extends existing architecture; no
navigation / theme / tokens / workflow / booking-engine / OCR / CRM / RBAC / auth changes.

---

## 1. Reuse inventory (what already exists — extend, never duplicate)

| Capability | Reuse | Location |
|---|---|---|
| Invoice + items + payments in one fetch | `getInvoice` returns `items`, `payments`, `customer`, computed `paid`/`due` | `finance.service.ts:60` |
| Invoice/payment actions (create/issue/pay/refund + GL bridge) | **`CaseFinanceCard`** — drop in as the Payments tab | `components/cases/CaseFinanceCard.tsx` |
| 8-tab detail shell | **`EntityTabs`/`EntityTabPanel`** (URL `?tab=`), model page `BookingWorkspacePage` | `components/workflow/EntityTabs.tsx` |
| Payment methods | enum already has cash/bank_transfer/bkash/nagad/card/cheque/other | `schema.prisma:93` |
| Refund | `PaymentKind.refund` + separate `payment:refund` permission | `schema.prisma:103`, `finance.service.ts:118` |
| Send email / WhatsApp / SMS + templates | **`CommsService.send`** / `commsApi.send`, `commsApi.timeline` | `comms.service.ts:311` |
| Audit | generic **`AuditLog`** (`entityType="Invoice"`) | `schema.prisma:1518` |
| Invoice ↔ communication link | polymorphic `Communication.relatedType` (plain String) → use `"invoice"` **no schema change** | `schema.prisma:989` |
| Portal finance (customer/agent/corporate) | dashboards already return invoices + payments + outstanding | `*-portal.service.ts` |
| Print/PDF (HTML→print) pattern | `FinanceStatementsPage.exportReport()` + `window.open` write | `pages/FinanceStatementsPage.tsx:110` |
| Reports pattern (aging = overdue) | `FinanceArApReportsPage` (`arApi.reportAging/reportOutstanding`), `analyticsApi.finance/exportUrl` | `pages/FinanceArApReportsPage.tsx` |
| Actions-in-column precedent | a `Column.render` returning Links/buttons | `pages/HotelsListPage.tsx:88` |

## 2. Exists vs missing (gap analysis)

### Invoice lifecycle (`enum InvoiceStatus`, schema.prisma:84 — currently `draft, issued, partially_paid, paid, void, cancelled`)
| Target | Today | Work |
|---|---|---|
| Draft / Partially Paid / Paid | ✅ | none |
| Generated | ≈ `issued` | **schema**: add `generated` (or treat `issued`=generated) |
| Approved / Sent / Viewed / Overdue / Refunded | ❌ | **schema**: add 5 enum values (additive) + **service** transitions |
| Cancelled / Void | enum present, **no code path** | **service** methods + endpoints |

### Payment methods — ✅ **all present**, no schema change. (advance/adjustment would be a new `PaymentKind` value or handled via the AR layer — optional.)

### Lifecycle transitions
`create/draft`, `issue`, auto `partially_paid`/`paid`, `payment`/`refund` — ✅ exist.
`approve / send / mark-viewed / cancel / void / mark-refunded / overdue-detect / credit-note` — ❌ **service-layer methods + endpoints** (plus enum additions above). Each writes an `AuditLog` row (model exists) + an invoice timeline event.

### PDF — ❌ **no engine anywhere** (no pdfkit/puppeteer; analytics `pdf`→HTML fallback). Needs a **new dependency** + an invoice template. Optional additive `Invoice.pdfStorageKey` if we persist generated PDFs.

### Invoice timeline / audit / communication
- Per-invoice timeline: ❌ (only case-level `ApplicationEvent`). **Two options**: (a) compose the Timeline tab from existing sources — `AuditLog(entityType=Invoice)` + `Payment` rows + `Communication(relatedType=invoice)` (no schema change), or (b) add a dedicated `InvoiceEvent` model (schema). **Recommend (a)** to avoid a new model.
- Audit: `AuditLog` exists; finance service does **not** write it yet → service-layer additions.
- Communication: works with `relatedType:"invoice"` — no schema change.

### Automation — ❌ **no scheduler runtime** (no `@nestjs/schedule`, no cron/queue). Due/overdue reminders need a **new runtime** (`@nestjs/schedule` or external cron hitting an endpoint) that queries overdue invoices and calls the comms path. Analytics schedules store a `cronExpr` but nothing executes it; the comms outbox drains only on manual `POST /comms/process-outbox`.

### Comms PDF attachment — ❌ `send()` ignores attachments. Attaching the invoice PDF = **new backend work** (create `CommMessageAttachment` + pass to adapter).

### Message delivery — ⚠️ **simulate-only.** WhatsApp/SMS/Email adapters return "sent" only under `COMMS_SIMULATE_DELIVERY=1`; real delivery needs the owner's Wasender/SMTP creds (the Wasender HTTP call is a `TODO` stub). All automation is built production-ready and verified **in simulation**.

## 3. Proposed schema change — **approve before migration** (additive only)
```prisma
enum InvoiceStatus {
  draft  issued  partially_paid  paid  void  cancelled   // existing — unchanged
  generated  approved  sent  viewed  overdue  refunded   // + additive
}
// Invoice: additive optional lifecycle stamps (mirrors the AR/AP doc pattern; nothing edited/removed)
model Invoice {
  // …existing fields unchanged…
  approvedAt DateTime?   approvedBy String?
  sentAt     DateTime?   viewedAt   DateTime?
  cancelledAt DateTime?  cancelledBy String?
  // pdfStorageKey String?   // optional — only if we persist generated PDFs
}
```
**Not proposed** (avoided to minimize schema churn): a new `InvoiceEvent` model (Timeline composed from AuditLog+Payment+Communication instead); `Invoice.agentId`/`corporateClientId` (agent already reachable via `application.agentId`; corporate via `Customer.type`) — add later only if direct ownership is required.

## 4. Phased plan (each phase ends green: typecheck/lint/build; I check in between)
1. **Invoice detail page — pure reuse, NO schema/backend.** New `invoices/:id` route + `FinanceInvoiceDetailPage` using `EntityTabs`: Overview / Items / Payments (`CaseFinanceCard`) / Communication (`commsApi.timeline`) / Timeline (composed) / Documents / Audit (`AuditLog`) / Notes. Add the **Actions column** to `FinanceInvoicesPage` and fix the dead invoice-number link. *(Deliverable with zero risk — can start immediately on "go".)*
2. **Lifecycle (backend, needs the schema migration above).** Enum values + `approve/send/mark-viewed/cancel/void/mark-refunded` service methods + endpoints, each writing `AuditLog`; overdue detection.
3. **Send + templates.** Wire `commsApi.send` for invoice email/WhatsApp/SMS (`relatedType:"invoice"`), seed invoice templates, Communication tab history + delivery status + retry. (PDF attachment deferred to Phase 4.)
4. **PDF engine.** Add the PDF dependency + a branded invoice template (logo/QR/summary/terms/signature) → `GET /invoices/:id/print` (+ portal download); optional attach-to-send.
5. **Automation.** Add the scheduler runtime; on-create / on-payment / due (7/3/1) / overdue flows → comms + portal notification + timeline.
6. **Reports + portals + filters.** Invoice/due/overdue/collection/tax/revenue/outstanding reports (extend `arApi` aging + `analyticsApi`); portal invoice detail/receipt; list search + filters.

## 5. Decisions needed before I migrate/build
1. **Approve the schema** in §3 (6 additive enum values + optional lifecycle stamps), or prefer `issued`=Generated (fewer values) / a dedicated `InvoiceEvent` model.
2. **PDF engine choice**: `pdfkit` (light, code-drawn) vs `puppeteer` (HTML→PDF, heavier). Recommend **pdfkit** for a server with no headless-Chrome.
3. **Scheduler**: in-process `@nestjs/schedule`, or external cron hitting a secured endpoint. Recommend `@nestjs/schedule`.
4. **Delivery**: OK to build + verify automation **in simulation** (real WhatsApp/Email needs your Wasender/SMTP creds)?
5. **Staging only, no prod deploy, no push** — same as v4.5/v4.6/v4.7? (Migration applied to staging DB only.)

**On "go", Phase 1 (invoice detail page + actions, zero schema/backend) ships immediately; Phase 2 waits on the schema approval above.**
