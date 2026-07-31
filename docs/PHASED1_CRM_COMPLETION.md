# Phase D1 — CRM Foundation Completion Report

**Completed:** 2026-07-31  
**Branch:** `feature/phase-d-crm`  
**Baseline:** `release/v2.0-rc1`  
**Module:** CRM Foundation (B2C / B2B / Corporate)  
**Status:** Production-complete for Phase D1 scope  

---

## Business model

Travel-agency CRM for inbound leads through conversion into shared Application cases (visa, ticketing, hotel, tour, hajj/umrah). Reuses Auth, RBAC, branch scope, case spine, communications/timeline patterns, AuditLog, and reporting framework. Booking engines and Finance C1–C4 unchanged.

---

## Scope delivered

| Area | Delivery |
|---|---|
| Leads | Sources: web, walkin, phone, whatsapp, facebook, referral; priority; convert |
| Contacts | Individual / family / corporate |
| Organizations | Corporate / travel_agent / partner_agency (+ optional Agent / CorporateClient link) |
| Opportunities | Pipeline stages, probability (bps), expected revenue |
| Activities | Call, meeting, email, WhatsApp, task, follow-up (+ Communication mirror) |
| Quotations | Visa / ticket / hotel / tour / hajj / umrah with lines |
| Conversion | `POST /crm/convert` → draft Application + mark lead/opp/quote converted |
| Reports | Lead sources, conversion, pipeline, team, forecast |
| RBAC / Audit | New perms + `AuditLog` on CRM mutations |

---

## Product rules honored

- No redesign of completed booking/finance modules  
- Conversion uses `ApplicationsService.create` only  
- Website, CMS, Portals, HR, AI not started  

---

## Database (additive)

- Extended `Lead`  
- Tables: `CrmContact`, `CrmOrganization`, `Opportunity`, `CrmActivity`, `Quotation`, `QuotationLine`  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260731240000_020_crm_foundation/`  
- Applied staging + production  

## Backend

- Nest SoT: `/opt/shanghai-erp-api/src/crm/`  
- Controllers: legacy `/leads`, `/communications` + `@Controller("crm")`  
- Deployed staging `:4201` + prod `/api2`  

---

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/crm` | Leads + convert |
| `/#/crm/contacts` | Contacts |
| `/#/crm/organizations` | Organizations |
| `/#/crm/opportunities` | Pipeline |
| `/#/crm/activities` | Activities |
| `/#/crm/quotations` | Quotations |
| `/#/crm/reports` | CRM reports |

Sidebar: **CRM** (`crm:read`).

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (34 unit tests)
npm run test:api      ✅  135/135 staging
npm run test:api:prod ✅  135/135
npm run test:e2e      ✅  12/12 Playwright
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASED1_CRM_DESIGN.md`

---

## Explicit non-goals (next)

- Website / CMS  
- Customer Portal / Agent Portal / Corporate Portal  
- HR  
- AI  
