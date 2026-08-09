import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

/**
 * V6 Wave 1 — Commission engine. Rules (basis × scope, effective-dated,
 * prioritised) produce a Commission from a commissionable event. The PRIMARY
 * agent earns 100% in Wave 1 (splits are a future capability). Generation is a
 * staff action (preview → confirm), not silent auto-post. A generated commission
 * writes an append-only CommissionLedger `earn` entry; paying it later settles
 * the ledger and credits the wallet (existing rail).
 */
@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  // ---------- Rules CRUD ----------
  listRules(q: any) {
    const where: any = { deletedAt: null };
    if (q?.active != null) where.active = q.active === "true" || q.active === true;
    return this.prisma.commissionRule.findMany({ where, orderBy: [{ priority: "desc" }, { createdAt: "desc" }] });
  }
  async createRule(dto: any, user: AuthedUser) {
    if (!dto.name?.trim()) throw new BadRequestException("name required");
    if (!["fixed", "percentage"].includes(dto.basis)) throw new BadRequestException("basis must be fixed | percentage");
    const value = Math.round(Number(dto.value));
    if (!(value >= 0)) throw new BadRequestException("value must be >= 0 (poisha for fixed, bps for percentage)");
    return this.prisma.commissionRule.create({
      data: {
        name: dto.name.trim(), basis: dto.basis, value, active: dto.active ?? true, priority: Number(dto.priority) || 0,
        agentId: dto.agentId || null, agentTierId: dto.agentTierId || null, serviceType: dto.serviceType || null,
        countryCode: dto.countryCode || null, packageId: dto.packageId || null, branchId: dto.branchId || null,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null, createdBy: user.id,
      },
    });
  }
  async updateRule(id: string, dto: any) {
    const r = await this.prisma.commissionRule.findFirst({ where: { id, deletedAt: null } });
    if (!r) throw new NotFoundException("Rule not found");
    return this.prisma.commissionRule.update({
      where: { id },
      data: {
        name: dto.name?.trim() ?? undefined, basis: dto.basis ?? undefined,
        value: dto.value != null ? Math.round(Number(dto.value)) : undefined,
        active: typeof dto.active === "boolean" ? dto.active : undefined,
        priority: dto.priority != null ? Number(dto.priority) : undefined,
        agentId: dto.agentId !== undefined ? dto.agentId || null : undefined,
        serviceType: dto.serviceType !== undefined ? dto.serviceType || null : undefined,
        packageId: dto.packageId !== undefined ? dto.packageId || null : undefined,
      },
    });
  }
  async deleteRule(id: string) {
    await this.prisma.commissionRule.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
    return { ok: true };
  }

  // ---------- Matching + compute ----------
  private specificity(r: any) {
    return [r.agentId, r.agentTierId, r.serviceType, r.countryCode, r.packageId, r.branchId].filter(Boolean).length;
  }
  /** Most-specific active, in-date rule matching the context (priority → specificity → newest). */
  async matchRule(ctx: { agentId?: string | null; agentTierId?: string | null; serviceType?: string | null; countryCode?: string | null; packageId?: string | null; branchId?: string | null }) {
    const now = new Date();
    const rules = await this.prisma.commissionRule.findMany({
      where: {
        active: true, deletedAt: null,
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: now } }] },
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
        ],
      },
    });
    const matched = rules.filter((r) =>
      (!r.agentId || r.agentId === ctx.agentId) &&
      (!r.agentTierId || r.agentTierId === ctx.agentTierId) &&
      (!r.serviceType || r.serviceType === ctx.serviceType) &&
      (!r.countryCode || r.countryCode === ctx.countryCode) &&
      (!r.packageId || r.packageId === ctx.packageId) &&
      (!r.branchId || r.branchId === ctx.branchId));
    if (!matched.length) return null;
    matched.sort((a, b) => b.priority - a.priority || this.specificity(b) - this.specificity(a) || (b.effectiveFrom?.getTime() || 0) - (a.effectiveFrom?.getTime() || 0));
    return matched[0];
  }
  private compute(base: number, basis: string, value: number) {
    return basis === "fixed" ? value : Math.round((base * value) / 10000); // bps
  }

  // ---------- Preview / generate for an invoice ----------
  private async resolveInvoice(invoiceId: string) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null },
      include: { application: true, customer: { select: { primaryAgentId: true } } },
    });
    if (!inv) throw new NotFoundException("Invoice not found");
    const agentId = inv.application?.agentId || inv.customer?.primaryAgentId || null;
    return { inv, agentId };
  }

  async previewForInvoice(invoiceId: string) {
    const { inv, agentId } = await this.resolveInvoice(invoiceId);
    if (!agentId) return { invoiceId, agentId: null, baseAmount: inv.total, computedAmount: 0, source: "none" as const };
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    const base = inv.total;
    const rule = await this.matchRule({
      agentId, agentTierId: agent?.tierId ?? null, serviceType: inv.application?.serviceType ?? null,
      packageId: inv.application?.packageId ?? null, branchId: inv.branchId,
    });
    if (rule) {
      return { invoiceId, agentId, agentName: agent?.name, baseAmount: base, basis: rule.basis, value: rule.value,
        computedAmount: this.compute(base, rule.basis, rule.value), source: "rule" as const, ruleId: rule.id, ruleName: rule.name };
    }
    // Fallback: the agent's configured percentage rate (activates commissionRateBps).
    const bps = agent?.commissionRateBps || 0;
    return { invoiceId, agentId, agentName: agent?.name, baseAmount: base, basis: "percentage", value: bps,
      computedAmount: this.compute(base, "percentage", bps), source: bps > 0 ? ("agent_rate" as const) : ("none" as const) };
  }

  /**
   * Create a pending Commission from the matched rule/rate + write an earn
   * ledger entry.
   *
   * BUG-01 — idempotent per INVOICE, not per (invoice, agent).
   *
   * The old guard keyed on (invoiceId, agentId), so reassigning customer
   * ownership and re-running this accrued a SECOND commission and a SECOND
   * `earn` ledger entry for the new agent on the same invoice. The business rule
   * is ONE INVOICE = ONE COMMISSION ACCRUAL, and an already-earned commission
   * stays attributed to the agent who earned it — ownership changes never
   * retro-transfer it.
   *
   * Concurrency: the pre-check alone is a race, so the real guarantee is the
   * unique index on Commission(invoiceId). Both the check and the write live
   * inside one transaction, and a unique-violation (P2002) from a racing request
   * is resolved by returning the commission that won.
   */
  async generateForInvoice(invoiceId: string, user: AuthedUser) {
    const existingBefore = await this.prisma.commission.findFirst({ where: { invoiceId } });
    if (existingBefore) return existingBefore;

    const p = await this.previewForInvoice(invoiceId);
    if (!p.agentId) throw new BadRequestException("No agent owns this invoice — nothing to accrue");
    if (!(p.computedAmount > 0)) throw new BadRequestException("Computed commission is zero (no matching rule or rate)");
    const applicationId = (await this.resolveInvoice(invoiceId)).inv.applicationId ?? null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Re-check inside the transaction so a commission created between the
        // preview and the write is honoured rather than duplicated.
        const existing = await tx.commission.findFirst({ where: { invoiceId } });
        if (existing) return existing;

        const c = await tx.commission.create({
          data: {
            agentId: p.agentId as string, invoiceId, applicationId,
            amount: p.computedAmount, baseAmount: p.baseAmount, status: "pending", trigger: "on_invoice",
            ruleId: "ruleId" in p ? (p.ruleId as string) : null,
            ruleSnapshot: { basis: p.basis, value: p.value, source: p.source } as any, createdBy: user.id,
          },
        });
        const last = await tx.commissionLedger.findFirst({ where: { agentId: p.agentId as string }, orderBy: { createdAt: "desc" } });
        await tx.commissionLedger.create({
          data: { agentId: p.agentId as string, commissionId: c.id, entryType: "earn", amount: p.computedAmount,
            runningBalance: (last?.runningBalance || 0) + p.computedAmount, memo: `Earn on invoice ${invoiceId}`, createdBy: user.id },
        });
        return c;
      });
    } catch (e) {
      // A concurrent request won the unique index — return its commission so the
      // caller still gets exactly one, and no second ledger entry was written.
      if ((e as { code?: string })?.code === "P2002") {
        const winner = await this.prisma.commission.findFirst({ where: { invoiceId } });
        if (winner) return winner;
      }
      throw e;
    }
  }

  ledger(agentId: string) {
    return this.prisma.commissionLedger.findMany({ where: { agentId }, orderBy: { createdAt: "desc" }, take: 200 });
  }
}
