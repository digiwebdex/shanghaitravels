# Phase B1 — Air Ticketing Production QA Report

**Date:** 2026-07-30  
**Branch:** `feature/phase-b-ticketing`  
**Module:** Air Ticketing (`serviceType=air_ticket`)  
**Scope:** Full production QA before Hotel — **Hotel not started**

---

## Verdict

| Severity | Count | Status |
|---|---|---|
| Critical | 0 remaining | Cleared |
| High | 0 remaining | Cleared (ops + refund + audit) |
| Medium | 0 remaining | Cleared |
| Low / accepted | Documented | Intentional non-goals |

**Recommendation:** Proceed to Hotel implementation on `feature/phase-b-hotel`.

---

## 1. UI vs Figma

### Source of truth

| Source | Role |
|---|---|
| `figma-design/src/admin/ticketing/` | Visual language (amber, density, cards) |
| Product constraint | Manual fulfilment — **no GDS / fake inventory / AED** |

### Comparison

| Figma surface | Live TravelOS | Result |
|---|---|---|
| Flight Search / Fare matrix tabs | Not implemented | **Accepted non-goal** (no GDS) |
| PNR / Ticket View | `AirTicketDetailCard` manual form | Pass — chrome matches admin density |
| Issue Ticket | Workflow stage + **Ticket operations → Mark ticket issued** | Pass (post-QA) |
| Reissue / Cancel / Refund tab | `TicketOpsCard` + finance refund | Pass (post-QA) |
| Group / Corporate / Reports mock | Not implemented | **Accepted non-goal** |
| List + case workspace | `/#/ticketing`, `/new`, `/:id` | Pass |
| Spacing / typography / amber CTAs | Shared `formStyles` + visa case patterns | Pass |
| Responsive | `grid-cols-1 lg:grid-cols-2`, mobile filters | Pass |
| Accessibility | Labels on ops/finance controls; search `aria-label` | Pass |
| LIVE badge | `ticketing` in LIVE modules — no DemoBadge | Pass |

### UI issues found & fixed

| ID | Finding | Fix |
|---|---|---|
| UI-1 | Unauthenticated `/#/ticketing` could surface RR default error UI | `errorElement` on auth layouts; E2E asserts redirect to login |
| UI-2 | Missing explicit fare / issue / reissue / cancel / refund request UI | Added `TicketOpsCard` |
| UI-3 | Note field not cleared after note/advance | Clear on success |
| UI-4 | NotFound copy still said “Phase A” | Updated to TravelOS |

---

## 2. Business logic

| Flow | Mechanism | Result |
|---|---|---|
| Ticket Request | `POST /applications` `serviceType=air_ticket` → 4 stages | Pass |
| Fare Quotation | Ops → note `Fare quotation: ৳…` (+ optional advance) | Pass |
| Manual PNR | `PUT …/detail/air_ticket` | Pass |
| Ticket Issue | Require `ticketNo` + advance from Fare & Booking → Ticket Issued | Pass |
| Reissue | Ops → timeline note `Reissue request: …` | Pass (manual) |
| Refund | Ops request note + `POST /payments/refund` (`payment:refund`) | Pass |
| Cancellation | Note + `PATCH` status `cancelled` + `status_changed` event | Pass |
| Timeline | Stages + History events | Pass |
| Documents | Shared `CaseDocumentsCard` | Pass |
| Invoice / Payment | Shared `CaseFinanceCard` (BDT/poisha) | Pass |
| Assignment | Shared `CaseAssignCard` + `/users/assignable` | Pass |

---

## 3. Backend

### Endpoints exercised (staging + prod smoke)

| Endpoint | Permission | Result |
|---|---|---|
| `POST /applications` air_ticket | `application:create` | Pass |
| `PUT /applications/:id/detail/air_ticket` | `application:update` | Pass |
| `GET /applications/:id` (includes `airTicket`) | `application:read` | Pass |
| `POST /applications/:id/note` | `application:note` | Pass |
| `POST /applications/:id/advance-stage` | `application:advance-stage` | Pass |
| `PATCH /applications/:id` status | `application:update` | Pass |
| `GET /applications/:id/journey` | `application:read` | Pass |
| Shared finance / docs / assign | existing gates | Pass |

### Fixes shipped (Nest SoT → staging + prod)

| ID | Finding | Fix |
|---|---|---|
| API-1 | Status changes had no timeline audit | `update()` writes `status_changed` ApplicationEvent |
| API-2 | Empty note returned 404 | Now `BadRequestException` |

Deploy: `npm run build` in `/opt/shanghai-erp-api` → rsync `dist/` to `/opt/st-erp-api` → restart `st-erp-api` + `st-erp-api-staging`.

---

## 4. Database

Prod sample (2026-07-30):

| Check | Result |
|---|---|
| `air_ticket` cases use Application spine | Pass (2+ cases) |
| Stage count = 4 (`Requirement` → `Delivered`) | Pass |
| `AirTicketDetail` orphan / wrong serviceType | None |
| Events on create / note / advance / cancel | Pass |

No migration required; shared Case architecture reused correctly.

---

## 5. Security

| Area | Result |
|---|---|
| RBAC fail-closed on Nest `@Permissions` | Pass |
| Separate `payment:refund` vs `payment:record` | Pass (UI + API) |
| Validation (trip/cabin enums, return ≥ depart, fare amount) | Pass |
| File uploads | Existing app-documents MIME/size gates (unchanged) |
| Session | httpOnly cookies; refresh `Path=/`; silent refresh smoke | Pass |
| Unauthenticated ticketing route | Redirects to login (E2E) | Pass |

---

## 6. Performance

Production build (Vite):

| Chunk | Size | gzip |
|---|---|---|
| `index-*.js` (shell) | 302.66 kB | 95.74 kB |
| `TicketingCasePage-*.js` | 19.20 kB | 5.25 kB |
| `TicketingListPage-*.js` | 6.98 kB | 2.48 kB |
| CSS | 106.87 kB | 17.59 kB |

Lazy routes via `React.lazy` for ticketing list/case. API smoke create→detail→note→advance→cancel &lt; few seconds on staging/prod.

---

## 7. Testing

| Suite | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run test:coverage` | 16/16 unit |
| `npm run test:api` (staging :4201) | 32/32 |
| `npm run test:api:prod` (`/api2`) | 32/32 |
| `npm run test:e2e` (Playwright) | 3/3 |
| `npm run build` → deploy `/erp/` | Pass |

New coverage: `tests/unit/airTicketOps.test.ts`; smoke fare note / advance / cancel audit; E2E case ops + unauth redirect.

---

## 8. Residual accepted gaps

1. **No GDS flight search / fare matrix / group / corporate tabs** — product rule; Figma mock AED/Dubai not cloned.  
2. **Reissue does not mutate PNR/ticket automatically** — staff updates detail + notes (manual ops).  
3. **Unit coverage config** still focuses on selected libs (not full page %); E2E/smoke cover module paths.

---

## 9. Stop / next

Hotel must **not** start until this report is accepted. After acceptance: branch `feature/phase-b-hotel`, same spine pattern, `serviceType=hotel`.
