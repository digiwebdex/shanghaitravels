# Phase C2 — Accounts Receivable & Accounts Payable Completion Report

**Completed:** 2026-07-30  
**Branch:** `feature/phase-c-ar-ap`  
**Baseline:** `v2.0-finance-foundation`  
**Module:** AR / AP accrual subledgers on Phase C1 GL  
**Status:** Production-complete for Phase C2 scope  

---

## Business model

Operational cases continue to bill via cash-basis `Invoice` / `Payment`.  
Phase C2 adds accrual **AR/AP documents** that post balanced journals through the Phase C1 posting engine (CoA codes 1300 / 2100 / 1100 / 4000 / 5200 — never hard-coded UUIDs).

---

## Scope delivered

| Area | Delivery |
|---|---|
| AR | Customer accounts view, invoices, receipts, advances, credit/debit notes, refunds |
| AP | Supplier bills, payments, advances, credit/debit notes |
| Workflow | draft → submit → approve/reject → post → void |
| Allocations | Apply receipts/payments/credits against invoices/bills |
| Bridge | Operational invoice → AR; cash payment → AR receipt (+ allocate) |
| Case integration | Optional `applicationId`; CaseFinanceCard “Post receivable to GL” |
| Timeline / Audit | `ApplicationEvent` when case-linked; `AuditLog` on all mutations |
| Reports | AR/AP aging, customer/supplier ledger, outstanding summary |
| RBAC | `ar:read`, `ar:manage`, `ap:read`, `ap:manage` |

---

## Product rules honored

- Finance Foundation (C1) reused for journal posting  
- Visa / Ticketing / Hotel / Transport / Tour / Hajj booking engines not replaced  
- Cash `Account` / `LedgerEntry` math unchanged  
- Banking and Financial Statements not started  

---

## Database (additive)

- Tables: `ArDocument`, `ArDocumentLine`, `ArAllocation`, `ApDocument`, `ApDocumentLine`, `ApAllocation`  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260731180000_017_ar_ap/`  
- Applied to staging + production  

## Backend

- Nest SoT: `/opt/shanghai-erp-api/src/arap/`  
- Controllers: `@Controller("ar")`, `@Controller("ap")`  
- Deployed staging `:4201` + prod `/api2`  

---

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/finance/ar` | AR documents |
| `/#/finance/ar/:id` | AR detail / workflow |
| `/#/finance/ap` | AP documents |
| `/#/finance/ap/:id` | AP detail / workflow |
| `/#/finance/ar-ap-reports` | Aging + outstanding |

CaseFinanceCard: **Post receivable to GL** + auto-bridge receipt after payment (when `ar:manage`).

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (29 unit tests)
npm run test:api      ✅  99/99 staging
npm run test:api:prod ✅  99/99
npm run test:e2e      ✅  Playwright (incl. AR/AP)
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASEC2_AR_AP_DESIGN.md`

---

## Stop line

Phase C2 complete. **Do not begin Banking or Financial Statements** until this module is approved and tagged.
