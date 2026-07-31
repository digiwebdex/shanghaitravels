# Phase B — Air Ticketing Technical Design

**Branch:** `feature/phase-b-ticketing`  
**Spec:** `/root/st-erp-frontend-spec-phase4.md`  
**Figma:** `figma-design/src/admin/ticketing/` (visual language only)  
**Constraint:** Manual fulfilment — **no GDS / fake flight search inventory**

---

## 1. Technical design

Air ticketing is an **Application** with `serviceType=air_ticket` on the same case spine as visa:

| Concern | Approach |
|---|---|
| List / create / case shell | Shared case patterns (stages, journey, docs, invoice, assign, RBAC) |
| Service detail | Manual `AirTicketDetail` form → `PUT /applications/:id/detail/air_ticket` |
| Workflow | Active template `air_ticket — standard` (4 stages) |
| Money | Existing invoice/payment cards (poisha / BDT) |
| UI chrome | Figma admin density (amber, 10–11px, white cards) — **not** Dubai GDS mock tabs |

### Routes

| Path | Page |
|---|---|
| `/#/ticketing` | List `serviceType=air_ticket` |
| `/#/ticketing/new` | Create case |
| `/#/ticketing/:id` | Case workspace |

### Explicit non-goals (this module)

- Flight search / fare matrix / GDS  
- Group / corporate booking mock tabs from Figma data.ts  
- AED pricing  

---

## 2. Database

**No migration.** Uses existing `AirTicketDetail` + `Application` + stages/events/docs/invoices.

---

## 3. API (existing Nest)

- `POST /applications` `{ serviceType: "air_ticket", customerId, title?, priority? }`  
- `GET /applications?serviceType=air_ticket`  
- `GET /applications/:id` → includes `airTicket`  
- `PUT /applications/:id/detail/air_ticket` — whitelist fields per Phase 4  
- Shared: journey, advance, note, assign, approve, documents, invoices, payments  

---

## 4–7. Frontend / responsive / validation / RBAC

- LIVE module key `ticketing` (no DemoBadge)  
- Permissions: `application:read|create|update|assign|advance-stage|approve|note`, `document:*`, `invoice:*`, `payment:record`  
- Client validation: required customer on create; tripType/cabinClass enums; dates coherent (return ≥ depart when both set)  
- Responsive: same breakpoints as visa case (`grid-cols-1 lg:grid-cols-2`)  

---

## 8–10. Tests

- Unit: air ticket field helpers / date coercion  
- API smoke: create air case → put detail → reload  
- E2E: login → ticketing list → (smoke path)  

---

## 11–14. Docs / build / git

Completion report: `docs/PHASEB_TICKETING_COMPLETION.md`  
Deploy `apps/web` → `/erp/` · commit + push on feature branch · **stop for approval** before hotel.
