# Phase D1 — CRM Foundation Technical Design

**Branch:** `feature/phase-d-crm`  
**Baseline:** `release/v2.0-rc1`  
**Business model:** B2C / B2B / Corporate travel sales CRM  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Reuse | Auth, RBAC, branch scope, Application spine, Documents, Timeline, Assignment, Notifications, Finance, AuditLog |
| Existing | Enhance `Lead` + `Communication`; wrap `Agent` / `CorporateClient` via CRM organizations |
| New | Contacts, Organizations, Opportunities, Activities, Quotations, Conversion, CRM reports |
| Booking modules | Untouched — conversion calls `ApplicationsService.create` only |

### Explicit non-goals

- Website, CMS, Customer / Agent / Corporate portals, HR, AI  
- Redesign of Visa / Ticketing / Hotel / Transport / Tour / Hajj / Finance  

---

## 2. Lead sources

Canonical `source` values: `web` | `walkin` | `phone` | `whatsapp` | `facebook` | `referral`.

---

## 3. Domain model (additive)

| Entity | Purpose |
|---|---|
| `Lead` (extended) | Inbound interest; links to contact/org/opportunity/case |
| `CrmContact` | Individual / family / corporate contact |
| `CrmOrganization` | Corporate / travel agent / partner agency (+ optional Agent / CorporateClient link) |
| `Opportunity` | Pipeline stage, probability, expected revenue |
| `CrmActivity` | Call / meeting / email / WhatsApp / task / follow-up |
| `Quotation` + lines | Service-typed quotes (visa, ticket, hotel, tour, hajj/umrah) |

`Communication` remains for simple interaction logs (compat).

---

## 4. Opportunity pipeline

Stages: `qualification` → `needs_analysis` → `proposal` → `negotiation` → `won` / `lost` / `converted`.

Probability stored as basis points (e.g. 6000 = 60%). Revenue in poisha.

---

## 5. Conversion

`POST /crm/convert` creates a draft `Application` for:

`visa` | `air_ticket` | `hotel` | `tour` | `hajj` | `umrah`

Resolves/creates `Customer`, marks opportunity/quote/lead converted, writes AuditLog + ApplicationEvent + CRM activity.

---

## 6. API (`/crm/*` + legacy)

```
GET/POST     /crm/leads  (+ legacy /leads)
GET/PATCH    /crm/leads/:id
GET/POST     /crm/contacts
GET/POST     /crm/organizations
GET/POST     /crm/opportunities
POST         /crm/opportunities/:id/stage
GET/POST     /crm/activities
GET/POST     /crm/quotations
POST         /crm/quotations/:id/status
POST         /crm/convert
GET          /crm/reports/lead-sources|conversion|pipeline|team|forecast
GET/POST     /communications  (legacy)
```

Permissions: existing `lead:*`, `crm:read`, `communication:manage`, `corporate:manage`, `agent:manage`  
+ `opportunity:read|manage`, `quote:read|manage`, `crm:convert`.

---

## 7. Frontend routes

| Path | Page |
|---|---|
| `/#/crm` | Leads |
| `/#/crm/contacts` | Contacts |
| `/#/crm/organizations` | Organizations |
| `/#/crm/opportunities` | Pipeline |
| `/#/crm/activities` | Activities |
| `/#/crm/quotations` | Quotations |
| `/#/crm/reports` | CRM reports |

---

## 8. Regression guard

Do not modify booking engines or Finance C1–C4 posting logic.  
Do not begin Website, CMS, Portals, HR, or AI.
