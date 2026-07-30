# Phase C1 — Finance ERP Foundation Completion Report

**Completed:** 2026-07-30  
**Branch:** `feature/phase-c-finance-foundation`  
**Baseline:** `v1.5-hajj-umrah`  
**Module:** Finance ERP / General Ledger foundation  
**Status:** Production-complete for Phase C1 scope  

---

## Business model

Shanghai Travels Finance ERP uses **double-entry accounting** as the backbone.  
Cash-basis `Account` / `Invoice` / `Payment` / `LedgerEntry` remain untouched for case billing.  
A parallel GL layer (`GlAccount`, journals, periods, currencies) provides configurable CoA, balanced posting, and auditability.

---

## Scope delivered

| # | Feature | Delivery |
|---|---|---|
| 1 | Chart of Accounts | Assets / Liabilities / Equity / Income / Expenses — configurable codes |
| 2 | Account Groups | `/#/finance/groups` |
| 3–4 | Fiscal Year + Periods | Bootstrap monthly periods; close/reopen with unposted-journal validation |
| 5 | Branch accounting | Optional `branchId` on GL accounts, journals, cost centers |
| 6 | Cost Centers | `/#/finance/cost-centers` |
| 7–8 | Currency + FX | BDT base + USD/SAR; exchange rates with scaled precision |
| 9–11 | Journal / Approval / Posting | Draft → submit → approve → post; void with audit |
| 12 | Opening balances | Journal `type=opening` |
| 13 | Closing period validation | Blocks close when drafts/pending exist; blocks post into closed periods |
| 14–15 | Audit + Permissions | `AuditLog` on mutations; `gl:*` / `journal:*` / `period:close` / `fx:manage` |
| Reports | CoA, Journal Register, Trial Balance | API + `/#/finance/reports` |

---

## Architecture rules honored

- Double-entry only; unbalanced journals rejected  
- Ledger trial balance must balance after posts  
- Every create/approve/post/void/period action audited  
- No hard-coded account IDs (UUID + code lookup)  
- Multi-branch / multi-currency ready; VAT via optional `taxCode`  
- Existing Visa / Ticketing / Hotel / Transport / Tour / Hajj modules untouched  
- Cash wallet APIs unchanged  

---

## Database (additive)

- Tables: `GlAccountGroup`, `GlAccount`, `FiscalYear`, `AccountingPeriod`, `CostCenter`, `Currency`, `ExchangeRate`, `JournalEntry`, `JournalLine`  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260731160000_016_gl_foundation/`  
- Applied to staging + production  
- Permissions seeded for `super_admin`, `accounts_manager`, `general_manager` (read)  

## Backend

- Nest SoT: `/opt/shanghai-erp-api/src/accounting/`  
- Controller: `@Controller("gl")`  
- Deployed: staging `:4201` + prod `/api2`  

### API surface

```
POST /gl/bootstrap
GET/POST/PATCH /gl/account-groups
GET/POST/PATCH /gl/accounts
GET/POST /gl/fiscal-years
POST /gl/periods · POST /gl/periods/:id/close|/reopen
GET/POST/PATCH /gl/cost-centers
GET/POST/PATCH /gl/currencies
GET/POST /gl/exchange-rates
GET/POST/PATCH /gl/journals
POST /gl/journals/:id/submit|approve|reject|post|void
GET /gl/reports/chart-of-accounts|journal-register|trial-balance
```

---

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/finance` | Chart of Accounts (+ bootstrap) |
| `/#/finance/groups` | Account groups |
| `/#/finance/periods` | Fiscal years & periods |
| `/#/finance/cost-centers` | Cost centers |
| `/#/finance/currencies` | Currencies & FX |
| `/#/finance/journals` | Journal list + create |
| `/#/finance/journals/:id` | Detail / submit / approve / post / void |
| `/#/finance/reports` | CoA / Register / Trial Balance |

Nav: **Finance ERP** (LIVE). Permission: `gl:read`.

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (28 unit tests)
npm run test:api      ✅  84/84 staging
npm run test:api:prod ✅  84/84
npm run test:e2e      ✅  8/8 Playwright
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASEC1_FINANCE_DESIGN.md`

---

## Stop line

Phase C1 complete. **Do not begin** Accounts Receivable, Accounts Payable, Banking, or Financial Statements until this foundation is approved and tagged.
