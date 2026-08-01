# V4 Package Engine Mapping

## Flow

```
Admin Package Master → publish + homeFeatured / featured / popular / recommended
        ↓
GET /api2/site/packages?collection=home → featured → homeFeatured → popular → (all)
        ↓
Homepage Featured Packages row
        ↓
Book Now / title link → /erp/#/site/packages/{slug}[/book]  (PackageID locked)
        ↓
CRM Lead.packageId → Application → Finance
```

The homepage requests ten packages and walks the collection list above in order,
returning the first non-empty result. Nothing is cached client-side, so unpublishing a
package removes its card on the next load.

## Card bindings

| UI element | Package field | Notes |
| --- | --- | --- |
| Image | `thumbnailUrl` → `bannerUrl` → `coverImageUrl` → `heroImageUrl` | Falls back to the brand gradient when absent or broken |
| Title | `name` | Clamped to one line |
| Duration | `durationDays`, `durationNights` | Rendered compactly as `5D / 4N` |
| Fact row | `destination` \| `country`, `durationDays`, `reviewCount` | Each fact is omitted when its field is null |
| Price | `offerPricePoisha` → `pricePoisha` → `sellingPricePoisha` | Poisha ÷ 100, `en-BD` grouping, `৳` prefix |
| Struck price | `pricePoisha` | Shown only when an offer genuinely undercuts it |
| Discount chip | derived | `round((base − offer) / base × 100)`, shown only when positive |
| Rating chip | `ratingAvg` → `rating` | One decimal place |
| Wishlist | `slug` | Persisted to `localStorage` under `st-wishlist` |
| Book Now | `/erp/#/site/packages/{slug}/book` | PackageID cannot be changed by the customer |
| Details | `/erp/#/site/packages/{slug}` | Title link |

## Badge ladder

Evaluated top-down; the first match wins.

| Order | Condition | Label | Colour |
| --- | --- | --- | --- |
| 1 | `popular` | Popular | `#22A45D` |
| 2 | `recommended` | Trending | `#7C3AED` |
| 3 | `homeFeatured` | Best Seller | `#F97316` |
| 4 | discount present | Value Pack | `#2F80ED` |
| 5 | `featured` | Featured | `#F97316` |

The specific flags outrank the generic `featured` flag so that a catalogue where most
packages are featured still produces a varied badge set — matching the reference, which
shows five different badges across five cards.

## Layout response to catalogue size

| Published packages | Layout |
| --- | --- |
| 0 | Dashed empty state pointing the admin at the Package Engine |
| 1 – 5 | Grid sized to the item count, so the row never ends in a gap |
| 6+ | Embla carousel, five per view, with edge arrows |

## Destinations

`packageCount` is computed server-side from published packages carrying that
`destinationId`. The "Browse all N countries" link reports the live destination count.
No country name or count is hardcoded anywhere on the page.

## Rules

- No mock packages. An empty API produces a skeleton, then an explicit empty state.
- Prices are never rounded or reformatted beyond poisha-to-taka conversion.
- The homepage links into the ERP site shell for detail and booking; it does not
  reimplement any booking logic.
