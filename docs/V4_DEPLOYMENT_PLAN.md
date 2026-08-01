# V4 Deployment Plan

The marketing SPA is built from `figma-design/` and served as static files from
`/var/www/ShanghaiTravels`. The ERP (`/erp/`), the visa admin apps and the media assets
in that directory are **not** produced by this build and must never be overwritten by it,
which is why the deploy copies individual bundles rather than syncing the whole `dist`.

## 1. Build

```bash
cd /var/www/ShanghaiTravels-src/figma-design
npm install          # only when dependencies changed
npm run build        # prints the hashed bundle names
```

Two pre-existing esbuild warnings from `src/mobile/AgentApp.tsx` and
`src/mobile/StaffApp.tsx` are unrelated to the marketing site and do not fail the build.

## 2. Deploy

```bash
cd /var/www/ShanghaiTravels-src/figma-design
JS=index-<hash>.js
CSS=index-<hash>.css

# New bundles into the live root and back into the repo
cp dist/assets/$JS dist/assets/$CSS dist/assets/logo-*.png /var/www/ShanghaiTravels/assets/
cp dist/assets/$JS dist/assets/$CSS                        /var/www/ShanghaiTravels-src/assets/

# Point index.html at them (both copies), then drop the superseded bundles
```

`/var/www/ShanghaiTravels/index.html` keeps the hand-maintained SEO head — canonical URL,
Open Graph, Twitter card, favicon and theme colour — so it is **patched**, never replaced
by the generated `dist/index.html`. Only these two lines change per release:

```html
<script type="module" crossorigin src="/assets/index-<hash>.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-<hash>.css">
```

Keep `/var/www/ShanghaiTravels/index.html` and `/var/www/ShanghaiTravels-src/index.html`
identical; the repo copy is the reviewable record of what is live.

### Retired injectors

`hero-services`, `packages-home` and `destinations-home` are gone from `index.html` —
React owns the hero, the package row and the destination grid. Their script and stylesheet
files remain in `assets/` but are no longer referenced and can be deleted once a release
has been verified.

## 3. Verify

1. `curl -s https://shanghaitravels.com.bd/ | grep -o 'index-[A-Za-z0-9_-]*\.\(js\|css\)'`
   returns the new hashes.
2. Homepage renders all nine sections top to bottom.
3. Featured Packages and Popular Destinations show live API data.
4. Footer newsletter posts to `/api2/site/forms` and reports success.
5. `/erp/` still serves TravelOS; the Login and Register choosers still open.
6. No console errors; no horizontal overflow at 390 px.

## 4. Rollback

Bundles are content-hashed, so the previous release is a two-line revert in `index.html`
provided its assets have not been pruned. Retain the previous `index-*.js` / `index-*.css`
pair until the new release is signed off.

## 5. Git

Branch `feature/v4-premium-homepage`. Commits contain the marketing site, its documentation
and the deployed bundles only — no ERP, authentication, finance, CRM or portal changes.
