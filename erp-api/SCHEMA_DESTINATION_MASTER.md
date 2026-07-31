# Phase E3 — Destination Master Schema Patch

Migration: `20260801140000_029_destination_master`

## New model

| Model | Purpose |
|-------|---------|
| `DestinationMaster` | Shared destination entity referenced by packages (slug unique, soft-delete) |

## Fields (highlights)

- Identity: `name`, `slug`, `country`, `countryCode`, `isoCode`
- Display: `flagEmoji`, `flagUrl`, `heroImageUrl`, `galleryJson`, `region`, `displayOrder`
- Flags: `visaRequired`, `popular`, `featured`, `homepageFeatured`
- Status: `draft` \| `published` \| `archived`
- SEO / content: `seoTitle`, `seoDescription`, `description`
- Geo: `latitude`, `longitude`, `mapEmbedUrl`

## PackageMaster relation

Optional FK on `PackageMaster`:

```prisma
destinationId         String?
destinationMaster     DestinationMaster? @relation(fields: [destinationId], references: [id], onDelete: SetNull)
@@index([destinationId])
```

Legacy string fields `country` and `destination` remain for backward compatibility.

## Seed

12 published `homepageFeatured` destinations: China, Bangladesh, Thailand, Malaysia, Singapore, UAE/Dubai, Saudi Arabia, Qatar, UK, USA, Canada, Australia.

Migration best-effort links existing `PackageMaster` rows via ILIKE on `country` / `destination`.

## CMS showcase settings

Stored in `CmsContent` (no new table):

- `type`: `destination_showcase`
- `slug`: `homepage-settings`
- Settings JSON in `meta` / `summary`: `maxCards`, `showPackageCount`, `showRegion`, `showFlag`, `showHeroImage`, `showCta`, `ctaLabel`, `enabled`

## Indexes

`status`, `homepageFeatured`, `popular`, `region`, `displayOrder`, `countryCode`
