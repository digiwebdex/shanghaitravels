# Phase 0 Completion — TravelOS Frontend Foundation

**Completed:** 2026-07-30  
**App path:** `apps/web/`  
**Deploy path:** `/erp/` (HashRouter)  
**visa-admin:** unchanged (verified)

---

## Objectives met

| Item | Status |
|---|---|
| Frontend architecture from `figma-design` tokens/layout/UI kit | Done |
| Reusable UI primitives copied (`src/components/ui/*`) | Done |
| Routing (Phase A routes only) | Done — `createHashRouter` |
| API services (`lib/api.ts`, `lib/services.ts`) | Done — base `/api2` |
| Authentication (cookie JWT, AuthProvider, RequireAuth, Can) | Done |
| Layouts (Figma AdminLayout chrome adapted) | Done |
| State (React context auth; server state via fetch) | Done |
| Environment variables (`VITE_ERP_BASE`) | Done |
| Error handling (`ApiError`, banners) | Done |
| Loading states (FullPageSpinner, InlineSpinner) | Done |
| Notifications (Sonner toaster mounted) | Done |
| DemoBadge + `LIVE_MODULES` | Done |

---

## Architecture

```
apps/web/
├── src/
│   ├── app/App.tsx, routes.tsx
│   ├── auth/AuthProvider, RequireAuth, Can
│   ├── layouts/AdminLayout.tsx          # Figma admin shell (Phase A nav)
│   ├── pages/…                          # Phase A screens
│   ├── lib/api.ts, services.ts, types.ts, money.ts
│   ├── config/env.ts, checklist.ts
│   ├── components/…                     # Spinner, DemoBadge, Feedback
│   ├── components/ui/                   # Figma shadcn kit
│   ├── admin/shared/CaseTimeline.tsx    # Figma shared timeline
│   └── styles/                          # Figma theme tokens
├── .env                    # VITE_ERP_BASE=/api2
└── dist/ → deployed to /var/www/ShanghaiTravels/erp/
```

---

## Quality gates (Phase 0)

```
npm run typecheck   ✅
npm run lint        ✅
npm run build       ✅  (~360 KB JS gzipped ~107 KB)
```

---

## Deploy notes

- URL: `https://shanghaitravels.com.bd/erp/` → app at `/erp/#/…`
- HashRouter chosen so **no nginx change** is required and deep links work without SPA `try_files` for `/erp/*`.
- Public site and `/visa-admin/` were **not** modified.

---

## Intentionally deferred (post Phase A)

- Full Figma module sidebar (24+ modules) — DemoBadged later phases
- BrowserRouter + nginx `/erp/` location
- Auth cutover `/api2` → `/api`
