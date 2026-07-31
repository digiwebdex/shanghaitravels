# Phase C4 — Financial Statements & General Ledger Completion Report

**Completed:** 2026-07-31  
**Branch:** `feature/phase-c-financial-statements`  
**Baseline:** `v2.2-banking`  
**Module:** Financial Statements & General Ledger  
**Status:** Production-complete for Phase C4 scope  

---

## Business model

Complete accounting reports are produced from **posted journals only** (C1 GL). AR/AP (C2) and Banking (C3) already post into the journal engine; statements read balances — they do not re-implement operational booking or cash wallets.

---

## Scope delivered

| Area | Delivery |
|---|---|
| GL inquiry | Ledger inquiry, account drill-down, trial balance (`/fs/*` + existing `/gl/reports`) |
| Closing | Period lock, reopen-with-approval, year-end close (P&L → RE 3100), OB roll-forward |
| Statements | Balance Sheet, P&L, Cash Flow (simplified indirect), Equity, comparative, multi-period |
| Analysis | Account, cost center, branch, currency + travel ERP validation |
| Controls | Locked periods block journal create/post; journal reversal (adjustment); adjustment journals via C1 |
| Exports | CSV (Excel) + printable HTML (Print/PDF via browser) |
| RBAC / Audit | `fs:export`, `period:lock`, `period:reopen-approve` + `AuditLog` |

---

## Product rules honored

- Posted journals only for all report math  
- Opening journals excluded from perpetual life-to-date (no double-count after roll-forward)  
- Booking modules (Visa / Ticketing / Hotel / Transport / Tour / Hajj) untouched  
- Cash wallet / Invoice / Payment ledger unchanged  
- CRM, Website, Portals, AI not started  

---

## Database (additive)

- `JournalEntry.reversesJournalId` (+ self-relation)  
- Tables: `PeriodReopenRequest`, `ClosingRun`  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260731220000_019_financial_statements/`  
- Applied to staging + production  

## Backend

- Nest SoT: `/opt/shanghai-erp-api/src/statements/`  
- Controller: `@Controller("fs")`  
- Deployed staging `:4201` + prod `/api2`  

---

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/finance/statements` | BS / P&L / CF / Equity / TB + export |
| `/#/finance/ledger` | Ledger inquiry + drill-down |
| `/#/finance/analysis` | Account / CC / branch / currency / travel validation |
| `/#/finance/closing` | Lock, reopen approval, year-end, roll-forward |

---

## Travel ERP validation

`GET /fs/travel-validation` reports case counts and AR/AP postings by service type (visa, ticketing, hotel, transport, tour, hajj) plus TB balanced flag and posted bank movement count.

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (33 unit tests)
npm run test:api      ✅  123/123 staging
npm run test:api:prod ✅  123/123
npm run test:e2e      ✅  Playwright (incl. statements.spec)
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASEC4_FINANCIAL_STATEMENTS_DESIGN.md`

---

## Explicit non-goals (next phases)

- CRM  
- Website  
- Portals  
- AI  
