# Test Coverage Report — Phase A Stabilization

**Generated:** 2026-07-30  
**App:** `apps/web`  
**API:** Nest staging `:4201` + prod `/api2`

---

## Summary

| Layer | Tool | Result |
|---|---|---|
| Unit | Vitest + v8 | **9/9 passed** |
| Integration (artifact) | Vitest | included in unit run |
| API smoke (auth, RBAC, visa, checklist, assign, finance, OCR) | Node fetch | **25/25 staging**, **25/25 prod** |
| E2E | Playwright Chromium | **1/1 passed** |

---

## Unit coverage (v8) — pure helpers

Scope: `src/lib/money.ts`, `src/lib/api.ts` (network `apiFetch` exercised by smoke/e2e, not mocked here).

| File | Stmts | Branches | Funcs | Lines |
|---|---|---|---|---|
| `money.ts` | 100% | 100% | 100% | **100%** |
| `api.ts` | 22.38% | 25.45% | 15.38% | 23.33% |
| **Total (scoped)** | 29.72% | 32.78% | 35.29% | 30.3% |

HTML report: `apps/web/coverage/index.html`  
JSON: `apps/web/coverage/coverage-summary.json`

**Interpretation:** Money helpers are fully covered. `apiFetch` / refresh / auth-lost paths are covered by **API smoke + e2e**, not by v8 instrumentation of browser fetch.

---

## API smoke cases (25)

1. `GET /health`  
2. `GET /auth/me` → 401 unauthenticated  
3. Login  
4. Refresh cookie present (`st_access`, `st_refresh`)  
5. Authenticated `/auth/me`  
6. RBAC / role present  
7. **Silent refresh**  
8. Session after refresh  
9. `GET /users/assignable`  
10. `GET /users` (manage)  
11. Create customer  
12. Create visa application  
13. CVASC stages ≥ 1 (observed 7)  
14. Put visa detail  
15. Checklist put ticks  
16. Checklist get (multi-device sync)  
17. Checklist audit (`checkedBy` + `checkedAt`)  
18. Assign to authorized staff  
19. Case note  
20. List accounts  
21. Create invoice  
22. Issue invoice  
23. Record payment  
24. OCR list reachable  
25. Logout  

Artifact: `apps/web/coverage/api-smoke-report.json` (last run target).

---

## E2E (Playwright)

`tests/e2e/auth-and-visa.spec.ts`

- Login → Dashboard → Customers → Visa list  
- Asserts `st_refresh` cookie **path `/`**

---

## How to re-run

```bash
cd /var/www/ShanghaiTravels/apps/web
# requires apps/web/.env.test (0600) with ERP_TEST_EMAIL / ERP_TEST_PASSWORD
npm run test:coverage
npm run test:api
npm run test:api:prod
npm run test:e2e
# or
npm run test:all
```

---

## Gaps (accepted for Phase A gate)

- No Nest Jest suite inside `/opt/shanghai-erp-api` yet (API covered by smoke against live processes).  
- UI component unit tests (RTL) not added — e2e covers critical staff path.  
- Notifications inbox UI still unwired (Phase D) — not in smoke.  
- File upload binary e2e not automated (client `validateUploadFile` unit-tested; Nest 15MB guard remains).
