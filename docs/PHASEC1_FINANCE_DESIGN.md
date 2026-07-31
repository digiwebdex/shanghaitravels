# Phase C1 — Finance ERP Foundation Technical Design

**Branch:** `feature/phase-c-finance-foundation`  
**Baseline:** `v1.5-hajj-umrah`  
**Business model:** Double-entry accounting backbone for Shanghai Travels ERP  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Cash ops (existing) | Keep `Account` / `Invoice` / `Payment` / `LedgerEntry` untouched |
| General Ledger (new) | Parallel `GlAccount` + journals — never hard-code account IDs |
| Money | Integer poisha (BDT base); multi-currency ready via Currency + FX |
| Branch | Optional `branchId` on journals / cost centers / GL accounts |
| Tax | Optional `taxCode` on GL accounts (future VAT hooks) |
| Audit | `AuditLog` rows on create/approve/post/void/period close |

### Explicit non-goals (this phase)

- Accounts Receivable / Accounts Payable modules  
- Banking reconciliation / cashbook UI replacement  
- Full Financial Statements (P&L, Balance Sheet, Cash Flow)  
- Auto-posting from Invoice/Payment into GL (future bridge)  

### Feature map

| # | Feature | Implementation |
|---|---|---|
| 1–2 | Chart of Accounts + Groups | `GlAccountGroup`, `GlAccount` |
| 3–4 | Fiscal Year / Periods | `FiscalYear`, `AccountingPeriod` |
| 5 | Branch accounting | `branchId` on journals/cost centers/accounts |
| 6 | Cost centers | `CostCenter` |
| 7–8 | Currency + FX | `Currency`, `ExchangeRate` |
| 9–11 | Journal / Approval / Posting | `JournalEntry` + `JournalLine` engine |
| 12 | Opening balances | Journal `type=opening` |
| 13 | Closing period | Period status + post validation |
| 14–15 | Audit / Permissions | `AuditLog` + `gl:*` / `journal:*` / `period:*` / `fx:*` |
| Reports | CoA / Journal Register / Trial Balance | Read APIs + UI |

---

## 2. Double-entry rules

1. Every journal line has **either** debit **or** credit (not both).  
2. Posting requires `sum(debitBasePoisha) === sum(creditBasePoisha)` and ≥ 2 lines.  
3. Posting only into an **open** accounting period.  
4. Posted journals are immutable (void creates reversing entry later — C1 voids draft/pending only; posted → `void` flag with audit, no silent edit).  
5. Account references by UUID / code lookup — **no hard-coded IDs**.  

---

## 3. API (`/gl/*`)

```
GET/POST/PATCH          /gl/account-groups
GET/POST/PATCH          /gl/accounts
GET/POST/PATCH          /gl/fiscal-years
GET/POST/PATCH          /gl/periods
POST                    /gl/periods/:id/close
GET/POST/PATCH          /gl/cost-centers
GET/POST/PATCH          /gl/currencies
GET/POST/PATCH          /gl/exchange-rates
GET/POST                /gl/journals
GET/PATCH               /gl/journals/:id
POST                    /gl/journals/:id/submit
POST                    /gl/journals/:id/approve
POST                    /gl/journals/:id/reject
POST                    /gl/journals/:id/post
POST                    /gl/journals/:id/void
GET                     /gl/reports/chart-of-accounts
GET                     /gl/reports/journal-register
GET                     /gl/reports/trial-balance
POST                    /gl/bootstrap   # seed BDT + sample CoA if empty (settings:manage)
```

Permissions: `gl:read`, `gl:manage`, `journal:create`, `journal:approve`, `period:close`, `fx:manage`, `financial-report:read`.

---

## 4. Frontend routes

| Path | Page |
|---|---|
| `/#/finance` | Module home / CoA |
| `/#/finance/accounts` | Chart of Accounts |
| `/#/finance/groups` | Account groups |
| `/#/finance/periods` | Fiscal years & periods |
| `/#/finance/cost-centers` | Cost centers |
| `/#/finance/currencies` | Currencies & FX |
| `/#/finance/journals` | Journal register + entry |
| `/#/finance/journals/:id` | Journal detail / approve / post |
| `/#/finance/reports` | Trial balance + register |

---

## 5. Regression guard

Do not modify Visa / Ticketing / Hotel / Transport / Tour / Hajj page internals.  
Do not alter cash `Account` / Invoice / Payment posting behavior.  
Do not begin AR / AP / Banking / Financial Statements.
