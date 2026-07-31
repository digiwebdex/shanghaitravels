# Version 2.0 RC1 — Regression Report

**Branch:** `release/v2.0-rc1`  
**Executed:** 2026-07-31  
**Frontend:** `apps/web`  
**API:** staging `http://127.0.0.1:4201/api` · prod `https://shanghaitravels.com.bd/api2`

---

## Summary

| Suite | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | ✅ PASS |
| ESLint | `npm run lint` | ✅ PASS (0 warnings) |
| Unit + coverage | `npm run test:coverage` | ✅ 33/33 (13 files) |
| Integration | `npx vitest run tests/integration` | ✅ 2/2 |
| API smoke (staging) | `npm run test:api` | ✅ 123/123 |
| API smoke (prod) | `npm run test:api:prod` | ✅ 123/123 |
| Playwright E2E | `npm run test:e2e` | ✅ 11/11 |
| Production build | `npm run build` | ✅ → `/erp/` |

**Overall:** All required regression gates green after RC1 security hotfixes.

---

## Unit tests

```
Test Files  13 passed (13)
Tests       33 passed (33)
```

Coverage (v8, statements): ~44.7% of measured helper/lib surface (historical baseline; not a gate failure).

## Integration tests

`tests/integration/visa-workflow.test.ts` — 2 passed (visa workflow helpers).

## API smoke coverage (123 checks)

Includes:

- Health / auth login-refresh-logout / me  
- Customers, visa case create/advance/docs  
- Ticketing, hotel, transport, tour, hajj flows  
- GL bootstrap, journal post, trial balance  
- AR/AP create → post → aging  
- Banking bootstrap, transfer, cheque, recon, reports  
- FS trial balance, BS, P&L, CF, equity, ledger, analysis, travel-validation, export, closing runs  

Staging and production both **123/123** after hotfixes.

## Playwright full regression (11)

| Spec | Result |
|---|---|
| `arap.spec.ts` | ✅ |
| `auth-and-visa.spec.ts` | ✅ |
| `banking.spec.ts` | ✅ |
| `finance.spec.ts` | ✅ |
| `hajj.spec.ts` | ✅ |
| `hotels.spec.ts` | ✅ |
| `statements.spec.ts` | ✅ |
| `ticketing.spec.ts` (2) | ✅ |
| `tours.spec.ts` | ✅ |
| `transport.spec.ts` | ✅ |

Base URL: `https://shanghaitravels.com.bd/erp/`

## Production build

- `tsc --noEmit && vite build` succeeded  
- Main bundle ~325 KB / ~101 KB gzip  
- Deployed: `rsync` → `/var/www/ShanghaiTravels/erp/`

## Database / migrations

| Env | Migrations | Status |
|---|---|---|
| `st_erp_staging` | 20 | Up to date |
| `st_erp_prod` | 20 | Up to date |

Latest: `20260731220000_019_financial_statements`

## Hotfix verification

Post-deploy smoke (auth + documents + finance modules) remained green. No new frontend test failures introduced (API-only hotfixes).

---

## Sign-off

Regression suite for **v2.0 RC1** is **PASS**. Ready for release-candidate freeze on `release/v2.0-rc1`.
