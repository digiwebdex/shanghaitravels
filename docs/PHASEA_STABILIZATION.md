# Phase A Stabilization — Completion Report

**Completed:** 2026-07-30  
**Scope:** HIGH-1 … HIGH-4 from QA (no Phase B modules)  
**Deployed:** Nest staging `:4201` + prod `:4200`; frontend `/erp/`

---

## Objectives

| ID | Objective | Status |
|---|---|---|
| HIGH-1 | Silent session refresh on `/api2` | **Done** |
| HIGH-2 | Server-side checklist per case + audit | **Done** |
| HIGH-3 | Assign any active staff (`application:assign`) | **Done** |
| HIGH-4 | Unit / integration / e2e / API smoke + coverage | **Done** |

Phase B (Ticketing, Hotel, Tour, Hajj, …) was **not** started.

---

## HIGH-1 — Refresh cookie path

**Change:** `st_refresh` cookie `Path` changed from `/api/auth` → `/` in Nest `auth.controller.ts`.  
Old path cleared on login/logout so browsers migrate.

**Result:** Browser sends refresh cookie to `/api2/auth/refresh`. Silent refresh verified on staging and production smoke (25/25).

**Files:** `/opt/shanghai-erp-api/src/auth/auth.controller.ts` → deployed to `/opt/st-erp-api`.

---

## HIGH-2 — Checklist persistence

**Schema:** `ApplicationChecklistItem` (`itemKey`, `checked`, `checkedAt`, `checkedBy`, timestamps)  
**Migration:** `20260730190000_012_application_checklist` applied to staging + prod.

**API:**
- `GET /applications/:id/checklist` — `application:read`
- `PUT /applications/:id/checklist` `{ updates: [{ itemKey, checked }] }` — `application:update`

**Audit:** Per-row `checkedAt` / `checkedBy` (+ display name); `ApplicationEvent` type `checklist_updated`.

**UI:** `VisaCasePage` loads/saves via API; localStorage removed; attribution shown under ticks.

---

## HIGH-3 — Staff assignment

**API:** `GET /users/assignable` — requires `application:assign` (not `user:manage`).  
Returns active staff `{ id, fullName, email, status, role }`.

**Assign hardening:** Target must be active non-deleted user; event message uses staff name.

**UI:** Case workspace uses `usersApi.assignable()`.

---

## HIGH-4 — Testing

| Suite | Command | Result |
|---|---|---|
| Unit + coverage | `npm run test:coverage` | 9 passed; `money.ts` 100% lines |
| Integration artifact checks | vitest `tests/integration` | included |
| API smoke (staging) | `npm run test:api` | **25/25** |
| API smoke (prod `/api2`) | `npm run test:api:prod` | **25/25** |
| E2E (Playwright) | `npm run test:e2e` | **1/1** passed |

Reports: `apps/web/coverage/`, `docs/TEST_COVERAGE_REPORT.md`.

---

## Also shipped

- Public `GET /api/health` (DB ping) — staging, prod, `/api2/health`
- Dedicated QA user `qa.stabilization@…` (mustChangePassword=false) for automated tests — credentials in `apps/web/.env.test` (mode 0600, not for commit)

---

## Verification commands

```bash
curl -sS https://shanghaitravels.com.bd/api2/health
cd /var/www/ShanghaiTravels/apps/web && npm run test:all
```

`visa-admin` md5 unchanged: `6873bb1e1d6b29e6c9f1bd216ac8c758`.
