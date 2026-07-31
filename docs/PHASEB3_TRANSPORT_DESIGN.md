# Phase B3 — Transport Module Technical Design

**Branch:** `feature/phase-b-transport`  
**Baseline:** `v1.2-hotel`  
**Spec:** `/root/st-erp-frontend-spec-phase4.md`  
**Figma:** `figma-design/src/admin/transport/` (visual language only)  
**Business model:** Supplier-based agency — **no fleet / driver roster / GPS**

---

## 1. Architecture

Transport is an **Application** with `serviceType=transport` on the shared case spine:

| Concern | Approach |
|---|---|
| Booking list / create / case | Shared stages, journey, docs, invoice, assign, RBAC |
| Booking detail | Manual `TransportDetail` → `PUT …/detail/transport` |
| Workflow | `transport — standard` (Requirement → Vehicle Assigned → Dispatched → Completed) |
| Suppliers | Existing `Supplier` with `type=transport` |
| Vehicle catalog | New reference table (supplier offer types — **not owned fleet**) |
| Routes / destinations | New reference table (manual route catalog) |
| Categories / service kinds | Controlled catalogs in app code + detail fields |
| Money | Shared `CaseFinanceCard` (BDT / poisha) |
| UI chrome | Figma amber density — **not** fleet/GPS/driver roster tabs |

### Workflow stages

1. Requirement  
2. Vehicle Assigned (supplier confirmation)  
3. Dispatched (voucher / trip start)  
4. Completed  

### Feature → implementation map

| # | Feature | Implementation |
|---|---|---|
| 1 | Transport Supplier Management | `/#/transport/suppliers` → `/suppliers?type=transport` |
| 2 | Vehicle Catalog | `/#/transport/vehicles` → `/reference/transport-vehicles` |
| 3 | Vehicle Categories | `VEHICLE_CATEGORIES` + catalog `category` |
| 4 | Airport Transfer | `serviceKind=airport_transfer` on booking |
| 5 | City Transfer | `serviceKind=city_transfer` |
| 6 | Chauffeur Booking | `serviceKind=chauffeur` |
| 7 | Route & Destination Catalog | `/#/transport/routes` → `/reference/transport-routes` |
| 8 | Booking | Cases `/#/transport`, `/new`, `/:id` |
| 9 | Supplier Confirmation | `confirmationNo` + ops advance to Vehicle Assigned |
| 10 | Transport Voucher | Ops → Dispatched + `transport_voucher` doc type |
| 11 | Modification | Ops timeline note |
| 12 | Cancellation | Note + `status=cancelled` + audit |
| 13–16 | Invoice / Payments / Timeline / Documents | Shared case cards |
| 17 | Reports | `/#/transport/reports` |

### Explicit non-goals

- Owned fleet, plate inventory, maintenance, GPS tracking  
- Driver HR roster / licensing system  
- Figma AED / Dubai mock fleet tabs  
- Tour Packages module  

---

## 2. Database

| Change | Why |
|---|---|
| `TransportDetail.serviceKind` | Airport / city / chauffeur |
| `TransportDetail.confirmationNo` | Supplier confirmation / voucher ref |
| `TransportDetail.routeName` | Optional link to route catalog label |
| `TransportVehicleType` table | Supplier vehicle offer catalog |
| `TransportRoute` table | Route / destination catalog |

All additive / new tables — non-breaking.

---

## 3. API

### Existing (reuse)

- Applications CRUD + `PUT /detail/transport`  
- Journey, note, advance, assign, documents, finance  
- `GET/POST/PATCH/DELETE /suppliers`  

### New

```
GET/POST/PATCH/DELETE /reference/transport-vehicles
GET/POST/PATCH/DELETE /reference/transport-routes
```

Read: authenticated staff. Mutations: `settings:manage`.

Detail whitelist gains: `serviceKind`, `confirmationNo`, `routeName`.

---

## 4. Frontend routes

| Path | Page |
|---|---|
| `/#/transport` | Booking list |
| `/#/transport/new` | Create booking |
| `/#/transport/:id` | Case workspace |
| `/#/transport/vehicles` | Vehicle catalog |
| `/#/transport/routes` | Route catalog |
| `/#/transport/suppliers` | Transport suppliers |
| `/#/transport/reports` | Ops report |

---

## 5. Validation / RBAC / audit

- Client: `serviceKind` / `vehicleType` catalogs; passengers ≥ 1; scheduledAt optional ISO  
- Permissions: `application:*`, `document:*`, `invoice:*`, `payment:*`, `supplier:*`, `settings:manage`  
- Timeline: notes, stage advances, `status_changed` on cancel  

---

## 6. Regression guard

Do not change Visa / Ticketing / Hotel page internals. Only additive shell wiring (nav, routes, LIVE module, smoke, shared doc category).
