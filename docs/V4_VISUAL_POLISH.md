# V4 Homepage — Premium Visual Polish

Visual-quality pass over the shipped V4 homepage. **No layout, section order, CMS,
Package Engine, API or ERP changes.** Every edit is presentation-only: photography
fallbacks, shadow ramp, hover motion, typographic rhythm and card padding.

---

## 1. Photography

### The problem

Five of the twelve published destinations and two of the four published packages
pointed at Unsplash photo IDs that have since been retired. Those cards rendered
the `CoverImage` gradient fallback — a flat navy rectangle that read as a broken
placeholder:

| Record | CMS image | Status |
| --- | --- | --- |
| Bangladesh, Indonesia, Thailand, United States, Canada | `images.unsplash.com/photo-…` | `404` |
| Bali Escape 5D4N, Hajj Economy Package 2026 | `images.unsplash.com/photo-…` | `404` |

### The fix — `src/home/v4/photos.ts`

A curated fallback library resolved by subject. **CMS data still wins**: these
frames are only reached when a record ships no image *or* the image it ships
fails to load.

```
CMS / Package Engine / Destination Master image
        └── onError ──▶ curated frame for that country / city / category
                             └── onError ──▶ brand gradient
```

Resolution order in `fallbackPhoto()`:

1. **Place** — exact match on country, country code or city (`dubai`, `ae`,
   `united arab emirates`, `makkah`, `bali`, …), then substring match so
   `"Makkah & Madinah"` and `"Hajj Economy 2026"` still resolve.
2. **Category** — package type keywords (`hajj`, `umrah`, `visa`, `flight`,
   `hotel`, `honeymoon`, `beach`, `desert`, `student`, …).
3. **Generic** — wide, bright scenic frames; blog cards use an editorial set.

Each pool holds several frames. `rotate` (the card's position in its row)
walks the pool so a row never repeats a frame — hashing alone let four adjacent
blog cards collide on one image.

> **Every photo ID in this file was fetched and visually checked before being
> added.** Unsplash returns `404` for retired photos, so an unverified ID ships a
> broken card. Re-verify with a `curl` status check before adding more.

### Hero

The hero crops to roughly **3.2:1** (1436×448), which destroys any photo with a
strong foreground subject — the first candidate put a parade float across the
right third. The chosen frame is a golden-hour Dubai skyline: a horizontal
composition that survives the crop and stays bright enough behind the scrim to
carry navy type.

Treatment:

- **Slow drift** — `scale 1.12 → 1` over 18s, disabled under `prefers-reduced-motion`.
- **Vignette** — `radial-gradient` navy at 16% on the corners.
- **Lighter scrim** — the old scrim reached ~95% white behind the headline, which
  washed the photo to nothing. Retuned to land near **80% white** at the type:
  navy still clears WCAG AA, and the photograph reads as a photograph.

### Consistent grade

One treatment for every photo slot, via `PHOTO_GRADE` in `tokens.ts`:

```
saturate-[1.08] contrast-[1.04] brightness-[1.03]
```

All fallback URLs share one request signature — `?w={n}&q=80&auto=format&fit=crop`.

---

## 2. Shadows

Single-blur shadows read flat at card size. Replaced with a two-part ramp — a
tight contact shadow to keep the edge crisp, plus a wide ambient pass for height:

| Token | Value |
| --- | --- |
| `SHADOW_REST` | `0 1px 2px rgba(20,33,61,.05), 0 6px 20px rgba(20,33,61,.06)` |
| `SHADOW_LIFT` | `0 2px 4px rgba(20,33,61,.06), 0 20px 44px rgba(20,33,61,.16)` |

---

## 3. Motion

`EASE = cubic-bezier(0.22, 1, 0.36, 1)` is now shared by every hover and reveal.

| Element | Before | After |
| --- | --- | --- |
| Cards | `-translate-y-1`, 300ms | `-translate-y-1.5`, 500ms, ring warms |
| Card images | `scale-1.07`, 700ms | `scale-1.09`, 900ms |
| Destination scrim | static | recedes to 90% on hover |
| Destination arrow | fade in | slides `translate-x-2 → 0` |
| Service icons | `scale-110` | `scale-110` + lift + shadow bloom |
| Primary CTAs | colour only | lift + shadow bloom + arrow nudge |
| Carousel buttons | colour only | `scale-110` + accent ring |
| Skeletons | `animate-pulse` | `st-shimmer` sweep |

All of it is suppressed under `prefers-reduced-motion`.

---

## 4. Typography & spacing

- Headings `tracking-[-0.022em]`; hero headline `-0.025em`; card titles `-0.01em`.
- Uppercase micro-labels opened up: hero eyebrow `0.22em`, `FROM` `0.1em`,
  partner wordmarks `0.14em`.
- Body line-height `1.55 → 1.65`; testimonial quotes `1.6 → 1.7`.
- Card padding `16px → 18px`; testimonials `20px → 22px`.
- Grid gaps `16px → 20px` on packages, destinations and services.
- Section heading margin `16px → 20px`; the accent rule is now a gradient.
- Hero support line lifted from `primary/55` to `primary/70` to hold contrast
  against the lighter scrim.

---

## 5. Section-specific

**Package cards** — bottom-anchored image gradient so the rating chip never
floats on bright sky; rating chip flipped to white-on-navy for legibility;
hairline rule above the price row.

**Destination cards** — the reading panel was strengthened
(`0.96 → 0.9 → 0.5 → 0`). The previous scrim was tuned against navy-gradient
placeholders; against real landmark photography the country name and CTA lost
contrast.

**Stats band** — navy gradient plus a warm radial glow behind the counters.

**CTA banner** — navy gradient with a warm rake off the photo edge and a cool
lift on the far corner, replacing flat `bg-primary`.

**Partners** — feathered marquee edges via `mask-image`. The row now falls back
to real airline marks (`src/assets/partners/`, listed in `partnerLogos.ts`)
instead of typeset wordmarks. They are bundled rather than hotlinked so the row
cannot break on a third party, and imported so the build fingerprints them.

Each mark carries its own cap height. The set runs from British Airways at
roughly 6.4:1 to Saudia in portrait at 0.84:1, so a single `max-height` would
put the stacked marks at nearly twice the optical weight of the wide wordmarks.

The static row is a `2 / 4 / 8` column grid rather than a flex row. Eight cells
at their minimum width measured 1208px inside a 355px `overflow-hidden`
container, which clipped six logos on a phone with no way to reach them. The
1px grid gap over a tinted backdrop draws the hairlines, so they stay correct
however the grid reflows. CMS-uploaded logos still take precedence, and more
than eight still switches to the marquee.

**Blog cards** — date chip gains a ring, layered shadow and a hover lift;
editorial fallback frames; bottom gradient for depth.

**Testimonials** — oversized quote glyph at 5% opacity, avatar ring, hover lift.

---

## 6. Counter fix (`StatsBar.tsx`)

Not styling — a real defect found during verification. The stats read
`2+ / 1,798+ / 14+ / 12%` and flickered instead of settling on
`20+ / 15,000+ / 120+ / 98%`.

`parseNumeric(value)` was called during render and listed in the `useEffect`
dependency array. It returns a **new object every render**, so the effect tore
down and restarted on every render — and the effect's own `setDisplay` caused
that render. The animation never got past frame 1–2, which is exactly
6% and 12% of each target:

```
20 × 0.061 = 1.2 → "1+"        20 × 0.120 = 2.4  → "2+"
15000 × 0.061 = 919 → "918+"   15000 × 0.120    → "1,798+"
```

Fixed by moving `parseNumeric` inside the effect, switching to a time-based
ramp (1400ms) rather than a frame count, landing on the authored string so CMS
formatting is preserved exactly, and holding the zero state until the band
scrolls into view.

Verified on the live site — smooth ramp, then stable:

```
before scroll: 0+ | 0+ | 0+ | 0%
250ms:  8+ | 6,173+  | 49+  | 40%
750ms: 18+ | 13,332+ | 107+ | 87%
1500ms: 20+ | 15,000+ | 120+ | 98%
3000ms: 20+ | 15,000+ | 120+ | 98%
```

---

## 7. Responsive

Unchanged. Verified at 1440px and 390px: hero 2×2 pill grid, single-column
packages, stacked footer all behave as before.

---

## Open items — CMS data, not code

These need an admin edit; they were left alone because CMS values take
precedence over code by design.

1. ~~**Hero banner title is `"Smoke banner"`**~~ — fixed, see below. No hero
   banner carries an `imageUrl` yet, so the cinematic code default still
   renders; uploading one would override it.
2. **Blog posts are smoke-test records** (`"Smoke blog 1785527453529"`).
3. **Qatar's destination image is a Tbilisi photo** — the URL resolves, so the
   fallback never triggers; only a CMS correction will fix it.
4. **`Schengen Visa Assistance` and `Dhaka–Dubai Round Trip` share one
   aeroplane photo** — both URLs resolve, so this is a Package Engine field edit.

---

## 8. Hero headline: smoke-test data in production

The live hero read **"Smoke banner"**. Three separate causes:

1. **The API smoke suite writes to production.** `apps/web/tests/api/smoke.mjs`
   POSTs a `placement: "hero"` banner on every run. Nine had accumulated in
   `st_erp_prod`.
2. **Banners have no delete endpoint** — `CmsController` exposes only GET and
   POST, so nothing ever cleaned them up.
3. **`sortOrder` did not disambiguate.** The public query orders by `sortOrder`
   ascending; the smoke rows defaulted to `0` while the real `home-hero` banner
   sat at `10`, so a test record was always first and `banners[0]` took it.

Fixes applied:

- **Data.** Soft-deleted the nine smoke rows in `st_erp_prod` and
  `st_erp_staging` (`deletedAt`, `isActive: false` — the public query filters on
  both). `home-hero` now carries the design headline
  `"Your World, Expertly Planned"` at `sortOrder 0`. The comma is load-bearing:
  `splitHeadline` breaks there to give the second line the orange accent.
  CSV snapshots of both tables are in `/root/cms-backups/`.
- **Selection.** `pickHeroBanner` in `home/v4/api.ts` keys off the `home-hero`
  code instead of taking `banners[0]`, and only falls back to list order if
  that code is absent.
- **Root cause.** The smoke test now creates its banner with
  `placement: "smoke"` and `isActive: false`, so it still exercises the create
  path without ever reaching the homepage.

Editing the headline is still a normal CMS operation — change the `home-hero`
banner's title and it flows straight through.
