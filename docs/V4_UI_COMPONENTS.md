# V4 UI Components

All components live in `figma-design/src/home/v4/`. Values are the measured reference
figures documented in [`V4_DESIGN_ANALYSIS.md`](./V4_DESIGN_ANALYSIS.md).

---

## Shared layer

### `tokens.ts`

| Token | Value |
| --- | --- |
| `CONTAINER` | `mx-auto w-full max-w-[1368px] px-5 sm:px-6` → 1320 px content at 1440 |
| `SECTION_TOP` | `pt-8 md:pt-9` → the 36 px inter-section rhythm |
| `CARD` | `rounded-xl bg-white ring-1 ring-[rgba(20,33,61,.08)] shadow-[0_2px_12px_rgba(20,33,61,.06)]` |
| `CARD_HOVER` | 4 px lift + `shadow-[0_14px_32px_rgba(20,33,61,.14)]` over 300 ms |
| `FOCUS` | 2 px accent ring with a 2 px offset |
| `ICON_TINTS` | Blue, orange, green, purple, teal, red — the services row, in reference order |

### `Section.tsx`
`Section` wraps a `motion.section` (fade + 24 px rise, `once`, `-60px` margin,
`cubic-bezier(.22,1,.36,1)`) around the container. `SectionHeading` renders the 26 px
left-aligned title with the 28 × 3 px orange rule and an optional right-hand slot.
`ViewAll` is the 12 px "View all … →" link with an arrow that nudges on hover.

### `CoverImage.tsx`
Photo slot that swaps to the brand gradient when the source is absent or fails to load,
so a missing CMS image never produces a broken-image box.

---

## Sections

### `AnnouncementBar` — 33 px navy
Government-approved badge with the registration number on the left; secondary nav
(About Us · Careers · Blog · Contact), four social icons that adopt their platform
colour on hover, and the language selector on the right.

### `SiteHeader` — 80 px, sticky, always solid white
Real wordmark, seven-item primary nav with hover/focus dropdowns, and the hotline pill
(orange circular phone glyph, "Hotline" caption, bold number). `AuthEntryDesktop` and
`AuthEntryMobile` are mounted unchanged, so every portal login and registration path is
preserved. Below `xl` the nav collapses to a sheet. The header gains a shadow past 8 px
of scroll.

### `HeroPremium` — 448 px desktop, 520 px minimum on mobile
Bright full-bleed photograph with two scrims: a vertical wash plus a centred radial wash
that guarantees the navy headline stays legible against any banner the CMS serves.
Content is orange eyebrow → 52 px two-tone headline → 18 px service line → trust line →
orange pill CTA with a white circular arrow. Four glass-white service pills
(74 px tall, 28 px gap) sit 22 px above the hero's bottom edge; they read from CMS
`hero_service` entries and fall back to the four labelled defaults. Pills are 4-up on
desktop and 2 × 2 on mobile.

### `FeaturedPackages`
Five cards across at `xl`, stepping 4 / 3 / 2 / 1 down the breakpoints. With five or
fewer published packages the row renders as a grid sized to the item count so the track
never ends in an empty slot; beyond five it becomes an Embla carousel with circular
arrows pinned to the image mid-line at the container edge.

Card — 176 px image with a 700 ms zoom on hover, coloured badge top-left
(Popular / Trending / Best Seller / Value Pack / Featured, derived from Package Engine
flags), discount chip top-right, rating chip bottom-left, then title with a wishlist
heart, compact `5D / 4N` duration, a fact row (destination · days · reviews), and a
closing row of From / price / struck original / orange **Book Now**.

### `PopularDestinations`
Four columns by two rows, 158 px cards. Each card is a full-bleed destination photo
under a left-to-right white scrim carrying a circular flag (explicit asset, else the ISO
code via flagcdn, else the emoji), the country name, the live package count and an
orange *Explore* link. Hover zooms the image, lifts the card and slides in a glass arrow
button. Admin toggles for flag, region, package count, CTA label and card count are all
honoured.

### `StatsBar`
Navy `rounded-2xl` card inside the container, 104 px tall, four columns of
`ring-1` orange icon + counter + caption. Counters ease in cubically on first view and
render their final value directly under `prefers-reduced-motion`.

### `ServicesGrid`
Six cards in a single row at `xl` (3-up tablet, 2-up mobile). Centre-aligned: 44 px solid
colour circle that scales on hover, 13 px title, three-line clamped description, and a
*Learn More →* link pinned to the card foot so every card closes at the same baseline.

### `Testimonials`
Left heading with a pair of circular carousel arrows on the right. Three cards per view
via Embla; each shows its star row, a three-line clamped quote, and an avatar with name
and service. Renders nothing when no testimonials are published.

### `Partners`
Single white strip with hairline dividers between eight evenly weighted logo cells.
Logos are greyscale at 75 % opacity and resolve to full colour on hover. More than eight
logos switches the strip to a duplicated-track marquee that pauses on hover and stops
entirely under `prefers-reduced-motion`.

### `CtaBanner`
Navy `rounded-2xl`, 155 px, with the photograph bleeding from the left under a gradient
that dissolves into the panel. Heading and subtitle, then Call Us and WhatsApp blocks
with ringed circular icons, then the orange pill CTA with its white circular arrow.

### `BlogLatest`
Four cards. 112 px image with a 46 px white date chip (bold day over an orange month)
inside its lower-left corner, then a two-line title, a two-line excerpt and
*Read More →*. Sorted by publish date, capped at four, hidden when empty.

### `SiteFooter`
Navy, six columns: brand block (wordmark with a soft halo, description, four social
buttons), Quick Links, Our Services, Support, Contact Us with orange glyphs, and the
newsletter. Every column heading carries a 24 × 2 px orange rule. The newsletter posts
to `/api2/site/forms` with `formType: "newsletter"` and reports status through an
`aria-live` region. A darker bottom bar closes with the copyright and the approval and
registration line.
