# Known Limitations — Phase 0 / Phase A

**As of:** 2026-07-30 (post Phase A stabilization)

See also: `PHASEA_STABILIZATION.md`, `DEPLOYMENT_READY.md`, `TECHNICAL_DEBT.md`.

---

## Resolved in stabilization

1. ~~Refresh cookie path blocked `/api2` silent refresh~~ → `st_refresh` Path=`/`  
2. ~~Checklist only in localStorage~~ → `ApplicationChecklistItem` + API  
3. ~~Assign staff list required `user:manage`~~ → `GET /users/assignable`  

---

## Auth & session

1. **Dual APIs** — Public site login still hits legacy `:4100` via `/api/`; ERP uses `/api2`. Full cutover still deferred (refresh now works without cutover).  
2. **HashRouter** — URLs look like `/erp/#/visa/...`. Can switch to BrowserRouter after nginx `location /erp/`.

---

## OCR & privacy

3. **OCR on prod** — `OCR_APPROVED=true`; scan available with `ocr:use`.  
4. **No OCR retention job** — images/raw text accumulate until ops cleanup.  
5. **Passport save permission** — `POST /passports` requires `ocr:apply`.

---

## Product / UX scope

6. **Phase A nav only** — CRM, finance module pages, HR, partners not in sidebar (Phase B+).  
7. **Figma VisaModule mega-tabs** not rebuilt; case workspace is the operational vertical.  
8. **Customer Lead CRM** — Phase D; public intake remains outside ERP shell.  
9. **Notifications inbox** — topbar bell present; inbox wiring Phase D. Sonner mounted.  
10. **Global ⌘K search** — visual placeholder.  
11. **Locale** — BDT / Dhaka (not Figma AED/Dubai).

---

## Ops / deploy

12. **Nest in-process Jest suite** not yet in `/opt/shanghai-erp-api` — live smoke covers API.  
13. **Source outside git** — initialize before Phase B.  
14. **No Sentry / APM** — ErrorBoundary + systemd journals.  
15. **Excluded unused shadcn modules** from `tsc` until needed.  
16. **Dead modules** in `apps/web/src/_unused/`.

---

## Non-goals (unchanged)

- No GDS / fake flight inventory  
- No Phase B service modules until owner approval  
- No corporate/supplier/customer self-service portals  
- No redesign of Figma visual system  
- `visa-admin` remains until staff fully migrate to `/erp/`
