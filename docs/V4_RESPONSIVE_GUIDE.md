# V4 Responsive Guide

Breakpoints are Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
The container is `max-w-[1368px] px-5 sm:px-6`, which yields the reference's 1320 px
content box at a 1440 px viewport and edge-safe gutters below that.

## Column matrix

| Section | ≥ 1280 | 1024 – 1279 | 768 – 1023 | 640 – 767 | < 640 |
| --- | --- | --- | --- | --- | --- |
| Hero pills | 4 | 2 × 2 | 2 × 2 | 2 × 2 | 2 × 2 |
| Featured packages | 5 | 4 | 3 | 2 | 1 |
| Popular destinations | 4 | 2 | 2 | 2 | 1 |
| Stats bar | 4 | 4 | 4 | 2 | 2 |
| Services | 6 | 3 | 3 | 2 | 2 |
| Testimonials | 3 | 3 | 2 | 1 | 1 |
| Partners | 8 in a strip | strip | strip | strip | strip |
| Blog | 4 | 2 | 2 | 2 | 1 |
| Footer | 6 | 3 | 3 | 2 | 2 |

## Height behaviour

| Element | Desktop | Mobile |
| --- | --- | --- |
| Announcement bar | 34 px single row | wraps to two centred rows |
| Header | 80 px | 68 px, nav collapses to a sheet below `xl` |
| Hero | fixed 448 px | `min-h-[520px]`, grows with content |
| Hero pills | 74 px | 64 px, tighter padding and type |
| Package / destination / blog cards | fixed image slots | unchanged, so no layout shift |
| Stats bar | 104 px | auto with `py-7` |
| CTA banner | 150 px row | stacks: photo, copy, contacts, button |

## Rules applied

- Card image heights are fixed at every breakpoint, so reflow never shifts the page.
- Titles and excerpts use `line-clamp`, and every flex text child sits in a `min-w-0`
  wrapper, so long CMS strings truncate rather than blow out a grid track.
- The hero pill row drops to 2 × 2 rather than a single column, keeping the hero short
  enough that the CTA stays above the fold on a 390 × 844 device.
- Carousels are `touch-pan-y`, so vertical page scrolling still works from inside a track.
- Secondary chrome (top-bar nav links, language selector, "View all" links, carousel
  arrows) hides below `sm`/`md` where the reference has no room for it.

## Verified

Checked at 1440, 1024, 768 and 390 px. At 390 px `document.documentElement.scrollWidth`
equals `window.innerWidth` — no horizontal overflow anywhere on the page.
