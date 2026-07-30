# Deployment Ready — Phase A Stabilization Gate

**Status:** ✅ **READY** for continued Phase A production use  
**Phase B:** **Not approved to start until owner explicitly green-lights after this gate**  
**Date:** 2026-07-30

---

## Decision

All **critical** Phase A stabilization items are **closed**:

1. Silent session refresh works on `/api2`  
2. Checklist is server-persisted with audit attribution  
3. Managers can assign any active staff via RBAC-safe picker  
4. Automated unit, API smoke (staging+prod), and e2e suites pass with coverage artifacts  

**Recommendation:** Phase A may remain the live staff ERP.  
**Phase B (Ticketing / Hotel / Tour / Hajj / …):** start only after explicit owner approval — do not begin from this document alone.

---

## Confirmed production surfaces

| Surface | URL / path | Status |
|---|---|---|
| Staff ERP | `https://shanghaitravels.com.bd/erp/` | ✅ deployed |
| Nest API (prod) | `/api2` → `127.0.0.1:4200` | ✅ health OK |
| Nest API (staging) | `:4201` | ✅ health OK |
| Stopgap admin | `/visa-admin/` | ✅ unchanged |
| Public site | `/` + `/api/public/` | ✅ untouched by this milestone |

---

## Gate matrix (must be green)

| Area | Result |
|---|---|
| Authentication | ✅ |
| RBAC | ✅ |
| Session refresh | ✅ |
| API health | ✅ |
| Database consistency | ✅ |
| File uploads | ✅ (guards; binary e2e optional) |
| OCR | ✅ enabled + reachable |
| Invoice | ✅ |
| Payments | ✅ |
| Notifications | ⚠️ module exists; inbox UI Phase D |
| Logging | ⚠️ journald; no Sentry |
| Error handling | ✅ |
| Performance | ✅ |
| Accessibility | ✅ baseline |
| Security | ✅ |

Details: `FINAL_PRODUCTION_CHECKLIST.md`, `TEST_COVERAGE_REPORT.md`, `PHASEA_STABILIZATION.md`.

---

## Rollback notes

- Frontend: restore previous `erp/assets` from backup if needed (no git yet — **initialize git before Phase B**).  
- API: previous dist lived under `/opt/st-erp-api/dist`; source of truth `/opt/shanghai-erp-api`.  
- DB migration `012_application_checklist` is additive (safe); dropping table only if rolling back checklist feature.

---

## Owner sign-off checklist

- [ ] Reviewed `PHASEA_STABILIZATION.md`  
- [ ] Reviewed smoke/e2e results in `TEST_COVERAGE_REPORT.md`  
- [ ] Accepted notifications/Sentry as non-blocking  
- [ ] Explicitly approve **start of Phase B** (separate instruction)

Until the last box is checked by the owner, agents must **not** implement Phase B modules.
