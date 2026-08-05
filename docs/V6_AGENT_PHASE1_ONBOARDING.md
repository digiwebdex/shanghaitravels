# TravelOS V6 — Phase 1: Agent Onboarding

**Document:** `docs/V6_AGENT_PHASE1_ONBOARDING.md`
**Date:** 2026-08-05
**Phase:** V6 Phase 1 — Agent Onboarding (the first implementation phase after the accepted planning trilogy).
**Scope discipline:** ONLY Agent Onboarding. No Commission, Wallet, Portal, Statements, or Analytics work was started.
**Environments:** backend source-of-truth `/opt/shanghai-erp-api/src`, migration + build verified on **staging only** (`st-erp-api-staging.service` :4201, DB `st_erp_staging` @5440). **Not deployed to production. Not pushed.**

Planning predecessors (all accepted): [`V6_AGENT_ARCHITECTURE_REVIEW.md`](./V6_AGENT_ARCHITECTURE_REVIEW.md) · [`V6_AGENT_FOUNDATION.md`](./V6_AGENT_FOUNDATION.md) · [`V6_AGENT_BUSINESS_WORKFLOW.md`](./V6_AGENT_BUSINESS_WORKFLOW.md).

---

## 1. What was built

The agent lifecycle now has a real onboarding pipeline: **applicant → KYC review → approve/reject**, plus **suspend/reinstate**, every transition audited and notified. Previously agent management was "create + list only" (audit finding M2); it is now a full lifecycle with a detail/approval surface.

### Owner's final decisions — honoured exactly
| Decision | Implementation |
|---|---|
| **Parent Agent** — keep extension-ready; nullable; not in UI; no hierarchy/commission logic | `Agent.parentAgentId` added **nullable**, with a self-relation. **No endpoint sets it, no UI references it, no logic reads it.** Purely schema-level, reserved. |
| **Commission** — primary agent 100%; split is future | No commission code touched. `commissionRateBps` remains stored-only; no rules, no splits. |
| **Customer Ownership** — belongs to Primary Agent; ops staff are responsibilities not ownership | No ownership model changed in this phase (that is Phase 2). Nothing here assigns customers to ops roles. |
| **Scope** — only Agent Onboarding | Commission/Wallet/Portal/Statements/Analytics untouched. |
| **Reuse; no duplicates** | Reused `AgentsService`, `AuditLog`, `NotificationsService`, existing RBAC, `PageShell/Surface/DataTable/Pill/Can/Feedback`. No new module/service duplicating an existing one. |

---

## 2. Additive schema (shown before migration, applied to staging only)

Migration `20260805120000_031_agent_onboarding` — **purely additive**, no existing column altered or dropped, every new column nullable → zero-risk, reversible.

**New model `AgentTier`** — pure classification (no money fields, so it does not begin Commission/Wallet; the future CommissionRule engine will reference it):
`id, code (unique), name, description?, sortOrder, active, createdBy, createdAt, updatedAt`.

**`Agent` — new nullable columns:**
`tierId` (FK→AgentTier), `parentAgentId` (self-FK, reserved/inert), `companyName`, `contactPerson`, `tradeLicenseNo`, `nationalId`, `kycStatus`, `kycNotes`, `appliedAt`, `reviewedBy`, `approvedAt`, `approvedBy`, `rejectedAt`, `rejectedReason` + indexes on `tierId`, `parentAgentId`.

**`status`** stays a `String` (no enum change → additive), now using values `pending | active | suspended | rejected` (previously `active | suspended`).

> The auto-generated `migrate diff` also surfaced unrelated pre-existing drift (`ALTER COLUMN updatedAt DROP DEFAULT` on many tables, a few `DROP INDEX`). Those were **deliberately excluded** — the hand-authored migration contains only the AgentTier + Agent additive statements. Nothing outside the agent onboarding scope was migrated.

---

## 3. Backend (reused `partners` module — no new service)

**`agents.service.ts`** (extended `AgentsService`):
- `create()` — accepts onboarding fields; `onboarding:true` (or `status:"pending"`) creates a **pending** applicant (`appliedAt`, `kycStatus=pending`) and enqueues a staff notification; otherwise unchanged active quick-add.
- `update()` — now accepts onboarding profile fields (`companyName/contactPerson/tradeLicenseNo/nationalId/tierId/kycNotes`); audited.
- `reviewKyc()` — sets `kycStatus` (pending/verified/rejected) + `reviewedBy`; audited. (KYC verification does **not** itself activate — approval is separate.)
- `approve()` — `pending → active` (guarded), stamps `approvedAt/approvedBy`, audits, notifies the agent.
- `reject()` — `pending → rejected` (guarded, reason required), audits, notifies.
- `suspend()` / `reinstate()` — `active ⇄ suspended` (guarded), audited.
- `timeline()` — returns the agent's `AuditLog` trail (reused store, no new table).
- `listTiers()` / `createTier()` / `updateTier()` — tier classification management.

**Controllers** (`partners.controller.ts`): new `AgentTiersController` (`/agent-tiers`) reusing `AgentsService`; `AgentsController` gains `GET /agents/:id/timeline` (commission:read) and `POST /agents/:id/{kyc,approve,reject,suspend,reinstate}` (agent:manage). **Module** imports `NotificationsModule` (reused outbox).

**RBAC:** reused existing permissions — viewing `commission:read`, all onboarding mutations `agent:manage` (already seeded and assigned to `general_manager` + `accounts_manager`). **No new permission introduced.**

---

## 4. Frontend (reused enterprise components — no new design system)

- **`lib/services.ts`** — `AgentTier`/`AgentAuditRow` types + onboarding fields on `Agent`; `agentsApi` gains `timeline/reviewKyc/approve/reject/suspend/reinstate` and a `status` list filter; new `agentTiersApi`.
- **`AgentsPage.tsx`** — status filter, clickable rows → detail, Company/Tier columns, and an "Onboard agent" form (company/contact/license/NID/tier + "register as applicant" toggle). Reuses `PageShell/Surface/DataTable/Pill/Can`.
- **`AgentDetailPage.tsx`** (new, route `partners/agents/:id`) — profile, status pill, lifecycle actions (Approve/Reject when pending; Suspend/Reinstate), KYC review panel, tier selector, and the onboarding audit timeline. All mutations gated by `agent:manage`.
- **`routes.tsx`** — lazy import + `partners/agents/:id` route. Nav unchanged (existing "Agents" entry now leads into the lifecycle).

---

## 5. Verification (staging)

Backend build ✓, staging restart ✓. End-to-end curl as staging QA super_admin:
- Create tier (Gold) ✓
- Create applicant → `status=pending`, `appliedAt` set, `kycStatus=pending`, tier linked ✓
- `GET /agents?status=pending` returns the applicant ✓
- KYC verify → `kycStatus=verified`, `reviewedBy` set ✓
- Approve → `status=active`, `approvedAt`/`approvedBy` set ✓
- Re-approve → **400** (guard holds) ✓
- Timeline → `[apply, kyc.review, approve]` audit trail ✓
- Notifications → 2 enqueued (staff "New agent application" + agent "account is approved"); **delivery simulation-only** (rows stay pending, no creds) ✓
- Test agent soft-deleted to keep staging clean; Gold tier retained as a starter.

Frontend gates: `tsc --noEmit` clean · eslint clean · `npm run build` ✓ (chunks `AgentsPage`, `AgentDetailPage` emitted).

---

## 6. Production-readiness posture

- ⛔ **Not deployed to prod, not pushed.** Migration `031` applied to **staging only**; prod DB does not yet have these columns (owner-gated deploy, like the V5 debt).
- ⛔ Notification **delivery simulation-only** until Wasender/SMTP creds.
- ✅ Additive/reversible schema; no destructive change.
- ✅ `parentAgentId` reserved but inert — no hierarchy behaviour exists.

**Prod deploy debt (owner-gated, when ready):** apply migration `031_agent_onboarding` to prod DB, deploy the `/opt` backend build, and deploy the frontend bundle.

---

## 7. Explicitly NOT done (future phases)

Per scope: no Commission engine (Phase 4), no Wallet funding/topup (Phase 5), no agent Portal onboarding UI (Phase 7), no Statements (Phase 6), no Analytics (Phase 8), and no Customer Ownership model changes (Phase 2). Agent **self-registration** in the portal remains a stub — Phase 1 delivers **staff-driven** onboarding only.

---

_Commit: `feat(v6): enterprise agent onboarding`. Stopped after commit; not pushed._
