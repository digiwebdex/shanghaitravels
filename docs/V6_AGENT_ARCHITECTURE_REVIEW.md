# TravelOS V6 — Enterprise Agent Platform

## Architecture Review & Implementation Blueprint

**Document:** `docs/V6_AGENT_ARCHITECTURE_REVIEW.md`
**Date:** 2026-08-05
**Status:** AUDIT ONLY — no code, no build, no commit produced by this review.
**Scope:** B2B travel-agent vertical of TravelOS ([[travelos-erp-frontend]]) — the standalone agent portal, the underlying data model, and every cross-cutting platform system (CRM, Bookings, Finance, Wallet, Commission, Customer360/Booking360, Document Intelligence/OCR, Notifications, Automation, Reports, Analytics, Timeline, Audit, Search, RBAC, and the Agent/Customer/Corporate portals).

**Systems under review:**
- Backend (source-of-truth): NestJS + Prisma at `/opt/shanghai-erp-api/src`, schema `/opt/shanghai-erp-api/prisma/schema.prisma` (3354 lines). Verified on **staging only** (`:4201`, DB `st_erp_staging`).
- Frontend: React 18 + Vite + react-router 7 at `/var/www/ShanghaiTravels-src/apps/web/src`.

> **Method.** Findings below are grounded in a direct read of the current codebase with `file:line` references. Where a capability does **not** exist, it is stated explicitly. Nothing here is aspirational — the "Current State" sections describe what is in the tree today.

---

## PART A — CURRENT STATE AUDIT

### A.0 Executive summary

TravelOS already ships a **working, isolated B2B agent portal** (separate `st_agent` cookie auth, its own module `src/agent-portal/`, 14 frontend pages) that lets a staff-provisioned agent log in, manage their own customers, submit booking requests, scan passports (OCR), view read-only commission and wallet balances, and file support tickets. That is a genuine foundation.

However, the agent vertical is **a thin portal bolted onto a customer-centric ERP**, not a first-class commercial agent platform. Three structural facts drive nearly every gap:

1. **Agent ownership is not modeled — it is inferred at query time.** `Customer` has no `agentId`/`ownerId`; ownership is a runtime `UNION` of `Application.agentId` and the string convention `Customer.createdBy = "agent:<id>"` (`agent-portal.service.ts:49-60`).
2. **Commission is 100% manual.** There is no `CommissionRule` engine. `Agent.commissionRateBps` and `PackageMaster.agentCommissionBps` are **stored but never used in any calculation**; staff type in a commission amount by hand (`partners/agents.service.ts:66-73`).
3. **The wallet is credit-only and denormalized.** No `topup` transaction type, no top-up/approval flow; balance is a cached `Agent.walletBalance` column, never reconciled against the ledger.

Cross-cutting engines (Notifications, Automation, Analytics, Search, PDF statements) are **agent-blind or convention-scoped** — they were built for the customer/GL world and reach agents only through free-string `relatedType:"agent"` tagging, if at all.

---

### A.1 Current Agent Workflow

The end-to-end lifecycle that exists today:

1. **Provisioning (staff-driven, no self-serve).** Staff create an `Agent` record (`AgentsPage.tsx` → `agentsApi.create`, guarded `agent:manage`), then provision a portal login via `POST /agent-accounts/:agentId` (`agent-admin.controller.ts:13`, `agent-auth.service.ts:229`), which returns a one-time temp password. There is **no agent self-registration**; `AgentRegisterPage.tsx` is an explicit marketing/UI-only stub ("invitation-only … no self-signup API").
2. **Login + forced password change.** Agent authenticates against `/portal/agent/login` (`st_agent` cookie, `JWT_AGENT_SECRET`, `aud:"agent"`); `mustChangePassword` gate blocks the shell until reset (`AgentPortalLayout.tsx:37-76`, `agent-jwt.guard.ts:61-68`). OTP login supported.
3. **Customer capture.** Agent creates customers (`POST /portal/agent/customers`), which are stamped `createdBy:"agent:<id>"` — this string is the ownership marker.
4. **Booking request.** Agent submits a case via `POST /portal/agent/cases` (customer derived server-side; client `customerId` is rejected — `agent-portal.service.ts:221`) **or** books a published package via `POST /portal/agent/packages/:id/book`. This is a lightweight "request → staff processes" model, **not** the full staff Unified Booking Wizard.
5. **Servicing.** Staff pick up the case in the normal back-office pipeline. Agent watches status on `/portal/agent/bookings/:id`.
6. **Commission (manual).** At some point staff manually create a `Commission` row for the agent (amount typed by hand), approve it, then "pay" it — which credits the agent wallet.
7. **Wallet (view only).** Agent sees balance + transaction history; there is no withdrawal request, no top-up.
8. **Support.** Agent files `POST /portal/agent/support`, which fans out an in-app notification to staff.

**Weak points in the workflow:** no onboarding/KYC, no approval gate, no commission automation, no payout/withdrawal request loop, no statement delivery, and two inconsistent booking paths (the package path `agentBook` trusts a client `customerId` **without an ownership check** — `packages.service.ts:861` — while the case path rejects it).

---

### A.2 Current Database

**Agent core** (`schema.prisma:841-891`):

| Model | Key fields | Notes |
|---|---|---|
| `Agent` (841) | `code`, `name`, `phone?`, `email?`, `branchId?`, `commissionRateBps Int=0`, `walletBalance Int=0`, `status String="active"` | `commissionRateBps` **never used in any calc**; `walletBalance` is a **denormalized cache**; `status` is a free string, not an enum. **No tier/type.** |
| `AgentWalletTxn` (865) | `agentId`, `amount Int` (signed), `type WalletTxnType`, `relatedType?/relatedId?`, `memo?` | The ledger. |
| `Commission` (878) | `agentId`, `applicationId?` (string, **no FK**), `invoiceId?` (string, **no FK**), `amount Int`, `status CommissionStatus`, `approvedAt?`, `paidAt?` | Not linked into booking/finance by relation. |
| `AgentUser` (1604), `AgentRefreshToken` (1623), `AgentAuthCode` (1636), `AgentSupportRequest` (1652) | portal auth + support | |

**Enums:** `WalletTxnType` = `commission_credit | withdrawal | adjustment` (**no `topup`**, `815-819`); `CommissionStatus` = `pending | approved | paid | cancelled` (`808-813`).

**The booking spine:** `Application` (`296-342`) carries `agentId String?` (310, "set when a B2B agent submitted the case") — but it is a **loose string with no `@relation` to `Agent`**. Also `corporateClientId?`, `source` (e.g. `agent_portal`), `packageId?`.

**Customer ownership — the critical structural gap:** `Customer` (`221-253`) has `branchId`, `code`, `type`, `source?`, `createdBy String` — **but no `agentId`, no `ownerId`, and no Agent M2M.** Ownership is *computed*, not *stored*.

**Other agent-adjacent references:** `CrmOrganization.agentId` (1169, CRM-side, separate from the `Agent` table), `PriceTemplate.agentId` (1420), `PackageMaster.agentFeatured`+`agentCommissionBps` (3219/3247, stored, unused in calc), `OcrSource.agent`, `Communication.partyKind:"agent"`.

**Absent models (confirmed):** no `AgentTier`/`AgentType`, no `CommissionRule`, no `CommissionPayout`, no `WalletTopup`, no `Refund` model (refunds are `Payment.kind=refund`). `Invoice` and `Payment` carry **no `agentId`**.

---

### A.3 Current APIs

**Agent auth** (`agent-auth.controller.ts`, all `@Public`, prefix `/portal/agent`, IP rate-limited): `login`, `refresh`, `logout`, `forgot-password`, `reset-password`, `otp/request`, `otp/verify`.

**Agent portal** (`agent-portal.controller.ts`, `@UseGuards(AgentJwtGuard)`, prefix `/portal/agent`): `GET /me`, `POST /change-password`, `GET /dashboard`, `GET|POST /cases`, `GET /cases/:id`, `GET|POST /customers`, `GET /customers/:id`, `POST /customers/:id/passports`, `POST /customers/:id/travellers`, `GET /commissions` (read-only), `GET /wallet` (read-only), `GET /finance`, `GET|POST /documents` (+versions/download), `GET /communications`, `POST /support`, `POST /ocr/scan`, `GET /packages`, `POST /packages/:id/book`, `GET /reports`.

**Staff-side agent admin:** `partners.controller.ts` — `/agents` list/get (`commission:read`), create/update/delete (`agent:manage`); `/agents/:id/wallet` and `/commissions` create/approve/pay (`commission:manage`). `POST /agent-accounts/:agentId` (`agent:manage`) provisions portal logins.

**Absent:** no agent self-registration endpoint; no wallet top-up/withdrawal-request endpoint; no commission-rule endpoint; no agent statement/PDF endpoint; no agent-scoped analytics endpoint.

---

### A.4 Current UI

**Staff agent management** (`pages/AgentsPage.tsx`, route `/partners/agents`, `agentsApi` = `list/get/create/update` only): effectively **"create + browse."** A paginated table (code/name/phone/email/commission%/wallet/status). **No detail page, no edit UI** (despite `agentsApi.update` existing), no approval/status workflow, no wallet/commission actions.

**Agent attribution across staff modules** is a **URL filter, not an owner field.** `lib/useAgentFilter.ts` persists `?agent=<uuid>`; consumed by `CustomersPage`, all service list pages (Visa/Ticketing/Hotels/Transport/Tour/Hajj), and `FinanceInvoicesPage`. UI via `ModuleLookupFilters.tsx` (`AgentLookup` typeahead + `AgentFilterChip`). The base `Customer` type (`lib/types.ts:14-28`) has **no agent field**; `CustomerWorkspacePage`/`BookingWorkspacePage` render **zero** agent/commission context.

**Customer360 / Booking360:** there is no component so named. The equivalent is the **Intelligence Profile** (`customersApi.intelligenceProfile` → `GET /customers/:id/intelligence`), whose type **does carry** an `agent` block (`services.ts:188-196`) + `corporate` + `finance` — but it is surfaced only in `CustomerIntelligencePanel.tsx`, **not** in the main customer workspace, and carries **no wallet** context.

---

### A.5 Current Portal (Agent vs Customer vs Corporate)

All three portals live under `/portal/*`, outside the staff `RequireAuth` tree, each with its own cookie client (`agentPortalApi` / `customerPortalApi` / `corporatePortalApi`) and shared chrome (`layouts/portalChrome.tsx`).

| Capability | Agent Portal | Customer Portal | Corporate Portal |
|---|---|---|---|
| Self-registration | ❌ (invite-only stub) | ✅ register + email verify | ❌ (login/forgot only) |
| Dashboard | ✅ | ✅ | ✅ |
| Customer/entity list | ✅ own customers | — | ✅ employees |
| Booking creation | ✅ (request model) | ✅ | ✅ (+ approval chain) |
| Finance view | ✅ wallet+commission+invoices | ✅ | ✅ (+ statements list) |
| **Statements** | ❌ | ❌ | ✅ (display-only) |
| **Profile page** | ❌ (no page/route) | ✅ full | ✅ company/employees |
| **Notifications** | ⚠️ inline dashboard list only | — | ✅ announcements |
| Documents + OCR | ✅ scan-only | ✅ | ⚠️ |
| Approval workflow | ❌ | — | ✅ |

**Agent portal is the least complete of the three** on identity-adjacent features (no profile, no self-signup, no statements, no dedicated notifications page). The shared `NotificationCenter` component is built to accept a portal-scoped `fetcher` but is **wired only into staff** (`NotificationCenterPage.tsx`) — a ready-made reuse the agent portal does not use.

---

### A.6 Current Commission

**Manual, standalone, not wired into booking/finance.** All logic in `partners/agents.service.ts`:
- `createCommission` (66) — staff supply `amount` + `agentId` directly; creates `pending`. **No formula.**
- `approveCommission` (74) — `pending → approved`.
- `payCommission` (81) — `approved → paid` **and** credits the wallet (`commission_credit`) in a `$transaction`.

`Agent.commissionRateBps` / `PackageMaster.agentCommissionBps` are **display-only** (e.g. `customers.service.ts:439` shows a "commission N%" label); **no code multiplies a rate by an amount.** `Commission.applicationId`/`invoiceId` are unenforced strings. **Absent:** `CommissionRule`, `CommissionPayout`, tier/service/slab logic, auto-generation on invoice/payment.

---

### A.7 Current Wallet

**Functional but minimal, credit-only.** `postWallet` (`agents.service.ts:52`) writes a signed `AgentWalletTxn` **and** mutates the denormalized `Agent.walletBalance` in-transaction — balance is **cached, never derived** from summing txns (no reconciliation path found). Credits come **only** from `payCommission`. Staff can post `adjustment`/`withdrawal` (`walletTxn`, `:92`; withdrawals forced negative, guarded against going below zero). Agent-facing `/wallet` and `/finance` are **read-only**. **Absent:** any `topup` type/model, top-up approval, withdrawal-request loop, or ledger reconciliation.

---

### A.8 Current Booking Flow

Two agent booking paths, inconsistent:
- **Case path** — `POST /portal/agent/cases` → `createCase` derives the customer server-side and **rejects** a client-supplied `customerId` (`agent-portal.service.ts:221`). Writes `Application.agentId`, `source:"agent_portal"`, and audits `portal.agent.booking_create`.
- **Package path** — `POST /portal/agent/packages/:id/book` → `packages.service.agentBook` (`:861`) **accepts `dto.customerId` without an ownership check** — a security/attribution inconsistency flagged for remediation.

Both are lightweight **request-style** bookings; the rich staff Unified Booking Wizard (per-service case pages: Visa/Ticketing/Hotels/Transport/Tour/Hajj) is **not** available to agents. `Application.agentId` is the only agent linkage and is not an enforced FK.

---

### A.9 Current Notifications

`NotificationsService.enqueue` writes `status:"pending"` rows; `processPending()` is an **explicit no-op** (adapters unconfigured — `notifications.service.ts:5-10,36-39`). Rows never mark delivered. Outbox carries `channel (email|whatsapp|inapp)`, free-string `recipient`, `relatedType/relatedId`. **Agent targeting exists by convention only:** the portal reads `where relatedType:"Agent", relatedId:agentId` (`agent-portal.service.ts:141-146`) and support fans out `relatedType:"AgentSupportRequest"` to staff. **There is no producer that notifies an agent on a commercial event** (commission approved, wallet credited, booking status). Controller is staff-only (`communication:manage`). **Verdict: exists, delivery not implemented, agent-aware only read-side.**

---

### A.10 Current Reports

`GET /finance/reports/:type` (`finance.service.ts:270-324`) supports `collection|receipts|refunds|outstanding|overdue|revenue|invoices|tax` — all `Invoice`/`Payment`/`Customer` driven, audited. **No commission report, no agent statement, no agent-scoped type.** The only agent-aware finance query is list-only: `listInvoices` filters `application.agentId` (`:50-52`). GL/`/fs/*` statements and `arap.service.ts` contain **zero** agent references. Agent reporting exists **only** as ad-hoc portal JSON (`agent-portal.service.reports()`/`finance()`), not a formal statement generator. The generic `PdfService.renderStatement` **can** render a `partyType:"Agent"` statement — but **no route calls `generate("statement")`** (dead code); agents have **no PDF access** at all.

---

### A.11 Current Analytics

`analytics.service.ts` (29 KB) offers `executive/customer/sales/comms/finance/export` — a substantial engine aggregating applications, expenses, AR/AP, pipeline, leads, teams. It is **completely agent-blind**: a full-file grep for `agent|commission|leaderboard` returns **nothing**. No agent performance, no leaderboard, no per-agent revenue/conversion analytics. **Verdict: does not exist for agents.**

---

### A.12 Current Customer Ownership

Ownership is **derived, not stored.** An agent "owns" a customer when either `Application.agentId = agent` **or** `Customer.createdBy = "agent:<id>"` (union computed in `agent-portal.service.ts:49-60`). Consequences:
- No referential integrity — a customer can silently lose/gain attribution as applications change.
- No transfer/reassignment concept, no shared/house-account concept, no ownership history.
- Staff UI shows agent linkage only as a **filter chip**, never as an owner field on the customer.
- The package-book path can attach an application to a customer the agent doesn't own (no check), so even the derived rule is bypassable.

---

### A.13 Current Finance

Finance is **customer/GL-centric and mature** (invoice lifecycle, payments/refunds, GL ledger, AR/AP, commercial reports, PDF invoices/receipts — the V5 program). Agents intersect finance only peripherally: invoices carry **no `agentId`** (agent is reachable only via `Invoice → Application.agentId`); the invoice PDF *displays* an agent field resolved from the application (`pdf.service.ts:161`). There is **no agent ledger, no agent statement, no commission-to-invoice linkage** by relation, and the wallet lives entirely outside the GL (`LedgerEntry` is company cash/bank only — `schema.prisma:724-734`).

---

## PART B — COMPARISON WITH A COMMERCIAL TRAVEL ERP

Benchmarked against what a commercial B2B travel-agency ERP (e.g. TBO, Travelport agency suites, Sabre agency tooling, typical Umrah/Hajj consolidator back-offices) provides for the **agent/sub-agent vertical**.

| Capability area | Commercial Travel ERP (expected) | TravelOS today | Delta |
|---|---|---|---|
| Agent onboarding | Self-signup → KYC/docs → approval → tiering | Staff-provisioned; no KYC/approval/tier | Missing pipeline |
| Agent identity/tier | Tiered (silver/gold/…) driving commission & credit | Single flat `commissionRateBps`, unused | Missing |
| Customer ownership | First-class FK, transfer, house accounts, history | Derived from strings; bypassable | Structural gap |
| Booking | Full booking engine in-portal, agent as principal | Request model → staff processes | Partial |
| Commission | Rule engine (per service/tier/slab), auto-generate, reconcile | Manual amount entry | Missing engine |
| Wallet/credit | Top-up, credit limit, hold/release, statement, withdrawal | Credit-only cache, no top-up | Major gap |
| Statements | Scheduled agent statements (PDF/email), ledger | None (renderer is dead code) | Missing |
| Payouts | Payout runs, batch, gateway/bank export | `status=paid` + wallet credit only | Missing |
| Notifications | Multi-channel, event-driven, per-agent | Pending-only outbox, no delivery, no producer | Not functional |
| Analytics | Agent leaderboard, conversion, revenue, aging | Agent-blind | Missing |
| Search | Agents indexed in global search | Not indexed | Missing |
| Portal completeness | Profile, notifications, statements, KYC | No profile/notifications/statements pages | Gaps |
| Audit | Actor-indexed agent activity | Audited but actor in JSON (`userId:null`) | Weak |

### B.1 Gap Analysis — CRITICAL
*(blocks the platform from being a real commercial agent system / correctness & integrity risks)*

- **C1 — Customer ownership is not modeled.** No `Customer.agentId`/ownership entity; ownership is inferred from `createdBy` strings + `Application.agentId`. No integrity, no transfer, no history. Everything downstream (commission attribution, statements, analytics) rests on this.
- **C2 — Commission is fully manual; no rule engine.** Rate fields exist but are never used; commission cannot be trusted or reconciled. `Commission.applicationId/invoiceId` are unenforced strings.
- **C3 — `Application.agentId` (and commission/invoice links) are loose strings, not FKs.** No referential integrity between agent, booking, commission, and invoice.
- **C4 — Booking ownership bypass.** `packages.service.agentBook` attaches to a client-supplied `customerId` with **no ownership check** (`:861`) — an agent can book against another agent's customer.
- **C5 — Wallet has no funding model and is denormalized without reconciliation.** Balance can drift from the ledger with no recompute/audit path; no top-up.

### B.2 Gap Analysis — HIGH
*(needed for a credible commercial launch)*

- **H1 — No agent onboarding/approval/KYC pipeline** (self-signup is a stub; no status lifecycle beyond `active|suspended` free string).
- **H2 — No agent statements** (formal PDF/email ledger). `renderStatement` exists but is uncalled dead code; agents have no PDF access.
- **H3 — Notifications not delivered and not produced for agent events.** No commercial-event → agent notification; adapters are no-ops.
- **H4 — No commission payout/withdrawal workflow** (no payout runs, no withdrawal requests, no batch/export).
- **H5 — Analytics is agent-blind** (no leaderboard/performance/revenue-by-agent).
- **H6 — No agent tiering** to drive commission/credit differentiation.

### B.3 Gap Analysis — MEDIUM

- **M1 — Agent portal missing profile & dedicated notifications pages**; shared `NotificationCenter` not reused (fetcher pattern already supports it).
- **M2 — Staff agent management is create+list only** — no detail/edit/approval/wallet/commission UI though `agentsApi.update` exists.
- **M3 — Automation engine claims agent support in comments but has no agent code path** (no commission-due, wallet-low, statement-ready jobs).
- **M4 — No agent templates** in CommsService (12 templates all customer-addressed).
- **M5 — Agents not in global/intelligence search.**
- **M6 — Customer360/Booking360 do not surface agent/commission/wallet** in the main workspace (data exists in `IntelligenceProfile.agent`, unused).

### B.4 Gap Analysis — LOW

- **L1 — Audit stores agent actor in JSON (`userId:null`)** — weak actor querying; add an actor/`agentId` column or dual-write.
- **L2 — Money formatting duplicated** across three portals (`formatPoisha` ×3); `lib/statements.ts` utilities not shared into portals.
- **L3 — Agent status is a free string** (`active|suspended`) — should be an enum.
- **L4 — Thin agent booking detail page** (`AgentBookingDetailPage.tsx`, 46 lines).
- **L5 — Naming/plumbing drift** — stale comments (e.g. permission-key comment in `partners.controller.ts`), agent-side finance/reports returned as untyped `Record<string,any>` blobs.

---

## PART C — IMPLEMENTATION BLUEPRINT

> Sequenced to **fix the foundation before building on it**. Each phase follows the standing TravelOS rules: review-first, **reuse** existing engines (CommsService / NotificationsService / AutomationService / PdfService / AuditLog / Analytics / NotificationCenter), **additive-only** schema changes shown before migrating, backend built + verified on **staging only**, no prod deploy, no auto-send (simulation until creds). This blueprint is design only — **no code is written in this document.**

### Phase 1 — Agent Onboarding
**Goal:** a real identity + lifecycle for agents. **Resolves:** H1, L3, and prepares C1.
- Schema (additive): `AgentTier` (or enum) + `Agent.tierId`; convert `Agent.status` to an enum (`pending|active|suspended|rejected`); add onboarding fields (KYC docs via existing document/OCR pipeline, `approvedBy/At`). Add an `AgentApplication`/onboarding record if self-signup is desired.
- APIs: optional self-registration (`POST /portal/agent/register` → `pending`), staff approval endpoints (`agent:manage`), reusing the existing agent-account provisioning for credential issue.
- UI: turn `AgentRegisterPage` stub into a real signup (if opted-in); add a **staff Agent detail/approval page** (also closes M2); onboarding checklist reusing OCR/document upload.
- Reuse: AuditLog for every state change; NotificationsService to notify staff of new applications.

### Phase 2 — Agent CRM (Customer Ownership)
**Goal:** make ownership first-class. **Resolves:** C1, C4, M6, and the integrity half of C3.
- Schema (additive): `Customer.agentId` (FK → Agent, nullable for house/staff-owned) **plus** an ownership-history/reassignment record; backfill from the existing derived rule (`Application.agentId` ∪ `createdBy:"agent:*"`) as a one-time migration.
- Enforce: replace the derived `ownedCustomerIds` union with the FK; add an **ownership check** to `packages.service.agentBook` (close C4); transfer/reassign endpoint (staff `agent:manage`).
- UI: show owner on `CustomersPage`/`CustomerWorkspacePage`; surface agent/commission/wallet in Customer360/Booking360 (the `IntelligenceProfile.agent` block already exists — just render it).

### Phase 3 — Agent Booking
**Goal:** consistent, attributable agent bookings. **Resolves:** C4 (fully), C3, L4, Booking partiality.
- Make `Application.agentId` an enforced FK relation; unify the two booking paths on one ownership-checked service; decide agent-as-principal vs request model per service.
- UI: richer agent booking detail (reuse staff case components where safe); expose a controlled subset of the booking wizard to agents.

### Phase 4 — Commission
**Goal:** a real commission engine. **Resolves:** C2, C3, H6.
- Schema (additive): `CommissionRule` (scope: global/tier/service/package/agent; basis: percent/flat/slab; effective dates) and make `Commission.applicationId/invoiceId` **FKs**. Keep `Commission` as the ledger of computed lines.
- Engine: compute commission from rules on invoice/payment events (start **preview/manual-confirm**, not auto-post, per no-auto-send discipline); wire `Agent.commissionRateBps`/`PackageMaster.agentCommissionBps` into the calculation (they finally get used).
- Reuse: AuditLog on every rule change and computation; reuse the existing approve/pay lifecycle.

### Phase 5 — Wallet
**Goal:** a fundable, reconcilable wallet. **Resolves:** C5, H4.
- Schema (additive): add `topup` to `WalletTxnType` + a `WalletTopup`/`WalletRequest` model (top-up and withdrawal requests with approval); optional `credit_limit`/`hold`.
- Integrity: add a **reconciliation** path (recompute balance = Σ txns) with an audit/adjustment on drift; keep the denormalized cache but make it verifiable.
- Workflow: agent-initiated top-up (proof upload via OCR/documents) + withdrawal request → staff approval → payout; commission "pay" continues to credit via the existing `postWallet`.

### Phase 6 — Statements
**Goal:** formal agent statements. **Resolves:** H2.
- Wire a route to the existing `PdfService.generate("statement")` with `partyType:"Agent"` (the renderer already exists — just needs a caller + agent ledger data); build the agent ledger (commissions + wallet txns + bookings) as the statement source.
- Delivery: reuse CommsService (add **agent templates**, closing M4) — simulation-only until creds; scheduled via AutomationService (add an agent-statement job, part of M3).
- UI: agent-portal Statements page + download (reuse `lib/statements.ts`/`downloadBlob`, closing L2 partially); expose PDF to the agent portal.

### Phase 7 — Portal
**Goal:** bring the agent portal to parity with customer/corporate. **Resolves:** M1, M2, H3, L4, L5.
- Add **Agent Profile** page + `updateProfile`; add a dedicated **Notifications** page reusing the shared `NotificationCenter` with an agent-scoped `fetcher` (already supported); wire the notification **producer** for commercial events (commission approved, wallet credited, booking status) via NotificationsService — reusing Phase 3 of V5's notification center pattern.
- Type the agent finance/reports payloads (retire the `Record<string,any>` blobs); enrich booking detail.

### Phase 8 — Analytics
**Goal:** agent intelligence. **Resolves:** H5, M5, L1.
- Extend `analytics.service.ts` with agent dimensions: leaderboard, conversion, revenue-by-agent, commission earned/paid, aging, wallet exposure — reusing the existing analytics export/schedule/template machinery.
- Index agents into global/intelligence search (M5).
- Strengthen audit actor indexing for agent actions (add actor/`agentId` column or dual-write; L1).

---

### C.1 Sequencing & dependency notes
- **Phases 1–2 are the true foundation** (identity + ownership). Commission (4), Wallet (5), Statements (6), and Analytics (8) all depend on ownership (C1) and FK integrity (C3) landing first.
- **Reuse-first, no new engines:** Notifications, Automation, Comms, PdfService, Analytics, AuditLog, and the shared `NotificationCenter` all already exist — the work is agent-scoping and wiring, not rebuilding. The `renderStatement` renderer and the `NotificationCenter` `fetcher` prop are pre-built seams waiting for callers.
- **Discipline carries over from V5:** additive schema shown before migrating; staging-only build/verify; delivery simulation-only until Wasender/SMTP creds; automation disabled-by-default in prod.

---

## PART D — Production readiness posture (for reference)

- This vertical currently runs the same **staging-only** posture as the V5 finance program: backend source-of-truth is `/opt/shanghai-erp-api/src`, verified on `:4201`; **nothing here is deployed to prod** and this review changes nothing.
- Cross-cutting delivery adapters (Notifications + Comms) are **simulate/no-op** everywhere — no channel actually reaches an agent until owner provides Wasender/SMTP credentials.
- Every phase above is **owner-gated**; this document is the audit that must be approved before any Phase 1 code begins.

---

_Audit complete. No code written, no build run, no commit made — per the V6 review directive. Next action is owner review/approval of this document before Phase 1._
