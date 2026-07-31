# Homepage Destination Card — Design Spec

Premium **Popular Destinations** cards for ERP hash site, marketing inject, and Figma `Home.tsx`. Data always from `/api2/site/destinations` — no static country grids.

## Card anatomy

```
┌─────────────────────────────────────────────┐
│ ┌──────────┐  ┌──────────────────────────┐  │
│ │  (flag)  │  │                          │  │
│ │  circle  │  │      hero image          │  │
│ │          │  │      object-cover        │  │
│ │ Country  │  │      hover zoom          │  │
│ │ CODE     │  │                          │  │
│ │ Region   │  └──────────────────────────┘  │
│ └─ ~42% ───┘         ~58% hero ──────────── │
├─────────────────────────────────────────────┤
│ N Packages          Explore Destination →  (●→) │
└─────────────────────────────────────────────┘
```

| Zone | Content | CMS toggle |
|------|---------|------------|
| Left | Circular flag (emoji or `flagUrl`), country name, ISO code, region | `showFlag`, `showRegion` |
| Right | Hero image, gradient + glass overlay on hover | `showHeroImage` |
| Footer | Package count, CTA text | `showPackageCount`, `showCta`, `ctaLabel` |
| Floating | Round orange arrow (bottom-right) | always when CTA enabled |

## Responsive grid

| Breakpoint | Columns |
|------------|---------|
| Mobile `<768px` | 1 |
| Tablet `768–1099px` | 2 |
| Desktop `≥1100px` | 4 |

`DestinationShowcaseGrid` enforces layout; inject CSS mirrors the same breakpoints (`.st-destinations-grid`).

## Motion & interaction

CSS transitions only (no framer-motion — not in `apps/web` dependencies).

| Interaction | Effect |
|-------------|--------|
| Card hover / focus | Lift (`translateY`), soft shadow, orange border accent |
| Hero image | `scale(1.08–1.10)` over ~700ms |
| Flag | `scale(1.10)` |
| Arrow button | Slide right + brighter orange |
| Hero overlay | Subtle glass (`backdrop-blur`) |
| Enter viewport | Intersection Observer fade-in (`opacity` + `translateY`) |

## Accessibility

- Outer `article` with `aria-label`
- Main link wraps flag + hero; footer CTA and arrow are separate focusable links
- `focus-visible` rings (orange)
- Lazy-loaded images with `loading="lazy"`
- Skeleton variant during loading (`DestinationCardSkeleton`)

## Branding

- Primary accent: orange `#F97316` / `#EA580C` (matches Shanghai Travels accent)
- Dark site variant: slate-950 background, white/amber text (`variant="site"`)
- Light/admin preview: white card, slate borders (`variant="light"`)
- CTA default copy: **Explore Destination →** (overridable via showcase settings)

## Empty & loading states

- **Loading:** 4 skeleton cards in grid
- **Empty API:** centered message — “No published destinations yet” (never fallback to hardcoded countries)
- **CMS disabled:** `settings.enabled === false` hides section entirely

## Link targets

| Surface | Detail URL | Browse all |
|---------|------------|------------|
| ERP hash site | `/#/site/destinations/{slug}` | `/#/site/destinations` |
| Marketing inject | `/erp/#/site/destinations/{slug}` | `/erp/#/site/destinations` |

Prefer ERP hash routes until dedicated marketing `/destinations/*` routes exist.

## Files

- React: `DestinationCard.tsx`, `DestinationShowcaseGrid.tsx`
- Inject: `assets/destinations-home.js`, `assets/destinations-home.css`
- Source: `figma-design/src/auth-entry/destinations-home.inject.js`
