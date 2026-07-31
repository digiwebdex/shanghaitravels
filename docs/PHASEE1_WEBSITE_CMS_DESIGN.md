# Phase E1 — Website & CMS Technical Design

**Branch:** `feature/phase-e-website-cms`  
**Baseline:** `v2.7-crm-analytics` (CRM Release Candidate)  
**Goal:** Multi-branch, CMS-driven website fully integrated with the ERP  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Reuse | Auth, RBAC, branch, CRM leads, Documents storage patterns, Notifications, AuditLog |
| Admin API | Nest `@Controller("cms")` — authenticated CMS management |
| Public API | Nest `@Controller("site")` — `@Public()` reads + form intake |
| Legacy | AdminModule `CmsController` retired; Website & CMS owns `/cms/*` + `/site/*` |
| Admin UI | TravelOS `/#/cms/*` |
| Public UI | TravelOS `/#/site/*` (CMS-driven viewer; no portals) |

### Explicit non-goals

- Customer / Agent / Corporate portals  
- HR, AI, analytics schedule execution engine  
- Redesign of CRM / Ops / Finance modules  

---

## 2. Domain (additive)

| Entity | Purpose |
|---|---|
| `CmsPage` (extended) | Page builder blocks, SEO, branch, workflow status, publish |
| `CmsPageVersion` | Version history snapshots |
| `CmsMenu` / `CmsMenuItem` | Menu manager |
| `CmsMedia` | Media library |
| `CmsBanner` | Banner / slider |
| `CmsRedirect` | Redirect manager |
| `CmsContent` | Blog, announcements, FAQs, testimonials, galleries, downloads |
| `CmsTravelOffer` | Visa / ticket / tour / Hajj / hotel / transport content |
| `CmsFormSubmission` | Form submissions (+ CRM lead link) |
| `CmsPageView` | Page-view counters for reports |

### Workflow

`draft` → `in_review` → `published` (or back to `draft`)  
Publish creates a `CmsPageVersion` snapshot.

---

## 3. Forms → CRM

`POST /site/forms` validates, stores `CmsFormSubmission`, and creates a CRM `Lead` (source=`web`) for enquiry types. Career applications store submission only (optional lead).

---

## 4. API surface

```
# Admin (/cms/*) — cms:manage / cms:publish
pages, menus, media, banners, redirects, content, travel, forms, reports, bootstrap

# Public (/site/*) — @Public()
pages/:slug, menus/:code, banners, content, travel, search
POST forms
GET sitemap.xml, robots.txt
```

---

## 5. Frontend routes

| Path | Purpose |
|---|---|
| `/#/cms` | Pages / workflow |
| `/#/cms/menus` | Menus |
| `/#/cms/media` | Media library |
| `/#/cms/banners` | Banners/sliders |
| `/#/cms/content` | Blog/FAQ/etc |
| `/#/cms/travel` | Travel offerings |
| `/#/cms/forms` | Form inbox |
| `/#/cms/seo` | Redirects + SEO tools |
| `/#/cms/reports` | CMS reports |
| `/#/site` | Public home (published) |
| `/#/site/p/:slug` | Public page |
| `/#/site/enquire` | Public enquiry form |

---

## 6. SEO

Public endpoints serve XML sitemap, robots.txt, and page payloads include canonical, Open Graph, and JSON-LD fields for the public renderer.
