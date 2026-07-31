# Phase B5 — Hajj & Umrah Module Completion Report

**Completed:** 2026-07-30  
**Branch:** `feature/phase-b-hajj-umrah`  
**Baseline:** `v1.4-tour-packages`  
**Module:** Hajj & Umrah (`serviceType=hajj|umrah`)  
**Status:** Complete — **awaiting owner approval** (do not start Finance ERP)

---

## Business model

Shanghai Travels operates as a **travel agency and Hajj/Umrah operator**.  
This module manages pilgrims, packages, visas, flights, hotels, transport, suppliers, payments, and group operations on the shared Application case spine.

Cross-module references reuse Visa / Ticketing / Hotel / Transport / Tour as manual links — no duplicate engines.

---

## Scope delivered

| Area | Delivery |
|---|---|
| Pilgrim profiles | `/#/hajj/pilgrims` → passport/visa/mahram/health/emergency |
| Packages / templates / pricing | `/#/hajj/packages` → kind, category, occupancy, inclusions |
| Groups / leader / flights / schedules | `/#/hajj/groups` |
| Bookings | List / new / case workspace for hajj + umrah |
| Ops | Installments, supplier payments, confirm, depart, modify, refund, cancel |
| Documents | Shared cards + `hajj_*` doc categories |
| Finance / timeline / assign / RBAC / audit | Shared case cards |
| Reports | Pilgrims, visa, flight manifest, rooming, payments, profitability |

---

## Product rules honored

- Shared case architecture reused  
- Existing hajj / umrah workflow templates reused  
- Visa / Ticketing / Hotel / Transport / Tour internals not modified  
- Finance ERP not started  
- Not an OTA marketplace  

---

## Database (additive)

- Extended `HajjUmrahDetail` with pilgrim/ops/pricing fields  
- Tables: `HajjUmrahPackage`, `HajjPilgrim`, `HajjGroup`  
- Migration: `/opt/shanghai-erp-api/prisma/migrations/20260731140000_015_hajj_umrah/`  
- Applied to staging + production  

## Backend

- `HajjCatalogController` on Nest SoT → staging + prod  
- Detail whitelist extended for hajj/umrah  

## Frontend routes

| Path | Purpose |
|---|---|
| `/#/hajj` | Bookings |
| `/#/hajj/new` | Create |
| `/#/hajj/:id` | Case workspace |
| `/#/hajj/packages` | Package templates |
| `/#/hajj/pilgrims` | Pilgrim profiles |
| `/#/hajj/groups` | Group operations |
| `/#/hajj/reports` | Reports |

Nav: **Hajj & Umrah** (LIVE).

Workflows: existing DB templates (hajj 6 stages / umrah 5 stages).

---

## Quality gates

```
npm run typecheck     ✅
npm run lint          ✅
npm run test:coverage ✅  (26 unit tests)
npm run test:api      ✅  73/73 staging
npm run test:api:prod ✅  73/73
npm run test:e2e      ✅  7/7 Playwright
npm run build         ✅  synced to /erp/
```

Design: `docs/PHASEB5_HAJJ_UMRAH_DESIGN.md`

---

## Stop line

Phase B5 complete. **Do not begin Finance ERP** until this module is approved and tagged.
