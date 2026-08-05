# V6 Wave 1 · Item 5 — Wallet (immutable ledger + funding rails)

**Date:** 2026-08-05 · **Status:** DONE (staging-verified, not deployed to prod, not pushed)
**Roadmap ref:** Wave 1 item 5 — implements the approved wallet architecture ([`V6_AGENT_FOUNDATION.md`](./V6_AGENT_FOUNDATION.md) §3): immutable ledger with running balance, reconciliation, and top-up/withdrawal request+approval rails (closes C5).

## Additive schema — migration `034_wallet_ledger` (staging only)
- `WalletTxnType` enum += `topup`, `refund`, `settlement` (was credit-only).
- `AgentWalletTxn.runningBalance` (nullable) — the ledger is now immutable **with a balance snapshot per row**; backfilled chronologically per agent.
- **`WalletTopupRequest`** — funding: `amount`, `proofDocumentId?`, `status(requested|approved|rejected|posted)`, requester/decider, `txnId`.
- **`WalletWithdrawalRequest`** — payout: `amount`, `method(bank|cash|adjustment)`, `bankRef?`, `status(requested|approved|rejected|paid)`, requester/decider, `txnId`.
All additive; existing columns unchanged.

## Backend (`/opt/shanghai-erp-api/src/partners`, staging-verified)
- **`postWallet` now writes the running-balance snapshot** and returns the txn — every credit/debit is a traceable, immutable ledger row.
- **`reconcileWallet(agentId)`** — compares the denormalized `Agent.walletBalance` cache to `Σ ledger`; reports drift and **never auto-fixes** (surfaces for staff, per foundation invariant).
- **Top-up rail:** `createTopupRequest` (agent funding) → `decideTopup(approve)` posts a `topup` credit + marks `posted` (or `rejected`).
- **Withdrawal rail:** `createWithdrawalRequest` (guarded ≤ balance) → `decideWithdrawal(approve)` posts a `withdrawal` debit (guarded against negative) + marks `paid`.
- **Endpoints:** `GET /agents/:id/wallet/{ledger,reconcile,requests}` (`commission:read`), `POST /agents/:id/wallet/{topup,withdraw}` (`commission:manage`); `WalletRequestsController` — `GET /wallet-requests`, `POST /wallet-requests/{topup,withdrawal}/:id/:decision` (`commission:manage`). Reused existing RBAC.

## Frontend (repo, gates green)
- `agentsApi` wallet methods + `walletRequestsApi` (approve/reject) + types.
- **`AgentWalletCard`** (mounted on `AgentDetailPage` for active agents) — balance, **reconcile status** (green "Reconciled" / red drift), request top-up / withdrawal, approve/reject pending requests, and the ledger with running balances.

## Verification (staging :4201)
End-to-end on a live agent: reconcile before (cached 0 = ledgerSum 0 ✓) → top-up request ৳1,000 → approve → **posted** → withdrawal request ৳300 → approve → **paid** → ledger shows `topup +100000 (bal 100000)`, `withdrawal −30000 (bal 70000)` → reconcile after (cached 70000 = ledgerSum 70000, **reconciled ✓**). Frontend `tsc`/eslint/`build` ✓.

## Production readiness
- ⛔ Not deployed to prod, not pushed. Prod needs migration `034` + `/opt` backend deploy + frontend bundle (backfill runs in the migration).
- ✅ Additive/reversible. Balance is now ledger-derived + reconciled (was an unreconciled cache). Agent-portal self-service top-up/withdrawal (agents raising their own requests) is a Wave 2 portal item; Wave 1 delivers the rails + staff approval.

## Files
Backend (`/opt`): `prisma/schema.prisma`, `prisma/migrations/20260805150000_034_wallet_ledger/migration.sql`, `src/partners/agents.service.ts`, `src/partners/partners.controller.ts`, `src/partners/partners.module.ts`.
Frontend (git): `lib/services.ts`, `components/agents/AgentWalletCard.tsx` (new), `pages/AgentDetailPage.tsx`.
