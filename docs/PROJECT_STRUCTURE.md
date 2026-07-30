# Project Structure — Shanghai Travels / TravelOS

**Audit date:** 2026-07-30  
**Scope:** Workspace + linked runtime systems that the product depends on.

---

## 1. Workspace tree (`/var/www/ShanghaiTravels`)

```
ShanghaiTravels/
├── docs/                          # Audit & roadmap (this package)
│   ├── PROJECT_AUDIT.md
│   ├── PROJECT_STRUCTURE.md
│   ├── UI_GAP_ANALYSIS.md
│   ├── BACKEND_GAP_ANALYSIS.md
│   ├── DATABASE_GAP_ANALYSIS.md
│   ├── API_GAP_ANALYSIS.md
│   ├── MISSING_FEATURES.md
│   └── IMPLEMENTATION_ROADMAP.md
│
├── figma-design/                  # UI SOURCE OF TRUTH (Figma Make export)
│   ├── package.json               # Vite + React + Tailwind 4 + Radix
│   ├── vite.config.ts
│   ├── guidelines/Guidelines.md   # Empty template
│   ├── default_shadcn_theme.css
│   └── src/
│       ├── main.tsx
│       ├── app/
│       │   ├── App.tsx
│       │   ├── routes.ts          # Full route table (~70 screens)
│       │   └── components/
│       │       ├── ui/            # shadcn primitives
│       │       └── figma/
│       ├── styles/                # fonts, theme, globals, tailwind
│       ├── components/Layout.tsx  # Public site chrome
│       ├── pages/                 # Public website pages
│       ├── portal/                # Customer portal
│       ├── staff/                 # Staff portal
│       ├── admin/                 # Admin ERP modules
│       ├── corporate/             # Corporate portal
│       ├── agent/                 # Agent portal
│       ├── supplier/              # Supplier portal
│       ├── mobile/                # PWA/mobile showcase
│       └── shared/                # RouteStatusTag, etc.
│
├── visa-admin/
│   └── index.html                 # Working Service Desk stopgap (vanilla JS)
├── visa-admin-staging/
│   └── index.html                 # Staging mirror
│
├── index.html                     # Live public site shell
├── assets/                        # Built public SPA (JS/CSS/logos)
├── favicon.png
├── og-image.jpg
├── hero-shanghai2.mp4
├── hero-poster-sh2.jpg
├── robots.txt
└── sitemap.xml
```

### Ownership rules

| Path | Owner / rule |
|---|---|
| `figma-design/` | **UI source of truth** — pixel reference; never redesign |
| `visa-admin/` | Preserve behavior until Figma ERP replaces it |
| `assets/`, `index.html` | Deploy targets for public site rebuild |
| `docs/` | Living documentation — update each phase |

---

## 2. Figma design module map

### 2.1 Public website (`src/pages/`)

| File | Route |
|---|---|
| Home.tsx | `/` |
| About.tsx | `/about` |
| Services.tsx | `/services` |
| Visa.tsx | `/visa` |
| Flights.tsx | `/flights` |
| Tours.tsx, TourDetail.tsx | `/tours`, `/tours/:id` |
| Blog.tsx, BlogArticle.tsx | `/blog`, `/blog/:slug` |
| Inquiry.tsx | `/inquiry` |
| Payment.tsx | `/payment` |
| Contact.tsx | `/contact` |

### 2.2 Customer portal (`src/portal/`)

Login, Dashboard, Apply, Documents, Track, PortalPayment, Invoice, Support + `PortalLayout`, `data.ts`.

### 2.3 Staff portal (`src/staff/`)

MyDashboard, AssignedTasks, Applications, Customers, StaffCalendar, InternalChat, StaffDocuments + layout/data.

### 2.4 Admin ERP (`src/admin/`)

**Services:** CRM, Customers, Passports, Visa, Ticketing, Hotels, Transport, Tours, Hajj, Student, Medical, Immigration, Insurance, Corporate Clients, Suppliers.

**Operations:** Case Journey, Accounting, Wallet/Commission, HR, Tasks, Reports *(route exists; component missing → placeholder)*, CMS, Notifications, Downloads, Settings, Tablet showcase, Project Overview, PWA.

**Shared admin:** `AdminLayout`, `AdminDashboard`, `AdminPlaceholder`, `shared/CaseTimeline`, `shared/PipelineKanban`.

### 2.5 Other portals

| Portal | Path | Screens |
|---|---|---|
| Corporate | `src/corporate/` | Dashboard, Employees, Applications, Approvals, Credit, Reports |
| Agent | `src/agent/` | Dashboard, Profile, Wallet, Passengers, Book, Bookings, Ledger, Commission, Downloads |
| Supplier | `src/supplier/` | Dashboard, Requests, Services, Invoices, Payments, Performance, Contracts |
| Mobile | `src/mobile/` | AdminApp, AgentApp, CustomerApp, StaffApp, MobileShowcase |

---

## 3. Backend source tree (`/opt/shanghai-erp-api`) — outside workspace

```
/opt/shanghai-erp-api/
├── README-SOURCE-OF-TRUTH.md
├── package.json
├── nest-cli.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/          # 001 … 011
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── rbac.ts              # JwtAuthGuard, PermissionsGuard, @Public, @Permissions
│   ├── prisma.*
│   ├── auth/
│   ├── customers/
│   ├── applications/        # Case spine + journey + detail upsert
│   ├── workflow/
│   ├── tasks/
│   ├── finance/
│   ├── notifications/
│   ├── public/              # config, countries, intake
│   ├── partners/            # suppliers, agents, commissions, corporate
│   ├── hr/
│   ├── crm/
│   ├── admin/               # CMS, settings, reports
│   ├── ocr/
│   ├── agent-portal/
│   ├── documents.controller.ts
│   ├── passports.controller.ts
│   ├── users.controller.ts
│   ├── app-documents.controller.ts
│   ├── reference.controller.ts
│   ├── storage/
│   └── util/client-ip.ts
├── dist/                    # Built output (synced to prod)
└── seed-*.cjs               # Operational seed helpers
```

**Prod runtime:** `/opt/st-erp-api` — `dist/` + `.env` only (`README-PROD-BUILD-DO-NOT-EDIT.md`).

**Legacy auth:** `/opt/shanghaitravels-api` — Express, `data/users.json`, port 4100.

---

## 4. Runtime topology

| Service | Unit / process | Bind | DB |
|---|---|---|---|
| ERP prod | `st-erp-api` | `127.0.0.1:4200` | `st_erp_prod` |
| ERP staging | `st-erp-api-staging` | `127.0.0.1:4201` | `st_erp_staging` |
| Legacy auth | `shanghaitravels-api` | `127.0.0.1:4100` | file `users.json` |
| Static site | nginx | `:443` | — |

Nginx site: `/etc/nginx/sites-enabled/shanghaitravels`  
Domain: `shanghaitravels.com.bd` (Cloudflare).

---

## 5. Spec & ops artifacts (`/root`)

| File / dir | Purpose |
|---|---|
| `st-erp-frontend-spec-phase1.md` … `phase7-8.md` | Frontend contracts |
| `st-erp-frontend-spec-ocr-agent.md` | OCR + agent portal UI |
| `st-visa-vertical-admin-brief.md` | Visa E2E proof path |
| `st-erp-rbac-audit-2026-07-23.md` | Permission matrix |
| `st-china-visa-focus.md` / website handoffs | Public site reorientation |
| `st-erp-cutover/` | Auth flip / rollback runbook |
| `st-erp-backup` cron | Encrypted DB backups → gdrive |

---

## 6. Intended future monorepo layout (recommended)

When implementation starts, co-locate UI with docs in-workspace; keep API edits in `/opt/shanghai-erp-api` (or later pull API into a monorepo). Proposed:

```
ShanghaiTravels/
├── docs/
├── figma-design/                 # frozen reference (or symlink)
├── apps/
│   ├── web/                      # Production React app (from figma-design)
│   └── visa-admin/               # Stopgap preserved until cutover
└── (API remains /opt until explicitly migrated)
```

Do **not** invent a Next.js `apps/api` to match Figma Project Overview comments — live API is NestJS.

---

## 7. Deploy paths

| Artifact | Build | Deploy target |
|---|---|---|
| Public + future ERP SPA | Vite build | `/var/www/ShanghaiTravels/` |
| Service Desk | Edit `visa-admin/index.html` | same path (no build) |
| ERP API | `npm run build` in `/opt/shanghai-erp-api` | rsync `dist/` → `/opt/st-erp-api` + `systemctl restart st-erp-api` |
| Migrations | `prisma migrate deploy` | staging first, then prod |

---

## 8. Git status

Workspace `/var/www/ShanghaiTravels` is **not** currently a git repository. Backend `/opt/shanghai-erp-api` also lacks an in-tree `.git` on this host. Source control for Windows builds historically lived on the owner’s machine (`F:\Download\shanhaitravels`). Establishing git for the production React app is a Phase 0 roadmap item.
