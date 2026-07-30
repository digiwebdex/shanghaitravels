# Final Production Checklist — Phase A Stabilization

**Date:** 2026-07-30  
**Auditor:** automated smoke + manual gate review  
**Surfaces:** `/erp/`, `/api2`, Nest `:4200`, DB `st_erp_prod`

Legend: ✅ pass · ⚠️ accepted limitation · ❌ fail

---

## Authentication & session

| Check | Status | Evidence |
|---|---|---|
| Login sets httpOnly cookies | ✅ | Smoke + e2e |
| `/auth/me` requires session | ✅ | 401 without cookie |
| Silent refresh on `/api2` | ✅ | HIGH-1; smoke 25/25 prod |
| Refresh cookie path `/` | ✅ | Playwright + Set-Cookie |
| Logout clears cookies | ✅ | Smoke |
| mustChangePassword gate | ✅ | LoginPage / ChangePassword |
| QA / staff sessions stable | ✅ | ACCESS_TTL 8h + refresh |

## RBAC

| Check | Status | Evidence |
|---|---|---|
| Nest PermissionsGuard | ✅ | Live |
| UI `Can` / `can()` | ✅ | Case workspace |
| Assign uses `application:assign` | ✅ | `/users/assignable` |
| Finance permissions hide UI | ✅ | Invoice card |

## API health

| Check | Status | Evidence |
|---|---|---|
| `GET /api2/health` | ✅ | `{ ok: true }` + DB ping |
| Staging `:4201` health | ✅ | Same |
| Nginx rewrite `/api2` → Nest | ✅ | |

## Database consistency

| Check | Status | Evidence |
|---|---|---|
| Checklist migration applied | ✅ | `012_application_checklist` |
| Invoice/payment integer poisha | ✅ | Schema + smoke payment |
| Assign FK to active user | ✅ | Service validation |
| Soft-delete patterns preserved | ✅ | Prisma models |

## File uploads

| Check | Status | Evidence |
|---|---|---|
| Nest 15MB + mime allow-list | ✅ | `app-documents.controller` |
| Client `validateUploadFile` | ✅ | Unit tests |
| Binary e2e upload | ⚠️ | Manual / future |

## OCR

| Check | Status | Evidence |
|---|---|---|
| `OCR_APPROVED=true` prod | ✅ | Env |
| List endpoint authenticated | ✅ | Smoke |
| Scan apply permissions | ✅ | `ocr:use` / `ocr:apply` |

## Invoice & payments

| Check | Status | Evidence |
|---|---|---|
| Create → issue → pay | ✅ | Smoke prod |
| paid/due computed | ✅ | Finance service |
| Case-scoped invoice filter in UI | ✅ | VisaCasePage |

## Notifications

| Check | Status | Evidence |
|---|---|---|
| Nest notifications module present | ✅ | Backend |
| Staff inbox UI wired | ⚠️ | Topbar bell placeholder — Phase D |
| Sonner toaster mounted | ✅ | App shell |

## Logging & errors

| Check | Status | Evidence |
|---|---|---|
| Nest process logs (systemd) | ✅ | `st-erp-api.service` |
| ErrorBoundary + ApiError banners | ✅ | Frontend |
| Central APM / Sentry | ⚠️ | Not configured — debt |

## Performance

| Check | Status | Evidence |
|---|---|---|
| Lazy route chunks | ✅ | Vite build |
| Main JS ~301 KB gzip ~95 KB | ✅ | Build output |
| Health responds quickly | ✅ | Smoke |

## Accessibility

| Check | Status | Evidence |
|---|---|---|
| Login labels / required | ✅ | E2E + a11y snapshot |
| Checklist labels | ✅ | Wrapped `<label>` |
| Full axe audit | ⚠️ | Not automated |

## Security

| Check | Status | Evidence |
|---|---|---|
| Cookies httpOnly + sameSite=lax + secure (prod) | ✅ | Auth controller / env |
| No tokens in localStorage | ✅ | Code review |
| Upload mime/size guards | ✅ | |
| `/admin` `/staff` blocked | ✅ | Nginx |
| ERP `noindex` | ✅ | index.html |
| `visa-admin` untouched | ✅ | md5 match |

## Frontend deploy

| Check | Status | Evidence |
|---|---|---|
| `/erp/` serves TravelOS | ✅ | Live title |
| HashRouter deep links | ✅ | |
| typecheck / lint / build | ✅ | |

---

## Critical open items

**None** for Phase A operational gate.

## Accepted non-blockers

1. Notifications inbox UI (Phase D)  
2. No Sentry  
3. No Nest Jest in-repo (smoke covers live API)  
4. Auth cutover `/api2` → `/api` still deferred (refresh now works anyway)
