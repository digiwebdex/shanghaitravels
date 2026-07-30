# Phase C2 — Accounts Receivable & Accounts Payable Technical Design

**Branch:** `feature/phase-c-ar-ap`  
**Baseline:** `v2.0-finance-foundation`  
**Business model:** Accrual AR/AP subledgers on top of Phase C1 double-entry GL  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Cash ops (existing) | Keep `Invoice` / `Payment` / `Account` / `LedgerEntry` + `CaseFinanceCard` |
| GL (Phase C1) | Reuse `AccountingService` create → post; CoA by **code** (1300/2100/…) |
| AR/AP (new) | Parallel `ArDocument` / `ApDocument` subledgers with allocations |
| Case integration | Optional `applicationId`; bridge from operational cash invoices |
| Audit / timeline | `AuditLog` on AR/AP lifecycle; `ApplicationEvent` when case-linked |

### Explicit non-goals

- Banking reconciliation / cashbook replacement  
- Full Financial Statements (P&L, Balance Sheet, Cash Flow)  
- Replacing Visa / Ticketing / Hotel / Transport / Tour / Hajj booking engines  

### Feature map

| Area | Delivery |
|---|---|
| AR | Customer accounts view, invoices, receipts, advances, credit/debit notes, refunds |
| AP | Supplier bills, payments, advances, credit/debit notes |
| Shared | Timeline events, audit, document attachments (ownerType), RBAC, approval |
| Reports | AR/AP aging, customer/supplier ledger, outstanding summary |
| Integration | Bridge cash invoice/payment → AR; AP bills linkable to cases |

---

## 2. Posting rules (via C1 engine)

| Event | Journal (BDT poisha) |
|---|---|
| AR invoice post | Dr **1300** AR · Cr **4000** Service Revenue |
| AR receipt / advance apply | Dr **1100** Cash · Cr **1300** AR |
| AR credit note | Dr **4000** Revenue · Cr **1300** AR |
| AR debit note | Dr **1300** AR · Cr **4000** Revenue |
| AR refund | Dr **1300** AR · Cr **1100** Cash |
| AP bill post | Dr **5200** Supplier Cost · Cr **2100** AP |
| AP payment / advance apply | Dr **2100** AP · Cr **1100** Cash |
| AP credit note | Dr **2100** AP · Cr **5200** Cost |
| AP debit note | Dr **5200** Cost · Cr **2100** AP |

Accounts resolved by **code lookup** — never hard-coded UUIDs.  
Journal posting requires open period; AR/AP post fails if period closed.  
Document workflow: `draft` → `pending_approval` → `approved` → `posted` (GL posted) / `void`.

---

## 3. API (`/ar/*`, `/ap/*`)

```
# Accounts Receivable
GET                 /ar/customers
GET/POST            /ar/documents
GET/PATCH           /ar/documents/:id
POST                /ar/documents/:id/submit|approve|reject|post|void
POST                /ar/allocations
POST                /ar/bridge/invoice/:invoiceId
POST                /ar/bridge/payment/:paymentId
GET                 /ar/reports/aging
GET                 /ar/reports/customer-ledger
GET                 /ar/reports/outstanding

# Accounts Payable
GET                 /ap/suppliers
GET/POST            /ap/documents
GET/PATCH           /ap/documents/:id
POST                /ap/documents/:id/submit|approve|reject|post|void
POST                /ap/allocations
GET                 /ap/reports/aging
GET                 /ap/reports/supplier-ledger
GET                 /ap/reports/outstanding
```

Permissions: `ar:read`, `ar:manage`, `ap:read`, `ap:manage` (+ reuse `journal:approve` for post path via internal GL service as the acting user).

---

## 4. Frontend routes

| Path | Page |
|---|---|
| `/#/finance/ar` | AR documents / customer receivables |
| `/#/finance/ar/:id` | AR document detail |
| `/#/finance/ap` | AP documents / supplier payables |
| `/#/finance/ap/:id` | AP document detail |
| `/#/finance/ar-ap-reports` | Aging, ledgers, outstanding |

CaseFinanceCard: bridge actions to post receivable/receipt into AR without changing booking modules.

---

## 5. Regression guard

Do not modify Visa / Ticketing / Hotel / Transport / Tour / Hajj internals beyond shared `CaseFinanceCard` bridge hooks.  
Do not alter cash ledger balance math.  
Do not begin Banking or Financial Statements.
