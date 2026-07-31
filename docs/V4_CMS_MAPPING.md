# V4 CMS Mapping

No new DB schema. Uses existing `CmsContent`, `CmsBanner`, `CmsMenu`.

| Homepage block | CMS / API | Fields used |
|---|---|---|
| Hero image/video | `CmsBanner` placement `hero` | `imageUrl`, `title`, `subtitle`, `ctaLabel`, `ctaUrl` |
| Hero service pills | Fixed routes (product IA) optional `hero_service` titles | `/visa`, `/air-ticket`, `/hajj`, `/tours` |
| Featured packages | Package Engine public API | `collection=featured` / `home` |
| Destinations | Destination Master | `collection=home` |
| Why Choose | `announcement` slug `homepage-why` | `title`, `summary`, `meta.items[]` |
| Stats | `announcement` slug `homepage-stats` | `meta.stats[{value,label,icon}]` |
| Services | `hero_service` or travel offers | title, summary, coverUrl, meta.url |
| Testimonials | `testimonial` | title=name, summary=quote, body=trip, coverUrl=avatar |
| Partners | `gallery` slug `trusted-partners` | body/meta image URLs |
| Blog | `blog` published | title, summary, coverUrl, slug, publishedAt |
| FAQ | `faq` | title=question, body=answer |
| Newsletter | `POST /site/forms` formType `contact` | name/email |
| Footer blurb | `announcement` slug `footer-about` | summary |

## Admin editing

Website CMS → Content / Banners / Featured Packages / Popular Destinations (existing admin pages).  
Publish → public homepage refreshes on next load (no rebuild).
