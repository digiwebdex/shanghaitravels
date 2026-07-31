# Phase E3 — Package Engine Completion

**Branch:** `feature/phase-e-package-engine`  
**Scope:** Frontend (`apps/web`) + marketing inject assets

## What shipped

### Library
- `apps/web/src/lib/packages.ts` — types, `formatPrice`, filters, `validatePackageForm`, collection helpers, poisha reuse
- `apps/web/src/lib/services.ts` — `packagesApi`, `sitePackagesApi` (additive)
- Portal API extensions: `customerPortalApi`, `agentPortalApi`, `corporatePortalApi` package methods

### ERP admin (Products & Packages)
- `PackageModuleNav`, `PackagesListPage`, `PackagesPricingPage`, `PackageCategoriesPage`, `PackageAvailabilityPage`, `PackageGalleryPage`, `PackageReportsPage`
- Admin nav + `LIVE_MODULES.products`
- Routes under `/#/products/*`

### CMS
- `CmsPackagesPage` — featured/popular/recommended toggles + collection preview
- `CmsModuleNav` link → `/#/cms/packages`

### Public site
- `SiteHomePage` — live package cards (no mock data; EmptyState when none)
- `SitePackageDetailPage`, `SitePackageBookPage`
- `SiteSearchPage` — destination, category, duration, budget, travelMonth, packageType filters

### Portals
- **Customer:** browse, wishlist, book, my packages, history + layout nav
- **Agent:** browse (commission), book-for-customer (locked packageId)
- **Corporate:** browse approved packages, request form with packageId

### Components
- `PackageCard`, `PackageQuickView`, `PackagePicker`
- `CrmLeadsPage` — optional PackagePicker on create form

### Marketing inject
- `figma-design/src/auth-entry/packages-home.inject.js` + `.css`
- Deployed copies: `/assets/packages-home.js`, `/assets/packages-home.css`
- Linked in root `index.html`

### Tests
- `apps/web/tests/unit/packages.test.ts`
- `apps/web/tests/e2e/packages.spec.ts`
- `apps/web/tests/api/smoke.mjs` — GET `/site/packages`

## Routes summary

| Area | Paths |
|------|-------|
| Admin | `/products/packages`, `/products/packages/pricing`, `/products/categories`, `/products/availability`, `/products/gallery`, `/products/reports` |
| CMS | `/cms/packages` |
| Site | `/site/packages/:slug`, `/site/packages/:slug/book`, `/site/search` |
| Customer portal | `/portal/customer/packages`, `…/wishlist`, `…/my`, `…/history`, `…/:slug/book` |
| Agent portal | `/portal/agent/packages`, `…/:slug/book` |
| Corporate portal | `/portal/corporate/packages`, `…/:slug/request` |

## Backend (Package Engine SoT)

- Live Nest module: `/opt/shanghai-erp-api/src/packages/`
- Git mirror: `erp-api/packages/`, migration `erp-api/prisma/migrations/20260801120000_028_package_engine/`
- Migration applied staging + prod: `20260801120000_028_package_engine`
- Public: `GET /api2/site/packages` (collections home|featured|popular|recommended|latest|seasonal|banner)
- Staff: `/erp/#/products/packages` → `/api2/packages`
- PackageID optional FKs on Application, Lead, Opportunity, Quotation(+line), Invoice(+item), case details, CmsTravelOffer, CorporateTravelRequest

## Quality gates

- TypeScript strict compile via `npm run build` in `apps/web`
- Vitest unit: `packages.test.ts`
- Playwright e2e: `packages.spec.ts` (requires `ERP_TEST_*`)
- API smoke: optional GET `/site/packages` when API deployed

## Non-goals (confirmed)

- No auth/finance workflow refactors
- Tour `/tours/packages` reference catalog unchanged
