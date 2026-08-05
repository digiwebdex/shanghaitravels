# V6 Wave 1 · Item 2 — Workflow Template Seeder

**Date:** 2026-08-05 · **Status:** DONE (staging-verified, not deployed to prod, not pushed)
**Roadmap ref:** Wave 1 item 2 — closes S4 (no seeded workflow templates → fresh install has empty workflow system).

## Goal
Every supported service must **install with production-ready workflow templates**. No empty workflow system on a fresh deployment.

## What was built (backend `/opt/shanghai-erp-api/src/workflow`)
Reused the existing `WorkflowTemplate` / `WorkflowTemplateStage` models and `WorkflowService` — no schema change, no new model.

- **`DEFAULT_WORKFLOWS`** — production-ready stage sets (with per-stage SLA hours) for **all 13 `ServiceType` values**: visa (7-stage China/CVASC), air_ticket, hotel, tour, transport, hajj (8), umrah (8), student, work/manpower (BMET), medical, immigration, insurance, corporate. So no service — even the phantom ones a case could theoretically use — is ever empty.
- **`WorkflowService.seedDefaults()`** — idempotent installer: for each service with **no** non-deleted template, creates an **active** v1 template from the defaults. Computes the next `version` (mirrors `create()`) so it's safe even when soft-deleted rows occupy earlier versions under `@@unique([serviceType, version])`. **Never overrides** an admin-configured template — a service that already has one is skipped.
- **Boot hook** — `WorkflowService implements OnModuleInit`; `onModuleInit()` runs `seedDefaults()` at startup (best-effort, wrapped so a boot never fails on it). This is what guarantees a fresh install comes up populated.
- **Manual re-seed endpoint** — `POST /workflow/templates/seed-defaults` (`settings:manage`) for re-seeding after edits.

## Reuse / no-duplication
Reused the template models, `instantiateStages` (unchanged — it already copies the active template's stages onto each new case), and the existing `create()` versioning approach. No new tables, no duplicate seeding path.

## Verification (staging :4201)
- `nest build` ✓ · app boots ✓.
- Staging already had 13 admin/earlier templates → the boot seeder correctly **skipped all** (non-override proven; no duplicates: still 13 active).
- **Creation path proven:** soft-deleted the `insurance` template to simulate a fresh gap → boot re-seed recreated it as **v2** with the default 4 stages (Requirement Capture → Plan Selection & Quote → Policy Issuance → Delivery & Closure). All **13/13 services** now have an active template.
- Fixed one bug found in verification: initial `version: 1` collided with the soft-deleted row under `@@unique([serviceType, version])`; now computes next version like `create()`.

## Production readiness
- ⛔ Not deployed to prod, not pushed. On the next prod deploy the boot seeder installs defaults for any service lacking a template — **a fresh customer install comes up with working workflows automatically**.
- ✅ No schema change. Idempotent + non-override → safe to run repeatedly and safe on already-configured tenants.

## Files (all in `/opt/shanghai-erp-api`, not under git)
`src/workflow/workflow.service.ts` (DEFAULT_WORKFLOWS + seedDefaults + OnModuleInit), `src/workflow/workflow.controller.ts` (+seed-defaults endpoint).
