# V4 Enterprise ERP UI

Frontend-only reorganization of TravelOS (`apps/web`). No backend, DB, auth, or API changes.

**Status:** V4 production-quality polish complete. Architecture frozen — do not start V5.

Design tokens: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

## Architecture

### Grouped sidebar
- Source: `src/config/nav.ts`
- Shell: `src/layouts/AdminLayout.tsx`
- Collapsible groups, localStorage expansion, mobile drawer, Cmd+K palette, Create menu

### Workspace principle
Every major domain has Overview / Work / Reports / Calendar / Settings tabs.

- Registry: `src/workspaces/registry.ts` (single SoT — ModuleNav wrappers use `ModuleNavFromWorkspace`)
- Tab bar: `src/workspaces/WorkspaceTabs.tsx`

### DashboardDataProvider
Components must not fetch multiple APIs directly.

- Provider: `src/dashboard/DashboardDataProvider.tsx`
- Named source loaders (one endpoint each), permission-gated, deduped
- Metrics carry provenance: `aggregate` | `derived` | `unavailable`
- Charts/KPIs use design tokens (`brand`, `chartColors`)

## Screens

| Area | Routes |
|------|--------|
| Partners | `/partners`, `/partners/agents`, `/partners/corporate`, `/partners/suppliers`, `/partners/suppliers/:type` |
| Products | `/products/packages` (+ destinations, categories, pricing, gallery, availability, reports) |
| Finance | `/finance/dashboard`, `/finance/invoices`, `/finance/payments`, `/finance/expenses`, `/finance/cash`, `/finance/customer-ledger`, `/finance/supplier-ledger` |
| Operations | `/operations`, `/operations/documents`, `/operations/workflow`, `/operations/calendar`, `/operations/notifications` |
| Admin | `/admin/users`, `/admin/settings` + Soon pages for roles/permissions/audit/api-keys/integrations |
| CMS typed | `/cms/content/:type` (blog / faq / testimonial) |
| AI | `/ai` — Soon (no backend) |

## Integration notes

- **Package ↔ Supplier:** `PackageMaster.supplierId` / supplier cost on create/edit; directory links to Supplier Center. No `Application.supplierId`.
- **Supplier Center:** type summary (counts + AP due), filters, Packages + AP shortcuts.
- **Performance:** route-level `lazy()` in `app/routes.tsx`; dashboard KPI cards memoized.

## Quality gates

Every phase: `npm run typecheck && npm run lint && npm run build` in `apps/web`.

## Known gaps (backend)

- No `Application.supplierId` — supplier link via AP + package master only
- No audit / API keys / integrations / roles admin endpoints
- No AI workspace endpoints
- No calendar entity — Operations Calendar is derived from tasks + bookings
- Today's Payments KPI has no date-scoped payments aggregate
