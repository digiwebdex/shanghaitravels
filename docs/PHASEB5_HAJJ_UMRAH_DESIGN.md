# Phase B5 — Hajj & Umrah Technical Design

**Branch:** `feature/phase-b-hajj-umrah`  
**Baseline:** `v1.4-tour-packages`  
**Spec:** `/root/st-erp-frontend-spec-phase7-8.md` + product pilgrim/package/ops requirements  
**Figma:** `figma-design/src/admin/hajj/` (visual language only)  
**Business model:** Travel agency + Hajj/Umrah operator — pilgrims, packages, visas, flights, hotels, transport, suppliers, payments, groups

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Pilgrim profiles | `HajjPilgrim` catalog (passport/visa/mahram/health/emergency) |
| Package master | `HajjUmrahPackage` (hajj/umrah templates, pricing, occupancy, inclusions) |
| Groups | `HajjGroup` (leader, flights, hotels, transport, schedules, capacity) |
| Booking | `Application` `serviceType=hajj\|umrah` + `HajjUmrahDetail` |
| Workflow | Existing DB templates (hajj 6 stages / umrah 5 stages) |
| Money | Package costs in poisha; case finance via shared invoices/payments/installment notes |
| Cross-module | Manual refs to Visa / Ticketing / Hotel / Transport (no duplicate engines) |
| UI chrome | Figma amber density — operator workspace, not marketplace |

### Explicit non-goals

- Separate case engine outside Application spine  
- New Finance ERP module (installments = notes + shared invoices)  
- Public OTA booking for Hajj/Umrah  
- Modifying Visa / Ticketing / Hotel / Transport / Tour internals  

### Feature map

| Area | Implementation |
|---|---|
| Pilgrim profiles | `/#/hajj/pilgrims` → `HajjPilgrim` CRUD |
| Packages / templates / pricing | `/#/hajj/packages` → `HajjUmrahPackage` |
| Groups / leader / flights / schedules | `/#/hajj/groups` → `HajjGroup` |
| Booking / room / supplier ops | Case workspace + `HajjDetailCard` / `HajjOpsCard` |
| Documents / finance / assign / timeline | Shared cards + `hajj_*` doc categories |
| Reports | `/#/hajj/reports` aggregates |

---

## 2. Database (additive)

1. Extend `HajjUmrahDetail` with ops/pricing/status fields.  
2. New tables: `HajjUmrahPackage`, `HajjPilgrim`, `HajjGroup`.  

No destructive migrations.

---

## 3. API

### Reuse

- Applications + `PUT /detail/hajj` | `PUT /detail/umrah`  
- Journey / note / advance / assign / documents / finance  
- Existing workflow templates for `hajj` / `umrah`  

### New (`settings:manage` for mutations; read authenticated)

```
GET/POST/PATCH/DELETE /reference/hajj-packages
GET/POST/PATCH/DELETE /reference/hajj-pilgrims
GET/POST/PATCH/DELETE /reference/hajj-groups
```

---

## 4. Frontend routes

| Path | Page |
|---|---|
| `/#/hajj` | Booking list (hajj + umrah) |
| `/#/hajj/new` | Create booking |
| `/#/hajj/:id` | Case workspace |
| `/#/hajj/packages` | Package master / templates |
| `/#/hajj/pilgrims` | Pilgrim profiles |
| `/#/hajj/groups` | Group operations |
| `/#/hajj/reports` | Manifests / payments / profitability |

---

## 5. Workflow ops

| Intent | Mechanism |
|---|---|
| Registration / docs | Stages + documents |
| Package & payment | Detail pricing + invoice/payments + installment notes |
| Pre-departure confirm | Advance with confirmation |
| In progress / completed | Stage advance + status |
| Refund | Ops note + finance |

---

## 6. Regression guard

Do not modify Visa / Ticketing / Hotel / Transport / Tour page internals. Additive shell wiring only. Do not begin Finance ERP.
