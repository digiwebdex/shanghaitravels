# Production Route Map — Shanghai Travels

**Audited:** 2026-07-31  
**Hosts:** `https://shanghaitravels.com.bd`  
**TravelOS SPA:** Vite `base: "/erp/"` + React `createHashRouter`  
**Scope:** Routing / deploy paths only (no business-logic changes)

---

## Intended production URLs (canonical)

| # | Surface | Production URL | Notes |
|---|---|---|---|
| 1 | **Staff ERP login** | `https://shanghaitravels.com.bd/erp/#/login` | TravelOS staff login (`LoginPage`). Same entry for all staff roles. |
| 2 | **Super Admin login** | `https://shanghaitravels.com.bd/erp/#/login` | **No separate URL.** Super Admin is an RBAC role (`super_admin`) after the same staff login. |
| 3 | **Customer Portal login** | `https://shanghaitravels.com.bd/erp/#/portal/customer/login` | Customer JWT realm (`st_customer`). |
| 4 | **Agent Portal login** | `https://shanghaitravels.com.bd/erp/#/portal/agent/login` | Agent JWT realm (`st_agent`). |
| 5 | **Corporate Portal login** | `https://shanghaitravels.com.bd/erp/#/portal/corporate/login` | Corporate JWT realm (`st_corporate`). |
| 6 | **Public website** | `https://shanghaitravels.com.bd/` | Marketing site (document root). CMS-driven viewer also available under TravelOS at `/erp/#/site/*`. |
| 7 | **Default landing (domain root)** | `https://shanghaitravels.com.bd/` | Public marketing home. |
| 7b | **Default landing (ERP shell)** | `https://shanghaitravels.com.bd/erp/` → hash `/` | Unauthenticated → redirect to `/#/login`. Authenticated → staff **Dashboard** (`AdminLayout` index). |
| — | Service Desk (legacy) | `https://shanghaitravels.com.bd/visa-admin/` | Stopgap vanilla UI; not HashRouter. |

### Answer to “which intended production URL?”

| Route | Role |
|---|---|
| `/#/login` | **Staff / Super Admin** login (under `/erp/`) |
| `/#/` (dashboard index) | **Staff home after login** (not a public landing) |
| `/#/portal/customer/login` | Customer portal |
| `/#/portal/agent/login` | Agent portal |
| `/#/portal/corporate/login` | Corporate portal |
| `/` (no hash, site root) | **Public website** (separate from TravelOS) |

There is **no** dedicated `/#/dashboard` path — the staff dashboard is the **index route** `/#/` inside `RequireAuth` + `AdminLayout`.

---

## 8. Route guard behavior

| Guard | Applies to | Behavior |
|---|---|---|
| `RequireAuth` | All staff routes under `AdminLayout` + `/change-password` | `loading` → spinner; `anon` → `<Navigate to="/login" state.returnTo>`; `mustChangePassword` → `/change-password` |
| Customer portal layout | `/portal/customer/*` (except public auth pages) | `me()` failure → `/portal/customer/login` |
| Agent portal layout | `/portal/agent/*` | `me()` failure → `/portal/agent/login`; temp password gate before outlet |
| Corporate portal layout | `/portal/corporate/*` | `me()` failure → `/portal/corporate/login`; temp password gate before outlet |
| Staff RBAC | API (`Permissions` / fail-closed) | UI may hide nav items; API enforces |

Public (no staff cookie required): `/login`, `/site/*`, portal auth pages (`…/login|register|verify|forgot`).

---

## 9. Which routes use `createHashRouter`

**All TravelOS routes** in `apps/web/src/app/routes.tsx` use a single `createHashRouter([...])`.

Implication: browser path is always `/erp/` (or `/erp/index.html`); client routes live in the **hash** (`/#/...`). Nginx does not need SPA fallback for deep staff paths beyond serving `/erp/index.html`.

**Does not use HashRouter:**

- Public marketing site at `/` (its own static SPA / assets)
- `/visa-admin/` and `/visa-admin-staging/` (static HTML tools)

---

## 10. Public website routes

### A. Document root (marketing)

| Path | Purpose |
|---|---|
| `https://shanghaitravels.com.bd/` | Marketing home |
| Static assets | `/assets/*`, `/favicon.png`, `/og-image.jpg`, hero media, `robots.txt`, `sitemap.xml` |

### B. CMS viewer inside TravelOS (HashRouter)

| Hash route | Purpose |
|---|---|
| `/#/site` | Published home |
| `/#/site/p/:slug` | CMS page |
| `/#/site/enquire` | Enquiry form → CRM lead |
| `/#/site/search` | Search |
| `/#/site/travel/:serviceType/:slug` | Travel offer |

Full public URL example: `https://shanghaitravels.com.bd/erp/#/site/enquire`

---

## Staff / portal hash map (under `/erp/`)

### Staff (RequireAuth)

| Hash | Screen |
|---|---|
| `/#/login` | Staff login |
| `/#/change-password` | Forced password change |
| `/#/` | Dashboard |
| `/#/customers`, `/#/visa`, `/#/ticketing`, `/#/hotels`, … | Ops modules |
| `/#/finance/*`, `/#/crm/*`, `/#/sales/*`, `/#/comms/*`, `/#/analytics/*`, `/#/cms/*` | ERP modules |

### Customer portal

| Hash | Screen |
|---|---|
| `/#/portal/customer/login` | Login (+ OTP) |
| `/#/portal/customer/register` | Register |
| `/#/portal/customer/verify` | Email verify |
| `/#/portal/customer/forgot` | Password reset |
| `/#/portal/customer` | Dashboard |
| `/#/portal/customer/applications|documents|finance|communications|profile|reports` | Modules |

### Agent portal

| Hash | Screen |
|---|---|
| `/#/portal/agent/login` | Login |
| `/#/portal/agent/forgot` | Reset |
| `/#/portal/agent` | Dashboard |
| `/#/portal/agent/bookings|customers|finance|documents|communications|reports` | Modules |

### Corporate portal

| Hash | Screen |
|---|---|
| `/#/portal/corporate/login` | Login |
| `/#/portal/corporate/forgot` | Reset |
| `/#/portal/corporate` | Dashboard |
| `/#/portal/corporate/company|employees|requests|approvals|bookings|finance|communications|reports` | Modules |

---

## Nginx / filesystem layout

| Location | Filesystem | Role |
|---|---|---|
| `/` | `/var/www/ShanghaiTravels/index.html` + `/assets/` | Public marketing |
| `/erp/` | `/var/www/ShanghaiTravels/erp/index.html` + `/erp/assets/` | TravelOS (HashRouter) |
| `/visa-admin/` | `/var/www/ShanghaiTravels/visa-admin/` | Legacy service desk |
| `/api2/` | proxy → Nest `:4200` | TravelOS API |
| `/api/public/` | proxy → Nest `:4200` | Public intake |
| `/api/` | proxy → interim `:4100` | Pre-cutover auth (legacy) |

Vite config: `base: "/erp/"` — asset URLs must be `/erp/assets/…`.

---

## Defect found and corrected (deploy path only)

| Issue | Impact | Fix applied |
|---|---|---|
| TravelOS build was synced to **document root** (flat `index.html` + `assets/`) instead of **`/erp/`** | Overwrote marketing home; `/erp/assets/*` returned HTML via SPA fallback; ERP shell broken at intended URL | Rebuilt `apps/web`; rsync → `/var/www/ShanghaiTravels/erp/`; restored marketing files to document root from `ShanghaiTravels-src` |

**Hash route table was already correct** — no React route changes required. Staff default remains protected index `/#/` (dashboard) with anon redirect to `/#/login`.

---

## Quick links (copy/paste)

```
Staff / Super Admin:  https://shanghaitravels.com.bd/erp/#/login
Customer portal:      https://shanghaitravels.com.bd/erp/#/portal/customer/login
Agent portal:         https://shanghaitravels.com.bd/erp/#/portal/agent/login
Corporate portal:     https://shanghaitravels.com.bd/erp/#/portal/corporate/login
Public website:       https://shanghaitravels.com.bd/
CMS viewer (in ERP):  https://shanghaitravels.com.bd/erp/#/site
Legacy desk:          https://shanghaitravels.com.bd/visa-admin/
```

---

## Explicit non-changes

- No API or business-logic edits  
- No new portal/feature routes  
- Super Admin not given a separate login path (by design)
