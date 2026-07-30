# Technical Debt — TravelOS Phase 0 / A

**As of:** 2026-07-30 (post stabilization)

---

## Closed in stabilization

| ID | Was | Resolution |
|---|---|---|
| D1 | Refresh cookie path `/api/auth` | Path `/` — silent refresh works on `/api2` |
| D4 | Checklist localStorage only | `ApplicationChecklistItem` + GET/PUT API + events |
| D5 | Assign needed `user:manage` | `GET /users/assignable` + `application:assign` |
| — | No `/health` | `GET /api/health` (+ `/api2/health`) |

---

## P0 — Before Phase B expansion

| ID | Debt | Suggested fix |
|---|---|---|
| D2 | Workspace **not a git repository** | `git init` + remote; protect main |
| D3a | No Nest Jest in API repo | Add vitest/jest under `/opt/shanghai-erp-api/test` |
| D3b | Expand Playwright (upload, invoice UI) | Grow `tests/e2e` |

---

## P1 — Should schedule

| ID | Debt | Notes |
|---|---|---|
| D6 | Passport `issueDate`/`expiryDate` vs DTO aliases | Display helper exists; normalize API responses |
| D7 | HashRouter + no dedicated nginx `/erp/` cache rules | Add `location /erp/` |
| D8 | No Sentry | Wire ErrorBoundary + Nest exceptions |
| D9 | Figma mega modules not implemented | Roadmap B–D |
| D10 | Notifications bell + ⌘K chrome-only | Phase D |
| D11 | Sonner sparsely used | Prefer toasts for success |
| D12 | Large unused shadcn kit on disk | Trim or generate on demand |
| D13 | `_unused/` kanban / RouteStatusTag | Delete or restore intentionally |
| D14 | Dual API pre-cutover | Phase G auth cutover |

---

## P2 — Cleanup / polish

| ID | Debt | Notes |
|---|---|---|
| D15 | Invoice list by customer then filter `applicationId` | Nest query param if available |
| D16 | Dashboard open-case count from first page | Server aggregates |
| D17 | Icon buttons missing some `aria-label`s | Axe pass |
| D18 | OCR retention job | Ops |
| D19 | Unit coverage of `apiFetch` via mocks | Raise v8 % beyond smoke |

---

## Test inventory

| Suite | Location |
|---|---|
| Unit | `apps/web/tests/unit/*` |
| Integration artifacts | `apps/web/tests/integration/*` |
| API smoke | `apps/web/tests/api/smoke.mjs` |
| E2E | `apps/web/tests/e2e/*` |
| Coverage HTML | `apps/web/coverage/` |

---

## Acceptance for Phase B start

1. Owner reads `DEPLOYMENT_READY.md` and explicitly approves Phase B.  
2. Prefer initializing git (D2) first.  
3. Do not reintroduce mock row data in live modules.  
4. Preserve `/visa-admin/` until migration signed off.
