# V5 Finance — Phase 3 Report: Commercial Communication Foundation

**Status: DONE (frontend + templates), verified on staging. No prod deploy, no push.**
Continuation of the approved V5 finance architecture (Phase 1 detail page, Phase 2 lifecycle).
No redesign. Reuses the existing Communication/Notification/Timeline/Audit engines — **no duplicate engine**.

## 1. Architecture review (Phases 1–2 recap)
- **Invoice detail** (`FinanceInvoiceDetailPage`, route `finance/invoices/:id`) — 8 tabs on the shared
  `EntityTabs`. Overview/Items/Payments/Communication/Timeline/Documents/Audit/Notes.
- **Lifecycle** (Phase 2, migration 030 on staging) — `InvoiceStatus` += generated/approved/sent/viewed/
  overdue/refunded; transitions approve/send/viewed/cancel/void/refunded, each writing `AuditLog`;
  `GET /invoices/:id/audit`; RBAC via existing `invoice:manage` / `payment:refund`.
- **Reused engines confirmed**: `CommsService.send` (email/WhatsApp/SMS + templates + adapters),
  `Communication` (polymorphic `relatedType` — `"invoice"` needs no schema change), `AuditLog`,
  `NotificationsService` (outbox, staff inapp), Customer360/Booking360 links, existing Payment engine.

## 2. Reuse inventory (Phase 3)
| Need | Reused (no new engine) | Location |
|---|---|---|
| Send email/WhatsApp/SMS | `commsApi.send` → `CommsService.send` (`relatedType:"invoice"`) | `comms.service.ts:send`, `services.ts:commsApi.send` |
| Templates + preview | `commsApi.listTemplates` / `renderTemplate`; seeded via `bootstrap` defaults | `comms.service.ts:bootstrap` |
| History / delivery status | `commsApi.timeline("invoice", id)` → `Communication` rows | `comms.service.ts` |
| Retry | re-`send` within the same invoice thread (no duplicate thread/engine) | frontend |
| Audit | `AuditLog` (Phase 2) | `finance.service.ts:writeInvoiceAudit` |
| Merge vars | invoice + `applicationsApi.get` + `customersApi.get` (already loaded) | detail page |

**New this phase = 3 idempotent templates** added to the existing `bootstrap` defaults (data, not a new engine):
`inv_email`, `inv_whatsapp`, `inv_sms` (category `payment`; merge fields customerName/invoiceNo/bookingNo/
amount/dueAmount/paymentLink/trackUrl/portalUrl). Seeded on staging.

## 3. Communication flow
```
Invoice Detail → Communication tab
  Send: channel + template (listTemplates) → renderTemplate(vars) preview → commsApi.send(
        channel, to, relatedType:"invoice", relatedId, templateId, vars, partyKind:"customer")
    → CommsService.send: CommThread (reused per invoice) + CommMessage + Communication(timeline)
      + NotificationsService.enqueue + adapter dispatch (SIMULATION until creds)
  History: commsApi.timeline("invoice", id) → channel · direction · summary · status · time
  Retry (failed only): re-send same body/channel to the customer contact, same invoice thread
```
Verified on staging: `inv_whatsapp` send → message `sent` (simulation) → appears in the invoice timeline.
`paymentLink`/`trackUrl` render blank now (activate in Phase 4 / tracking); `applyMergeFields` drops
unknown vars, so templates are forward-compatible with **no rewrite**.

## 4. Foundation for later phases (prepared, NOT implemented — per spec)
- **Phase 4 — PDF attachment:** the attachment model **already exists** (`CommMessage.attachments
  CommAttachment[]`). Phase 4 extends `CommsService.send` to accept `attachments` and generate the invoice
  PDF; the composer already reserves the "PDF attaches in Phase 4" affordance. **No architecture change needed.**
- **Phase 5 — Reminder scheduler hooks:** the reusable send path (`commsApi.send` / a thin
  `finance.remindInvoice(id, kind)` wrapper) is the single call a scheduler will make for
  Invoice-Due / Overdue / Payment-Reminder using `inv_*` / `*_payment_reminder` templates. **No scheduler
  runtime is built** (none exists — `@nestjs/schedule` recommended). Automation stays **simulation-only** in prod.

## 5. Money Receipt system — prepared architecture (not implemented)
Reuse, no duplication: a receipt is a **view over an existing `Payment`** (`kind=payment`), not a new ledger.
- **Receipt Number** = derive from `Payment.id`/`reference` (or a future `receiptNo` additive field).
- **Receipt PDF/QR/verify** = the same PDF engine (Phase 4) + a `GET /payments/:id/receipt` render + a public
  `GET /public/receipt/verify?no=` (mirrors the `@Public` pattern) — **no new tables**.
- **Send/Portal** = reuse `commsApi.send` (`relatedType:"payment"`); **Timeline/Audit** = `Communication` + `AuditLog`.
Hook point: `finance.recordPayment` already returns the `Payment` and audits it — receipt generation slots in there.

## 6. Agent Commission — prepared (reuse, no duplicate ledger)
The `Commission` model + `GET /commissions` (agent-scoped) + agent **Wallet** already exist (`partners`).
Invoices reach the agent via `application.agentId`. Preparation: a `finance` hook computes commission on
invoice paid (rate from `Agent.commissionRateBps`) and writes a `Commission` row (pending→approved→paid via
the existing `commissions/approve|pay`). **No new ledger** — reuse `Commission` + `Payment` + GL.

## 7. Customer / Agent / Corporate portal finance — prepared
The portal services already return invoices + payments + outstanding (customer/agent/corporate). Preparation:
portal invoice-detail + receipt views call the **same** `getInvoice` / receipt render (read-only, permission-
scoped by the portal JWT) — **no duplicate finance logic**. Communication history reuses `commsApi.timeline`.

## 8. Corporate billing & Supplier payment — prepared
- **Corporate:** statement / bulk-invoice / outstanding compose over existing per-customer invoices +
  `corporate-portal` aggregation; no workflow change. (A direct `Invoice.corporateClientId` FK is the only
  optional future additive field.)
- **Supplier payment:** NOT implemented. The `Invoice`/`Payment`/GL/`Communication`/`Timeline` layer is generic
  (Payment.kind, AR/AP already exist) so supplier flows reuse it later without duplication.

## 9. Future-phase readiness
No rewrite required for Phases 4–6: PDF (attachment model ready), scheduler (single reusable send call),
receipt/commission/portal/corporate all compose over existing models. Message delivery is **simulation-only**
until owner provides Wasender/SMTP creds. `docs/V5_FINANCE_COMMERCIAL_COMPLETION.md` holds the master plan.
