# Shanghai Travels ERP — Owner Final Requirements · PRE-DEPLOYMENT REPORT

Audit against the LIVE system. Baseline commit `6e09c44`. Date 2026-08-10.

---

## Phase 1 — Requirement → existing-system matrix

| # | Owner requirement | Status | Evidence |
|---|---|---|---|
| P2 | Core journey Lead→…→Reports | **IMPLEMENTED** | built & tested across prior phases |
| P3 | Customer creation (name/phone/email/nationality/gender/DOB/address/notes/passport) | **IMPLEMENTED** | `customers.service.create` |
| P4 | Agent vs Booking vs Portal agent; snapshot rules | **IMPLEMENTED** | BUG-02 fix, live |
| P5 | Passport OCR / manual / skip | **IMPLEMENTED** | Document Scanner (approved format), live |
| P6 | Customer → service (9 services) | **IMPLEMENTED** | guided journey, live |
| P7 | Service-specific dynamic forms | **IMPLEMENTED** | `lib/serviceForms.ts` |
| P8 | Supplier cost / selling / discount / margin | **IMPLEMENTED** | BookingCommercialsCard + wizard |
| P9 | Supplier per booking | **IMPLEMENTED** | `Application.supplierId`, live |
| P10 | Invoice (existing renderer + QR) | **IMPLEMENTED** | pdfkit engine, unchanged |
| P11 | Payment method ≠ receive account | **IMPLEMENTED** | `Payment.method` + `accountId` |
| P12 | Supplier AP / no double bill | **IMPLEMENTED** | `/applications/:id/supplier-bill` |
| P13 | ONE INVOICE = ONE COMMISSION | **IMPLEMENTED** | BUG-01 fix + unique index, live |
| P14 | Finance/commission/wallet reconcile | **IMPLEMENTED** | verified 0 drift/orphans this session |
| P15 | Per-service workflows (not all visa) | **IMPLEMENTED** | 9 × 11-stage templates |
| P17 | Delivery Report | **IMPLEMENTED** | shipped `6e09c44`, live |
| P23 | Country independence (data, not code) | **IMPLEMENTED** | see below |
| **P16** | **Submit Report** | **MISSING** | no `/reports/submit`, no page |
| **P18** | **Monthly staff salary** | **PARTIALLY IMPLEMENTED** | backend exists; 2 gaps (below) |
| **P21** | ERP Assistant covers salary + submit/delivery report | **PARTIALLY** | no guidance entries for these |
| P19 | Reports set incl. Submit + Salary | **PARTIALLY** | Submit + Salary reports missing |
| P20 | Menu one-function-one-place | **IMPLEMENTED** | consolidated earlier this session |

---

## Country independence — PROVEN (P23), no work needed

- `Country` = **199 data rows**. Destination is **free text** on every service detail (`VisaDetail.destination`, `HotelDetail.country`, `TourPackageDetail.destination`, `WorkDetail.country`, …).
- The **only** literal "China" in the backend is `DEFAULT_SITE_CONFIG.destinations` in `public.service.ts` — a fallback for the **public marketing site** that is merged with the DB `site.config` override (`{...DEFAULT, ...db}`). It is **not** booking-engine logic and does not constrain any service.
- **No Canton Fair / China module exists.** Any country + any service already works through the same path. **Nothing to change; nothing to remove.**

---

## Genuine gaps to implement (only these)

### GAP 1 — Submit Report (P16) · MISSING
Delivery Report exists; there is no Submit Report. Both report on the same events, so the **safe, non-duplicating** move is to reuse the *same* audited data path: extend the existing `deliveryReport` query into a shared "movements" builder and add `GET /reports/submit` that returns rows **filtered to those with a real Submit Date**, with columns SL · Name · Passport No · Category · Type · **Submit Date** · Customer · Remarks. Submit Date is the *already-proven* source (`VisaDetail.submittedAt` or the completed "Embassy Submission"/"Application Submitted" stage). No fabricated dates.

### GAP 2 — Salary/Payroll (P18) · PARTIALLY IMPLEMENTED
The backend **already has**: `Employee` (code, designation, department, joinDate, **salary**), `SalaryPayment` (employeeId, **period**, amount, **accountId**, paidAt, note), and `hr.service` methods `createEmployee`/`paySalary`/`listSalaries` behind `/employees`, `/employees/:id/salary`, `/payroll` (`hr:read`/`hr:manage`). Two real gaps:

1. **`paySalary` does NOT post to the ledger.** `createExpense` posts a `-amount` `LedgerEntry` and updates the account balance in a transaction; `paySalary` only inserts the `SalaryPayment` row. So a salary payment silently does **not** reduce the cash/bank account — a finance-integrity gap.
2. **No admin frontend exists.** Only unrelated corporate-portal employee screens. Staff cannot record salary from the UI.

**Owner decision needed (P18 asks this explicitly):** the requirement lists "salary + accounting entry", and the existing `createExpense` pattern already sets the precedent, so the proposal is **salary + payment + ledger posting** (option 3): `paySalary` wrapped in a `$transaction` that also posts `-amount` to the chosen account via the *existing* `post()` helper — **no new accounting engine, no tax/deduction invention** (net = gross − explicit deduction the user types, nothing computed). A minimal Salary admin page (Employees list + "Pay salary" with month + receive account) and a Salary Report.

### GAP 3 — ERP Assistant (P21) · PARTIAL
Add guidance articles for **Salary**, **Submit Report**, **Delivery Report** so the assistant matches the live UI.

---

## What will NOT change (no proof to justify it)
Invoice renderer/QR · OCR engine · BUG-01/BUG-02 · commission/wallet/AP engines · workflow stage names · CMS/homepage · `.env`/SMTP/WhatsApp/SMS · every existing report · schema of finance tables. **No China/Canton module. Hajj/Umrah stays one service among many.**

---

## Required changes (scoped)
- **DB:** none. (`Employee`/`SalaryPayment` already exist.)
- **Backend:** `paySalary` → post ledger entry in a transaction (fixes GAP 2.1, reuses `post()`); add `GET /reports/submit` (reuses the delivery query); optional `deleteSalary` not needed.
- **Frontend:** Salary admin page + Salary Report; Submit Report page; assistant articles; nav leaves for Salary and Submit Report.
- **Permissions:** reuse `hr:read`/`hr:manage` (salary) and `report:read` (submit report). None created.

## Risk & rollback
All additive. Salary ledger posting changes behaviour of an endpoint with **0 existing rows** (SalaryPayment=0), so no historical data is affected. Rollback = redeploy previous `dist` + frontend bundle; no schema change to revert.
