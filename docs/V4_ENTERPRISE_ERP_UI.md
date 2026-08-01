# V4 Enterprise ERP UI

Frontend-only reorganization of TravelOS (`apps/web`). No backend, DB, auth, or API changes.

## Architecture

### Grouped sidebar
- Source: `src/config/nav.ts`
- Shell: `src/layouts/AdminLayout.tsx`
- Collapsible groups, localStorage expansion, mobile drawer, Cmd+K palette, Create menu

### Workspace principle
Every major domain has Overview / Work / Reports / Calendar / Settings tabs.

- Registry: `src/workspaces/registry.ts`
- Tab bar: `src/workspaces/WorkspaceTabs.tsx`

### DashboardDataProvider
Components must not fetch multiple APIs directly.

- Provider: `src/dashboard/DashboardDataProvider.tsx`
- Named source loaders (one endpoint each), permission-gated, deduped
- Metrics carry provenance: `aggregate` | `derived` | `unavailable`

## New screens

| Area | Routes |
|------|--------|
| Partners | `/partners`, `/partners/agents`, `/partners/corporate`, `/partners/suppliers`, `/partners/suppliers/:type` |
| Finance | `/finance/dashboard`, `/finance/invoices`, `/finance/payments`, `/finance/expenses`, `/finance/cash`, `/finance/customer-ledger`, `/finance/supplier-ledger` |
| Operations | `/operations`, `/operations/documents`, `/operations/workflow`, `/operations/calendar`, `/operations/notifications` |
| Admin | `/admin/users`, `/admin/settings` + Soon pages for roles/permissions/audit/api-keys/integrations |
| CMS typed | `/cms/content/:type` (blog / faq / testimonial) |
| AI | `/ai` — Soon (no backend) |

## Known gaps (backend)

- No `Application.supplierId` — supplier link via AP + package master only
- No audit / API keys / integrations / roles admin endpoints
- No AI workspace endpoints
- No calendar entity — Operations Calendar is derived from tasks + bookings
- Today's Payments KPI has no date-scoped payments aggregate
