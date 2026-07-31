# Phase D2 — Sales Automation & Quotations Completion Report

**Completed:** 2026-07-31  
**Branch:** `feature/phase-d-sales`  
**Baseline:** `v2.4-crm-foundation`  
**Module:** Sales Automation & Quotations  
**Status:** Production-complete for Phase D2 scope  

---

## Business model

Complete sales workflow from opportunity qualification through versioned quotation approval and conversion into shared Application bookings (visa, air ticket, hotel, tour, Hajj & Umrah). Reuses Auth, RBAC, branch model, CRM Foundation, Documents/Timeline patterns, Assignment, Notifications, Finance integration surface, AuditLog, and reporting framework. Booking engines and Finance C1–C4 unchanged.

---

## Scope delivered

| Area | Delivery |
|---|---|
| Opportunity management | Configurable `SalesStage`, stage history, win/loss, `LostReason` catalog, expected close date (CRM field), probability scoring |
| Quotation engine | Versioned quotes, revisions (`rootQuoteId`), line items, discounts, tax, validity, approval workflow, printable HTML/PDF, email-ready HTML |
| Pricing | `PriceTemplate` (+ lines), `PriceBook` kinds: standard / customer / corporate / agent / promo, resolve endpoint |
| Sales tasks | Follow-up scheduling, reminders, assignment, escalations, SLA due tracking |
| Conversion | Approved/accepted quotes → Application via `ApplicationsService.create`; links quote / opportunity / lead / customer |
| Dashboards & reports | Quote status, win/loss, funnel, by executive, conversion time, forecast accuracy |
| RBAC / Audit | `quote:approve`, `sales:pricing`, `sales:task` + `AuditLog` on sales mutations |

---

## Product rules honored

- No redesign of CRM D1 screens or completed booking/finance modules  
- Conversion uses `ApplicationsService.create` only  
- Website, CMS, Portals, HR, AI not started  

---

## Database (additive)

- Tables: `SalesStage`, `OpportunityStageHistory`, `LostReason`, `PriceTemplate`, `PriceTemplateLine`, `PriceBook`, `SalesTask`  
- Extended `Opportunity.lostReasonId`, `Quotation` (version, discounts, approval, htmlSnapshot), `QuotationLine` (productCode, discount)  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260731260000_021_sales_automation/`  
- Applied staging + production  

## Backend

- Nest SoT: `/opt/shanghai-erp-api/src/sales/`  
- Controller: `@Controller("sales")`  
- Deployed staging `:4201` + prod `/api2` (`/opt/st-erp-api`)  

---

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/sales` | Pipeline / stages / win-loss / history |
| `/#/sales/quotations` | Quote engine, approval, export, convert |
| `/#/sales/pricing` | Templates & price books |
| `/#/sales/tasks` | Tasks / SLA / escalate |
| `/#/sales/reports` | Sales dashboards |

Sidebar: **Sales** (`opportunity:read`). Live module key: `sales`.

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (36 unit tests)
npm run test:api      ✅  157/157 staging
npm run test:api:prod ✅  157/157
npm run test:e2e      ✅  sales + crm Playwright specs
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASED2_SALES_DESIGN.md`

---

## Explicit non-goals (next)

- Website / CMS  
- Customer Portal / Agent Portal / Corporate Portal  
- HR  
- AI  
