# Phase E3 — Package Engine Schema Patch

Migration: `20260801120000_028_package_engine`

## New enums

- `PackageMasterStatus`: draft, published, archived, scheduled
- `PackageGalleryKind`: thumbnail, gallery, banner
- `PackageAvailabilityStatus`: open, full, closed, cancelled

## New models

| Model | Purpose |
|-------|---------|
| `PackageCategory` | Unlimited categories (code/slug unique, soft-delete) |
| `PackageMaster` | Single source of truth for sellable packages (money in poisha) |
| `PackageGalleryItem` | Images per package |
| `PackageAvailability` | Departure/date slots with seat counts |
| `PackageFaq` | Structured FAQs |
| `PackageReview` | Published reviews (rating 1–5) |
| `PackageWishlist` | Customer ↔ package (unique pair) |

## packageId on existing models

Optional FK to `PackageMaster` (`onDelete: SetNull`) + index on:

- `Application`
- `Lead`
- `Opportunity`
- `Quotation`
- `QuotationLine`
- `Invoice`
- `InvoiceItem`
- `TourPackageDetail`
- `HajjUmrahDetail`
- `CmsTravelOffer`
- `CorporateTravelRequest`

Named relations on `PackageMaster` avoid collisions with legacy `TourPackage` / `HajjUmrahPackage` catalogs.

## Seed categories

visa, air_ticket, hotel, tour, hajj, umrah, transport, student, work_permit, medical, custom

## Customer relation

- `Customer.packageWishlists` → `PackageWishlist[]`

## Supplier relation

- `Supplier.packageMasters` → `PackageMaster[]`
