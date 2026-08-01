# V4 CMS Mapping

No new database schema. The homepage reads existing `CmsContent` and `CmsBanner` records
through the public site endpoints.

| # | Homepage block | Source | Fields used | Behaviour when empty |
| --- | --- | --- | --- | --- |
| 1 | Announcement bar | Static trust facts | — | n/a |
| 2 | Hero banner | `GET /api2/site/banners?placement=hero` | `imageUrl`, `title`, `subtitle`, `ctaLabel`, `ctaUrl` | Default photo, "Your World, Expertly Planned", `/inquiry` |
| 3 | Hero service pills | `GET /api2/site/content?type=hero_service` | `title`, `summary`, `meta.url` | Four labelled defaults (Visa, Air, Hajj, Tours) |
| 4 | Featured packages | Package Engine — see [`V4_PACKAGE_ENGINE_MAPPING.md`](./V4_PACKAGE_ENGINE_MAPPING.md) | — | Dashed empty-state message |
| 5 | Popular destinations | Destination Master `?collection=home` + `/settings` | — | Dashed empty-state message |
| 6 | Stats bar | `content?type=announcement`, slug `homepage-stats` | `meta.stats[{ value, label, icon }]` | Four brand defaults |
| 7 | Services | `content?type=service` | `title`, `summary`, `meta.url`, `meta.icon` | Six brand service defaults |
| 8 | Testimonials | `content?type=testimonial` | `title` = name, `summary` = quote, `meta.role` \| `meta.service` \| `body` = caption, `coverUrl` = avatar, `meta.rating` | Section hides |
| 9 | Trusted partners | `content?type=gallery`, slug `trusted-partners` | `title`, `meta.logos[]` or JSON `body` | Eight airline name cells |
| 10 | CTA banner | `GET /api2/site/banners?placement=cta` | `imageUrl`, `title`, `subtitle`, `ctaLabel`, `ctaUrl` | Default photo and copy |
| 11 | Blog | `content?type=blog` | `title`, `summary`, `coverUrl`, `slug`, `publishedAt` | Section hides |
| 12 | Footer newsletter | `POST /api2/site/forms` | `formType: "newsletter"`, `email`, `source: "footer"` | n/a |

## Headline splitting

A hero banner title containing a comma splits at the comma, so `"Your World, Expertly
Planned"` renders the second clause in orange. A title without a comma splits at the
midpoint by word count; a title of fewer than three words renders as a single navy line
with no empty accent row.

## Icon keys

`meta.icon` on a `service` record accepts `visa`, `air`, `hajj`, `tour`, `hotel` and
`insurance`. `meta.icon` on a `homepage-stats` entry accepts `award`, `users`, `globe`
and `shield`. Unrecognised keys fall back to position-based defaults.

## Destination display settings

`GET /api2/site/destinations/settings` drives the grid: `enabled` hides the section,
`maxCards` caps the card count, and `showFlag`, `showRegion`, `showPackageCount`,
`showCta` and `ctaLabel` control the card body. `showRegion` is opt-in — the reference
card shows flag, name, package count and CTA only. A `ctaLabel` that ships with its own
trailing arrow is normalised, since the card already draws one.

## Admin workflow

Website CMS → Content / Banners / Featured Packages / Popular Destinations. Publishing
takes effect on the next public page load; no rebuild or deploy is required.

## Sections removed from the homepage

`homepage-why` (`WhyChoose`) and `faq` (`FaqSection`) are no longer composed into the
homepage, because the reference frame does not contain them. Both components remain in
the codebase, still read the same CMS records, and can be mounted on inner pages.
