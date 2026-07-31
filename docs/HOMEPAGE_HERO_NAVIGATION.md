# Homepage Hero Service Navigation

**Date:** 2026-08-01  
**Branch:** `feature/homepage-hero-navigation`  
**Scope:** Marketing homepage hero UI only  

---

## Summary

Replaced the large hero service cards with a **premium horizontal quick-access navigation**.

Kept:

- Full-bleed hero banner
- Hero title + subtitle as primary focus
- Main CTA — **Request a Free Consultation**

Removed:

- Large service cards (icon + description + per-card button)

---

## Navigation

| Label | Route |
|---|---|
| 🛂 Visa Services | `/visa` |
| ✈️ Air Tickets | `/air-ticket` |
| 🕋 Hajj & Umrah | `/hajj` |
| 🌍 Tour Packages | `/tours` |

Fixed routes in the hero inject / `Home.tsx` — no CMS or API dependency for this nav.

---

## Design

- Single horizontal row on desktop (4 equal-width pills)
- Height **50px**, radius **999px**
- Glassmorphism (`rgba` fill + `backdrop-filter: blur(12px)`)
- Thin white border; white icon + label
- Hover: orange border, orange icon emphasis, underline scale animation
- Transitions: **300ms**
- Tablet / mobile: **2 × 2** grid

---

## Files

| Path | Role |
|---|---|
| `assets/hero-services.js` | Live marketing inject |
| `assets/hero-services.css` | Pill nav styles |
| `figma-design/src/auth-entry/hero-services.inject.js` | Inject source |
| `figma-design/src/auth-entry/hero-services.css` | Inject CSS source |
| `figma-design/src/pages/Home.tsx` | React homepage hero |

Linked from root `index.html` as `/assets/hero-services.css` + `/assets/hero-services.js`.

---

## Non-goals

- No backend / API changes  
- No ERP admin or CMS admin changes  
- No authentication changes  
- Package Engine and other modules untouched  

---

## Accessibility

- `<nav aria-label="Quick access travel services">`
- Each pill is a focusable link with `aria-label`
- Visible focus ring on keyboard focus
- Decorative emoji icons marked `aria-hidden`

## Deploy notes

- Live inject cache-busted via `?v=` on `index.html` asset URLs.
- Packages inject must not mount inside the hero section.
