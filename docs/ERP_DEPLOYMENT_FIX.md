# ERP Deployment Fix — `/erp/` blank page (MIME `text/html`)

**Date:** 2026-07-31  
**Symptom:** `https://shanghaitravels.com.bd/erp/#/login` blank; console:
`Refused to apply style…` / `Failed to load module script…` because `/erp/assets/*` returned HTML.  
**Scope:** Deployment / nginx only. No React, routing, API, auth, or business-logic changes.

---

## Root cause

1. TravelOS is built with Vite `base: "/erp/"` and `createHashRouter`.
2. Generated shell references absolute assets:
   - `/erp/assets/index-*.js`
   - `/erp/assets/index-*.css`
3. Nginx had **no** `location /erp/` or `location /erp/assets/`.
4. Requests fell into marketing SPA fallback:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

5. When an ERP asset was **missing** (wrong deploy path, stale hash, or overwrite), nginx served **marketing** `/index.html` as `text/html` for the `.js` / `.css` URL → browser MIME refusal → blank page.

Assets that **exist** on disk were served correctly; the failure mode is **missing URI → HTML fallback**.

---

## Audit results

### 1. Vite build output

| Item | Result |
|---|---|
| Build dir | `apps/web/dist/` |
| Shell | `dist/index.html` title `TravelOS — Shanghai Travels ERP` |
| Assets | `dist/assets/*` (~178 hashed files) |
| Asset URL prefix | `/erp/assets/…` |

### 2–3. `vite.config` / base path

```ts
// apps/web/vite.config.ts
base: "/erp/",
build: { outDir: "dist", … }
```

**Correct** — no config change required.

### 4. Generated `index.html`

```html
<script type="module" crossorigin src="/erp/assets/index-EOdBDk3k.js"></script>
<link rel="stylesheet" crossorigin href="/erp/assets/index-CmoJeMoa.css">
```

**Correct** for HashRouter under `/erp/`.

### 5. Nginx (before)

| Location | Behavior |
|---|---|
| `/assets/` | Marketing hashed assets, `try_files $uri =404` |
| `/` | SPA fallback → `/index.html` |
| `/erp/` | **Missing** — inherited SPA fallback |
| `/erp/assets/` | **Missing** — missing files → marketing HTML |

### 6–7. Deploy filesystem

| Path | Role |
|---|---|
| `/var/www/ShanghaiTravels/` | Marketing document root |
| `/var/www/ShanghaiTravels/erp/` | TravelOS shell + assets |
| `/var/www/ShanghaiTravels/erp/assets/` | **Exists** (hashed JS/CSS) |

Deploy must rsync **into** `/erp/`, never flatten onto document root.

### 8. `index.html` references vs disk

Live shell and `dist/index.html` match (`md5` identical). Referenced `index-*.js` / `index-*.css` present under `/erp/assets/`.

### 9. HashRouter deployment

Browser path stays `/erp/` (or `/erp/index.html`). Client routes live in the hash (`/#/login`, `/#/portal/…`). Nginx only needs to serve the shell + static assets under `/erp/`; no deep-path BrowserRouter fallback is required for staff routes.

### 10. Intended production URL

`https://shanghaitravels.com.bd/erp/#/login` — staff login (unchanged).

---

## Fix applied (deployment only)

### A. Nginx — dedicated `/erp/` locations

Live file: `/etc/nginx/sites-available/shanghaitravels`  
Repo mirror: `deploy/nginx/erp-locations.conf` + `deploy/nginx/shanghaitravels.site.conf`

```nginx
location /erp/assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable" always;
    # … security headers …
    try_files $uri =404;   # NEVER fall back to HTML
}

location /erp/ {
    add_header Cache-Control "no-cache" always;
    # … security headers …
    try_files $uri $uri/ /erp/index.html;
}
```

`nginx -t` ✅ · `systemctl reload nginx` ✅

### B. Re-sync frontend build → `/erp/`

```bash
rsync -a --delete apps/web/dist/ /var/www/ShanghaiTravels/erp/
```

Helper script (guards `/erp/assets/` references):

```bash
./deploy/sync-erp-frontend.sh
```

Marketing root and APIs untouched.

---

## Verification

| Check | Result |
|---|---|
| `GET /erp/` | `200` `text/html` TravelOS shell |
| `GET /erp/assets/index-*.js` | `200` `application/javascript` (JS body) |
| `GET /erp/assets/index-*.css` | `200` `text/css` (CSS body) |
| `GET /erp/assets/missing-….js` | `404` nginx error page (**not** marketing SPA) |
| Browser `https://shanghaitravels.com.bd/erp/#/login` | Login UI renders (TravelOS / Welcome back / Sign In) |

### Reproduce pre-fix failure (origin)

Before the `/erp/assets/` block, a missing asset returned marketing HTML:

```
GET /erp/assets/missing-deadbeef.js → 200 text/html (Shanghai Travels marketing)
```

After fix:

```
GET /erp/assets/missing-deadbeef.js → 404
```

---

## Operator runbook

```bash
# 1. Build
cd /var/www/ShanghaiTravels-src/apps/web && npm run build

# 2. Sync ONLY to /erp/
./deploy/sync-erp-frontend.sh

# 3. Confirm nginx still has /erp/ locations (after site edits)
sudo nginx -t && sudo systemctl reload nginx

# 4. Smoke
curl -sI https://shanghaitravels.com.bd/erp/assets/$(
  grep -oE 'index-[^"]+\.js' /var/www/ShanghaiTravels/erp/index.html | head -1
) | grep -i content-type
# expect: application/javascript
```

**Do not** rsync `dist/` onto `/var/www/ShanghaiTravels/` (document root) — that overwrites the marketing site and breaks `/erp/assets/*`.

If Cloudflare previously cached HTML for an asset URL, purge that URL or wait for TTL after a correct origin response.

---

## Explicit non-changes

- No React components, routes, HashRouter settings, or Vite `base`
- No API / auth / backend / business features
- Super Admin / portal URLs unchanged (see `docs/PRODUCTION_ROUTE_MAP.md`)
