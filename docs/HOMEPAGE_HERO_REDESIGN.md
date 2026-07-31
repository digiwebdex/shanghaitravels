# Homepage Hero Redesign — Hero Services

**Date:** 2026-07-31  
**Scope:** Website CMS + public homepage hero UI only  
**Non-goals:** ERP ops, auth, CRM, finance, portals, booking engines

---

## What changed

Removed the hero **booking widget** (service tabs, destination, travel date, Request Quote form).

Replaced with a **Premium Hero Services** section:

1. Hero title  
2. Hero subtitle  
3. Up to **six** featured service cards (default four)  
4. Large CTA — **Request a Free Consultation**

### Default services

| Title | Button | Default URL |
|---|---|---|
| Visa Services | Apply Now | `/inquiry?service=visa` |
| Hajj & Umrah | View Packages | `/tours` |
| Air Ticket | Book Now | `/inquiry?service=air_ticket` |
| Tour Packages | Explore Tours | `/tours` |

---

## CMS — Website → Home → Hero Services

Admin: `https://shanghaitravels.com.bd/erp/#/cms/hero-services`

Each service:

| Field | Storage (`CmsContent` type `hero_service`) |
|---|---|
| Enable / Disable | `status` = `published` / `draft` |
| Icon | `coverUrl` (key: passport, kaaba, plane, globe, hotel, bus) |
| Title | `title` |
| Short description | `summary` |
| Button text | `body` |
| URL | `meta.url` |
| Display order | `sortOrder` |

**Max six** enabled (`published`) services — enforced in CMS service layer.  
Public API returns only enabled services, ordered, max 6:  
`GET /api2/site/content?type=hero_service`

---

## Surfaces

| Surface | Implementation |
|---|---|
| Marketing homepage (live) | Injector `/assets/hero-services.js` + `.css` (preserves BD SPA) |
| Marketing source | `figma-design/src/pages/Home.tsx` |
| CMS public viewer | `apps/web/src/pages/SiteHomePage.tsx` |
| CMS admin | `apps/web/src/pages/CmsHeroServicesPage.tsx` |

---

## CMS API notes (Website CMS module only)

Extended existing content APIs (no auth/CRM/finance/portal changes):

- Content type allowlist includes `hero_service`
- `POST /cms/content/:id` — update  
- `POST /cms/content/:id/unpublish` — disable  
- Publish capacity check for max 6 enabled hero services  

---

## UX

- Responsive grid: 1 → 2 → 4 columns  
- Hover lift, soft transitions, brand accent  
- Keyboard focus rings; `aria-label` on cards; list labelled “Featured travel services”

---

## Deploy checklist

```bash
# API (already: content type + update/unpublish)
cd /opt/shanghai-erp-api && npm run build
rsync -a --delete dist/ /opt/st-erp-api/dist/
systemctl restart st-erp-api

# TravelOS admin + CMS viewer
cd /var/www/ShanghaiTravels-src/apps/web && npm run build
rsync -a --delete dist/ /var/www/ShanghaiTravels/erp/

# Marketing inject (no full SPA rebuild)
cp figma-design/src/auth-entry/hero-services.* /var/www/ShanghaiTravels/assets/
# ensure index.html links hero-services.css/js
```
