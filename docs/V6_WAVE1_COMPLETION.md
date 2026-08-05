# V6 Wave 1 — Completion Report

**Date:** 2026-08-05 · **Status:** COMPLETE (all 6 items, staging-verified) — **not deployed to prod, not pushed.**
**Authoritative roadmap:** [`docs/V6_COMMERCIAL_GAP_ANALYSIS.md`](./V6_COMMERCIAL_GAP_ANALYSIS.md). Wave 1 = "make it deliverable, administrable, and monetizable for the agent vertical." Each item was built on staging, passed typecheck/lint/build, got a completion report, and was committed separately (no push).

## Items delivered

| # | Item | Commit | Migration | Verified on staging |
|---|---|---|---|---|
| 1 | Production Communication Layer | `60a7520` | — | delivery worker delivered 100 pending rows (simulate) |
| 2 | Workflow Template Seeder | `38eb19f` | — | 13/13 services have active templates; re-seed recreates gaps |
| 3 | Customer Ownership | `dd4483b` | `032` | 17 customers backfilled; assign/release/history; C4 closed |
| 4 | Commission Engine | `3860fcc` | `033` | rule→preview ৳25→generate→ledger earn→pay→settle |
| 5 | Wallet immutable ledger | `dc837db` | `034` | topup→approve→withdraw→approve; reconciled |
| 6 | Booking Tracking (public + portal) | `9ad74e0` | — | `GET /public/track` returns safe status + stages |

Per-item detail: `docs/V6_WAVE1_ITEM{1..6}_*.md`.

## What each item changed (summary)

1. **Communication Layer** — real **SMTP (nodemailer) / Wasender WhatsApp / HTTP SMS** adapters behind a shared `MessagingModule` provider factory; simulation preserved as fallback (env-only switch to production). The **Notifications outbox now delivers** (`processPending` was a no-op). Closes the #1 commercial blocker (S1).
2. **Workflow Seeder** — production-ready default workflows for **all 13 service types**, installed idempotently on boot (non-override) + manual re-seed endpoint. No service installs empty (S4).
3. **Customer Ownership** — `Customer.primaryAgentId`/`secondaryAgentId` FK + `CustomerAssignment` history + migration backfill; ownership service/endpoints; FK-authoritative agent scoping; **closes the C4 booking-ownership bypass**; UI Owner column + ownership card.
4. **Commission Engine** — `CommissionRule` (basis × scope, prioritised) + engine (match/compute/preview/generate) + append-only `CommissionLedger` (earn/settle); replaces manual entry. Primary agent 100%; splits deferred (owner's decision). UI Commission Rules page.
5. **Wallet** — immutable ledger with running-balance snapshot + reconciliation + **top-up/withdrawal request & approval rails** (`WalletTxnType` += topup/refund/settlement). UI wallet card. Closes C5.
6. **Booking Tracking** — public `GET /public/track?ref=` (customer-safe) + reusable `BookingTracker` + public `/track` page + portal application tracker.

## Reuse discipline (no duplication)
Reused throughout: `MessagingAdapter` interface, `AuditLog`, `NotificationsService`, existing RBAC (`agent:manage`/`commission:read`/`commission:manage`/`settings:manage` — **no new permissions**), the `WorkflowTemplate` engine, the `Application`/stage models, `postWallet`, and the enterprise UI kit (`PageShell/Surface/DataTable/Pill/Can`). New shared components: `MessagingModule`, `CustomerOwnershipCard`, `AgentWalletCard`, `BookingTracker`.

## Migrations (staging only, additive & reversible)
- `032_customer_ownership` — Customer ownership FKs + `CustomerAssignment` + backfill.
- `033_commission_engine` — `CommissionRule`, `CommissionLedger`, `Commission` engine columns.
- `034_wallet_ledger` — `AgentWalletTxn.runningBalance` + `WalletTopupRequest`/`WalletWithdrawalRequest` + enum values.
All additive (no column dropped/retyped); backfills only fill nulls; safe to re-run.

## Production deployment debt (owner-gated — nothing deployed)
To ship Wave 1 to production:
1. **Backend** (`/opt/shanghai-erp-api` is source-of-truth, not under git): `npm i` (adds **nodemailer**), `npm run build`, apply migrations `032`/`033`/`034` to the prod DB (backfills run in-migration), deploy, restart. The workflow seeder runs automatically on boot.
2. **Frontend**: deploy the built bundle.
3. **Delivery credentials** (to actually send): set `COMMS_EMAIL_PROVIDER=smtp` + SMTP creds, `COMMS_WHATSAPP_PROVIDER=wasender` + `COMMS_WASENDER_API_KEY`, `COMMS_SMS_PROVIDER=http` + gateway — otherwise delivery stays simulation-only (safe default). See `.env.example`.

## Notes & owner decisions honoured
- Commission **primary agent 100%; splits are future** (per owner decision). The engine's rate fallback activates the agent's `commissionRateBps` only on **staff-initiated** generate (preview→confirm), never auto-post — the money-behaviour flag from the foundation (§8.4) is respected.
- `parentAgentId` remains reserved/inert (from Phase 1).
- Agent-portal **self-service** top-up/withdrawal (agents raising their own requests) is a Wave 2 portal item; Wave 1 delivers the rails + staff approval.

## Status
**Wave 1 is complete and stopped here. Wave 2 (agent-platform completion: ownership-driven statements, agent portal parity, analytics) will NOT begin without approval.**
