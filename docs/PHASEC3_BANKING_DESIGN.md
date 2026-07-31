# Phase C3 — Banking & Cash Management Technical Design

**Branch:** `feature/phase-c-banking`  
**Baseline:** `v2.1-ar-ap`  
**Business model:** Bank/cash books, transfers, cheques, and reconciliation on Phase C1 GL + C2 AR/AP  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Cash ops wallet | Keep existing `Account` / `LedgerEntry` / `Payment` / `Expense` untouched |
| GL (C1) | All banking movements post via journal engine; CoA by code (1100/1200) |
| AR/AP (C2) | Bridge deposits/payments/refunds/advances without replacing AR/AP docs |
| Banking (new) | Parallel `BankMaster` / `BankAccount` / movements / cheques / statements |

### Explicit non-goals

- Financial Statements (P&L, Balance Sheet, Cash Flow statement pack)  
- CRM  
- Replacing Visa / Ticketing / Hotel / Transport / Tour / Hajj engines  
- Changing cash-basis wallet balance math  

### Feature map

| Area | Delivery |
|---|---|
| Bank master / accounts | Institutions, account numbers, branch, opening balances, GL link |
| Cash | Cash / petty cash accounts, transfers, receipts, payments |
| Transactions | Deposit, withdrawal, transfer, charge, interest, cheque register |
| Cheques | Status tracking + configurable print template |
| Reconciliation | CSV statement import, match screen, adjustments |
| Travel integration | Link movements to AR/AP/payment/application |
| Reports | Bank book, cash book, daily cash position, recon report, cash flow summary |

---

## 2. Posting rules (C1 engine)

| Movement | Journal |
|---|---|
| Deposit / cash receipt into bank | Dr **1200**/bank GL · Cr **1100** or clearing/AR (via link) |
| Withdrawal / cash payment from bank | Dr **1100** or expense · Cr bank GL |
| Internal transfer | Dr destination bank GL · Cr source bank GL |
| Bank charge | Dr **5100** Office Expense · Cr bank GL |
| Interest | Dr bank GL · Cr **4000** Service Revenue |
| Opening balance | Dr/Cr bank GL · Cr/Dr **3000** Equity (opening) |

Accounts resolved by `BankAccount.glAccountId` or code lookup — never hard-coded UUIDs.

---

## 3. API (`/banking/*`)

```
GET/POST/PATCH   /banking/masters
GET/POST/PATCH   /banking/accounts
POST             /banking/accounts/:id/opening
GET/POST         /banking/movements
POST             /banking/movements/:id/post|void
GET/POST/PATCH   /banking/cheques
POST             /banking/cheques/:id/print|status
GET/POST         /banking/statements
POST             /banking/statements/import-csv
POST             /banking/reconciliations
POST             /banking/reconciliations/:id/match
POST             /banking/reconciliations/:id/complete
POST             /banking/bridge/ar-receipt/:arDocId
POST             /banking/bridge/ap-payment/:apDocId
GET              /banking/reports/bank-book
GET              /banking/reports/cash-book
GET              /banking/reports/daily-cash-position
GET              /banking/reports/reconciliation
GET              /banking/reports/cash-flow-summary
GET/PUT          /banking/cheque-print-config
```

Permissions: `banking:read`, `banking:manage`, `banking:reconcile`, `cheque:manage` (+ existing `bank:read` for cash wallets).

---

## 4. Frontend routes

| Path | Page |
|---|---|
| `/#/finance/banking` | Bank masters & accounts |
| `/#/finance/banking/movements` | Cash/bank transactions |
| `/#/finance/banking/cheques` | Cheque register |
| `/#/finance/banking/reconciliation` | Statement import & match |
| `/#/finance/banking/reports` | Bank/cash books & position |

---

## 5. Regression guard

Do not modify booking module internals.  
Do not alter cash `Account.currentBalance` posting in FinanceService.  
Do not begin Financial Statements or CRM.
