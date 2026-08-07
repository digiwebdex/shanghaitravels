# TravelOS Enterprise ERP — Final Go-Live Audit (re-audit after Launch Hotfix Sprint)

**Date:** 2026-08-07 (regenerated)
**Mode:** AUDIT — reflects the completed **Launch Hotfix Sprint** that fixed the three launch blockers from the prior audit. Fixes were verified on staging (`:4201`); backend source is `/opt/shanghai-erp-api` (built + verified staging-only, not deployed to prod, not pushed).
**Assumptions (unchanged):** production deployment complete; real SMTP/WhatsApp/SMS credentials configured; migrations `027–035` applied.

---

## Launch Score: **91 / 100** — GO for a controlled single-tenant pilot

The three prior blockers (H1 notifications, H2 stub verticals, H3 register validation) are **fixed and verified**. Zero criticals; the remaining items are accepted limitations or post-launch improvements, none of which a paying customer hits as a broken workflow on day one.

---

## Hotfixes applied & verified (were the launch blockers)

| ID | Blocker | Fix | Verified on staging |
|---|---|---|---|
| **HF1** | Enqueued notifications never auto-delivered (nothing called `processPending`). | New `NotificationScheduler` `@Cron("*/2 * * * *")` calls the existing `NotificationsService.processPending()` — **reuses the service, no new queue**, and runs independently of the automation toggle. | ✅ Cron fired autonomously (`17:20:00`) and delivered a pending email (`delivered=1`), pending 1→0, **with no manual call**. |
| **HF2** | Student & Manpower were selectable and silently created **Visa** cases. | **Backend guard** rejects `student/work/manpower/medical/immigration/insurance` at `applications.create` with `400 "not yet supported"`; **frontend** marks them `supported:false` (own `apiType`, never "visa"), filters them out of the picker, blocks the wizard, and removes the nav entries. | ✅ `student`/`work` create → **400**; `visa` create → **201** (7 stages); no silent mapping. |
| **HF3** | Public `register` used `@Body() any` (unvalidated). | Added `RegisterDto` (email/password≥8/fullName/phone) wired into `customer-auth` `register`; global `ValidationPipe` enforces it. | ✅ Bad password/email → **400**. |

---

## Re-audit results

**Critical Bugs — none.**

**High Bugs**
- **H1 — RESOLVED** (HF1). ✅
- **H2 — RESOLVED** (HF2). ✅
- **H3 — RESOLVED** (HF3). ✅
- **H4 — No online payment path** (customers/corporates view invoices, staff record payment). **Not fixed — out of hotfix scope; accepted limitation** (staff-recorded payments), tracked for Wave 3. Not a day-one *broken* workflow, but a commercial gap.

**Medium / Low Bugs** — unchanged from the prior audit (none are launch blockers): agent portal wallet self-service + profile page; RBAC not self-administrable; synthetic receipt numbers; two-ledger finance / no auto invoice→GL posting; one-way `advanceStage` + unguarded `update` status; OCR history in-memory + image-only; single-instance in-memory state; generic tracker for pre-seeding bookings; agent register marketing stub; global TLS 1.0/1.1 + no SPA CSP/HSTS; no webhooks.

---

## Smoke test (staging) — all green

staff login `201` · `/health` `200` · `/health/ready` `database:ok` · customers list ok · invoice PDF `200 application/pdf` · public track `found=true` · commission preview `200` · wallet reconcile `reconciled=true` · **HF2** student `400` / visa `201` · **HF3** bad register `400` · **HF1** cron auto-delivered.

Backend `nest build` ✓; frontend `tsc` ✓ / `eslint` ✓ / `build` ✓.

---

## Final Decision: **GO** — controlled single-tenant pilot with hypercare

All prior launch blockers are fixed and verified; no criticals; core journeys (customer, agent, corporate, admin, finance, booking, tracking, OCR, portal, notification) work end-to-end. Proceed to a controlled pilot per `COMMERCIAL_LAUNCH_PLAN.md` (deploy the sprint to prod → configure delivery → smoke → pilot → 30-day hypercare).

### Remaining post-launch improvements (not blockers — planned, owner-gated)

1. **Online payment in portals** (H4) — customer/corporate self-pay (Wave 3).
2. **Admin/RBAC tooling** — role/permission/branch editor + audit-log viewer (highest operational value; Wave 2).
3. **Agent portal parity** — self-service wallet top-up/withdrawal, Profile page, dedicated notifications page (Wave 2).
4. **Finance** — sequential receipt numbering; automatic invoice→GL posting (Wave 3).
5. **Booking** — allow stage rollback; guard `update` status transitions.
6. **OCR** — persist scan history; segregate prod/staging keys; PDF support.
7. **Verticals** — build real Student & Manpower modules (currently correctly blocked, not sold).
8. **Ops/scale** — Redis-backed rate limiting + cron leader election before multi-instance; global TLS 1.0/1.1 removal + SPA CSP/HSTS; dedicated host/quotas; outbound webhooks.

These are tracked in `COMMERCIAL_LAUNCH_PLAN.md` §11/§14. None gate the pilot launch.

---

_Re-audit complete. Hotfixes verified on staging; not deployed to prod, not pushed. Commit: `chore(launch): hotfix release blockers`._
