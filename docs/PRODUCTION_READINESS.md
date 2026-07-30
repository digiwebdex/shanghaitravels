# Production Readiness — TravelOS Phase 0 / A

**As of:** 2026-07-30  
**App:** `https://shanghaitravels.com.bd/erp/`  
**API:** `/api2` → Nest `:4200` (`st_erp_prod`)  
**Companion:** `/visa-admin/` (stopgap; do not remove)

---

## Gate status: READY for Phase A production use

Critical QA blockers found in audit were fixed and redeployed. Phase A visa vertical is safe for staff use with the caveats in § Remaining risks.

**Phase B:** Not started. See `PHASEA_QA_REPORT.md` — proceed only after owner ack of HIGH items.

---

## Checklist

### Environment

| Item | Status |
|---|---|
| `VITE_ERP_BASE=/api2` in build | ✅ |
| Nest prod env (`ACCESS_TTL`, JWT secrets, `DATABASE_URL`) | ✅ on `/opt/st-erp-api` |
| `OCR_APPROVED=true` (prod) | ✅ enabled |
| Secrets not in frontend bundle | ✅ cookies/JWT server-side |
| Dual API pre-cutover documented | ✅ `/api` legacy `:4100`, `/api2` Nest |

### Auth & session

| Item | Status |
|---|---|
| httpOnly cookies | ✅ `st_access`, `st_refresh` |
| secure + sameSite=lax | ✅ |
| mustChangePassword hard gate | ✅ |
| Mid-session 401 → login | ✅ (`onAuthLost`) |
| Silent refresh on `/api2` | ⚠️ broken cookie path (8h access mitigates) |

### UX states

| Item | Status |
|---|---|
| Loading (boot + lazy modules) | ✅ |
| Empty states (lists) | ✅ |
| Error banners / ApiError | ✅ |
| 404 page | ✅ |
| Render crash recovery | ✅ ErrorBoundary |
| Dedicated HTTP 500 page | ⚠️ API errors shown inline; no branded 500 route (acceptable) |

### Security ops

| Item | Status |
|---|---|
| RBAC fail-closed in UI | ✅ |
| Upload limits client + server | ✅ 15MB image/pdf |
| `/admin` `/staff` blocked | ✅ nginx 404 |
| ERP `noindex` | ✅ meta robots |
| CSRF | sameSite=lax; cookie auth staff tool |

### Performance

| Item | Status |
|---|---|
| Production Vite build | ✅ |
| Lazy-loaded Phase A pages | ✅ |
| Gzip (nginx) | ✅ |

### Observability

| Item | Status |
|---|---|
| Browser console ErrorBoundary log | ✅ |
| Central error logging (Sentry etc.) | ❌ not configured — debt |
| API structured logs | Nest process logs only |

### Browser compatibility

| Target | Expectation |
|---|---|
| Modern Chromium / Firefox / Safari | Supported (ES modules, cookies) |
| IE11 | Not supported |
| Mobile | Layout collapses sidebar &lt;1024px; usable but desktop-first |

### Data integrity

| Item | Status |
|---|---|
| Money integer poisha | ✅ |
| Invoice paid/due computed server-side | ✅ |
| Soft deletes on finance entities | ✅ Prisma `deletedAt` |
| Checklist ticks | Browser localStorage only (not multi-device SoT) |

---

## Go-live staff verification (manual)

1. Open `/erp/` → Sign in (super_admin for full finance).  
2. Create customer → New visa case (China tourist).  
3. Confirm CVASC stages; advance; assign (self).  
4. Upload doc; tick checklist; reload — ticks persist in same browser.  
5. Create invoice (৳) → Issue → Record payment.  
6. Approve / complete; reload case.  
7. Confirm `/visa-admin/` still works unchanged.

---

## Remaining risks (accept or schedule)

1. **Auth cutover held** — refresh cookie path; dual APIs. Schedule Phase G.  
2. **No e2e CI** — regressions caught manually.  
3. **Workspace not in git** — no rollback/PR review.  
4. **No Sentry** — client failures only in console.  
5. **OCR retention** — when scanning, ops cleanup still needed.

---

## Recommendation

- **Ship / keep Phase A live** for China visa staff workflows.  
- **Defer Phase B** until HIGH items in QA report are acknowledged.  
- Keep `visa-admin` until staff confirm `/erp/` covers their daily path.
