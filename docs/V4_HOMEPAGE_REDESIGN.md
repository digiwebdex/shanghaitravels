# V4 Premium Homepage Redesign

**Branch:** `feature/v4-premium-homepage`
**Scope:** Public website + CMS content mapping only
**Non-goals:** Auth, ERP ops, Finance, CRM, Portals, Backend APIs, Database schema, Booking engine

---

## 1. Design reference

The homepage is a **measured reconstruction** of the approved reference frame, not a
loose interpretation of it. Every container width, row pitch, card size, band height
and type step was extracted programmatically from the reference render; the numbers
and the method live in **[`V4_DESIGN_ANALYSIS.md`](./V4_DESIGN_ANALYSIS.md)**.

Headline figures: **1440 px frame, 1320 px content box, 36 px section rhythm,
448 px hero, 12 px card radius, all-white section backgrounds.** The rebuilt page
measures 3024 px tall against the reference's 3040 px.

Only the brand layer differs from the reference: the real Shanghai Travels wordmark,
navy `#14213D` / orange `#F97316`, Bangladesh contact facts (Reg. No 0017053, hotline
+880 1333-356393, Banani, Dhaka) and live Package Engine / Destination Master / CMS data.

---

## 2. Audit summary

### Live site (`shanghaitravels.com.bd`)
Compiled marketing SPA served from `/var/www/ShanghaiTravels`. The legacy
`hero-services`, `packages-home` and `destinations-home` injector scripts are retired —
React now owns the whole homepage.

### CMS (existing types — no schema change)
`blog`, `announcement`, `faq`, `testimonial`, `gallery`, `download`, `hero_service`,
plus a `service` type for the six-card services row.
Public endpoints: `/api2/site/content`, `/banners`, `/menus`, `/forms`.

### Package Engine
`GET /api2/site/packages` with collections `home | featured | popular`, falling through
in that order. Detail and booking stay on the ERP site shell
(`/erp/#/site/packages/:slug`).

### Destination Master
`GET /api2/site/destinations?collection=home` plus `/settings`, with live `packageCount`
and admin toggles for flag, region, package count, CTA label and card count.

---

## 3. Homepage component inventory

Section order mirrors the reference exactly.

| # | Component | Data source | Status |
| --- | --- | --- | --- |
| 1 | `AnnouncementBar` | Static trust facts + secondary nav | Rebuilt |
| 2 | `SiteHeader` | Route config + `AuthEntryMenus` (reused as-is) | Rebuilt |
| 3 | `HeroPremium` | `banners?placement=hero` + `content?type=hero_service` | Rebuilt |
| 4 | `FeaturedPackages` | Package Engine | Rebuilt (5-up) |
| 5 | `PopularDestinations` | Destination Master + settings | Rebuilt (4 × 2) |
| 6 | `StatsBar` | CMS `announcement/homepage-stats` | Rebuilt |
| 7 | `ServicesGrid` | CMS `service`, falling back to defaults | Rebuilt (6-up) |
| 8 | `Testimonials` | CMS `testimonial` | Rebuilt |
| 9 | `Partners` | CMS `gallery/trusted-partners` | Rebuilt |
| 10 | `CtaBanner` | `banners?placement=cta` | Rebuilt |
| 11 | `BlogLatest` | CMS `blog` | Rebuilt (4-up) |
| 12 | `SiteFooter` | Static links + newsletter → `/api2/site/forms` | Rebuilt |

Supporting modules: `tokens.ts` (container, rhythm, card, focus ring, brand constants),
`Section.tsx` (motion section, orange-rule heading, view-all link), `Logo.tsx`,
`CoverImage.tsx` (graceful photo fallback), `format.ts` (price, duration, badge ladder,
flag resolution).

**Reused unchanged:** `AuthEntryMenus` (all portal login/register flows), the public
Package and Destination APIs, Embla, Motion, Lucide, and every existing marketing route.

**Not on the homepage:** `WhyChoose` and `FaqSection` are absent from the reference, so
they were removed from the composition. Both files remain CMS-driven and available for
inner pages.

---

## 4. Dynamic-content contract

No package, destination, testimonial, partner, statistic or article is hardcoded.
Each section renders one of three states:

1. **Skeleton** while its request is in flight (packages, destinations).
2. **Live content** from the API.
3. **Empty state** — an explicit dashed-border message for packages and destinations, or
   the section hides itself entirely (testimonials, blog).

The only literals in the tree are the service copy defaults, which apply solely when the
CMS returns zero `service` entries, and the labelled hero pill defaults, which apply
when fewer than four `hero_service` entries are published.

---

## 5. Accessibility and performance

- Every interactive element carries a visible `focus-visible` ring; the carousels and
  wishlist toggles expose `aria-label` / `aria-pressed`; decorative imagery and scrims
  are `aria-hidden`.
- The hero banner is `fetchPriority="high"`; every other photograph is `loading="lazy"`.
- `prefers-reduced-motion` disables the partner marquee and freezes the stat counters at
  their final values.
- No layout shift: card image slots, the stats bar and the CTA banner all have fixed
  heights.

---

## 6. Success criteria

- Reads as the same design language as the reference at a glance — verified on total
  page height (0.5 % deviation) and on every row pitch.
- Packages, destinations, testimonials, partners, stats and articles all update when an
  administrator publishes.
- Clean at 1440, 1024, 768 and 390 px, with no horizontal overflow.
- No ERP, auth, finance, CRM or portal regressions.
