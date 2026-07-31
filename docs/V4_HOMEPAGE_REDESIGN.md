# V4 Premium Homepage Redesign

**Branch:** `feature/v4-premium-homepage`  
**Scope:** Public website + CMS content mapping only  
**Non-goals:** Auth, ERP ops, Finance, CRM, Portals, Backend APIs, Database schema, Booking engine  

---

## 1. Design reference analysis

Studied the attached Shanghai Travels mock (Aug 1, 2026). Extracted:

| Dimension | Reference pattern | V4 adaptation |
|---|---|---|
| Layout | Top bar → sticky nav → hero → sections → footer | Same information architecture |
| Grid | 4-col destinations, package carousel, 6 service cards | Responsive 4 / 2 / 1 |
| Spacing | Large section padding, airy white space | `py-16 md:py-24`, `gap-6` |
| Colors | Navy + orange + white | Keep TravelOS tokens (`#14213D`, `#F97316`) |
| Typography | Bold navy headlines, orange overlines | Plus Jakarta Sans hierarchy |
| Cards | Soft shadow, ~12–16px radius | `rounded-2xl shadow-[0_8px_30px_rgba(20,33,61,0.08)]` |
| Hero | Full-bleed photo + centered copy + floating service pills | Pill nav (not large cards); BD photography/brand |
| CTA | Orange pill + arrow circle | Primary conversion pattern |
| UX | Trust bar, social proof, partners, newsletter | Conversion funnel preserved |

**Not a pixel copy.** Original composition for Shanghai Travels (Dhaka), Reg. No. 0017053, BD hotline, Package Engine + Destination Master data.

---

## 2. Audit summary

### Live site (`shanghaitravels.com.bd`)
- Compiled marketing SPA + injectors (`hero-services`, `packages-home`, `destinations-home`, `auth-entry`)
- Hero previously booking widget → cards → pills
- Destinations/packages partially dynamic via injects
- Layout/footer still mixed Dubai demo vs BD in source

### CMS (existing types — no schema change)
`blog`, `announcement`, `faq`, `testimonial`, `gallery`, `download`, `hero_service`  
Public: `/api2/site/content`, `/banners`, `/menus`, `/travel`

### Package Engine
`GET /api2/site/packages` collections `home|featured|popular`  
Detail/book already on ERP site shell; marketing links to `/tours`, `/inquiry`, `/erp/#/site/packages/:slug`

### Destination Master
`GET /api2/site/destinations?collection=home` with live `packageCount`

---

## 3. Implementation plan

1. Rewrite marketing `Layout` (announcement + sticky nav + luxury footer) — BD brand  
2. Rebuild `Home` as composed V4 sections (all dynamic)  
3. Seed CMS rows for empty types (testimonials, FAQ, partners, stats/why) via existing `CmsContent`  
4. Build `figma-design` → deploy `/var/www/ShanghaiTravels`  
5. Remove conflicting injectors from `index.html` (hero/packages/destinations); keep `auth-entry` only if needed  
6. Document CMS + Package mapping  

---

## 4. Homepage component inventory

| # | Component | Source | Reuse / Rebuild |
|---|---|---|---|
| 1 | AnnouncementBar | CMS announcement / static BD trust | Rebuild |
| 2 | SiteHeader (sticky) | Layout | Rebuild |
| 3 | HeroPremium | Banner API + pill nav | Rebuild |
| 4 | FeaturedPackages | Package Engine | Rebuild (carousel) |
| 5 | PopularDestinations | Destination Master | Rebuild |
| 6 | WhyChoose | CMS announcement `homepage-why` | New |
| 7 | StatsBar | CMS announcement `homepage-stats` | New |
| 8 | ServicesGrid | CMS `hero_service` / travel | Rebuild |
| 9 | Testimonials | CMS `testimonial` | New |
| 10 | TrustedPartners | CMS `gallery` partners | New |
| 11 | CtaBanner | Static structure + CMS copy | New |
| 12 | BlogLatest | CMS `blog` | New |
| 13 | FaqAccordion | CMS `faq` | New |
| 14 | Newsletter | Form POST `/site/forms` | New |
| 15 | SiteFooter | Layout | Rebuild |

**Reused:** Auth entry menus, Package/Destination public APIs, Embla carousel, Motion, Lucide, existing routes (`/visa`, `/tours`, `/inquiry`, …).

**Rebuilt:** Entire homepage visual system + header/footer.

---

## 5. Detailed reusable prompt

```
You are Lead Product Designer + Senior React Engineer for Shanghai Travels (Dhaka).

Redesign ONLY the public marketing website inspired by a premium navy/orange travel homepage mock
(Booking.com / Klook quality). Do NOT pixel-copy. Keep brand: navy #14213D, orange #F97316, white.

Hard constraints:
- Do not change Auth, ERP, Finance, CRM, Portals, Backend APIs, DB schema, Booking engine, RBAC.
- No hardcoded packages/destinations — Package Engine + Destination Master only.
- CMS-editable sections via existing CmsContent types.
- Bangladesh facts: Reg. No 0017053, hotline +880 1333-356393, Vatara Dhaka.

Homepage sections in order:
1 Announcement bar  2 Sticky nav  3 Hero + 4 service pills  4 Featured packages carousel
5 Popular destinations grid  6 Why choose  7 Animated stats  8 Services  9 Testimonials
10 Partners marquee  11 CTA band  12 Blog  13 FAQ  14 Newsletter  15 Luxury footer

Quality: large whitespace, soft shadows, rounded-2xl, motion fades/hovers, lazy images,
skeleton loading, WCAG AA, responsive 4/2/1, Lighthouse-minded.

Deliver production React (figma-design), docs V4_*, branch feature/v4-premium-homepage,
commit Website/CMS UI only.
```

---

## 6. Success criteria

- Homepage matches premium reference quality without cloning  
- Packages & destinations update when admin publishes  
- Mobile / tablet / desktop polished  
- No ERP/auth/finance regressions  
