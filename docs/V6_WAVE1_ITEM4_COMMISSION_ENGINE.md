# V6 Wave 1 · Item 4 — Commission Engine

**Date:** 2026-08-05 · **Status:** DONE (staging-verified, not deployed to prod, not pushed)
**Roadmap ref:** Wave 1 item 4 — implements the approved commission architecture ([`V6_AGENT_FOUNDATION.md`](./V6_AGENT_FOUNDATION.md) §2), replacing manual hand-entered commission with a rule engine. **Owner decision honoured: primary agent earns 100%; commission split is a future capability.**

## Additive schema — migration `033_commission_engine` (staging only)
- **`CommissionRule`** — policy: `basis` (fixed | percentage) × scope dims (agent / tier / service / country / package / branch, null = any), `value` (poisha for fixed, bps for percentage), `priority`, `effectiveFrom/To`, `active`.
- **`Commission`** (existing manual record) extended additively: `ruleId`, `ruleSnapshot` (Json, frozen at compute), `baseAmount`, `trigger`.
- **`CommissionLedger`** — append-only per-agent earned account: `entryType` (earn | settle | adjust | clawback | cancel), signed `amount`, `runningBalance` snapshot.
All additive; no existing column altered.

## Backend (`/opt/shanghai-erp-api/src/partners`, staging-verified)
- **`CommissionService`** (new): rule CRUD; `matchRule` (most-specific active in-date rule — priority → specificity → newest); `compute` (fixed = value, percentage = base × bps ÷ 10000); `previewForInvoice` (resolves earning agent from `application.agentId` or `customer.primaryAgentId`, matches a rule, falls back to the agent's `commissionRateBps`); `generateForInvoice` (creates a pending `Commission` from the rule + writes a ledger **earn** entry, idempotent per invoice+agent); `ledger`.
- **Existing pay flow now settles the ledger:** `AgentsService.payCommission` writes a **settle** entry (−amount) alongside the wallet `commission_credit` — so paying moves value from "owed" to the wallet, netting the ledger.
- **Preview/manual-confirm discipline:** generation is an explicit staff action (`commission:manage`), not silent auto-post.
- **Controllers:** `CommissionRulesController` (`/commission-rules` CRUD); `CommissionsController` gains `GET /commissions/preview/invoice/:id`, `POST /commissions/generate/invoice/:id`, `GET /commissions/ledger/:agentId`. Reused existing `commission:read`/`commission:manage` RBAC.

## Frontend (repo, gates green)
- `commissionRulesApi` + `commissionApi` (preview/generate/ledger) + types.
- **`CommissionRulesPage`** (route `finance/commission-rules`, nav Finance → Commission Rules) — list + create rules (basis/value/scope/priority), delete. `commission:read` to view, `commission:manage` to manage.

## Verification (staging :4201)
End-to-end: created a 5% rule → preview on a ৳500 invoice = **৳25 (source: rule)** → generate → pending commission (trigger `on_invoice`) → ledger **earn +2500** (running 2500) → approve + pay → ledger **settle −2500** (running 0) + wallet credited. Frontend `tsc`/eslint/`build` ✓.

## Production readiness
- ⛔ Not deployed to prod, not pushed. Prod needs migration `033` + `/opt` backend deploy + frontend bundle.
- ✅ Additive schema. **Money-behaviour note (per foundation §8.4):** the fallback uses the agent's `commissionRateBps` when no rule matches — activating a previously-inert rate. Generation is staff-initiated preview→confirm (never automatic), so no silent payout occurs.
- Splits, per-country/airline/hotel scope population, and settlement batching remain future (architecture supports them).

## Files
Backend (`/opt`): `prisma/schema.prisma`, `prisma/migrations/20260805140000_033_commission_engine/migration.sql`, `src/partners/commission.service.ts` (new), `src/partners/partners.controller.ts`, `src/partners/partners.module.ts`, `src/partners/agents.service.ts`.
Frontend (git): `lib/services.ts`, `pages/CommissionRulesPage.tsx` (new), `app/routes.tsx`, `config/nav.ts`.
