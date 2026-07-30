# UI Gap Analysis — Figma Design vs Implementation

**Audit date:** 2026-07-30  
**UI source of truth:** `figma-design/`  
**Implementations compared:** live public SPA (`assets/`), `visa-admin/`, Figma mock itself (no live ERP SPA)

**Legend**

| Status | Meaning |
|---|---|
| MATCH | Live UI closely follows Figma structure (rare) |
| PARTIAL | Some behavior exists; visuals/layout diverge |
| STOPGAP | Working alternate UI (visa-admin) — not Figma |
| MOCK | Exists only in figma-design with demo data |
| MISSING | Not implemented in any live surface |
| BLOCKED | Route intentionally 404 on production domain |

---

## 1. Cross-cutting UI findings

1. **No production build of `figma-design/` is deployed.** Live ERP staff UI is `visa-admin/` (vanilla).  
2. Figma uses **AED / Dubai HQ / multi-branch UAE** branding; product is **BDT / Dhaka / China-visa**. Pixel layout must be kept; **copy, currency, and branch defaults must be localized** without redesigning chrome.  
3. Every Figma module ships with **fabricated rows** in `data.ts`. Live modules must show empty states or real API data — never promote mocks.  
4. Figma Project Overview documents **Next.js routes and wrong API paths** — ignore those for implementation; use Nest contracts in `API_GAP_ANALYSIS.md`.  
5. nginx returns **404** for `/admin` and `/staff` on the live domain (blocks demo screens).  
6. Reports sidebar item points to `/admin/reports` but **`ReportsModule.tsx` does not exist** → `AdminPlaceholder`.  
7. `visa-admin` proves backend verticals but fails every pixel/brand check vs Figma AdminLayout.

---

## 2. Public website

| Screen | Figma route | Live | Gap |
|---|---|---|---|
| Home | `/` | PARTIAL | Live SPA present; China-focus patches historically applied; still not a clean rebuild from current figma-design + `/api/public/config` |
| About | `/about` | PARTIAL | Present in bundle; content fidelity unverified vs latest Figma |
| Services | `/services` | PARTIAL | Must be driven by `active_services` / public config — Figma is static cards |
| Visa Info | `/visa` | PARTIAL | China visa types needed; Figma may still show generic/Schengen-style content |
| Flights | `/flights` | PARTIAL | Must not show fake inventory; stopgap CTAs to enquiry |
| Tours / Tour Detail | `/tours` | PARTIAL | Residual demo packages risk |
| Blog / Article | `/blog` | MOCK/PARTIAL | CMS backend exists; public blog not confirmed wired to `CmsPage` |
| Inquiry | `/inquiry` | PARTIAL | Should POST `/api/public/intake` with serviceType/destination/direction |
| Payment | `/payment` | MOCK | No live payment gateway integration |
| Contact | `/contact` | PARTIAL | Static |

**Required rebuild outcomes**

- Drive nav/services from `GET /api/public/config` + `GET /api/public/countries`.  
- Enquiry form → `POST /api/public/intake`.  
- Optional passport autofill → `POST /api/public/ocr/scan` (when OCR approved).  
- Remove fabricated prices/availability.

---

## 3. Customer portal (`/portal/*`)

| Screen | Status | Gap |
|---|---|---|
| Login | PARTIAL | UI exists in public bundle; posts `/api/auth/login` → **legacy :4100**; no Nest customer-auth realm |
| Dashboard | MOCK | Demo applications; no customer-scoped Nest API |
| Apply | MOCK | Not creating real applications as authenticated customer |
| Documents | MOCK | No customer document API |
| Track | MOCK | CaseTimeline UI exists in Figma; no customer auth to load journey |
| Payment / Invoice | MOCK | Finance APIs are staff-scoped |
| Support | MOCK | Phase 2 in Figma inventory |

**Backend gap:** customer self-service auth + scoped APIs are **missing** (only public intake + public OCR).

---

## 4. Staff portal (`/staff/*`)

| Screen | Status | Gap |
|---|---|---|
| My Dashboard | BLOCKED + MOCK | Figma only; live `/staff` → 404 |
| Assigned Tasks | BLOCKED + MOCK | Backend `GET /tasks?mine=true` exists — UI not wired |
| Applications | BLOCKED + MOCK | Covered functionally by visa-admin Cases |
| Customers | BLOCKED + MOCK | Covered by visa-admin Customers |
| Calendar | MOCK | No calendar API |
| Internal Chat | MOCK | No chat backend |
| Documents | MOCK | Partial via application documents API |

**Decision:** Prefer consolidating staff work into **Admin ERP** (Figma `/admin`) rather than maintaining a separate `/staff` product surface, unless owner insists on both. Roadmap Phase A focuses on Admin.

---

## 5. Admin ERP (`/admin/*`) — primary gap

| Module | Figma | visa-admin | Nest API | Gap severity |
|---|---|---|---|---|
| Shell / AdminLayout | MOCK | STOPGAP (no sidebar) | Auth me | **Critical** — need Figma shell + auth |
| Dashboard | MOCK (AED charts) | MISSING | `/reports/operational`, `/finance/summary` | High |
| CRM | MOCK | MISSING | `/leads`, `/communications` | High |
| Customers | MOCK | STOPGAP | `/customers` | High (pixel) / Low (function) |
| Passports | MOCK | STOPGAP (in case) | `/passports`, `/ocr/*` | High |
| Visa | MOCK | STOPGAP | `/applications` + `/visa` | High |
| Air Ticketing | MOCK | STOPGAP (generic case) | detail upsert | Medium |
| Hotels | MOCK | STOPGAP | detail upsert | Medium |
| Transport | MOCK | STOPGAP | detail upsert | Medium |
| Tours | MOCK | STOPGAP | detail upsert | Medium |
| Hajj & Umrah | MOCK | STOPGAP | detail upsert | Medium |
| Student | MOCK | STOPGAP | detail upsert | Medium |
| Medical | MOCK | STOPGAP | detail upsert | Medium |
| Immigration | MOCK | STOPGAP | detail upsert | Medium |
| Insurance | MOCK | STOPGAP | detail upsert | Medium |
| Work / Manpower | *not a dedicated Figma module* | STOPGAP (service type) | `WorkDetail` | Medium — add Figma-aligned module or visa subflow |
| Corporate Clients | MOCK | MISSING | `/corporate-clients` | High |
| Suppliers | MOCK | MISSING | `/suppliers` | High |
| Case Journey Map | MOCK | PARTIAL (timeline in case) | `/applications/:id/journey` | Medium |
| Accounting & Finance | MOCK | PARTIAL (invoice only) | invoices/payments/expenses/accounts | High |
| Wallet & Commission | MOCK | MISSING | agents/commissions/wallet | High |
| HR & Payroll | MOCK | MISSING | `/employees`, `/payroll` | Medium |
| Tasks & Workflow | MOCK | MISSING | `/tasks`, workflow templates | High |
| Reports & BI | **MISSING FILE** | MISSING | `/reports/operational`, `/finance/summary` | High — implement from Figma patterns |
| CMS | MOCK | MISSING | `/cms/pages` | Medium |
| Notifications | MOCK | MISSING | `/notifications` | Medium |
| Download Center | MOCK | MISSING | documents filtered | Low |
| Settings | MOCK | MISSING | `/settings`, `/workflow/templates` | High |
| Tablet / PWA / Overview | Showcase only | N/A | N/A | Defer (meta screens) |

### Pixel / UX deltas (visa-admin vs Figma Admin)

| Element | Figma | visa-admin |
|---|---|---|
| Sidebar | Dark `#0D1117`, amber active, module dots | Top header + 3 tabs |
| Topbar | Search ⌘K, branch switcher, notifs, quick actions | Name + logout only |
| Typography | Dense 10–11px admin scale | System UI 14px |
| Color tokens | Amber/slate admin | Red accent `#c8102e` on navy |
| Case UI | Module-specific pipelines/kanban | Single generic case page |
| Empty states | Rich mock tables | Real empty / real rows |
| DemoBadge | Spec required; not in Figma export | N/A (all live) |

---

## 6. Corporate portal (`/corporate/*`)

All 6 screens = **MOCK**. Backend has staff-managed `CorporateClient` only — **no corporate user auth**. Gap: entire self-service portal deferred (security design).

---

## 7. Agent portal (`/agent/*`)

| Screen | Figma | Backend `/portal/agent` | Gap |
|---|---|---|---|
| Login / shell | MOCK | Auth endpoints live | Need Figma UI wired to agent cookies |
| Dashboard | MOCK | `GET .../dashboard` | Wire KPIs (BDT) |
| Profile | MOCK | `GET .../me` | Partial fields |
| Wallet | MOCK | `GET .../wallet` | Wire |
| Passengers | MOCK | MISSING API | Need design decision |
| New Booking / Bookings | MOCK | cases list/create | Wire |
| Ledger | MOCK | wallet txns | Map to ledger UI |
| Commission | MOCK | `GET .../commissions` | Wire |
| Downloads | MOCK | MISSING | Low |

---

## 8. Supplier portal (`/supplier/*`)

All screens = **MOCK**. Backend: staff `Supplier` CRUD only — **no supplier login**. Full portal deferred.

---

## 9. Mobile / PWA showcase

`/mobile` and `/admin/pwa`, `/admin/tablet` are design showcases. Not production apps. Defer until desktop ERP is live; then extract responsive patterns.

---

## 10. Component reuse opportunities (from Figma)

Must reuse rather than rebuild:

- `src/app/components/ui/*` (shadcn)  
- `AdminLayout` / portal layouts  
- `admin/shared/CaseTimeline.tsx`, `PipelineKanban.tsx`  
- `shared/RouteStatusTag.tsx`  
- Theme tokens in `src/styles/theme.css` (adapt currency labels, not structure)

---

## 11. Summary counts (approx.)

| Category | Screens |
|---|---|
| Figma screens inventoried | ~70 |
| Live + Figma-faithful | ~0 admin; public PARTIAL |
| Functionally covered by visa-admin | ~1 composite desk (customers/cases/staff) |
| Mock-only | Majority |
| Blocked on prod domain | `/admin/*`, `/staff/*` |

**Bottom line:** UI gap is primarily an **integration + productionization** problem, not a missing visual design. Build from `figma-design`, strip mocks, bind Nest APIs, localize BD/BDT.
