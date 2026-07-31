# Phase C4 — Financial Statements & General Ledger Technical Design

**Branch:** `feature/phase-c-financial-statements`  
**Baseline:** `v2.2-banking`  
**Business model:** Complete accounting reports from **posted journals only**  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Source of truth | Posted `JournalEntry` / `JournalLine` (C1) only |
| AR/AP / Banking | Already post into GL; statements read GL balances |
| Booking modules | Untouched — validated via case-linked GL postings |
| Exports | CSV (Excel), printable HTML (Print/PDF via browser) |

### Explicit non-goals

- CRM, Website, Portals, AI  
- Changing cash wallet / booking engines  
- Live bank feeds  

### Feature map

| Area | Delivery |
|---|---|
| GL | Ledger inquiry, drill-down, TB, period/year close, OB roll-forward |
| Statements | Balance Sheet, P&L, Cash Flow, Equity, comparative / multi-period |
| Analysis | Account, cost center, branch, currency |
| Controls | Lock periods, reopen-with-approval, journal reversal, adjustments |
| Exports | CSV + printable HTML |

---

## 2. Statement construction rules

1. **Posted journals only** (`status=posted`, not void).  
2. **Balance Sheet:** assets / liabilities / equity (+ retained earnings after P&L close).  
3. **P&L:** income − expense for period range.  
4. **Cash Flow (indirect/simplified):** opening cash (1100+1200) + net movement from posted cash/bank lines.  
5. **Equity:** opening equity + net income − drawings (if any) + closing equity.  
6. **Comparative:** same report for period A vs period B.  
7. Account types from configurable CoA — never hard-coded UUIDs.

---

## 3. API (`/fs/*` + GL control extensions)

```
# Inquiry / statements
GET  /fs/ledger
GET  /fs/ledger/:glAccountId
GET  /fs/trial-balance
GET  /fs/balance-sheet
GET  /fs/profit-loss
GET  /fs/cash-flow
GET  /fs/equity
GET  /fs/comparative
GET  /fs/multi-period
GET  /fs/analysis/account|cost-center|branch|currency
GET  /fs/export/:report   # ?format=csv|html

# Controls
POST /fs/periods/:id/lock
POST /fs/periods/:id/reopen-request
POST /fs/periods/:id/reopen-approve
POST /fs/periods/:id/reopen-reject
POST /fs/journals/:id/reverse
POST /fs/year-end/close
POST /fs/year-end/roll-forward
GET  /fs/closing-runs
```

Permissions: `financial-report:read`, `fs:export`, `period:close`, `period:lock`, `period:reopen-approve`, `journal:approve`.

---

## 4. Frontend routes

| Path | Page |
|---|---|
| `/#/finance/statements` | Statement hub (BS / P&L / CF / Equity) |
| `/#/finance/ledger` | Ledger inquiry + drill-down |
| `/#/finance/analysis` | Account / CC / branch / currency |
| `/#/finance/closing` | Period lock, year-end, reopen approvals |

---

## 5. Regression guard

Do not modify Visa / Ticketing / Hotel / Transport / Tour / Hajj.  
Do not begin CRM, Website, Portals, or AI.
