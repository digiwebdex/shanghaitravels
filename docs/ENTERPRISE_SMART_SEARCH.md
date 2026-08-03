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

---

# TravelOS V4.5.2 — Module Lookup Filters (Agent / Passport)

Two enterprise **Combobox** controls that live in the **module filter area** — inside the
list card, below the global header search — **not** in the global header. The global
`GlobalSmartSearch` / `CommandPalette` / ⌘K are **unchanged**.

## Layout

```
┌ Global header ────────────────────────────────────────────────┐
│  [ Global Smart Search (⌘K) ]              (unchanged)         │
└───────────────────────────────────────────────────────────────┘
   Module page card (Surface)
   ┌───────────────────────────────────────────────────────────┐
   │  [ Agent Name / Reference ]   [ Passport Number ]         │  ← ModuleLookupFilters row (16px gap)
   │  [ existing module search / filters ]                     │
   │  [ DataTable … ]                                           │
   └───────────────────────────────────────────────────────────┘
```

## Component

`apps/web/src/components/enterprise/ModuleLookupFilters.tsx` — one row, two comboboxes,
composed from the existing `ui/popover` + `ui/command` (cmdk) primitives and design tokens.
cmdk supplies arrow / Enter / Escape navigation; 250ms debounce; open-on-click (no typing
required); results virtualize via cmdk's list.

### Agent lookup
- **API:** `agentsApi.list({ q, limit })` — recent/available on open, debounced type-ahead.
- **Shows:** Agent Name · Agent Code · Phone (fields that exist on `Agent`).
- **On select:** records the agent filter in the URL (`?agent=<id>`) and fires `onAgentSelect`.
- **Width:** ~280px.

### Passport lookup
- **API:** `customersApi.intelligenceSearch(q)` (passport-first ranking) — the **same**
  endpoint the Global Smart Search uses; recent lookups first from `smartSearchHistory`.
- **Shows:** Customer Name · Passport Number · context subtitle (only what the API returns).
- **On select:** opens **Customer Intelligence (Customer 360)** — `navigate('/customers/:id')`.
- **Width:** ~260px.

## Placement
- Shared scaffold: `ListPageShell` gained an optional `lookupFilters` prop → renders the row
  at the top of the card. Enabled on **Visa, Ticketing, Hotels, Tour, Hajj**.
- Non-scaffold pages: dropped directly into **Customers, Finance › Invoices, CRM › Directory**.
- Other modules adopt it with one line (`lookupFilters` prop, or `<ModuleLookupFilters />`).

## Reuse strategy (no duplication)
- **No new search logic / APIs / hooks.** Reuses `agentsApi.list`, `customersApi.intelligenceSearch`,
  `smartSearchHistory`, and the existing `popover`/`command` primitives + tokens.
- **No changes** to GlobalSmartSearch, CommandPalette, CustomerIntelligencePanel, Customer 360,
  Booking 360, search ranking, keyboard shortcuts, or existing search behavior.
- **No backend / API / schema / RBAC / workflow changes.**

## Known limitation
The Agent control records its selection (`?agent=<id>`) and is ready to drive server-side
list filtering, but **does not yet reduce the module list** — that needs a backend `agentId`
filter on the list endpoints (out of scope here; a follow-up). The Passport control is fully
functional end-to-end.
