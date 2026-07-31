# V4 UI Components

## Design tokens

| Token | Value | Use |
|---|---|---|
| `--primary` / navy | `#14213D` | Headlines, footer, stats |
| `--accent` / orange | `#F97316` | CTAs, accents |
| `--background` | `#FFFFFF` / soft gray sections | Canvas |
| Radius | `1rem` / `999px` pills | Cards / buttons |
| Shadow | `0 8px 30px rgba(20,33,61,0.08)` | Cards |
| Font | Plus Jakarta Sans | All UI |

## Component API (marketing)

### `AnnouncementBar`
Props: `{ leftText, links[], phone, email }` — CMS announcement preferred.

### `SiteHeader`
Sticky; transparent over hero; solid on scroll. Nav items + hotline + Login/Register.

### `HeroPremium`
- `eyebrow`, `title`, `subtitle`, `cta`, `imageUrl` / `videoUrl` (banner API)
- `services[]` — 4 pills: Visa / Air / Hajj / Tours

### `FeaturedPackagesCarousel`
- `packages: PackageMaster[]` from Package Engine
- Embla slider; Book Now → package book URL; wishlist localStorage optional

### `DestinationShowcase`
- Destination Master cards: flag, name, packageCount, explore
- Hover zoom + lift + arrow

### `WhyChooseGrid` / `StatsBar` / `ServicesGrid` / `TestimonialsSlider` / `PartnersMarquee` / `CtaBanner` / `BlogGrid` / `FaqAccordion` / `Newsletter` / `SiteFooter`

## Motion

Use `motion` (Motion One / Framer Motion v12):
- Section `whileInView` fade-up
- Card hover scale 1.02
- Image scale 1.06 on hover
- Counter animation for stats

## Accessibility

- Landmark regions, focus rings, `aria-label` on carousels
- Prefer reduced-motion: disable transforms when `prefers-reduced-motion`
