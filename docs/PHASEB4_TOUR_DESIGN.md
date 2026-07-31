# Phase B4 — Tour Packages Technical Design

**Branch:** `feature/phase-b-tour-packages`  
**Baseline:** `v1.3-transport`  
**Spec:** `/root/st-erp-frontend-spec-phase4.md` + product master/builder/pricing/ops requirements  
**Figma:** `figma-design/src/admin/tours/` (visual language only)  
**Business model:** Supplier-curated packages — **not an OTA marketplace**

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Product master | `TourPackage` catalog (builder + pricing fields) |
| Departures | `TourDeparture` calendar rows linked to package |
| Destinations | `TourDestination` (country/city/season tags) |
| Booking | `Application` `serviceType=tour` + `TourPackageDetail` |
| Workflow | Enquiry → Itinerary & Quote → Confirmed → In Progress → Completed |
| Money | Product costs/prices in poisha; case finance via shared invoices |
| Countries | Existing `GET /reference/countries` |
| UI chrome | Figma amber density — no marketplace / GDS |

### Explicit non-goals

- OTA inventory / online public booking engine  
- Owned hotel/fleet GDS wiring  
- Dedicated Hajj & Umrah module (religious tours here exclude that spine)  
- Guide HR / GPS fleet systems from Figma mocks  

### Feature map

| Area | Implementation |
|---|---|
| Categories / types / seasons | Controlled catalogs + package fields |
| Destinations / cities / countries | `TourDestination` + Country reference |
| Package builder | Product form: itinerary days (JSON), inclusions/exclusions, activities, hotels/transport/flights notes, visa, insurance |
| Pricing | Occupancy/child/season notes + supplierCost / sellingPrice poisha + margin helper |
| Departure calendar | `TourDeparture` CRUD |
| Booking / quotation / voucher / modify / cancel | Case spine + `TourOpsCard` |
| Documents / finance / assign / timeline | Shared cards |
| Reports | `/#/tours/reports` aggregates + package performance |
| Domestic / international / group / private / … | `category` + `packageType` enums |

---

## 2. Database (additive)

1. Extend `TourPackageDetail` with builder/pricing/ops fields used on bookings.  
2. New tables: `TourPackage`, `TourDeparture`, `TourDestination`.  

No destructive migrations.

---

## 3. API

### Reuse

- Applications + `PUT /detail/tour`  
- Journey / note / advance / assign / documents / finance  
- `GET /reference/countries`  

### New (`settings:manage` for mutations; read authenticated)

```
GET/POST/PATCH/DELETE /reference/tour-packages
GET/POST/PATCH/DELETE /reference/tour-departures
GET/POST/PATCH/DELETE /reference/tour-destinations
```

---

## 4. Frontend routes

| Path | Page |
|---|---|
| `/#/tours` | Booking list |
| `/#/tours/new` | Create booking |
| `/#/tours/:id` | Case workspace |
| `/#/tours/packages` | Product master / builder |
| `/#/tours/departures` | Departure calendar |
| `/#/tours/destinations` | Destination catalog |
| `/#/tours/reports` | Sales / profit / performance |

---

## 5. Workflow ops

| Intent | Mechanism |
|---|---|
| Quotation | Note + detail pricing fields |
| Confirm | `confirmationNo` + advance → Confirmed |
| Voucher / in progress | Advance → In Progress |
| Modify / cancel | Notes + status audit |

---

## 6. Regression guard

Do not change Visa / Ticketing / Hotel / Transport page internals. Additive shell only (nav, routes, LIVE, smoke, doc category).
