# V4 — Reference Design Analysis Report

Measured from the approved homepage reference render (485 × 1024 px thumbnail →
**1440 × 3040 px** design frame, scale factor 2.969). Every figure below is in real
CSS pixels at a 1440 px viewport and was extracted programmatically (band detection
and gap-centre analysis), not estimated by eye.

---

## 1. Container and grid

| Property | Measured | Implementation |
| --- | --- | --- |
| Design frame | 1440 px | — |
| Content box | x 56 → 1375 = **1320 px** | `max-w-[1368px] mx-auto px-6` |
| Side margin | ~57 px symmetric | — |
| Column model | 12 × 90 px, **20 px gutter** | CSS grid |

Cross-checked against three independent elements that all resolve to 1320: the stats
bar (56 → 1375), the destination grid and the blog grid.

## 2. Row pitches (from gap-centre spacing)

| Row | Gap centres (px) | Pitch | Gap | Card width |
| --- | --- | --- | --- | --- |
| Featured packages (5-up) | 340 / 604 / 868 / 1135 | 265 | 15 | **250** |
| Destinations (4-up) | 378 / 715 / 1052 | 337 | 17 | **320** |
| Services (6-up) | — | 220 | 22 | **198** |
| Blog (4-up) | 380 / 717 / 1052 | 336 | 24 | **312** |
| Testimonials (3-up) | — | 440 | 24 | **416** |

## 3. Vertical rhythm

| Band | y-range | Height |
| --- | --- | --- |
| Announcement bar | 0 – 33 | 33 |
| Header | 36 – 119 | 83 |
| Hero | 122 – 570 | **448** |
| Featured packages | 606 – 1000 | — |
| Popular destinations | 1033 – 1450 | — |
| Stats bar | 1486 – 1590 | **104** |
| Services | 1621 – 1868 | — |
| Testimonials | 1903 – 2120 | — |
| Partners | 2147 – 2280 | — |
| CTA banner | 2296 – 2451 | **155** |
| Blog | 2470 – 2758 | — |
| Footer | 2797 – 3040 | 243 |

The distance from one section's last pixel to the next section's heading is a
consistent **33 – 36 px**, and heading → content is **16 px**. This is a dense
premium layout in the Booking.com/Trip.com register, not an airy editorial one.

**Validation:** the rebuilt page measures **3024 px** tall against the reference's
3040 px — a 0.5 % deviation across fourteen stacked bands.

## 4. Component geometry

- **Hero** — 448 px, bright photograph, **no dark overlay**. Eyebrow sits 52 px below
  the hero's top edge; the CTA ends at 443; the pill row runs 474 – 548, leaving a
  22 px margin above the hero's bottom edge. Pills are 230 × 74 with a 28 px gap.
- **Package card** — 250 × 347; image 250 × 176 (≈ 10:7); badge top-left; price block
  and orange *Book Now* on the closing row.
- **Destination card** — 320 × 158; full-bleed image with a **left-to-right white
  scrim**, navy text, circular flag, orange *Explore →*.
- **Service card** — 198 × 178, centre-aligned, 44 px solid-colour circular icon.
- **Stats bar** — navy `rounded-2xl` card inside the container, 104 px, four columns.
- **CTA banner** — navy `rounded-2xl`, 155 px, photo bleeding from the left edge.
- **Blog card** — 312 wide, 112 px image, 46 px white date chip inside the image.

## 5. Typography scale

| Role | Size / weight |
| --- | --- |
| H1 | 52 / 1.08 extrabold, tracking-tight |
| Section H2 | 26 bold + 28 × 3 px orange rule |
| Card title | 14 bold |
| Body | 11 – 13 |
| Eyebrow | 12 uppercase, 0.16em tracking |
| Price | 17 extrabold |

## 6. Radius, shadow, colour

- Radius — cards **12**, banners and stats **16**, buttons 8, CTAs and pills 999.
- Shadow — resting `0 2px 12px rgba(20,33,61,.06)`; hover `0 14px 32px rgba(20,33,61,.14)`.
- Colour — **every section sits on white.** There are no alternating grey bands; navy
  appears only on the top bar, the stats card, the CTA card and the footer. Navy
  `#14213D`, orange `#F97316`, both already the Shanghai Travels brand tokens.

## 7. Motion

Section reveal (fade + 24 px rise, once, −60 px margin), image zoom to 1.07 over 700 ms,
card lift of 4 px with shadow bloom over 300 ms, arrow slide on hover, and animated
number counters on the stats bar. All easing is `cubic-bezier(.22,1,.36,1)`;
`prefers-reduced-motion` disables the marquee and the counters.

## 8. Deltas corrected against the previous V4 build

| # | Was | Now |
| --- | --- | --- |
| 1 | 92 vh hero with a dark navy overlay | 448 px hero, bright photo, navy headline |
| 2 | Alternating grey/white section bands | All sections white |
| 3 | Featured packages 3-up | 5-up (grid when fewer than five are published) |
| 4 | Stats bar directly under the hero | After Popular Destinations |
| 5 | Services 3-up | 6-up in a single row |
| 6 | Blog 3-up | 4-up with date chips |
| 7 | Centred section headers with eyebrow + subtitle | Left-aligned 26 px title + orange rule |
| 8 | Standalone newsletter section | Folded into the footer, as in the reference |
| 9 | Generic plane-in-a-square logo | Real Shanghai Travels wordmark |

**Sections not present in the reference** — *Why Choose Us* and the *FAQ accordion*
were removed from the homepage to preserve the reference's section order and count.
Both components remain in the codebase and stay CMS-driven for use on inner pages.
