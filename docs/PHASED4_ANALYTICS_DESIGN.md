# Phase D4 — CRM Analytics & Customer Intelligence Technical Design

**Branch:** `feature/phase-d-analytics`  
**Baseline:** `v2.6-communications`  
**Audience:** Sales managers, branch managers, executives  

---

## 1. Architecture

| Layer | Approach |
|---|---|
| Reuse | Auth, RBAC, branch, CRM, Sales, Comms, Application spine, AR/AP, FS, AuditLog, existing report endpoints as data sources |
| New module | Nest `@Controller("analytics")` + UI `/#/analytics/*` |
| Computation | Live aggregations over existing tables (no fabricated metrics) |
| Export | CSV / Excel-compatible / printable HTML (PDF via browser print) |
| Schedules | Report definitions only — execution engine deferred |

### Explicit non-goals

- Website, CMS, Portals, HR, AI  
- Redesign of CRM / Sales / Comms / Finance modules  
- Scheduled report runner / email dispatch  

---

## 2. Domain (additive)

| Entity | Purpose |
|---|---|
| `AnalyticsReportTemplate` | Saved report templates (filters + metric set) |
| `AnalyticsScheduledReport` | Schedule definitions (cron, format, recipients) — no runner yet |

---

## 3. API (`/analytics/*`)

```
POST   /analytics/bootstrap
GET    /analytics/executive?from&to&branchId
GET    /analytics/customer?...
GET    /analytics/sales?...
GET    /analytics/comms?...
GET    /analytics/finance?...
GET    /analytics/export/:report?format=csv|excel|html|pdf
GET/POST /analytics/templates
GET/POST /analytics/schedules
PATCH  /analytics/schedules/:id
```

Permissions: `analytics:read`, `analytics:manage`, `analytics:export`

---

## 4. Dashboard sections

| Dashboard | Metrics |
|---|---|
| Executive | Pipeline, forecast, monthly trend, branch/team performance, booking conversion, lead sources |
| Customer | CLV, booking frequency, repeat rate, segmentation, corporate vs B2C, geography |
| Sales | Win/loss, stage conversion, cycle duration, forecast accuracy, productivity, quote acceptance |
| Communication | Response times, SLA, email/WA/SMS metrics, activity completion |
| Finance-linked | Revenue by service, AR/AP outstanding, collections, profit contribution, branch financials |

---

## 5. Frontend routes

| Path | Page |
|---|---|
| `/#/analytics` | Executive dashboard |
| `/#/analytics/customers` | Customer analytics |
| `/#/analytics/sales` | Sales analytics |
| `/#/analytics/comms` | Communication analytics |
| `/#/analytics/finance` | Finance-linked analytics |
| `/#/analytics/reports` | Saved templates + schedules + export |

---

## 6. Regression guard

Do not modify booking engines, CRM/Sales/Comms UIs, or Finance cores.  
Do not begin Website, CMS, Portals, HR, or AI.
