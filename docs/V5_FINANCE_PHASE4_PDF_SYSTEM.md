# V5 Finance — Phase 4 Report: Enterprise Commercial PDF System

**Status: DONE (engine + Invoice/Receipt/Quotation PDFs + QR verification), verified on staging. No prod deploy, no push.**
Continuation of the approved V5 finance architecture. No redesign; reuses theme/tokens/CommsService/AuditLog.

## 1. Architecture review (Phases 1–4)
- Phase 1 detail page (8 tabs), Phase 2 lifecycle+audit (migration 030 staging), Phase 3 communication layer (CommsService reuse, invoice templates).
- Phase 4 adds a **reusable pdfkit engine** + streaming endpoints + a **public QR verification** surface, all additive.
- Reused: `getInvoice`-shaped data, `AuditLog` (Phase 2), the existing `@Res` file-stream pattern
  (`analytics.controller`/`sales.controller`), the `@Public` public-module pattern, the company branding
  (logo + Reg 0017053 + contacts), design tokens, and the hash-router unauth top-level route slot.

## 2. Reuse inventory
| Need | Reused (no duplication) | Location |
|---|---|---|
| PDF stream from controller | `@Res() res` + `res.send(buffer)` pattern | mirrors `analytics.controller.ts:52` |
| Public endpoint (verify) | `@Public()` + public module | `public.controller.ts` |
| Audit on generate/download | `AuditLog` (`entityType=Invoice/Payment`) | `pdf.controller.ts:audit` |
| Company branding / logo | `/var/www/ShanghaiTravels/assets/logo-*.png` (env-overridable) | `pdf.service.ts` |
| Money/format | minor-units convention (poisha) | shared |
| Frontend verify page | design tokens; top-level unauth route | `VerifyPage.tsx` |
**New dependency (approved):** `pdfkit` + `qrcode` (NOT Puppeteer).

## 3. PDF engine (`src/pdf/`)
One engine, one renderer, one registry — documents are added by registering a builder (no engine rewrite).
The spec's named roles map to:
- **PdfService** — `src/pdf/pdf.service.ts`: the render pipeline (`render()` collects pdfkit chunks → Buffer).
- **PdfTemplateEngine** — the private layout helpers: `brandHeader` (logo + company + title + accent rule),
  `kvGrid`, `itemsTable`, `totals`, `qrVerify` (QR + verification no + URL + signature), `footer`.
- **DocumentRenderer** — `renderInvoice` / `renderReceipt` / `renderStatement`.
- **TemplateRegistry** — `RENDERERS` map (`invoice`/`quotation`/`receipt`/`statement`).
- **DocumentGenerator** — `generate(type, data): Promise<Buffer>`.
- **Module/endpoints** — `PdfModule` + `PdfController`:
  `GET /invoices/:id/pdf`, `GET /invoices/:id/quotation`, `GET /payments/:id/receipt`
  (`?download=1` → attachment, else inline for Preview/Print). Permission `invoice:amount:read`;
  **branch-scoped** (non-HQ users only their branch); each writes an `AuditLog` row.

**Invoice PDF** contains: branding + logo, company info, invoice/booking/reference numbers, customer,
passport, nationality, service, agent, booking/issue/due dates, status, item table, subtotal/discount/tax/
total/paid/due, QR verification (number + URL), signature area, terms footer. Verified on staging (271 KB, valid).

## 4. Document matrix
| Document | Status | Renderer |
|---|---|---|
| **Invoice** | ✅ done | `renderInvoice` |
| **Money Receipt** | ✅ done | `renderReceipt` (receipt no `RCPT-<id8>`, method, received, outstanding, cashier, QR) |
| **Quotation** | ✅ done | `renderInvoice` (isQuotation — reuses the invoice renderer per spec) |
| **Customer / Agent / Corporate Statement** | 🟡 renderer scaffolded (`renderStatement`, running-balance) | additive: wire a data source + a `GET /statements/:type/:id/pdf` |
| Booking Confirmation, Visa Summary, Air Ticket, Hotel/Transport Voucher, Tour, Hajj/Umrah | 🟡 **register a builder** in `RENDERERS` + a route; data via existing `applicationsApi.get` per-service detail | no engine change |
All remaining documents plug into the **same** engine (register builder + endpoint) — **no rewrite**.

## 5. QR verification
- Every generated PDF embeds a QR encoding `https://shanghaitravels.com.bd/erp/#/verify/<number>`.
- **Verification API**: `GET /api/public/verify?no=<invoiceNo>` (`@Public`) → customer-safe JSON
  `{valid, type, number, status, total, currency, issuedAt, customerName(masked)}`. **Never** exposes
  internal notes / finance journal / audit.
- **Public verification page**: `/verify/:no` (`VerifyPage`, no login) shows Authentic/Not-found + safe fields.
- Receipts verify via their linked invoice number (efficient, no full-table scan). Verified on staging.

## 6. Portal integration (prepared — reuse, no duplicate finance logic)
The PDF endpoints are the single source; portal download buttons call the **same** URLs, scoped by the portal
JWT identity (customer/agent/corporate). Customer portal: download Invoice/Receipt/Quotation/Booking/Statement;
Agent: commission statement; Corporate: corporate statement. Booking360/Customer360 "Documents" tabs list the
same links. (Buttons are a thin follow-up; the engine + audit + RBAC are done.)

## 7. Email / WhatsApp attachment
`CommMessage.attachments (CommAttachment[])` model already exists. Email attach = generate the PDF buffer +
persist a `CommAttachment` + pass to the adapter (delivery stays **simulation-only** until Wasender/SMTP creds).
WhatsApp: attach if the provider supports binary, else send the verification/download link. Wiring is additive
onto `CommsService.send` — no new engine.

## 8. Security
RBAC enforced (`invoice:amount:read`); PDF endpoints branch-scoped so users only reach their branch's
documents. Public verify returns masked, minimal fields. Audit on every generation/download.

## 9. Future readiness
No rewrite for Phase 5 (scheduler) or 6 (reports/portals): statements/vouchers register into the same
`RENDERERS`; portal downloads reuse the endpoints; search can index invoice/receipt/verification numbers via the
existing intelligence search. Master plan: `docs/V5_FINANCE_COMMERCIAL_COMPLETION.md`.
