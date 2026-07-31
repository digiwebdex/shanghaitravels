# Destination Master integration points

Applied live under `/opt/shanghai-erp-api` (mirrored in `erp-api/destinations/`).

## New module

- `src/destinations/*` — mirrored in `erp-api/destinations/`
- Migration `prisma/migrations/20260801140000_029_destination_master`

## PackageMaster link

- Optional `destinationId` FK → `DestinationMaster` (`onDelete: SetNull`)
- `packages.service.ts` — create/update accept optional `destinationId` via `packageDataFromDto`
- Legacy `country` / `destination` string fields unchanged

## Staff API (authenticated; mutations need `settings:manage`)

- `GET/POST /api/destinations`
- `GET/PATCH/DELETE /api/destinations/:id`
- `POST /api/destinations/:id/publish|unpublish|archive`
- `GET/PUT /api/destinations/showcase-settings` — CMS display config via `CmsContent`
- Filters: `q`, `region`, `status`, `popular`, `featured`, `homepageFeatured`, `limit`, `offset`
- List/detail include computed `packageCount` (published packages only)

## Public API (`@Public()`)

- `GET /api/site/destinations?collection=home|popular|featured&limit=`
- `GET /api/site/destinations/settings` — homepage showcase CMS settings
- `GET /api/site/destinations/:slug` — detail with published packages, gallery, category breakdown
- `GET /api/site/destinations/browse` — filters: `region`, `country`, `q`, `categoryCode`, `budgetMin`/`budgetMax` (poisha)

## Relationship to Package Engine

Package Engine remains SoT for sellable packages. Destination Master is a shared catalog entity that packages optionally reference via `destinationId`.
