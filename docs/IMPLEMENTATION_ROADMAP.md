# Implementation Roadmap — TravelOS

**Audit date:** 2026-07-30  
**Rule:** No implementation until this roadmap is **owner-approved**.  
**Delivery style:** One module at a time; pixel-faithful to `figma-design/`; Nest API contracts unchanged unless a listed gap requires it; lint + typecheck + tests + production build after each module.

---

## 0. Guiding principles

1. **UI SoT** = `figma-design/`. Never redesign.  
2. **API SoT** = `/opt/shanghai-erp-api` + `/root/st-erp-frontend-spec-*.md`.  
3. **Preserve** `visa-admin/` until the Figma ERP covers the same vertical.  
4. **DemoBadge** on every module until it is live on real data.  
5. **Money** = integer poisha; **currency display** = BDT (adapt Figma AED labels).  
6. **Branches/copy** = Bangladesh defaults (adapt Figma Dubai mocks).  
7. Pre-cutover ERP base `/api2`; flip to `/api` only in Phase G.  
8. Backend widening only for blockers in §“Allowed backend changes”.

---

## Phase 0 — Foundation (no user-facing modules)

**Goal:** Production React app scaffolded from Figma, build pipeline, docs hygiene.

| Step | Work |
|---|---|
| 0.1 | Initialize git (if approved) for web app; ignore secrets |
| 0.2 | Copy/adapt `figma-design` → `apps/web` (or in-place) with Vite build |
| 0.3 | Add `apiFetch`, `ERP=/api2`, AuthProvider, RequireAuth, Can, DemoBadge, `moduleStatus.ts` |
| 0.4 | Localize tokens: currency helper `fmtBDT`, BD branch seed in UI config |
| 0.5 | ESLint + `tsc --noEmit` + Vitest smoke + `vite build` green |
| 0.6 | Deploy path decision: e.g. `/erp/` or replace `/visa-admin/` behind feature flag |
| 0.7 | Update docs with chosen deploy URL |

**Exit:** Login against `/api2` works in Figma shell; all modules DemoBadged; visa-admin untouched.

---

## Phase A — Visa vertical proof (CRITICAL)

**Goal:** Staff can complete owner brief end-to-end in Figma UI with **real** prod/staging data.

| Module | Figma reference | API |
|---|---|---|
| A1 Login / change-password | portal or admin login pattern | `/auth/*` |
| A2 Customers list/detail/create/edit | `admin/customers` | `/customers` |
| A3 Visa cases list + create | `admin/visa` | `/applications` |
| A4 Case workspace | Visa detail + `CaseTimeline` | get/journey/visa/advance/note/assign/approve |
| A5 Documents upload | visa/docs patterns | `/applications/:id/documents` |
| A6 Passport manual + OCR UI | `admin/passports` | `/passports`, `/ocr/scan` (handle 503) |
| A7 Invoice from case | accounting slice | `/invoices` + issue |

**Exit checklist (from `st-visa-vertical-admin-brief.md`):**  
create customer → China visa case (7 stages) → detail → advance all → approve → invoice issue → reload persistence.

**Quality gate:** lint, tsc, tests, production build; no mock rows on live modules.

---

## Phase B — Case spine generalization

| Module | Notes |
|---|---|
| B1 Shared Application detail host | One component; service tabs from `serviceType` |
| B2 Air / Hotel / Transport / Tours | `PUT .../detail/:serviceType` |
| B3 Student / Work / Medical / Immigration / Insurance | same |
| B4 Hajj & Umrah | shared HajjUmrahDetail |
| B5 Case Journey Map page | `GET .../journey` |
| B6 Tasks module | `/tasks`, hide without `task:read` |

**Exit:** All 13 service types creatable from Figma admin; empty states real.

---

## Phase C — Finance & partners

| Module | API |
|---|---|
| C1 Accounting dashboard | `/finance/summary` |
| C2 Invoices list/detail | `/invoices` |
| C3 Payments + gated refund | `/payments`, `/payments/refund` |
| C4 Expenses | `/expenses` |
| C5 Accounts + ledger | `/accounts` |
| C6 Suppliers | `/suppliers` |
| C7 Agents + wallet + commissions | `/agents`, `/commissions` |
| C8 Corporate clients | `/corporate-clients` |

**Exit:** Money RBAC mirrored in UI; GM read-only; visa roles see no finance nav.

---

## Phase D — Operations admin

| Module | API |
|---|---|
| D1 CRM | `/leads`, `/communications` |
| D2 HR & Payroll | `/employees`, `/payroll` |
| D3 CMS | `/cms/pages` |
| D4 Settings + workflow templates | `/settings`, `/workflow/templates` |
| D5 Reports & BI (build missing Figma screen) | `/reports/operational` + finance summary |
| D6 Notifications inbox | `/notifications` |
| D7 Download Center | documents filters |
| D8 Users/staff admin | `/users` |

**Exit:** All admin sidebar modules un-badged except showcases (tablet/pwa/overview).

---

## Phase E — Public website rebuild

| Step | Work |
|---|---|
| E1 | Rebuild pages from Figma `src/pages` |
| E2 | Drive services/nav from `/api/public/config` + countries |
| E3 | Inquiry → `/api/public/intake` |
| E4 | Strip fake inventory; enquiry CTAs only |
| E5 | Owner content pass (fees, CVASC checklist) |
| E6 | Optional public OCR button |

**Exit:** Homepage + enquiry create real `APP-*****`; no fabricated availability.

---

## Phase F — Agent portal UI

| Step | Work |
|---|---|
| F1 | Agent login shell (Figma `/agent`) on `st_agent` cookies |
| F2 | Dashboard / cases / commission / wallet |
| F3 | New booking + OCR |
| F4 | Staff invite UX |
| F5 | Passengers — **only if** mini API/DB approved |

**Exit:** Agent isolated from staff routes (re-verify).

---

## Phase G — Auth cutover

| Step | Work |
|---|---|
| G1 | Owner browser-tests `/api2` extensively |
| G2 | Rollback drill (`/root/st-erp-cutover`) |
| G3 | Off-hours flip `/api` → `:4200` |
| G4 | Change frontend `ERP` from `/api2` to `/api` |
| G5 | Remove `/api2` after soak; retire legacy Express |
| G6 | Fix refresh cookie path permanently |

**Exit:** Single auth API; refresh works; legacy `users.json` decommissioned.

---

## Phase H — Customer portal (post-cutover)

| Step | Work |
|---|---|
| H1 | Design customer auth (mirror agent isolation) |
| H2 | DB `CustomerUser` + migrations |
| H3 | Scoped APIs for cases/docs/invoices |
| H4 | Wire Figma `/portal/*` |
| H5 | Online payment design (provider TBD) |

---

## Phase I — Hardening & deferred portals

| Step | Work |
|---|---|
| I1 | SMTP + WhatsApp notification adapters |
| I2 | OCR_APPROVED enable + retention job |
| I3 | Document verify + reject/submit endpoints polish |
| I4 | PDF invoices |
| I5 | Test suite expansion + CI |
| I6 | Corporate/Supplier portal security design → implement |
| I7 | Chat/Calendar — implement or formally cut from Figma nav |
| I8 | Performance: route-based code splitting |

---

## Allowed backend changes (during frontend phases)

- Bugfixes discovered while wiring UI  
- Small additive endpoints listed in API_GAP Priority A  
- Migrations only when entering Phases H/I features  
- **No** new service verticals, GDS, or manpower ATS

---

## Module completion checklist (every phase item)

- [ ] Matches Figma layout/spacing/components (screenshot pass)  
- [ ] Uses real API; empty state if no data  
- [ ] `Can`/permission gating; no dead buttons  
- [ ] DemoBadge removed only for that module  
- [ ] `eslint`, `tsc`, tests, `vite build` pass  
- [ ] Docs updated (`MISSING_FEATURES`, this roadmap progress)  
- [ ] visa-admin behavior not regressing until explicitly retired  

---

## Suggested first approval ask

Approve **Phase 0 + Phase A only**. After visa vertical is proven in Figma UI on `/api2`, approve B→I sequentially.

---

## Progress log

| Date | Phase | Notes |
|---|---|---|
| 2026-07-30 | Audit | Documents created; implementation not started |
| 2026-07-30 | Phase 0 + A | `apps/web` live at `/erp/`; visa vertical wired to `/api2`; visa-admin preserved |

---

## References

- [PROJECT_AUDIT.md](./PROJECT_AUDIT.md)  
- [UI_GAP_ANALYSIS.md](./UI_GAP_ANALYSIS.md)  
- [BACKEND_GAP_ANALYSIS.md](./BACKEND_GAP_ANALYSIS.md)  
- [DATABASE_GAP_ANALYSIS.md](./DATABASE_GAP_ANALYSIS.md)  
- [API_GAP_ANALYSIS.md](./API_GAP_ANALYSIS.md)  
- [MISSING_FEATURES.md](./MISSING_FEATURES.md)  
- `/root/st-visa-vertical-admin-brief.md`  
- `/root/st-erp-frontend-spec-phase*.md`
