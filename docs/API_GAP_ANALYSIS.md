# API Gap Analysis — TravelOS

**Audit date:** 2026-07-30  
**Base (prod ERP):** `https://shanghaitravels.com.bd/api2/...` → Nest `:4200` `/api/...`  
**Public (already on Nest):** `/api/public/...`  
**Legacy (pre-cutover):** `/api/...` → Express `:4100` (auth/users file store)

All Nest routes use global prefix `api`. Cookie auth unless `@Public()`.

---

## 1. Live Nest endpoint inventory

### 1.1 Auth — `/api/auth`

| Method | Path | Auth | Perm |
|---|---|---|---|
| POST | `/auth/login` | Public | — |
| POST | `/auth/refresh` | Public | — |
| POST | `/auth/logout` | Public | — |
| GET | `/auth/me` | Staff | — |
| POST | `/auth/change-password` | Staff | — |

### 1.2 Customers — `/api/customers`

| Method | Path | Perm |
|---|---|---|
| GET | `/customers` | customer:read |
| GET | `/customers/:id` | customer:read |
| POST | `/customers` | customer:create |
| PATCH | `/customers/:id` | customer:update |
| DELETE | `/customers/:id` | customer:delete |

### 1.3 Applications — `/api/applications`

| Method | Path | Perm |
|---|---|---|
| GET | `/applications` | application:read |
| GET | `/applications/:id` | application:read |
| GET | `/applications/:id/journey` | application:read |
| POST | `/applications` | application:create |
| PATCH | `/applications/:id` | application:update |
| POST | `/applications/:id/advance-stage` | application:advance-stage |
| POST | `/applications/:id/note` | application:note |
| POST | `/applications/:id/assign` | application:assign |
| POST | `/applications/:id/approve` | application:approve |
| DELETE | `/applications/:id` | application:delete |
| PUT | `/applications/:id/visa` | application:update |
| PUT | `/applications/:id/detail/:serviceType` | application:update |

### 1.4 Documents / passports / users / reference

| Method | Path | Perm |
|---|---|---|
| GET/POST | `/applications/:id/documents` | document:read / document:upload |
| GET | `/documents/passports` | document:read-passport |
| POST | `/passports` | ocr:apply |
| GET/POST/PATCH | `/users` | user:manage |
| GET | `/reference/countries` | staff auth |
| GET | `/reference/airlines` | staff auth |
| GET | `/reference/services` | staff auth |

### 1.5 Workflow / tasks

| Method | Path | Perm |
|---|---|---|
| CRUD + activate | `/workflow/templates` | settings:manage |
| CRUD | `/tasks` | task:read / task:manage |

### 1.6 Finance

| Method | Path | Perm |
|---|---|---|
| GET/POST/DELETE + issue | `/invoices` | invoice:amount:read / invoice:manage |
| POST | `/payments` | payment:record |
| POST | `/payments/refund` | payment:refund |
| GET/POST | `/expenses` | expense:manage |
| GET/POST + ledger | `/accounts` | bank:read / ledger:manage |
| GET | `/finance/summary` | financial-report:read |

### 1.7 Public

| Method | Path | Notes |
|---|---|---|
| GET | `/public/config` | Active services, destinations |
| GET | `/public/countries` | 199 countries |
| POST | `/public/intake` | Rate-limited; creates Customer+Application |
| POST | `/public/ocr/scan` | Public OCR (gated by OCR_APPROVED) |

### 1.8 Partners

Suppliers, Agents (+ wallet), Commissions (approve/pay), Corporate-clients — full CRUD as in controllers.

### 1.9 HR / CRM / Admin

Employees + salary + payroll; Leads; Communications; CMS pages; Settings; Reports operational; Notifications list/process.

### 1.10 OCR (staff)

`POST /ocr/scan`, `GET /ocr`, `GET /ocr/:id`, `POST /ocr/:id/apply`, `POST /ocr/process-pending`.

### 1.11 Agent portal — `/api/portal/agent`

login/refresh/logout (public); me; change-password; dashboard; cases CRUD-ish; commissions; wallet; ocr/scan.  
Staff invite: `POST /api/agent-accounts/:agentId`.

---

## 2. Contract mismatches (Figma Project Overview vs Nest)

Figma `ProjectOverview` documents incorrect paths — **do not implement these**:

| Figma-documented | Actual Nest |
|---|---|
| `GET /api/crm/leads` | `GET /api/leads` |
| `GET /api/visa/applications` | `GET /api/applications?serviceType=visa` |
| `GET /api/accounting/invoices` | `GET /api/invoices` |
| `GET /api/staff/applications` | `GET /api/applications` (+ filters) |
| Next.js `apps/api/...` modules | Nest modules under `/opt/shanghai-erp-api/src` |

Frontend specs in `/root/st-erp-frontend-spec-*.md` are the **correct** contracts.

---

## 3. Coverage vs Figma screens

| UI need | API coverage |
|---|---|
| Admin login / me / RBAC gates | Covered |
| Customer mgmt | Covered |
| Visa + all service case UIs | Covered |
| Case journey timeline | Covered |
| Finance module | Covered (staff) |
| Wallet/commission admin | Covered |
| HR / CRM / CMS / Settings | Covered |
| Agent portal screens | Mostly covered; passengers/downloads missing |
| Customer portal | **Not covered** (no customer auth/APIs) |
| Corporate portal | **Not covered** |
| Supplier portal | **Not covered** |
| Internal chat | **Not covered** |
| Staff calendar | **Not covered** |
| Public Payment page (gateway) | **Not covered** |
| Global search ⌘K | **Not covered** (compose client-side from list endpoints) |
| Notification center read/unread | Partial (outbox list) |
| Document verify actions | Thin / unclear dedicated verify route |
| Reject / embassy-submit dedicated routes | Partial (perms exist; prefer explicit endpoints when wiring) |

---

## 4. Gaps to add (when UI requires)

### Priority A — needed soon for Figma admin parity

| API | Reason |
|---|---|
| Harden document download (auth streaming) | Admin document viewer |
| Explicit `POST /applications/:id/reject` | Match perm + cleaner than PATCH |
| `POST /applications/:id/submit-to-embassy` | Match seeded perm |
| `POST /documents/:id/verify` | Document checklist UX |
| Notifications: mark read / my inbox | Topbar bell in AdminLayout |

### Priority B — portals

| API | Reason |
|---|---|
| Customer auth + scoped cases/docs/invoices | `/portal/*` |
| Corporate auth + employees/approvals/credit | `/corporate/*` |
| Supplier auth + requests/invoices | `/supplier/*` |
| Agent passengers CRUD | Figma Passengers screen |

### Priority C — later

| API | Reason |
|---|---|
| Payment provider webhooks | Online pay |
| Chat threads | Staff Internal Chat |
| Calendar events | Staff Calendar |
| PDF invoice render | Downloads / portal invoice |
| Global search endpoint | ⌘K performance |

---

## 5. Client integration rules (non-negotiable)

1. Same-origin relative URLs; `credentials: "include"`.  
2. Pre-cutover ERP base = `/api2`; public = `/api/public`.  
3. Never store tokens in `localStorage`.  
4. Money: integer poisha only.  
5. On 401: refresh once, then login.  
6. Honor `permissions[]` from `/auth/me` (and `activeServices[]`).  
7. Empty API → empty UI; never substitute Figma mock rows.

---

## 6. visa-admin consumption map (preserve)

| UI action | Endpoint |
|---|---|
| Login/me/logout/cpw | `/auth/*` |
| Customers | `/customers` |
| Cases list/create | `/applications` |
| Visa detail | `PUT .../visa` |
| Other detail | `PUT .../detail/:serviceType` |
| Advance/note/assign/approve | matching POSTs |
| Reject | `PATCH` status |
| Passport | `POST /passports`, `POST /ocr/scan` |
| Docs | `/applications/:id/documents` |
| Invoice | `/invoices` + issue |
| Staff | `/users` |
| Reference | `/reference/services`, `/reference/countries` |

Any Figma ERP replacement must keep these behaviors.

---

## 7. Verdict

API surface is **broad and sufficient for Admin ERP + Agent portal + public intake**. Gaps are **portal identity APIs** and a handful of **UX-completing** endpoints (verify, reject, inbox, downloads). Do not invent Figma’s fictional `/api/visa/*` or `/api/accounting/*` namespaces.
