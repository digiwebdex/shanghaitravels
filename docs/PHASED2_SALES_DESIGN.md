# Phase D2 — Sales Automation & Quotations Technical Design

**Branch:** `feature/phase-d-sales`  
**Baseline:** `v2.4-crm-foundation`  
**Business model:** Lead → opportunity → versioned quote → approval → booking conversion  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Reuse | Auth, RBAC, branch, CRM Foundation, Application spine, Notifications, AuditLog |
| New module | Nest `@Controller("sales")` + UI `/#/sales/*` |
| Booking modules | Untouched — conversion via `ApplicationsService.create` |
| PDF / email | Printable HTML snapshot (browser Print/PDF); email-ready HTML body |

### Explicit non-goals

- Website, CMS, Portals, HR, AI  
- Redesign of CRM D1 screens or Finance  

---

## 2. Domain (additive)

| Entity | Purpose |
|---|---|
| `SalesStage` | Configurable pipeline stages + default probability |
| `OpportunityStageHistory` | Stage transition audit |
| `LostReason` | Catalog for win/loss |
| `Quotation` (extended) | Version, discount, approval workflow, HTML snapshot |
| `PriceTemplate` / lines | Product/service pricing templates |
| `PriceBook` | Customer / corporate / agent / promo overrides |
| `SalesTask` | Follow-ups, reminders, assignment, SLA, escalation |

---

## 3. Quotation workflow

`draft` → `pending_approval` → `approved` / `rejected` → `sent` → `accepted` → `converted`  
(also `expired`)

- **Revise:** clone as new version under same `rootQuoteId`  
- **Approve:** `quote:approve` permission  
- **Convert:** only `approved` or `accepted` quotes; links Application ↔ quote/opportunity/lead  

---

## 4. API (`/sales/*`)

```
GET/POST  /sales/stages
GET/POST  /sales/lost-reasons
POST      /sales/opportunities/:id/stage   # with history + lostReasonId
GET       /sales/opportunities/:id/history
GET/POST  /sales/quotations
POST      /sales/quotations/:id/submit|approve|reject|revise|send
GET       /sales/quotations/:id/export     # ?format=html
GET/POST  /sales/price-templates
GET/POST  /sales/price-books
POST      /sales/pricing/resolve
GET/POST  /sales/tasks
POST      /sales/tasks/:id/complete|escalate
POST      /sales/convert                   # approved quote → Application
GET       /sales/reports/*
POST      /sales/bootstrap
```

Permissions: existing `opportunity:*`, `quote:*`, `crm:convert`  
+ `quote:approve`, `sales:pricing`, `sales:task`

---

## 5. Frontend routes

| Path | Page |
|---|---|
| `/#/sales` | Pipeline / stages dashboard |
| `/#/sales/quotations` | Quote engine + approval |
| `/#/sales/pricing` | Templates & price books |
| `/#/sales/tasks` | Sales tasks / SLA |
| `/#/sales/reports` | Funnel, win/loss, forecast accuracy |

---

## 6. Regression guard

Do not modify Visa / Ticketing / Hotel / Transport / Tour / Hajj engines.  
Do not begin Website, CMS, Portals, HR, or AI.
