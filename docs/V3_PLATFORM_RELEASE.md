# Version 3.0 — Platform Release Candidate

**Release:** `v3.0-platform-rc1`  
**Branch:** `release/v3.0-platform-rc1`  
**Commit message:** Version 3.0 Platform RC1  
**Date:** 2026-07-31  
**Baseline tip:** Phase H1 Corporate Portal (`2060457`) + regression hardening  

---

## Completed platform surface

| Domain | Modules |
|---|---|
| Public web | Website & CMS (pages, menus, media, banners, forms, SEO, travel content) |
| CRM | Leads, contacts, organizations, opportunities, activities |
| Sales | Pipeline, quotations, pricing, booking conversion |
| Communications | Timeline, email/SMS/WhatsApp outbox, activities |
| Analytics | Executive, sales, finance, communications intelligence |
| Travel ops | Visa, Air Ticketing, Hotel, Transport, Tour Packages, Hajj & Umrah |
| Finance ERP | CoA, journals, AR/AP, banking, financial statements |
| Portals | Customer, Agent, Corporate (isolated JWT realms) |

---

## Auth realms

| Realm | Cookies | Secret | Audience |
|---|---|---|---|
| Staff | `st_access` / `st_refresh` | `JWT_ACCESS_SECRET` | staff |
| Customer | `st_customer` / `st_customer_refresh` | `JWT_CUSTOMER_SECRET` | `customer` |
| Agent | `st_agent` / `st_agent_refresh` | `JWT_AGENT_SECRET` | `agent` |
| Corporate | `st_corporate` / `st_corporate_refresh` | `JWT_CORPORATE_SECRET` | `corporate` |

---

## Architecture spine

- **Application** case engine shared across all travel services  
- **Finance** invoices/payments/ledger in minor units (poisha)  
- **Documents** + version history, permission-checked downloads  
- **Timeline** application events  
- **Notifications** outbox  
- **AuditLog** security-relevant mutations  
- **RBAC** fail-closed permissions on staff APIs  

---

## Quality gates (RC1)

| Gate | Result |
|---|---|
| TypeScript | ✅ |
| ESLint | ✅ |
| Unit tests | ✅ 43/43 |
| API smoke staging | ✅ 311/311 |
| API smoke production | ✅ 311/311 |
| Playwright full suite | ✅ 20/20 |
| Production build → `/erp/` | ✅ |

---

## Explicit exclusions (not in V3.0 RC1)

- HR product module expansion  
- AI features  
- Mobile apps  
- Report schedule execution engine  

---

## Companion docs

- `docs/V3_PLATFORM_AUDIT.md` — control-by-control audit  
- `docs/V3_PLATFORM_REGRESSION.md` — regression execution record  
- Prior phase completion docs under `docs/PHASE*`
