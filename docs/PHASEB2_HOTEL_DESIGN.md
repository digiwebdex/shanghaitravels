# Phase B2 — Hotel Module Technical Design

**Branch:** `feature/phase-b-hotel`  
**Baseline:** `v1.1-ticketing`  
**Spec:** `/root/st-erp-frontend-spec-phase4.md`  
**Figma:** `figma-design/src/admin/hotels/` (visual language only)  
**Constraint:** Manual fulfilment — **no hotel GDS / bed-bank / rate-sheet inventory APIs**

---

## 1. Architecture

Hotel work is an **Application** with `serviceType=hotel` on the shared case spine (same as visa / air ticket):

| Concern | Approach |
|---|---|
| Booking list / create / case shell | Shared stages, journey, docs, invoice, assign, RBAC |
| Booking detail | Manual `HotelDetail` → `PUT /applications/:id/detail/hotel` |
| Workflow | Active template `hotel — standard` (4 stages) |
| Money | Shared `CaseFinanceCard` (poisha / BDT) |
| Suppliers | Existing `Supplier` with `type=hotel` |
| Hotel master | Existing `Hotel` reference table + new Nest CRUD |
| Room types / meal plans | Controlled catalogs in app code (+ `mealPlan` on detail) |
| UI chrome | Figma amber density — **not** search/rate-sheet/GDS tabs |

### Workflow stages

1. Requirement  
2. Availability & Quote  
3. Booking Confirmed  
4. Voucher Delivered  

### Feature → implementation map

| # | Feature | Implementation |
|---|---|---|
| 1 | Hotel Supplier Management | UI `/#/hotels/suppliers` → `GET/POST/PATCH/DELETE /suppliers?type=hotel` |
| 2 | Hotel Master | UI `/#/hotels/catalog` → `GET/POST/PATCH/DELETE /reference/hotels` |
| 3 | Room Types | Shared `ROOM_TYPES` catalog + `HotelDetail.roomType` |
| 4 | Meal Plans | `MEAL_PLANS` catalog + additive `HotelDetail.mealPlan` |
| 5 | Hotel Booking | Cases `/#/hotels`, `/new`, `/:id` |
| 6 | Hotel Voucher | Stage “Voucher Delivered” + confirmation/voucher no. + doc upload |
| 7 | Booking Confirmation | `confirmationNo` + advance to “Booking Confirmed” |
| 8 | Modification | Ops note + detail update (timeline) |
| 9 | Cancellation | Ops → note + `status=cancelled` + audit |
| 10 | Hotel Invoice | Shared finance card (`applicationId`) |
| 11 | Hotel Payments | Shared payment / refund |
| 12 | Hotel Timeline | Shared stages + journey events |
| 13 | Hotel Documents | Shared documents card |
| 14 | Hotel Reports | `/#/hotels/reports` — case aggregates from list API |

### Explicit non-goals

- Live hotel search / availability matrices  
- Rate sheets / bed-bank inventory  
- AED pricing / Figma Dubai mocks  
- Transport or Tour modules  

---

## 2. Database

| Change | Why |
|---|---|
| `HotelDetail.mealPlan String?` | Meal plan feature without separate MealPlan table |
| No other schema changes | `Hotel`, `Supplier`, Application spine already exist |

Migration: additive nullable column only (non-breaking).

---

## 3. API

### Existing (reuse)

- `POST/GET/PATCH /applications` (+ `?serviceType=hotel`)  
- `PUT /applications/:id/detail/hotel`  
- Journey, note, advance, assign, approve, documents  
- Invoices / payments / refunds  
- `GET/POST/PATCH/DELETE /suppliers`  

### New

```
GET    /reference/hotels?q=&city=&country=&active=
POST   /reference/hotels          (settings:manage)
PATCH  /reference/hotels/:id      (settings:manage)
DELETE /reference/hotels/:id      (settings:manage, soft-delete)
```

Read is available to any authenticated staff (same pattern as countries/airlines).

Detail whitelist gains: `mealPlan`.

---

## 4. Frontend routes

| Path | Page |
|---|---|
| `/#/hotels` | Booking list |
| `/#/hotels/new` | Create booking case |
| `/#/hotels/:id` | Case workspace |
| `/#/hotels/catalog` | Hotel master |
| `/#/hotels/suppliers` | Hotel suppliers |
| `/#/hotels/reports` | Hotel ops report |

Nav: **Hotels** (LIVE). Sub-links on module chrome (bookings / catalog / suppliers / reports).

### New UI only (no duplication of case shell)

- `HotelDetailCard`, `HotelOpsCard`  
- `lib/hotel.ts`, `lib/hotelOps.ts`  
- List/create/catalog/suppliers/reports pages  

Reuse: `CaseAssignCard`, `CaseDocumentsCard`, `CaseFinanceCard`, `CaseTimeline`, `formStyles`.

---

## 5. Validation / RBAC / audit

- Client: check-out ≥ check-in; nights coherent; mealPlan/roomType catalogs; rooms/guests ≥ 1 when set  
- Permissions: `application:*`, `document:*`, `invoice:*`, `payment:*`, `supplier:*`, `settings:manage` (catalog mutations)  
- Timeline: notes, stage advances, `status_changed` on cancel  
- No GDS calls  

---

## 6. Tests & docs

- Unit: hotel helpers / ops gates  
- API smoke: create hotel case → put detail → note → advance → cancel audit; hotel master CRUD  
- E2E: login → hotels list → catalog smoke  
- Docs: this file + `PHASEB2_HOTEL_COMPLETION.md`  

---

## 7. Regression guard

Do **not** change visa or air-ticketing page behaviour except unavoidable shared-component improvements (finance refund already shared). Hotel-only routes and cards.
