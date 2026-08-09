import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuthedUser } from "../rbac";

/**
 * Agents (B2B referrers), their onboarding lifecycle, commissions, and wallet.
 * Money in integer minor units.
 *
 * V6 Phase 1 — Agent Onboarding: an agent moves through
 *   pending → active (approve) | rejected (reject); active ⇄ suspended.
 * Every transition writes an AuditLog row (reused, no new store) and enqueues a
 * Notification (reused outbox; delivery stays simulation-only until creds).
 *
 * Commission lifecycle: pending → approved → paid (paying CREDITS the agent
 * wallet via an AgentWalletTxn, transactionally). Wallet balance is denormalized
 * and kept in sync in the same $transaction as each txn.
 */
@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService, private notes: NotificationsService) {}

  /** Reused AuditLog writer — best-effort, never blocks the mutation. */
  private async audit(user: AuthedUser | null, action: string, entityId: string, before?: unknown, after?: unknown) {
    try {
      await this.prisma.auditLog.create({
        data: { userId: user?.id ?? null, action, entityType: "Agent", entityId,
          before: before == null ? undefined : (before as any), after: after == null ? undefined : (after as any) },
      });
    } catch { /* audit is best-effort */ }
  }

  // Commercial onboarding profile fields persisted from the form (all additive/nullable).
  private static readonly PROFILE_STRINGS = [
    "companyName", "contactPerson", "tradeLicenseNo", "nationalId",
    "ownerName", "passportNo", "gender", "nationality",
    "businessType", "website", "facebookPage", "googleBusiness",
    "officeAddress", "city", "district", "country", "postalCode", "googleMapLocation",
    "bankName", "bankBranch", "bankAccountName", "bankAccountNumber", "bankRoutingNumber",
    "bkash", "nagad", "rocket", "upay",
    "openingBalanceType", "currency",
    "emergencyName", "emergencyRelationship", "emergencyPhone", "internalNotes",
  ];
  private static readonly PROFILE_DATES = ["dob", "businessStartDate"];
  private static readonly PROFILE_INTS = ["yearsExperience", "openingBalance"];

  /** Onboarding profile fields accepted on create/update (all optional, additive). */
  private onboardingData(dto: any) {
    const d: any = {};
    for (const k of AgentsService.PROFILE_STRINGS) if (dto[k] !== undefined) d[k] = dto[k] || null;
    for (const k of AgentsService.PROFILE_DATES) if (dto[k] !== undefined) d[k] = dto[k] ? new Date(dto[k]) : null;
    for (const k of AgentsService.PROFILE_INTS) if (dto[k] !== undefined) d[k] = dto[k] === "" || dto[k] == null ? null : Math.round(Number(dto[k]));
    if (dto.tierId !== undefined) d.tierId = dto.tierId || null;
    return d;
  }

  /** Friendly duplicate pre-checks (email also has a DB @unique). Reuses the findFirst pattern. */
  private async assertNoDuplicate(dto: any, excludeId?: string) {
    const not = excludeId ? { id: { not: excludeId } } : {};
    const checks: [string, any][] = [];
    if (dto.phone) checks.push(["phone", { phone: dto.phone }]);
    if (dto.email) checks.push(["email", { email: String(dto.email).toLowerCase() }]);
    if (dto.tradeLicenseNo) checks.push(["trade license", { tradeLicenseNo: dto.tradeLicenseNo }]);
    if (dto.nationalId) checks.push(["national ID", { nationalId: dto.nationalId }]);
    for (const [label, where] of checks) {
      const hit = await this.prisma.agent.findFirst({ where: { ...where, ...not, deletedAt: null }, select: { id: true, code: true } });
      if (hit) throw new BadRequestException(`An agent with this ${label} already exists (${hit.code}).`);
    }
  }

  // ---- Agents ----
  async list(q: any) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    // "inactive" surfaces DEACTIVATED (soft-deleted) agents so they can be restored.
    const where: any = q.status === "inactive" ? { deletedAt: { not: null } } : { deletedAt: null };
    if (q.q) where.OR = ["name", "code", "phone", "email", "companyName"].map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
    if (q.status && q.status !== "inactive") where.status = q.status;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.agent.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit, include: { tier: true } }),
      this.prisma.agent.count({ where }),
    ]);
    const withBlockers = await this.attachBlockers(data);
    return { data: withBlockers, total, page, limit };
  }

  /**
   * Deactivation blockers per agent (3 grouped queries, not N+1): outstanding
   * commission (pending/approved), pending wallet withdrawal (requested), and
   * pending bookings (not completed/cancelled/rejected). Drives the disabled
   * Delete button + the authoritative guard in softDelete().
   */
  private async blockersFor(ids: string[]) {
    if (ids.length === 0) return new Map<string, { outstandingCommission: boolean; pendingWithdrawal: boolean; pendingBookings: boolean }>();
    const [comm, wd, book] = await Promise.all([
      this.prisma.commission.groupBy({ by: ["agentId"], where: { agentId: { in: ids }, status: { in: ["pending", "approved"] } }, _count: { _all: true } }),
      this.prisma.walletWithdrawalRequest.groupBy({ by: ["agentId"], where: { agentId: { in: ids }, status: "requested" }, _count: { _all: true } }),
      this.prisma.application.groupBy({ by: ["agentId"], where: { agentId: { in: ids }, deletedAt: null, status: { notIn: ["completed", "cancelled", "rejected"] as any } }, _count: { _all: true } }),
    ]);
    const cs = new Set(comm.map((x) => x.agentId));
    const ws = new Set(wd.map((x) => x.agentId));
    const bs = new Set(book.map((x) => x.agentId).filter(Boolean) as string[]);
    return new Map(ids.map((id) => [id, { outstandingCommission: cs.has(id), pendingWithdrawal: ws.has(id), pendingBookings: bs.has(id) }]));
  }
  private async attachBlockers<T extends { id: string }>(rows: T[]) {
    const ids = rows.map((r) => r.id);
    const [map, photo, activity] = await Promise.all([
      this.blockersFor(ids),
      // Avatar presence — latest uploaded "Agent Photo" document (reuses Document store).
      ids.length
        ? this.prisma.document.findMany({
            where: { ownerType: "agent", ownerId: { in: ids }, deletedAt: null, category: { contains: "photo", mode: "insensitive" } },
            select: { ownerId: true },
          })
        : Promise.resolve([] as { ownerId: string | null }[]),
      // Last activity — most recent AuditLog row for the agent (reused AuditLog, no new store).
      ids.length
        ? this.prisma.auditLog.groupBy({ by: ["entityId"], where: { entityType: "Agent", entityId: { in: ids } }, _max: { createdAt: true } })
        : Promise.resolve([] as { entityId: string | null; _max: { createdAt: Date | null } }[]),
    ]);
    const withPhoto = new Set(photo.map((d) => d.ownerId).filter(Boolean) as string[]);
    const lastAt = new Map(activity.map((a) => [a.entityId, a._max.createdAt] as const));
    return rows.map((r) => {
      const b = map.get(r.id) ?? { outstandingCommission: false, pendingWithdrawal: false, pendingBookings: false };
      return {
        ...r,
        blockers: b,
        canDeactivate: !b.outstandingCommission && !b.pendingWithdrawal && !b.pendingBookings,
        hasPhoto: withPhoto.has(r.id),
        lastActivityAt: lastAt.get(r.id) ?? null,
      };
    });
  }
  async get(id: string) {
    const a = await this.prisma.agent.findFirst({ where: { id, deletedAt: null },
      include: { tier: true, commissions: { orderBy: { createdAt: "desc" }, take: 50 }, wallet: { orderBy: { createdAt: "desc" }, take: 50 } } });
    if (!a) throw new NotFoundException("Agent not found");
    return a;
  }
  /** Audit trail for one agent — reuses AuditLog, no dedicated timeline store. */
  timeline(id: string) {
    return this.prisma.auditLog.findMany({ where: { entityType: "Agent", entityId: id }, orderBy: { createdAt: "desc" }, take: 100 });
  }
  async create(dto: any, user: AuthedUser) {
    // Required fields (owner name is required for commercial onboarding).
    if (!dto.name?.trim()) throw new BadRequestException("Agent name is required");
    if (!dto.ownerName?.trim()) throw new BadRequestException("Owner / proprietor name is required");
    if (!dto.tradeLicenseNo?.trim() && !dto.nationalId?.trim()) {
      throw new BadRequestException("Trade License Number or National ID is required");
    }
    await this.assertNoDuplicate(dto);
    const code = `AGT-${String((await this.prisma.agent.count()) + 1).padStart(5, "0")}`;
    // Onboarding applicant starts `pending` (needs approval); a directly-added
    // known agent stays `active` (existing quick-add behaviour, unchanged).
    const asApplicant = dto.status === "pending" || dto.onboarding === true;
    const status = asApplicant ? "pending" : "active";
    const agent = await this.prisma.agent.create({ data: {
      code, name: dto.name, phone: dto.phone, email: dto.email || null, address: dto.address,
      commissionRateBps: Math.round(Number(dto.commissionRateBps) || 0), createdBy: user.id,
      status, ...this.onboardingData(dto),
      ...(asApplicant ? { appliedAt: new Date(), kycStatus: "pending" } : {}),
    } });
    await this.audit(user, asApplicant ? "agent.onboarding.apply" : "agent.create", agent.id, undefined, { status, name: agent.name });
    if (asApplicant) {
      await this.notes.enqueue({ channel: "inapp", recipient: "staff", subject: "New agent application",
        body: `${agent.name} (${agent.code}) applied and is pending review.`, relatedType: "Agent", relatedId: agent.id });
    }
    return agent;
  }
  async update(id: string, dto: any, user: AuthedUser) {
    const before = await this.get(id);
    await this.assertNoDuplicate(dto, id);
    const { name, phone, address, kycNotes } = dto;
    const agent = await this.prisma.agent.update({ where: { id }, data: { name, phone, address, kycNotes,
      email: dto.email !== undefined ? (dto.email || null) : undefined,
      commissionRateBps: dto.commissionRateBps != null ? Math.round(Number(dto.commissionRateBps)) : undefined,
      ...this.onboardingData(dto) } });
    await this.audit(user, "agent.update", id, { name: before.name, tierId: before.tierId }, { name: agent.name, tierId: agent.tierId });
    return agent;
  }

  // ---- V6 Phase 1: onboarding lifecycle ----
  /** KYC review outcome (does not change agent status; approval is a separate step). */
  async reviewKyc(id: string, dto: any, user: AuthedUser) {
    await this.get(id);
    const kycStatus = ["pending", "verified", "rejected"].includes(dto.kycStatus) ? dto.kycStatus : "pending";
    const agent = await this.prisma.agent.update({ where: { id }, data: { kycStatus, kycNotes: dto.kycNotes ?? undefined, reviewedBy: user.id, reviewedAt: new Date() } });
    await this.audit(user, "agent.kyc.review", id, undefined, { kycStatus });
    return agent;
  }
  /** pending → active. Only a pending applicant can be approved. */
  async approve(id: string, user: AuthedUser) {
    const a = await this.get(id);
    if (a.status !== "pending") throw new BadRequestException("Only a pending agent can be approved");
    const agent = await this.prisma.agent.update({ where: { id }, data: { status: "active", approvedAt: new Date(), approvedBy: user.id } });
    await this.audit(user, "agent.onboarding.approve", id, { status: "pending" }, { status: "active" });
    await this.notes.enqueue({ channel: a.email ? "email" : "inapp", recipient: a.email || a.code,
      subject: "Your agent account is approved", body: `${a.name}, your agent account (${a.code}) has been approved and is now active.`,
      relatedType: "Agent", relatedId: id });
    return agent;
  }
  /** pending → rejected. Requires a reason. */
  async reject(id: string, dto: any, user: AuthedUser) {
    const a = await this.get(id);
    if (a.status !== "pending") throw new BadRequestException("Only a pending agent can be rejected");
    if (!dto.reason?.trim()) throw new BadRequestException("A rejection reason is required");
    const agent = await this.prisma.agent.update({ where: { id }, data: { status: "rejected", rejectedAt: new Date(), rejectedReason: dto.reason.trim(), reviewedBy: user.id } });
    await this.audit(user, "agent.onboarding.reject", id, { status: "pending" }, { status: "rejected", reason: dto.reason.trim() });
    await this.notes.enqueue({ channel: a.email ? "email" : "inapp", recipient: a.email || a.code,
      subject: "Your agent application", body: `${a.name}, your agent application (${a.code}) was not approved.`, relatedType: "Agent", relatedId: id });
    return agent;
  }
  /** active → suspended. */
  async suspend(id: string, user: AuthedUser) {
    const a = await this.get(id);
    if (a.status !== "active") throw new BadRequestException("Only an active agent can be suspended");
    const agent = await this.prisma.agent.update({ where: { id }, data: { status: "suspended" } });
    await this.audit(user, "agent.suspend", id, { status: "active" }, { status: "suspended" });
    return agent;
  }
  /** suspended → active. */
  async reinstate(id: string, user: AuthedUser) {
    const a = await this.get(id);
    if (a.status !== "suspended") throw new BadRequestException("Only a suspended agent can be reinstated");
    const agent = await this.prisma.agent.update({ where: { id }, data: { status: "active" } });
    await this.audit(user, "agent.reinstate", id, { status: "suspended" }, { status: "active" });
    return agent;
  }

  // ---- Agent tiers (classification; no money logic in Phase 1) ----
  listTiers() {
    return this.prisma.agentTier.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  }
  async createTier(dto: any, user: AuthedUser) {
    if (!dto.name?.trim()) throw new BadRequestException("name required");
    const code = (dto.code || dto.name).trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 24);
    return this.prisma.agentTier.create({ data: { code, name: dto.name.trim(), description: dto.description || null,
      sortOrder: Number(dto.sortOrder) || 0, createdBy: user.id } });
  }
  async updateTier(id: string, dto: any) {
    const t = await this.prisma.agentTier.findUnique({ where: { id } });
    if (!t) throw new NotFoundException("Tier not found");
    return this.prisma.agentTier.update({ where: { id }, data: { name: dto.name?.trim() ?? undefined,
      description: dto.description ?? undefined, sortOrder: dto.sortOrder != null ? Number(dto.sortOrder) : undefined,
      active: typeof dto.active === "boolean" ? dto.active : undefined } });
  }
  /** View action — returns the agent and records an audit entry (spec: View is audited). */
  async getForView(id: string, user: AuthedUser) {
    const a = await this.get(id);
    await this.audit(user, "agent.view", id);
    return a;
  }

  /**
   * Enterprise soft delete = DEACTIVATE. Never hard-deletes; bookings, customers,
   * commission and wallet history remain. Sets status=inactive + deletedAt +
   * deletedBy, audits, and notifies. Customer ownership is NOT auto-released.
   */
  async softDelete(id: string, user: AuthedUser) {
    const a = await this.get(id); // throws if already deactivated (deletedAt filter)
    const b = (await this.blockersFor([id])).get(id);
    if (b && (b.outstandingCommission || b.pendingWithdrawal || b.pendingBookings)) {
      const reasons = [
        b.outstandingCommission && "outstanding commission",
        b.pendingWithdrawal && "a pending wallet withdrawal",
        b.pendingBookings && "pending bookings",
      ].filter(Boolean).join(", ");
      throw new BadRequestException(`Cannot deactivate: ${reasons}. Resolve these first.`);
    }
    const agent = await this.prisma.agent.update({ where: { id }, data: { status: "inactive", deletedAt: new Date(), deletedBy: user.id } });
    await this.audit(user, "agent.deactivate", id, { status: a.status }, { status: "inactive" });
    await this.notes.enqueue({ channel: "inapp", recipient: "staff", subject: "Agent deactivated",
      body: `${a.name} (${a.code}) was deactivated. Bookings, customers, commission and wallet history are retained.`, relatedType: "Agent", relatedId: id });
    return { ok: true, agent };
  }

  /** Restore a deactivated agent → active. Audits + notifies. */
  async restore(id: string, user: AuthedUser) {
    const a = await this.prisma.agent.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!a) throw new NotFoundException("Deactivated agent not found");
    const agent = await this.prisma.agent.update({ where: { id }, data: { status: "active", deletedAt: null, deletedBy: null } });
    await this.audit(user, "agent.restore", id, { status: a.status, deactivated: true }, { status: "active" });
    await this.notes.enqueue({ channel: "inapp", recipient: "staff", subject: "Agent restored",
      body: `${a.name} (${a.code}) was restored to active.`, relatedType: "Agent", relatedId: id });
    return agent;
  }

  // ---- Wallet posting helper (in-txn) ----
  private async postWallet(tx: any, agentId: string, amount: number, type: string, memo: string, userId: string, rel?: { type: string; id: string }) {
    const agent = await tx.agent.findFirst({ where: { id: agentId, deletedAt: null } });
    if (!agent) throw new NotFoundException("Agent not found");
    const runningBalance = agent.walletBalance + amount; // immutable ledger snapshot
    const txn = await tx.agentWalletTxn.create({ data: { agentId, amount, type, memo, createdBy: userId, relatedType: rel?.type, relatedId: rel?.id, runningBalance } });
    await tx.agent.update({ where: { id: agentId }, data: { walletBalance: runningBalance } });
    return txn;
  }

  // ---- Commissions ----
  listCommissions(q: any) {
    const where: any = {};
    if (q.agentId) where.agentId = q.agentId;
    if (q.status) where.status = q.status;
    return this.prisma.commission.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  }
  async createCommission(dto: any, user: AuthedUser) {
    const amount = Math.round(Number(dto.amount));
    if (!(amount > 0)) throw new BadRequestException("amount must be positive (minor units)");
    if (!dto.agentId) throw new BadRequestException("agentId required");
    await this.get(dto.agentId);
    // BUG-01 — ONE INVOICE = ONE COMMISSION ACCRUAL applies to this manual path
    // too. The unique index on Commission(invoiceId) is the real guarantee; this
    // check only turns it into a clear message instead of a raw 500. Manual
    // commissions with no invoice (invoiceId null) remain unrestricted.
    if (dto.invoiceId) {
      const existing = await this.prisma.commission.findFirst({ where: { invoiceId: dto.invoiceId } });
      if (existing) {
        throw new BadRequestException(
          `This invoice already has a commission (${existing.id}). One invoice accrues commission once.`,
        );
      }
    }
    return this.prisma.commission.create({ data: { agentId: dto.agentId, amount, applicationId: dto.applicationId ?? null,
      invoiceId: dto.invoiceId ?? null, note: dto.note, status: "pending", createdBy: user.id } });
  }
  async approveCommission(id: string) {
    const c = await this.prisma.commission.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Commission not found");
    if (c.status !== "pending") throw new BadRequestException("Only pending commissions can be approved");
    return this.prisma.commission.update({ where: { id }, data: { status: "approved", approvedAt: new Date() } });
  }
  /** Pay an approved commission → credits the agent wallet, transactionally. */
  async payCommission(id: string, user: AuthedUser) {
    return this.prisma.$transaction(async (tx) => {
      const c = await tx.commission.findUnique({ where: { id } });
      if (!c) throw new NotFoundException("Commission not found");
      if (c.status !== "approved") throw new BadRequestException("Only approved commissions can be paid");
      await this.postWallet(tx, c.agentId, c.amount, "commission_credit", `Commission ${id}`, user.id, { type: "commission", id });
      // V6 Wave 1: settle the commission ledger (reduces owed balance as value moves to the wallet)
      const last = await tx.commissionLedger.findFirst({ where: { agentId: c.agentId }, orderBy: { createdAt: "desc" } });
      await tx.commissionLedger.create({ data: { agentId: c.agentId, commissionId: c.id, entryType: "settle", amount: -c.amount, runningBalance: (last?.runningBalance || 0) - c.amount, memo: `Settled commission ${id} → wallet`, createdBy: user.id } });
      return tx.commission.update({ where: { id }, data: { status: "paid", paidAt: new Date() } });
    });
  }

  // ---- Wallet adjustments / withdrawals ----
  async walletTxn(agentId: string, dto: any, user: AuthedUser) {
    const raw = Math.round(Number(dto.amount));
    if (!raw || raw === 0) throw new BadRequestException("amount required (non-zero minor units)");
    const type = dto.type === "withdrawal" ? "withdrawal" : "adjustment";
    const amount = type === "withdrawal" ? -Math.abs(raw) : raw; // withdrawals always debit
    return this.prisma.$transaction(async (tx) => {
      const agent = await tx.agent.findFirst({ where: { id: agentId, deletedAt: null } });
      if (!agent) throw new NotFoundException("Agent not found");
      if (agent.walletBalance + amount < 0) throw new BadRequestException("Insufficient wallet balance");
      await this.postWallet(tx, agentId, amount, type, dto.memo || type, user.id);
      return tx.agent.findUnique({ where: { id: agentId } });
    });
  }

  // ================= V6 Wave 1: immutable wallet ledger + funding rails =================

  /** Append-only ledger (immutable). Each row carries its running-balance snapshot. */
  async walletLedger(agentId: string) {
    return this.prisma.agentWalletTxn.findMany({ where: { agentId }, orderBy: { createdAt: "desc" }, take: 200 });
  }

  /** Reconcile the denormalized cache against the ledger sum; report (never auto-fix) drift. */
  async reconcileWallet(agentId: string) {
    const agent = await this.get(agentId);
    const agg = await this.prisma.agentWalletTxn.aggregate({ where: { agentId }, _sum: { amount: true } });
    const ledgerSum = agg._sum.amount ?? 0;
    return { agentId, cachedBalance: agent.walletBalance, ledgerSum, drift: agent.walletBalance - ledgerSum, reconciled: agent.walletBalance === ledgerSum };
  }

  listWalletRequests(agentId?: string, status?: string) {
    const where: any = { ...(agentId ? { agentId } : {}), ...(status ? { status } : {}) };
    return Promise.all([
      this.prisma.walletTopupRequest.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
      this.prisma.walletWithdrawalRequest.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    ]).then(([topups, withdrawals]) => ({ topups, withdrawals }));
  }

  // ---- Top-up (funding) ----
  async createTopupRequest(agentId: string, dto: any, user: AuthedUser) {
    await this.get(agentId);
    const amount = Math.round(Number(dto.amount));
    if (!(amount > 0)) throw new BadRequestException("amount must be positive (minor units)");
    return this.prisma.walletTopupRequest.create({ data: { agentId, amount, proofDocumentId: dto.proofDocumentId ?? null, memo: dto.memo ?? null, requestedBy: user.id } });
  }
  async decideTopup(id: string, approve: boolean, user: AuthedUser) {
    const req = await this.prisma.walletTopupRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException("Top-up request not found");
    if (req.status !== "requested") throw new BadRequestException("Request already decided");
    if (!approve) return this.prisma.walletTopupRequest.update({ where: { id }, data: { status: "rejected", decidedBy: user.id, decidedAt: new Date() } });
    return this.prisma.$transaction(async (tx) => {
      const txn = await this.postWallet(tx, req.agentId, req.amount, "topup", `Top-up ${id}`, user.id, { type: "topup", id });
      return tx.walletTopupRequest.update({ where: { id }, data: { status: "posted", decidedBy: user.id, decidedAt: new Date(), txnId: txn.id } });
    });
  }

  // ---- Withdrawal (payout) ----
  async createWithdrawalRequest(agentId: string, dto: any, user: AuthedUser) {
    const agent = await this.get(agentId);
    const amount = Math.round(Number(dto.amount));
    if (!(amount > 0)) throw new BadRequestException("amount must be positive (minor units)");
    if (amount > agent.walletBalance) throw new BadRequestException("Requested amount exceeds wallet balance");
    return this.prisma.walletWithdrawalRequest.create({ data: { agentId, amount, method: dto.method === "cash" ? "cash" : "bank", bankRef: dto.bankRef ?? null, memo: dto.memo ?? null, requestedBy: user.id } });
  }
  async decideWithdrawal(id: string, approve: boolean, user: AuthedUser) {
    const req = await this.prisma.walletWithdrawalRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException("Withdrawal request not found");
    if (req.status !== "requested") throw new BadRequestException("Request already decided");
    if (!approve) return this.prisma.walletWithdrawalRequest.update({ where: { id }, data: { status: "rejected", decidedBy: user.id, decidedAt: new Date() } });
    return this.prisma.$transaction(async (tx) => {
      const agent = await tx.agent.findFirst({ where: { id: req.agentId, deletedAt: null } });
      if (!agent) throw new NotFoundException("Agent not found");
      if (agent.walletBalance - req.amount < 0) throw new BadRequestException("Insufficient wallet balance");
      const txn = await this.postWallet(tx, req.agentId, -req.amount, "withdrawal", `Withdrawal ${id}${req.bankRef ? ` ref ${req.bankRef}` : ""}`, user.id, { type: "withdrawal", id });
      return tx.walletWithdrawalRequest.update({ where: { id }, data: { status: "paid", decidedBy: user.id, decidedAt: new Date(), txnId: txn.id } });
    });
  }
}
