# Phase E3 — Package Engine Design

**Branch:** `feature/phase-e-package-engine`  
**API base:** `/api2`  
**Status:** Frontend implementation (Nest backend companion)

## Purpose

Introduce a unified **Package Engine** where `PackageID` is the system-of-truth (SoT) for sellable travel products across ERP admin, public website, CMS collections, customer/agent/corporate portals, CRM leads, and booking/enquiry flows.

Tour reference products (`/reference/tour-packages`) remain for legacy tour case workflows. The Package Engine is the customer-facing catalogue and cross-module product master.

## Architecture — PackageID SoT

```
PackageMaster (id = PackageID)
    ├── Staff CRUD / publish lifecycle (/packages/*)
    ├── Public catalogue (/site/packages/*)
    ├── Portal catalogues (/portal/{customer|agent|corporate}/packages*)
    ├── CMS collection flags (homeFeatured, popular, recommended)
    ├── CRM lead attachment (optional packageId on create)
    └── Enquiry / booking forms (packageId locked from slug resolve)
```

Any module that displays, prices, or books a package resolves to the same `PackageMaster.id`. Slug is the public URL key; ID is the immutable foreign key on leads and applications.

## Data model (frontend types)

| Entity | Role |
|--------|------|
| `PackageCategory` | Taxonomy (code, name, slug) |
| `PackageMaster` | Product master: pricing (poisha), duration, seats, flags, media, content |
| `PackageGalleryItem` | Ordered images per package |
| `PackageAvailability` | Departure slots / seat inventory |
| `PackageFaq` | Q&A blocks on detail page |
| `PackageReportSummary` | Admin dashboard aggregates |

Prices stored as **poisha** (BDT × 100), formatted via `formatPrice()` / `toPoisha` / `fromPoisha` (reused from `@/lib/tour`).

## API map

### Staff — `packagesApi` → `/packages/*`

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST/PATCH/DELETE | `/packages/categories` | Category CRUD |
| GET/POST/PATCH/DELETE | `/packages` | Package CRUD + list filters |
| POST | `/packages/:id/publish\|unpublish\|archive\|clone\|schedule` | Lifecycle |
| GET/POST/PATCH/DELETE | `/packages/:id/gallery` | Gallery |
| GET/POST/DELETE | `/packages/:id/availability` | Slots |
| GET/POST/DELETE | `/packages/:id/faqs` | FAQs |
| GET | `/packages/reports/summary` | Reports |
| GET/POST | `/packages/export`, `/packages/import` | Bulk |

### Public — `sitePackagesApi` → `/site/packages/*`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/site/packages?collection=home\|featured\|…` | List / collections |
| GET | `/site/packages/search?…` | Faceted search |
| GET | `/site/packages/:slug` | Detail + gallery + related |
| POST | `/site/packages/enquire` | Lead / enquiry (packageId required) |

### Portals

| Portal | Base | Key actions |
|--------|------|-------------|
| Customer | `/portal/customer/packages*` | browse, wishlist, enquire, my applications, history |
| Agent | `/portal/agent/packages*` | browse (commission), book for customer (locked packageId) |
| Corporate | `/portal/corporate/packages*` | approved catalogue, request with packageId |

## CMS collections

Staff toggles on `PackageMaster`: `homeFeatured`, `popular`, `recommended`, plus `agentEnabled` / `corporateEnabled`.

Collection query param values: `home`, `featured`, `popular`, `recommended`, `agent`, `corporate`.

CMS page: `/#/cms/packages` — toggles + live collection preview.

## ERP admin routes

| Route | Page |
|-------|------|
| `/#/products/packages` | List + create/edit + lifecycle actions |
| `/#/products/packages/pricing` | Pricing-focused view |
| `/#/products/categories` | Categories |
| `/#/products/availability` | Slots per package |
| `/#/products/gallery` | Gallery manager |
| `/#/products/reports` | Summary reports |

Nav: **Products & Packages** in AdminLayout (`LIVE_MODULES`: `products`).

## Public site routes

| Route | Page |
|-------|------|
| `/#/site` | Home — `sitePackagesApi.list({ collection: 'home' })` |
| `/#/site/packages/:slug` | Detail |
| `/#/site/packages/:slug/book` | Enquiry (packageId locked) |
| `/#/site/search` | Faceted package search |

Marketing SPA inject: `/assets/packages-home.js` loads `/api2/site/packages?collection=featured`.

## Components

- `PackageCard` — site + portal premium card
- `PackageQuickView` — modal quick view
- `PackagePicker` — CRM/searchable select returning packageId
- `PackageModuleNav` — admin sub-nav

## Migration (backend companion)

Expected Prisma migration name: `20260801120000_028_package_engine` (or next sequential in API repo).

## Non-goals (this phase)

- Deep finance / invoicing changes
- Auth system changes
- Replacing tour case `/reference/tour-packages` workflows
- OTA-style dynamic packaging
