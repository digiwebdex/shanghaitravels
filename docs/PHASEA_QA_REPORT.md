# Phase A QA Report — TravelOS (Phase 0 + Phase A)

**Audit date:** 2026-07-30  
**Scope:** Validate `PHASE0_COMPLETION.md` + `PHASEA_COMPLETION.md`; UI vs `figma-design`; live `/api2`; DB; security; perf; a11y; debt.  
**Deploy:** `https://shanghaitravels.com.bd/erp/` (HashRouter)  
**visa-admin:** md5 `6873bb1e1d6b29e6c9f1bd216ac8c758` — **unchanged**

---

## Executive verdict

| Gate | Result |
|---|---|
| Critical production blockers | **Cleared** (fixes deployed this audit) |
| Phase 0 / A completion claims | Mostly **CONFIRMED**; UI “pixel-perfect Figma” is **PARTIAL** by intentional scope |
| Mock / placeholder row data in live modules | **None found** |
| Phase B | **Not started.** Cleared to recommend after owner ack of remaining HIGH items below |

---

## 1. Claim validation

### Phase 0 (`docs/PHASE0_COMPLETION.md`)

| Claim | Verdict | Evidence |
|---|---|---|
| Architecture from Figma tokens / UI kit | **CONFIRMED** | `apps/web/src/styles/*`, `components/ui/*` |
| Routing Phase A only + HashRouter | **CONFIRMED** | `app/routes.tsx`, `createHashRouter` |
| API base `/api2` | **CONFIRMED** | `VITE_ERP_BASE=/api2`, `config/env.ts` |
| Cookie auth + AuthProvider / RequireAuth / Can | **CONFIRMED** | `auth/*`, `credentials: "include"` |
| AdminLayout Figma chrome | **PARTIAL** | Same tokens (`#0D1117`, amber active, 10px labels); Phase A nav only (not full Figma module tree / Dubai branches) |
| Loading / errors / Sonner | **CONFIRMED** | Spinners, banners, toaster; ErrorBoundary added in QA |
| DemoBadge + LIVE_MODULES | **CONFIRMED** | Live: customers, passports, visa, case-journey |
| typecheck / lint / build ✅ | **CONFIRMED** | Re-run 2026-07-30 |
| Build “~360 KB JS gzipped ~107 KB” | **PARTIAL / imprecise** | Main JS ~301 KB (gzip ~95 KB); CSS ~107 KB (gzip ~17 KB); plus lazy chunks |
| Deploy `/erp/`, visa-admin untouched | **CONFIRMED** | Live title TravelOS; md5 match |

### Phase A (`docs/PHASEA_COMPLETION.md`)

| Claim | Verdict | Evidence |
|---|---|---|
| Workflow table (customer→passport→OCR→case→docs→invoice→pay→assign→stages) | **CONFIRMED** | `VisaCasePage`, `services.ts` → Nest routes |
| Live data only (no mock rows) | **CONFIRMED** | Pages call `*Api`; DemoBadge null for live keys |
| Screens 1–9 delivered | **CONFIRMED** | All under `pages/` |
| OCR 503 handled | **PARTIAL** | UI still handles 503; **prod `OCR_APPROVED=true`** so OCR is enabled on `:4200` |
| Backend changes: none | **CONFIRMED** | Frontend-only (QA fixes also frontend) |
| E2E checklist | **CONFIRMED as manual** | No automated e2e suite |

---

## 2. UI vs Figma

Screenshots: login verified live (`/erp/#/login`). Email field may show browser autofill; app state initializes email to `""` (not hardcoded).

| Screen | Match | Mismatches | Severity |
|---|---|---|---|
| **Login** | Split layout, label/input classes, TravelOS mark, eye toggle, shield note | No Unsplash hero; no register toggle; China/BDT copy vs Dubai portal stats; solid `#14213D` panel | **Major intentional scope** (staff ERP ≠ customer portal) |
| **Admin shell** | Dark sidebar, amber active bar, 10px nav, collapse, top search/bell chrome | Phase A nav only (5 items); no Dubai branch switcher; ⌘K / bell non-functional; no Figma quick-action grid | **Major intentional scope** |
| **Dashboard** | Live counts + recent cases | Not Figma `AdminDashboard` widgets / mock charts | **Major intentional scope** |
| **Customers** | Dense list/detail operational UI | Not full Figma `CustomerModule` (family tabs, mega CRM) | **Major intentional scope** |
| **Visa list / case** | Case workspace with stages, finance, docs | Not Figma Visa mega-tabs (embassy config, interview scheduler, biometric, kanban) | **Major intentional scope** |
| **Passports** | Manual + OCR forms | No mock passport card visual from Figma OCR demo | **Minor / scope** |
| **Case Journey** | Reuses Figma `CaseTimeline` + live journey | Simplified page shell vs Figma showcase | **Minor** |

**Conclusion:** Visual language and chrome tokens match. Phase A did **not** pixel-clone every Figma module page; it shipped a live China-visa operational vertical. That matches prior `KNOWN_LIMITATIONS` / roadmap — not a silent failure of “live modules,” but it **does** mean UI gap claims in older audit docs remain true for mega-modules.

---

## 3. Backend integration

| Check | Result |
|---|---|
| All Phase A pages → `lib/services.ts` → `/api2` | **Pass** |
| Hardcoded mock customers/invoices/cases | **None** in `pages/` |
| Auth cookies only (no localStorage tokens) | **Pass** |
| `visa-admin` still `/api2` | **Pass** (parallel stopgap) |
| Dual API pre-cutover | `/api/` → `:4100`, `/api2/` → `:4200` — **expected** |

---

## 4. Database (prod `st_erp_prod`)

Sample counts (2026-07-30):

| Table | Count |
|---|---|
| Customer | 6 |
| Application | 9 |
| Passport | 1 |
| Document / ApplicationDocument | 5 / 5 |
| Invoice | 2 |
| Payment | 0 |
| User | 17 |

**Invoice ↔ payment:** Both issued invoices (`INV-000001` 80_00_000 poisha, `INV-000002` 12_00_000) have `pay_sum = 0`. Consistent with unpaid issued state; Nest computes `paid`/`due` in finance service.

**Money:** Integer minor units (`Invoice.total`, `Payment.amount`); UI uses `toPoisha` / `fmtBDTPlain`.

**CRUD:** Customer create/update; application create/patch/advance/assign/approve; passport create; document upload; invoice create/issue; payment record — wired in UI to existing Nest controllers.

---

## 5. Security

| Area | Status | Notes |
|---|---|---|
| RBAC | **Pass** | `Can` + `can()`; Nest `@Permissions`; super_admin bypass in client |
| Session | **Pass with HIGH caveat** | httpOnly `st_access` path `/`; `st_refresh` path `/api/auth` **not sent** to `/api2/auth/refresh` |
| Access TTL | 8h (`ACCESS_TTL=8h`) | Mitigates refresh gap for a workday |
| Upload | **Pass (fixed)** | Client `validateUploadFile` 15MB JPG/PNG/WEBP/PDF; Nest `app-documents` same |
| Validation | **Pass** | Nest DTOs / BadRequest; client form checks |
| Errors | **Pass (fixed)** | `ApiError`; ErrorBoundary; auth-lost → login |
| Stack traces | Nest default JSON errors (no stacks to browser in samples) | |

---

## 6. Performance

| Metric | Value |
|---|---|
| Main bundle | ~301 KB JS / ~95 KB gzip |
| CSS | ~107 KB / ~17 KB gzip |
| Lazy routes | Dashboard, Customers, Visa*, Passports, CaseJourney | **Pass** |
| Duplicate dead modules | Quarantined to `src/_unused/` | |

---

## 7. Accessibility

| Check | Status |
|---|---|
| Login labels / required inputs | **Pass** |
| Password show toggle button | Present (`Show password`) |
| Keyboard | Forms + sidebar links usable; custom selects are native `<select>` |
| Checklist checkboxes | Labeled via wrapping `<label>` |
| Color contrast | Amber on dark sidebar OK; light content slate-on-white OK |
| Gaps | No full axe audit; search ⌘K decorative; some icon-only controls lack explicit `aria-label` |

---

## 8. Critical / High issues

### Fixed during this QA (deployed)

1. Final 401 → `travelos:auth-lost` → force login  
2. Client upload mime/size guard  
3. ErrorBoundary + lazy Suspense boundaries  
4. NotFound (`*`) routes  
5. Route-level code splitting  
6. Login email not hardcoded (browser autofill may still fill)  
7. Case load: docs/invoices failures isolated  
8. Invoice list filtered to `applicationId === case.id`  
9. Assign always offers “(me)” when staff list empty  
10. **Passport expiry display** — Nest returns `expiryDate`; UI now reads `expiryDate \|\| dateOfExpiry`  
11. **Checklist ticks** persist per case in `localStorage` (browser-local; uploads remain SoT)

### Remaining HIGH (not Phase B blockers; do not ignore)

| ID | Issue | Mitigation / plan |
|---|---|---|
| H1 | Refresh cookie path `/api/auth` vs `/api2` | ACCESS_TTL 8h; re-login overnight; fix at auth cutover (Phase G) |
| H2 | Checklist not server-persisted | localStorage this browser only; durable = documents |
| H3 | Assign peer list needs `user:manage` | “(me)” claim works; broaden Nest list perm later |
| H4 | No automated e2e / not a git repo | Init git + Playwright before heavy Phase B |
| H5 | Figma mega-modules not built | Roadmap B–D — expected |
| H6 | Notifications / ⌘K placeholders | Phase D |

### Explicitly not CRITICAL for Phase A gate

- OCR gated — **outdated for current prod** (`OCR_APPROVED=true`)  
- Hash URLs — acceptable for staff tool  

---

## 9. Quality gates (post-fix)

```
npm run typecheck   ✅
npm run lint        ✅
npm run build       ✅
Deployed            ✅  /var/www/ShanghaiTravels/erp/
visa-admin md5      ✅  unchanged
```

---

## 10. Phase B recommendation

**Critical issues resolved.** Phase B may begin after owner acknowledges H1–H6.

Do **not** treat Figma mega Visa/Customer modules as “done” — they remain future phases.
