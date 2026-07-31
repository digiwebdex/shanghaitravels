# PackageID integration points (SoT API)

Applied live under `/opt/shanghai-erp-api` (not a separate git remote).

## New module
- `src/packages/*` — mirrored in `erp-api/packages/`
- Migration `prisma/migrations/20260801120000_028_package_engine`

## Optional `packageId` columns (FK → PackageMaster)
Application, Lead, Opportunity, Quotation, QuotationLine, Invoice, InvoiceItem,
TourPackageDetail, HajjUmrahDetail, CmsTravelOffer, CorporateTravelRequest

## Persistence hooks
- `applications.service.ts` — create accepts `packageId`
- `crm.service.ts` — lead/opportunity create/update accept `packageId`
- `sales.service.ts` — quotation create accepts `packageId`
- Customer portal — browse / wishlist / book (`POST .../packages/:id/book` locks path id)
- Agent portal — browse + book for customer with `packageId`
- Corporate portal — approved packages list; travel request stores `packageId`

## Public
- `GET /api/site/packages` collections: featured|popular|recommended|home|banner|latest|seasonal
- `GET /api/site/packages/search`
- `GET /api/site/packages/:slug`
- `POST /api/site/packages/:slug/enquire` — Lead.packageId locked from slug

## Destination Master (Phase E3)
See `DESTINATION_INTEGRATIONS.md` and `SCHEMA_DESTINATION_MASTER.md`.
- Optional `PackageMaster.destinationId` → `DestinationMaster`
- Public: `GET /api/site/destinations?collection=home`
