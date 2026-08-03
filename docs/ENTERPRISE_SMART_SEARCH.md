# TravelOS V4.4 — Enterprise Global Customer Intelligence Search

One shared smart search for the ERP shell and portal-scoped search for customer / agent / corporate portals. Results open a **360° intelligence dashboard**, not a plain table.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  AdminLayout header / ⌘K  →  GlobalSmartSearch              │
│  (shared across Dashboard, CRM, Bookings, Finance, Ops, …)  │
└───────────────────────────┬─────────────────────────────────┘
                            │ debounce 220ms
                            ▼
              GET /customers/intelligence/search?q=
                            │ priority-ranked hits
                            ▼
              GET /customers/:id/intelligence
                            │ permission-sliced 360° bundle
                            ▼
              CustomerIntelligencePanel (dashboard cards)
```

| Layer | Location |
|-------|----------|
| API client | `apps/web/src/lib/services.ts` → `customersApi.intelligence*` |
| History / favorites | `apps/web/src/lib/smartSearchHistory.ts` (localStorage) |
| ERP UI | `apps/web/src/components/search/GlobalSmartSearch.tsx` |
| 360° panel | `apps/web/src/components/search/CustomerIntelligencePanel.tsx` |
| Shell entry | `CommandPalette` re-export (AdminLayout unchanged) |
| Portal UI | `PortalSmartSearch` + `portalSmartSearch.ts` loaders |
| Backend | Nest `CustomersService.intelligenceSearch` / `intelligenceProfile` / `intelligenceReports` |

**No schema, auth, RBAC, booking workflow, finance logic, OCR engine, theme, or navigation IA changes.**

## Indexed fields & search priority

Backend ranks hits by priority (lower = better). Deduplicates to best match per entity.

| Priority | Kind | Typical match |
|----------|------|----------------|
| 1 | Passport number | Exact (case-insensitive) |
| 2 | NID | Exact / contains |
| 3 | Customer ID / code | Exact / prefix |
| 4 | Booking ID / reference | Exact / contains |
| 5 | Visa file number | Contains |
| 6 | Mobile | Digits normalize |
| 7 | Email | Contains |
| 8 | Customer name | Contains |
| 9 | Agent name | Contains |
| 10 | Corporate name | Contains |

Queries use existing Prisma indexes on passport, customer code, application reference, phone, email where present. Target **&lt; 500ms** for typical branch-scoped lookups; response includes `tookMs`.

## 360° profile slices

Returned by `GET /customers/:id/intelligence` (branch-scoped):

- **Customer** — photo placeholder, identity, contact, VIP/regular tier, status  
- **Bookings** — totals, current, per-service status, upcoming / history  
- **Finance** — outstanding, paid, refund, invoices, payments *(null without finance permission)*  
- **Documents** — categories, OCR confidence / verification *(null without documents permission)*  
- **CRM** — leads, opportunities, sales executive, last contact  
- **Operations** — stage, officer, pending tasks, urgent flags, workflow  
- **Agent / Corporate** — linked partner summary  
- **Communications** — emails / WhatsApp / SMS / notes  
- **Timeline** — chronological events  
- **Duplicate** — passport/booking/doc counts (warn before creating duplicates)

## Permissions

| Actor | Behaviour |
|-------|-----------|
| Staff with `customer:read` | Full intelligence search + profile |
| Finance-only | Finance slice only when finance permission granted server-side |
| Agent portal | Own customers / cases / docs via portal APIs |
| Corporate portal | Own employees / bookings via portal APIs |
| Customer portal | Own bookings / passports / documents |
| Super Admin | Everything (existing RBAC) |

Frontend hides null slices; portals never call staff intelligence routes.

## Performance

- **Debounce:** 220ms on query input  
- **Profile cache:** in-memory Map, 60s TTL per customer id  
- **Search history:** localStorage recent / pinned / favorites + most-searched counters  
- **Reports:** `GET /customers/intelligence/reports` (duplicate / expired / expiring / pending passports); most-searched is client-tracked  

## Quick actions

From the 360 panel: open customer / booking / invoices / docs, upload document, create booking / invoice / task, assign officer, print summary, one-click call / WhatsApp / email.

## Duplicate detection

Passport hits may include `duplicateHint`. Profile banner shows existing passport / booking / document counts and instructs operators **not** to create a duplicate customer.

## Portals

`PortalShell` exposes ⌘K + search trigger. Loaders in `portalSmartSearch.ts` filter **only** portal-owned records.
