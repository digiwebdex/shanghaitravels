# Shanghai Travels ERP (TravelOS) — Project Audit

**Audit date:** 2026-07-30  
**Auditor role:** Lead Software Architect / Technical Product Manager  
**Status:** READ-ONLY audit — no application code modified  
**Verdict:** Backend is largely built and production-deployed; production-ready Figma-faithful frontend is largely missing. Current staff UI is a functional stopgap, not the design system.

---

## 1. Executive summary

Shanghai Travels ERP (“TravelOS”) is a **manual-fulfilment travel agency operating system** (no GDS/inventory APIs). The Application record is the **case spine**; every service (visa, air, hotel, …) is a thin detail table hanging off that spine, with workflow stages copied from editable templates.

| Layer | Location | Maturity |
|---|---|---|
| UI source of truth | `figma-design/` (Figma Make export) | Complete mock UI (~70 screens); **100% demo data**; no live API |
| Live public website | `/var/www/ShanghaiTravels/{index.html,assets/}` | Deployed Vite SPA; partial `/api/public` wiring; residual demo content |
| Staff stopgap UI | `visa-admin/` (vanilla HTML/JS) | **Working** against Nest ERP via `/api2`; not pixel-matched to Figma |
| ERP API (source) | `/opt/shanghai-erp-api` (NestJS + Prisma) | Phases 1–8 + OCR + agent portal **built**; staging `:4201` |
| ERP API (prod) | `/opt/st-erp-api` (`dist/` only) | Live on `:4200`; DB `st_erp_prod` (~55 tables, real but sparse data) |
| Legacy auth API | `/opt/shanghaitravels-api` (Express + `users.json`) | Still serves live `/api/` until auth cutover |
| Product specs | `/root/st-erp-frontend-spec-phase*.md` + Figma Project Overview | Authoritative backend contracts + phased UI scope |

**Critical constraint (owner directive 2026-07-25):** prove the **visa vertical end-to-end with real data** before widening UI; auth cutover is **held** until admin UI works against `/api2`.

---

## 2. What exists where

### 2.1 In this workspace (`/var/www/ShanghaiTravels`)

```
ShanghaiTravels/
├── index.html + assets/          # Live public site (built SPA)
├── visa-admin/index.html         # Staff Service Desk stopgap (build 2026-07-28d)
├── visa-admin-staging/           # Mirror of visa-admin
├── figma-design/                 # ONLY UI source of truth (Vite/React/Tailwind/shadcn)
├── docs/                         # This audit package
├── favicon.png, og-image.jpg, hero-*, robots.txt, sitemap.xml
```

There is **no** NestJS source, Prisma schema, or React admin source tree inside the workspace except the Figma mock. Backend source of truth is **outside** the web root (see §2.2).

### 2.2 Outside the workspace (operational)

| Path | Role |
|---|---|
| `/opt/shanghai-erp-api` | NestJS **source of truth** (`src/`, `prisma/`); also runs staging |
| `/opt/st-erp-api` | Prod runtime (`dist/` + `.env`); do not edit source here |
| `/opt/shanghaitravels-api` | Legacy Express auth on `:4100` |
| `/etc/nginx/sites-enabled/shanghaitravels` | Routes site, `/api/`, `/api2/`, `/api/public/`, `/visa-admin/` |
| `/root/st-erp-frontend-spec-*.md` | Frontend contracts per phase |
| `/root/st-visa-vertical-admin-brief.md` | Visa E2E build brief |
| `/root/st-erp-cutover/` | Auth cutover runbook (flip/rollback) |

---

## 3. Product specification sources (TravelOS)

The “complete product specification” is distributed across:

1. **Figma Project Overview** (`figma-design/src/admin/project-overview/ProjectOverview.tsx`) — screen inventory, MVP / Phase 2 / Phase 3 tagging, design tokens.
2. **Backend phase memory** (`/root/.claude/.../st-erp-project.md`) — Application spine, cash-basis finance, no GDS, B2C intake → cases.
3. **Frontend phase specs** (`/root/st-erp-frontend-spec-phase1.md` … `phase7-8.md`, OCR/agent).
4. **RBAC audit** (`/root/st-erp-rbac-audit-2026-07-23.md`) — role × permission matrix (verified on staging).
5. **Business focus** — China visa–first operations; config-driven `active_services`; currency **BDT** (minor units / poisha), not AED as in Figma mocks.

### Core product principles (must preserve)

- **Manual entry only** — no fabricated flight/hotel inventory; quote via enquiry/case.
- **Application = case spine** — stages from WorkflowTemplate; soft-delete only.
- **Money = integer minor units** (poisha); single currency BDT; cash-basis ledger.
- **RBAC fail-closed** — UI must hide controls the role cannot use; server is the real boundary.
- **No localStorage tokens** — httpOnly cookies only (`st_access` / `st_refresh`; agent: `st_agent`).
- **DemoBadge rule** — staff must never confuse mock screens with live modules.
- **OCR confirm-before-write** — scan proposes fields; human applies.

---

## 4. Architecture snapshot

```
Browser
  ├─ Public site (Vite SPA) ──► /api/public/* ──► Nest ERP :4200
  ├─ /visa-admin/ (vanilla) ──► /api2/* ───────► Nest ERP :4200  (pre-cutover)
  ├─ Figma design (local only) — mock data, no deploy path in nginx
  └─ (future) Figma-based React ERP ──► /api/* after cutover

Nginx
  /api/public/ → :4200
  /api2/       → :4200  (rewrite to /api/)
  /api/        → :4100  LEGACY Express (login still here for public site)
  /admin,/staff → 404 (blocks Figma demo routes on live domain)
  /visa-admin/ → static no-store
```

---

## 5. Frontend architecture review

### 5.1 Figma design (`figma-design/`)

| Aspect | Finding |
|---|---|
| Stack | React 18, Vite 6, React Router 7, Tailwind 4, Radix/shadcn, Lucide, Recharts, Motion |
| Portals | Public, Customer Portal, Staff, Admin ERP, Corporate, Agent, Supplier, Mobile showcase |
| Screen count | ~70 routes (see Project Overview) |
| Data | Local `data.ts` mocks everywhere — AED, Dubai HQ, Schengen/Dubai demo cases |
| Auth | None |
| API | None (Project Overview even documents a **Next.js** `apps/api` layout that does **not** match the live Nest API) |
| Responsive | Admin collapses sidebar &lt;1024px; mobile showcase routes exist |
| Production readiness | **Design reference only** — must be rewired to Nest contracts + BDT/BD locale |

### 5.2 Live public site

- Built bundle `assets/index-Mn2yDS4Z.js` (~2.4 MB).
- References `/api/public` and `/api/auth/*`.
- Auth still hits legacy `:4100` (cutover pending).
- China-focused stopgap patches applied historically; residual generic/demo content remains in deep routes.

### 5.3 `visa-admin/` (working stopgap)

Single-file SPA (~36 KB) wired to `/api2` with cookie auth. Capabilities:

- Login / logout / change-password / `mustChangePassword` gate  
- Customers CRUD (create + edit)  
- Cases for **all 13 service types** + direction + 199 countries  
- Stage advance, notes, assign, approve, reject  
- Passport manual + OCR scan UI  
- Document upload  
- Invoice create + issue  
- Staff user management (`user:manage`)

**Does not match Figma** (layout, typography, sidebar, modules, brand chrome). Preserve behavior; replace UI with Figma-faithful React.

---

## 6. Backend architecture review

| Aspect | Finding |
|---|---|
| Framework | NestJS 11, Prisma 6, Postgres, Argon2, JWT cookies |
| Prefix | Global `api` |
| Guards | Global `JwtAuthGuard` + `PermissionsGuard`; `@Public()` escape |
| Modules | Auth, Customers, Applications, Workflow, Tasks, Finance, Notifications, Public, Partners, HR, CRM, Admin, OCR, Agent Portal |
| Storage | Local filesystem (`STORAGE_LOCAL_DIR`); R2 swap planned |
| Notifications | Outbox model; email/WhatsApp adapters **not wired** (need owner SMTP/WA creds) |
| OCR | Gemini provider; gated by `OCR_APPROVED` (currently off → 503) |
| Agent portal | Separate JWT secret + `st_agent` cookie; agentId-scoped queries |
| Tests | Ad-hoc smoke/RBAC scripts historically; no Jest suite in package.json |
| Trust proxy | Rate limits use `clientIp()` (CF-Connecting-IP) — correct |

---

## 7. Database review (prod `st_erp_prod`)

- **~55 user tables** after migrations 001–011.
- **Enums:** ServiceType (13), CaseStatus, CasePriority, StageStatus, finance/OCR/commission enums, CaseDirection.
- **Sparse but real data (audit snapshot):** users 17, customers 5, applications 8, invoices 2, permissions 55, workflow templates 15, countries 199.
- Soft-delete columns on key entities; AuditLog present.
- Agent portal tables (`AgentUser`, `AgentRefreshToken`) + `Application.agentId` live.

Full gap detail → `DATABASE_GAP_ANALYSIS.md`.

---

## 8. Auth & RBAC review

| Concern | Status |
|---|---|
| Staff cookie auth (Nest) | Implemented; accessible via `/api2` |
| Live `/api/auth` | Still legacy Express `:4100` — **cutover held** |
| Refresh cookie path | Scoped to `/api/auth` → **refresh fails on `/api2`** (15 min re-login quirk) |
| Roles | super_admin, general_manager, office_incharge, accounts_manager, marketing_manager, visa_consultant, visa_executive |
| Permissions | 55 keys; money actions accounts_manager + super_admin only; `payment:refund` independent |
| Agent auth | Separate realm; cannot call staff routes (verified historically) |
| Customer portal auth | **Not built** (portal UI in Figma is mock) |
| Corporate / supplier self-service auth | **Not built** (deferred security design) |

---

## 9. Routing review

| Surface | Routes | Live access |
|---|---|---|
| Public site | `/`, `/visa`, `/flights`, … | Live |
| Customer portal | `/portal/*` | Present in public bundle (mock/partial); nginx does not block |
| Admin Figma routes | `/admin/*` | **404** on live domain (intentional) |
| Staff Figma routes | `/staff/*` | **404** on live domain |
| Service Desk | `/visa-admin/` | Live stopgap |
| Agent Figma | `/agent/*` | In design only; backend portal API exists under `/api2/portal/agent` |

---

## 10. Responsive / performance / security

| Area | Finding |
|---|---|
| Responsive | Figma admin collapses &lt;lg; visa-admin is basic mobile-usable forms; public site responsive |
| Performance | Public JS ~2.4 MB single chunk — needs code-splitting when rebuilding from Figma |
| Security headers | nginx: nosniff, SAMEORIGIN, Referrer-Policy |
| Secrets | Gemini key file-based; JWT secrets in `.env`; backup age-encrypted to gdrive |
| PII | Passport OCR storage + retention cleanup **not** implemented |
| SSH | Key-only (hardened 2026-07-25) |

---

## 11. Highest-risk gaps (priority order)

1. **No production Figma-faithful ERP frontend** — design is mock; staff use vanilla stopgap.  
2. **Auth cutover unfinished** — dual APIs; refresh broken on `/api2`.  
3. **Figma ↔ Nest contract mismatch** — Figma docs wrong paths (`/api/visa/applications`, Next.js layout, AED).  
4. **Customer / corporate / supplier portals** — UI only; auth/API incomplete or absent.  
5. **Notification delivery** — outbox without SMTP/WhatsApp.  
6. **OCR privacy gate** — feature built but disabled; no retention job.  
7. **Reports module** — sidebar entry in Figma; **no `ReportsModule.tsx`**; falls through to placeholder.  
8. **Locale/brand drift** — Figma = Dubai/AED; product = Dhaka/BDT/China visa.

---

## 12. What must be preserved

- All Nest API contracts currently used by `visa-admin` and `/api/public`.  
- Working visa/all-service case flow, invoice issue, staff management, document upload.  
- Soft-delete semantics, money minor units, RBAC matrix.  
- Nginx carve-outs for `/api/public` and `/visa-admin`.  
- Cutover kit and backup regime.

---

## 13. Related documents

| Doc | Purpose |
|---|---|
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Tree + ownership map |
| [UI_GAP_ANALYSIS.md](./UI_GAP_ANALYSIS.md) | Page-by-page Figma vs implementation |
| [BACKEND_GAP_ANALYSIS.md](./BACKEND_GAP_ANALYSIS.md) | Module feature gaps |
| [DATABASE_GAP_ANALYSIS.md](./DATABASE_GAP_ANALYSIS.md) | Schema coverage vs product |
| [API_GAP_ANALYSIS.md](./API_GAP_ANALYSIS.md) | Endpoint inventory + gaps |
| [MISSING_FEATURES.md](./MISSING_FEATURES.md) | Consolidated backlog |
| [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) | Phased delivery plan |

---

## 14. Recommendation

**Do not rewrite the backend.** Treat `/opt/shanghai-erp-api` as the API source of truth and `figma-design/` as the UI source of truth. Build a production React app that:

1. Copies Figma layout/components pixel-faithfully.  
2. Replaces every `data.ts` mock with Nest `/api` (or `/api2` pre-cutover) calls.  
3. Localizes to BDT / Bangladesh / China-visa defaults.  
4. Ships module-by-module with DemoBadge until each module is live.  
5. Keeps `visa-admin` available until the Figma ERP covers the proven vertical.

Await owner approval of this audit package before any implementation phase.
