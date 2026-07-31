# V4 Package Engine Mapping

## Flow

```
Admin Package Master → publish / homeFeatured / featured / popular
        ↓
GET /api2/site/packages?collection=…
        ↓
Homepage Featured Packages carousel
        ↓
View Details / Book Now → package detail / enquiry (PackageID locked)
        ↓
CRM Lead.packageId → Application → Finance
```

## Homepage bindings

| UI element | Package field |
|---|---|
| Image | `thumbnailUrl` / `bannerUrl` |
| Title | `name` |
| Country | `country` / `destination` |
| Duration | `durationDays` / `durationNights` |
| Price | `offerPricePoisha` \|\| `pricePoisha` |
| Discount badge | when offer < price |
| Rating | `ratingAvg` |
| Badge | featured→BEST SELLER, popular→POPULAR, recommended→TRENDING |
| Book Now | `/erp/#/site/packages/{slug}/book` or `/inquiry?packageId=` |
| View Details | `/erp/#/site/packages/{slug}` |

## Destinations

`packageCount` computed from published packages with `destinationId`.  
No hardcoded country counts.

## Rules

- Empty API → skeleton / empty state (never fake packages)
- Admin unpublish removes card automatically
