# V6 Wave 1 · Item 3 — Customer Ownership

**Date:** 2026-08-05 · **Status:** DONE (staging-verified, not deployed to prod, not pushed)
**Roadmap ref:** Wave 1 item 3 — implements the approved ownership model ([`V6_AGENT_FOUNDATION.md`](./V6_AGENT_FOUNDATION.md) §1) and closes C4 (booking-ownership bypass) + M6 (ownership not shown in UI).

## Goal
Replace the string/heuristic ownership with a real FK model: **customer ownership belongs to the Primary Agent** (owner), with an optional Secondary (co-servicing) agent, full assignment history, backfill, and server-side enforcement. Operational staff remain *responsibilities*, not ownership (owner's decision).

## Additive schema — migration `032_customer_ownership` (staging only)
- `Customer.primaryAgentId` (FK Agent, null = **house account**), `secondaryAgentId` (FK Agent), `assignedById` (staff user).
- New `CustomerAssignment` — append-only ownership history (`fromAgentId/toAgentId/role/action/reason/assignedById/actorAgentId`).
- Agent back-relations `primaryCustomers`/`secondaryCustomers`. Indexes on both agent FKs + history.
- **Backfill (in the migration):** primary owner set from (1) `createdBy='agent:<id>'` and (2) customers with exactly one distinct application agent — only where null (no overwrite); a `backfill` history row written for each. All additive, reversible.
- **Staging result:** 17 customers backfilled to owners, 91 house, 108 total; 17 history rows.

## Backend (`/opt/shanghai-erp-api/src`, staging-verified)
- **CustomersService ownership methods:** `assignPrimary` (assign/reassign), `releaseOwnership` (→ house), `setSecondary` (add/remove), `ownershipHistory`. Each writes `CustomerAssignment` **and** `AuditLog` in one transaction.
- **Endpoints (customers.controller):** `GET /customers/:id/ownership` (`customer:read`); `POST /customers/:id/ownership/{assign,release,secondary}` (`agent:manage`).
- **List/get now surface the owner** (`primaryAgent` included); the `agentId` filter now matches FK ownership + legacy applications.
- **Enforcement (FK-authoritative, dual-read fallback):** `agent-portal.ownedCustomerIds` now unions FK ownership (primary/secondary) with the legacy heuristic. Agent-portal `createCustomer` and package `agentBook` stamp `primaryAgentId = creating agent` + write a history row.
- **C4 CLOSED:** `packages.service.agentBook` now rejects a supplied `customerId` the agent doesn't own (NotFound, not Forbidden — doesn't confirm foreign IDs) — previously it trusted any client `customerId`.

## Frontend (repo, gates green)
- `Customer` type + `OwnershipAssignment` type; `customersApi.{ownershipHistory,assignOwner,releaseOwner,setSecondaryOwner}`.
- **CustomersPage:** new **Owner** column (agent name or "House").
- **CustomerWorkspacePage:** new reusable `CustomerOwnershipCard` (overview tab) — shows owner, staff (`agent:manage`) assign/reassign/release + history.

## Verification (staging :4201)
- Backend build ✓; migration applied + backfill counts confirmed.
- Ownership endpoints: assign → `primaryAgentId` + `assignedById` set + history `assign`; release → null + history `release`; history returns full trail. ✓
- Frontend: `tsc` ✓ · eslint ✓ · `npm run build` ✓.

## Production readiness
- ⛔ Not deployed to prod, not pushed. Prod needs migration `032` + `/opt` backend deploy + frontend bundle. Backfill runs as part of the migration → prod customers get owners on deploy.
- ✅ Additive/reversible; FK-authoritative with a heuristic fallback so partial backfill is safe.

## Files
Backend (`/opt`, not under git): `prisma/schema.prisma`, `prisma/migrations/20260805130000_032_customer_ownership/migration.sql`, `src/customers/customers.service.ts`, `src/customers/customers.controller.ts`, `src/agent-portal/agent-portal.service.ts`, `src/packages/packages.service.ts`.
Frontend (git): `lib/types.ts`, `lib/services.ts`, `pages/CustomersPage.tsx`, `pages/CustomerWorkspacePage.tsx`, `components/customers/CustomerOwnershipCard.tsx`.
