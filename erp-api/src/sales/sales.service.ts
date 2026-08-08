import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { ApplicationsService } from "../applications/applications.service";

const HQ = new Set(["super_admin", "general_manager"]);
const QUOTE_SERVICES = new Set(["visa", "air_ticket", "hotel", "tour", "hajj", "umrah"]);

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private apps: ApplicationsService,
  ) {}

  private branchFilter(user: AuthedUser) {
    return HQ.has(user.role) ? {} : { branchId: user.branchId ?? "__none__" };
  }

  private async audit(userId: string | undefined, action: string, entityType: string, entityId: string | null, after?: unknown) {
    await this.prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId,
        after: after == null ? undefined : (after as any),
      },
    });
  }

  private async nextCode(prefix: string, model: "priceTemplate" | "priceBook" | "quotation") {
    for (let i = 0; i < 6; i++) {
      const count = await (this.prisma as any)[model].count();
      const candidate = `${prefix}${String(count + 1 + i).padStart(5, "0")}`;
      if (model === "quotation") {
        const clash = await this.prisma.quotation.findFirst({ where: { quoteNo: candidate } });
        if (!clash) return candidate;
      } else {
        const clash = await (this.prisma as any)[model].findFirst({ where: { code: candidate } });
        if (!clash) return candidate;
      }
    }
    return `${prefix}${Date.now().toString().slice(-8)}`;
  }

  async bootstrap(user: AuthedUser) {
    const stages = await this.prisma.salesStage.count();
    const reasons = await this.prisma.lostReason.count();
    if (stages === 0) {
      const defaults = [
        ["qualification", "Qualification", 10, 2000, false, false, false],
        ["needs_analysis", "Needs Analysis", 20, 4000, false, false, false],
        ["proposal", "Proposal", 30, 6000, false, false, false],
        ["negotiation", "Negotiation", 40, 7500, false, false, false],
        ["won", "Won", 90, 10000, true, false, false],
        ["lost", "Lost", 91, 0, false, true, false],
        ["converted", "Converted", 100, 10000, false, false, true],
      ] as const;
      for (const [code, name, sortOrder, prob, isWon, isLost, isConverted] of defaults) {
        await this.prisma.salesStage.create({
          data: { code, name, sortOrder, defaultProbabilityBps: prob, isWon, isLost, isConverted },
        });
      }
    }
    if (reasons === 0) {
      for (const [code, label, sortOrder] of [
        ["price", "Price too high", 10],
        ["competitor", "Chose competitor", 20],
        ["timing", "Timing / postponed", 30],
        ["no_budget", "No budget", 40],
        ["no_response", "No response", 50],
        ["other", "Other", 90],
      ] as const) {
        await this.prisma.lostReason.create({ data: { code, label, sortOrder } });
      }
    }
    await this.audit(user.id, "sales.bootstrap", "SalesStage", null, { stages, reasons });
    return { ok: true, stages: await this.listStages(), lostReasons: await this.listLostReasons() };
  }

  // ---------- Stages / lost reasons ----------
  listStages() {
    return this.prisma.salesStage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  }

  async createStage(dto: any, user: AuthedUser) {
    if (!dto?.code?.trim() || !dto?.name?.trim()) throw new BadRequestException("code and name required");
    const row = await this.prisma.salesStage.create({
      data: {
        code: String(dto.code).trim(),
        name: String(dto.name).trim(),
        sortOrder: Number(dto.sortOrder) || 0,
        defaultProbabilityBps: Number(dto.defaultProbabilityBps) || 2000,
        isWon: !!dto.isWon,
        isLost: !!dto.isLost,
        isConverted: !!dto.isConverted,
      },
    });
    await this.audit(user.id, "sales.stage.create", "SalesStage", row.id, row);
    return row;
  }

  listLostReasons() {
    return this.prisma.lostReason.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  }

  async createLostReason(dto: any, user: AuthedUser) {
    if (!dto?.code?.trim() || !dto?.label?.trim()) throw new BadRequestException("code and label required");
    const row = await this.prisma.lostReason.create({
      data: { code: String(dto.code).trim(), label: String(dto.label).trim(), sortOrder: Number(dto.sortOrder) || 0 },
    });
    await this.audit(user.id, "sales.lost_reason.create", "LostReason", row.id, row);
    return row;
  }

  // ---------- Opportunity stage with history ----------
  async setOpportunityStage(id: string, dto: any, user: AuthedUser) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
    });
    if (!opp) throw new NotFoundException("Opportunity not found");
    const toStage = String(dto.stage || "").trim();
    if (!toStage) throw new BadRequestException("stage required");
    const stageRow = await this.prisma.salesStage.findFirst({ where: { code: toStage, isActive: true } });
    const probabilityBps =
      dto.probabilityBps != null
        ? Number(dto.probabilityBps)
        : stageRow?.defaultProbabilityBps ?? opp.probabilityBps;

    const data: any = { stage: toStage, probabilityBps };
    if (stageRow?.isWon || toStage === "won") {
      data.status = "won";
      data.wonAt = new Date();
    } else if (stageRow?.isLost || toStage === "lost") {
      if (!dto.lostReasonId && !dto.lostReason) throw new BadRequestException("lostReasonId or lostReason required for loss");
      data.status = "lost";
      data.lostAt = new Date();
      data.lostReasonId = dto.lostReasonId || null;
      data.lostReason = dto.lostReason || null;
    } else if (stageRow?.isConverted || toStage === "converted") {
      data.status = "converted";
      data.convertedAt = new Date();
    } else {
      data.status = "open";
    }

    const row = await this.prisma.opportunity.update({ where: { id }, data });
    await this.prisma.opportunityStageHistory.create({
      data: {
        opportunityId: id,
        fromStage: opp.stage,
        toStage,
        probabilityBps,
        note: dto.note || null,
        lostReasonId: dto.lostReasonId || null,
        changedBy: user.id,
      },
    });
    await this.audit(user.id, "sales.opportunity.stage", "Opportunity", id, row);
    return row;
  }

  async opportunityHistory(id: string, user: AuthedUser) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
      select: { id: true },
    });
    if (!opp) throw new NotFoundException("Opportunity not found");
    return this.prisma.opportunityStageHistory.findMany({
      where: { opportunityId: id },
      orderBy: { changedAt: "asc" },
    });
  }

  // ---------- Quotations ----------
  private calcTotals(lines: { amountPoisha: number }[], discountPoisha: number, discountBps: number, taxPoisha: number) {
    const subtotal = lines.reduce((s, l) => s + l.amountPoisha, 0);
    const pctDisc = Math.round((subtotal * Math.max(0, discountBps)) / 10000);
    const discount = Math.max(0, discountPoisha) + pctDisc;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.max(0, taxPoisha);
    return { subtotalPoisha: subtotal, discountPoisha: discount, taxPoisha: tax, totalPoisha: taxable + tax };
  }

  private buildLines(linesIn: any[]) {
    if (!Array.isArray(linesIn) || linesIn.length < 1) throw new BadRequestException("At least one line required");
    return linesIn.map((l: any, i: number) => {
      const qty = Math.max(1, Number(l.quantity) || 1);
      const unit = Math.max(0, Number(l.unitPricePoisha) || 0);
      const lineDisc = Math.max(0, Number(l.discountPoisha) || 0);
      const amount = Math.max(0, qty * unit - lineDisc);
      return {
        lineNo: i + 1,
        productCode: l.productCode || null,
        description: String(l.description || "Item").trim(),
        quantity: qty,
        unitPricePoisha: unit,
        discountPoisha: lineDisc,
        amountPoisha: amount,
      };
    });
  }

  listQuotations(q: any, user: AuthedUser) {
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.status) where.status = q.status;
    if (q.serviceType) where.serviceType = q.serviceType;
    if (q.rootQuoteId) where.rootQuoteId = q.rootQuoteId;
    return this.prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        lines: { orderBy: { lineNo: "asc" } },
        opportunity: { select: { id: true, opportunityNo: true, title: true } },
        lead: { select: { id: true, name: true } },
      },
    });
  }

  async getQuotation(id: string, user: AuthedUser) {
    const q = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(user) },
      include: { lines: { orderBy: { lineNo: "asc" } }, opportunity: true, lead: true },
    });
    if (!q) throw new NotFoundException("Quotation not found");
    return q;
  }

  async createQuotation(dto: any, user: AuthedUser) {
    const serviceType = String(dto.serviceType || "");
    if (!QUOTE_SERVICES.has(serviceType)) throw new BadRequestException("Invalid serviceType");
    const lines = this.buildLines(dto.lines || []);
    const totals = this.calcTotals(lines, Number(dto.discountPoisha) || 0, Number(dto.discountBps) || 0, Number(dto.taxPoisha) || 0);
    const quoteNo = await this.nextCode("QT-", "quotation");
    const row = await this.prisma.quotation.create({
      data: {
        quoteNo,
        serviceType,
        version: 1,
        rootQuoteId: null,
        status: "draft",
        opportunityId: dto.opportunityId || null,
        leadId: dto.leadId || null,
        contactId: dto.contactId || null,
        organizationId: dto.organizationId || null,
        customerId: dto.customerId || null,
        packageId: dto.packageId || null,
        currencyCode: String(dto.currencyCode || "BDT").toUpperCase(),
        ...totals,
        discountBps: Number(dto.discountBps) || 0,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        notes: dto.notes || null,
        branchId: user.branchId ?? null,
        createdBy: user.id,
        lines: { create: lines },
      },
      include: { lines: true },
    });
    await this.prisma.quotation.update({ where: { id: row.id }, data: { rootQuoteId: row.id } });
    await this.audit(user.id, "sales.quote.create", "Quotation", row.id, row);
    return this.getQuotation(row.id, user);
  }

  async submitQuotation(id: string, user: AuthedUser) {
    const q = await this.getQuotation(id, user);
    if (q.status !== "draft" && q.status !== "rejected") {
      throw new BadRequestException("Only draft/rejected quotes can be submitted");
    }
    const row = await this.prisma.quotation.update({
      where: { id },
      data: { status: "pending_approval", submittedAt: new Date() },
      include: { lines: true },
    });
    await this.audit(user.id, "sales.quote.submit", "Quotation", id, row);
    return row;
  }

  async approveQuotation(id: string, user: AuthedUser) {
    const q = await this.getQuotation(id, user);
    if (q.status !== "pending_approval") throw new BadRequestException("Quote is not pending approval");
    const html = this.toHtml(q);
    const row = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: "approved",
        approvedBy: user.id,
        approvedAt: new Date(),
        htmlSnapshot: html,
        rejectedBy: null,
        rejectedAt: null,
        rejectReason: null,
      },
      include: { lines: true },
    });
    await this.audit(user.id, "sales.quote.approve", "Quotation", id, row);
    return row;
  }

  async rejectQuotation(id: string, reason: string, user: AuthedUser) {
    const q = await this.getQuotation(id, user);
    if (q.status !== "pending_approval") throw new BadRequestException("Quote is not pending approval");
    if (!reason?.trim()) throw new BadRequestException("reason required");
    const row = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: "rejected",
        rejectedBy: user.id,
        rejectedAt: new Date(),
        rejectReason: reason.trim(),
      },
      include: { lines: true },
    });
    await this.audit(user.id, "sales.quote.reject", "Quotation", id, row);
    return row;
  }

  async sendQuotation(id: string, user: AuthedUser) {
    const q = await this.getQuotation(id, user);
    if (!["approved", "accepted", "sent"].includes(q.status)) {
      throw new BadRequestException("Approve the quote before sending");
    }
    const html = q.htmlSnapshot || this.toHtml(q);
    const row = await this.prisma.quotation.update({
      where: { id },
      data: { status: "sent", htmlSnapshot: html },
      include: { lines: true },
    });
    await this.audit(user.id, "sales.quote.send", "Quotation", id, { id, status: "sent" });
    return { quotation: row, emailReady: { subject: `Quotation ${row.quoteNo}`, html } };
  }

  async reviseQuotation(id: string, dto: any, user: AuthedUser) {
    const src = await this.getQuotation(id, user);
    const lines = dto.lines ? this.buildLines(dto.lines) : src.lines.map((l) => ({
      lineNo: l.lineNo,
      productCode: l.productCode,
      description: l.description,
      quantity: l.quantity,
      unitPricePoisha: l.unitPricePoisha,
      discountPoisha: l.discountPoisha,
      amountPoisha: l.amountPoisha,
    }));
    const discountPoisha = dto.discountPoisha != null ? Number(dto.discountPoisha) : src.discountPoisha;
    const discountBps = dto.discountBps != null ? Number(dto.discountBps) : src.discountBps;
    const taxPoisha = dto.taxPoisha != null ? Number(dto.taxPoisha) : src.taxPoisha;
    const totals = this.calcTotals(lines, discountPoisha, discountBps, taxPoisha);
    const rootId = src.rootQuoteId || src.id;
    const maxVer = await this.prisma.quotation.aggregate({
      where: { rootQuoteId: rootId, deletedAt: null },
      _max: { version: true },
    });
    const quoteNo = `${src.quoteNo.split("-v")[0]}-v${(maxVer._max.version || src.version) + 1}`;
    const row = await this.prisma.quotation.create({
      data: {
        quoteNo,
        serviceType: src.serviceType,
        version: (maxVer._max.version || src.version) + 1,
        rootQuoteId: rootId,
        status: "draft",
        opportunityId: src.opportunityId,
        leadId: src.leadId,
        contactId: src.contactId,
        organizationId: src.organizationId,
        customerId: src.customerId,
        currencyCode: src.currencyCode,
        ...totals,
        discountBps,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : src.validUntil,
        notes: dto.notes ?? src.notes,
        branchId: src.branchId,
        createdBy: user.id,
        lines: { create: lines },
      },
      include: { lines: true },
    });
    await this.audit(user.id, "sales.quote.revise", "Quotation", row.id, { from: src.id, to: row.id });
    return row;
  }

  exportQuotation(id: string, user: AuthedUser) {
    return this.getQuotation(id, user).then((q) => ({
      contentType: "text/html; charset=utf-8",
      body: q.htmlSnapshot || this.toHtml(q),
      filename: `${q.quoteNo}.html`,
    }));
  }

  private toHtml(q: any): string {
    const lines = (q.lines || [])
      .map(
        (l: any) =>
          `<tr><td>${l.lineNo}</td><td>${l.productCode || ""}</td><td>${l.description}</td><td>${l.quantity}</td><td>${(l.unitPricePoisha / 100).toFixed(2)}</td><td>${(l.amountPoisha / 100).toFixed(2)}</td></tr>`,
      )
      .join("");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${q.quoteNo}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #e2e8f0;padding:6px 8px}th{background:#f8fafc}@media print{button{display:none}}</style></head><body>
<button onclick="window.print()">Print / Save PDF</button>
<h1>Shanghai Travels — Quotation ${q.quoteNo}</h1>
<p>Service: ${q.serviceType} · Version ${q.version} · Status ${q.status}</p>
<p>Valid until: ${q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-BD") : "—"}</p>
<table><thead><tr><th>#</th><th>Code</th><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>${lines}</tbody></table>
<p>Subtotal: ৳${(q.subtotalPoisha / 100).toFixed(2)} · Discount: ৳${(q.discountPoisha / 100).toFixed(2)} · Tax: ৳${(q.taxPoisha / 100).toFixed(2)}</p>
<p><strong>Total: ৳${(q.totalPoisha / 100).toFixed(2)} ${q.currencyCode}</strong></p>
${q.notes ? `<p>Notes: ${q.notes}</p>` : ""}
</body></html>`;
  }

  // ---------- Pricing ----------
  listPriceTemplates(user: AuthedUser) {
    return this.prisma.priceTemplate.findMany({
      where: { deletedAt: null, ...this.branchFilter(user) },
      include: { lines: { orderBy: { lineNo: "asc" } } },
      orderBy: { code: "asc" },
      take: 100,
    });
  }

  async createPriceTemplate(dto: any, user: AuthedUser) {
    if (!dto?.name?.trim() || !dto?.serviceType) throw new BadRequestException("name and serviceType required");
    if (!QUOTE_SERVICES.has(dto.serviceType)) throw new BadRequestException("Invalid serviceType");
    const lines = Array.isArray(dto.lines) ? dto.lines : [];
    if (lines.length < 1) throw new BadRequestException("At least one template line required");
    const code = dto.code?.trim() || (await this.nextCode("PT-", "priceTemplate"));
    const row = await this.prisma.priceTemplate.create({
      data: {
        code,
        name: String(dto.name).trim(),
        serviceType: dto.serviceType,
        currencyCode: String(dto.currencyCode || "BDT").toUpperCase(),
        notes: dto.notes || null,
        branchId: user.branchId ?? null,
        createdBy: user.id,
        lines: {
          create: lines.map((l: any, i: number) => ({
            lineNo: i + 1,
            productCode: l.productCode || null,
            description: String(l.description || "Item"),
            unitPricePoisha: Math.max(0, Number(l.unitPricePoisha) || 0),
          })),
        },
      },
      include: { lines: true },
    });
    await this.audit(user.id, "sales.price_template.create", "PriceTemplate", row.id, row);
    return row;
  }

  listPriceBooks(user: AuthedUser) {
    return this.prisma.priceBook.findMany({
      where: { deletedAt: null, ...this.branchFilter(user) },
      orderBy: { code: "asc" },
      take: 200,
    });
  }

  async createPriceBook(dto: any, user: AuthedUser) {
    if (!dto?.name?.trim()) throw new BadRequestException("name required");
    const kind = String(dto.kind || "standard");
    if (!["standard", "customer", "corporate", "agent", "promo"].includes(kind)) {
      throw new BadRequestException("Invalid price book kind");
    }
    const code = dto.code?.trim() || (await this.nextCode("PB-", "priceBook"));
    const row = await this.prisma.priceBook.create({
      data: {
        code,
        name: String(dto.name).trim(),
        kind,
        serviceType: dto.serviceType || null,
        customerId: dto.customerId || null,
        organizationId: dto.organizationId || null,
        agentId: dto.agentId || null,
        productCode: dto.productCode || null,
        unitPricePoisha: dto.unitPricePoisha != null ? Number(dto.unitPricePoisha) : null,
        discountBps: Number(dto.discountBps) || 0,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        notes: dto.notes || null,
        branchId: user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "sales.price_book.create", "PriceBook", row.id, row);
    return row;
  }

  /** Resolve effective unit price: promo > agent/corporate/customer > template. */
  async resolvePricing(dto: any, user: AuthedUser) {
    const serviceType = String(dto.serviceType || "");
    const productCode = dto.productCode || null;
    const now = new Date();
    const books = await this.prisma.priceBook.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...this.branchFilter(user),
        OR: [{ serviceType }, { serviceType: null }],
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validTo: null }, { validTo: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    const pick = (kind: string, match: (b: any) => boolean) =>
      books.find((b) => b.kind === kind && match(b) && (!productCode || !b.productCode || b.productCode === productCode));

    const promo = pick("promo", () => true);
    const agent = dto.agentId ? pick("agent", (b) => b.agentId === dto.agentId) : null;
    const corporate = dto.organizationId ? pick("corporate", (b) => b.organizationId === dto.organizationId) : null;
    const customer = dto.customerId ? pick("customer", (b) => b.customerId === dto.customerId) : null;
    const standard = pick("standard", () => true);

    let templateLine = null as any;
    if (dto.templateId || serviceType) {
      const tpl = dto.templateId
        ? await this.prisma.priceTemplate.findFirst({
            where: { id: dto.templateId, deletedAt: null },
            include: { lines: true },
          })
        : await this.prisma.priceTemplate.findFirst({
            where: { serviceType, deletedAt: null, isActive: true, ...this.branchFilter(user) },
            include: { lines: true },
          });
      templateLine = tpl?.lines?.find((l) => !productCode || l.productCode === productCode) || tpl?.lines?.[0];
    }

    const chosen = promo || agent || corporate || customer || standard;
    const base = chosen?.unitPricePoisha ?? templateLine?.unitPricePoisha ?? (Number(dto.fallbackPoisha) || 0);
    const discountBps = chosen?.discountBps || 0;
    const unitPricePoisha = Math.max(0, base - Math.round((base * discountBps) / 10000));
    return {
      unitPricePoisha,
      basePoisha: base,
      discountBps,
      source: chosen ? `price_book:${chosen.kind}:${chosen.code}` : templateLine ? `template:${templateLine.productCode || templateLine.description}` : "fallback",
      priceBookId: chosen?.id || null,
      templateLineId: templateLine?.id || null,
    };
  }

  // ---------- Sales tasks ----------
  listTasks(q: any, user: AuthedUser) {
    const where: any = { ...this.branchFilter(user) };
    if (q.status) where.status = q.status;
    if (q.assignedTo) where.assignedTo = q.assignedTo;
    if (q.overdue === "true") {
      where.status = "open";
      where.OR = [{ slaDueAt: { lt: new Date() } }, { dueAt: { lt: new Date() } }];
    }
    return this.prisma.salesTask.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
      take: 200,
      include: { opportunity: { select: { id: true, opportunityNo: true, title: true } } },
    });
  }

  async createTask(dto: any, user: AuthedUser) {
    if (!dto?.title?.trim()) throw new BadRequestException("title required");
    const dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    const slaHours = Number(dto.slaHours) || 48;
    const slaDueAt = dto.slaDueAt
      ? new Date(dto.slaDueAt)
      : dueAt
        ? dueAt
        : new Date(Date.now() + slaHours * 3600_000);
    const row = await this.prisma.salesTask.create({
      data: {
        title: String(dto.title).trim(),
        description: dto.description || null,
        type: dto.type || "follow_up",
        opportunityId: dto.opportunityId || null,
        quotationId: dto.quotationId || null,
        leadId: dto.leadId || null,
        assignedTo: dto.assignedTo || user.id,
        dueAt,
        reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : dueAt,
        slaDueAt,
        branchId: user.branchId ?? null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "sales.task.create", "SalesTask", row.id, row);
    return row;
  }

  async completeTask(id: string, user: AuthedUser) {
    const t = await this.prisma.salesTask.findFirst({ where: { id, ...this.branchFilter(user) } });
    if (!t) throw new NotFoundException("Task not found");
    const row = await this.prisma.salesTask.update({
      where: { id },
      data: { status: "done", completedAt: new Date() },
    });
    await this.audit(user.id, "sales.task.complete", "SalesTask", id, row);
    return row;
  }

  async escalateTask(id: string, user: AuthedUser) {
    const t = await this.prisma.salesTask.findFirst({ where: { id, ...this.branchFilter(user) } });
    if (!t) throw new NotFoundException("Task not found");
    if (t.status !== "open") throw new BadRequestException("Only open tasks can be escalated");
    const row = await this.prisma.salesTask.update({
      where: { id },
      data: { status: "escalated", escalatedAt: new Date() },
    });
    await this.audit(user.id, "sales.task.escalate", "SalesTask", id, row);
    return row;
  }

  // ---------- Conversion (approved quotes) ----------
  async convertApprovedQuote(dto: any, user: AuthedUser) {
    if (!dto.quotationId) throw new BadRequestException("quotationId required");
    const quote = await this.getQuotation(dto.quotationId, user);
    if (!["approved", "accepted", "sent"].includes(quote.status)) {
      throw new BadRequestException("Only approved, accepted, or sent quotations can be converted");
    }
    const serviceType = String(dto.serviceType || quote.serviceType);
    if (!QUOTE_SERVICES.has(serviceType)) throw new BadRequestException("Invalid serviceType");

    let customerId = dto.customerId || quote.customerId;
    if (!customerId) {
      const lead = quote.leadId
        ? await this.prisma.lead.findFirst({ where: { id: quote.leadId } })
        : null;
      const branchId =
        user.branchId ||
        quote.branchId ||
        (await this.prisma.branch.findFirst({ select: { id: true } }))?.id;
      if (!branchId) throw new BadRequestException("No branch for customer");
      const code = `CUS-${String((await this.prisma.customer.count()) + 1).padStart(6, "0")}`;
      const customer = await this.prisma.customer.create({
        data: {
          branchId,
          code,
          fullName: lead?.name || `Quote ${quote.quoteNo}`,
          phone: lead?.phone || `sales-${Date.now()}`,
          email: lead?.email || null,
          source: "sales",
          createdBy: user.id,
        },
      });
      customerId = customer.id;
    }

    const app = await this.apps.create(
      {
        customerId,
        serviceType,
        title: dto.title || `${serviceType} from ${quote.quoteNo}`,
        source: "sales",
        assignedTo: user.id,
        priority: "medium",
      },
      user,
    );

    await this.prisma.quotation.update({
      where: { id: quote.id },
      data: { status: "converted", applicationId: app.id, customerId },
    });
    if (quote.opportunityId) {
      await this.prisma.opportunity.update({
        where: { id: quote.opportunityId },
        data: {
          status: "converted",
          stage: "converted",
          applicationId: app.id,
          customerId,
          convertedAt: new Date(),
          probabilityBps: 10000,
        },
      });
      await this.prisma.opportunityStageHistory.create({
        data: {
          opportunityId: quote.opportunityId,
          fromStage: quote.opportunity?.stage || null,
          toStage: "converted",
          probabilityBps: 10000,
          note: `Converted via ${quote.quoteNo}`,
          changedBy: user.id,
        },
      });
    }
    if (quote.leadId) {
      await this.prisma.lead.update({
        where: { id: quote.leadId },
        data: {
          status: "converted",
          customerId,
          convertedApplicationId: app.id,
          convertedAt: new Date(),
        },
      });
    }

    await this.audit(user.id, "sales.convert", "Application", app.id, {
      quotationId: quote.id,
      opportunityId: quote.opportunityId,
      leadId: quote.leadId,
      referenceNo: app.referenceNo,
      serviceType,
    });
    return {
      application: app,
      quotationId: quote.id,
      opportunityId: quote.opportunityId,
      leadId: quote.leadId,
      customerId,
    };
  }

  // ---------- Reports ----------
  async reportQuoteStatus(user: AuthedUser) {
    const rows = await this.prisma.quotation.groupBy({
      by: ["status"],
      where: { deletedAt: null, ...this.branchFilter(user) },
      _count: { _all: true },
      _sum: { totalPoisha: true },
    });
    return { rows: rows.map((r) => ({ status: r.status, count: r._count._all, totalPoisha: r._sum.totalPoisha || 0 })) };
  }

  async reportWinLoss(user: AuthedUser) {
    const where = { deletedAt: null, ...this.branchFilter(user) };
    const [won, lost, open] = await Promise.all([
      this.prisma.opportunity.count({ where: { ...where, status: "won" } }),
      this.prisma.opportunity.count({ where: { ...where, status: "lost" } }),
      this.prisma.opportunity.count({ where: { ...where, status: "open" } }),
    ]);
    const decided = won + lost;
    return {
      won,
      lost,
      open,
      winRate: decided ? Math.round((won / decided) * 10000) / 100 : 0,
    };
  }

  async reportFunnel(user: AuthedUser) {
    const stages = await this.listStages();
    const grouped = await this.prisma.opportunity.groupBy({
      by: ["stage"],
      where: { deletedAt: null, ...this.branchFilter(user) },
      _count: { _all: true },
      _sum: { expectedRevenuePoisha: true },
    });
    return {
      rows: stages.map((s) => {
        const g = grouped.find((x) => x.stage === s.code);
        return {
          stage: s.code,
          name: s.name,
          count: g?._count._all || 0,
          expectedRevenuePoisha: g?._sum.expectedRevenuePoisha || 0,
        };
      }),
    };
  }

  async reportByExecutive(user: AuthedUser) {
    const rows = await this.prisma.opportunity.groupBy({
      by: ["assignedTo"],
      where: { deletedAt: null, ...this.branchFilter(user) },
      _count: { _all: true },
      _sum: { expectedRevenuePoisha: true },
    });
    const converted = await this.prisma.opportunity.groupBy({
      by: ["assignedTo"],
      where: { deletedAt: null, status: { in: ["won", "converted"] }, ...this.branchFilter(user) },
      _count: { _all: true },
    });
    return {
      rows: rows.map((r) => ({
        assignedTo: r.assignedTo,
        opportunities: r._count._all,
        pipelinePoisha: r._sum.expectedRevenuePoisha || 0,
        wonOrConverted: converted.find((c) => c.assignedTo === r.assignedTo)?._count._all || 0,
      })),
    };
  }

  async reportConversionTime(user: AuthedUser) {
    const converted = await this.prisma.opportunity.findMany({
      where: { deletedAt: null, status: "converted", convertedAt: { not: null }, ...this.branchFilter(user) },
      select: { createdAt: true, convertedAt: true },
      take: 500,
    });
    const days = converted
      .map((o) => (o.convertedAt!.getTime() - o.createdAt.getTime()) / 86400000)
      .filter((d) => d >= 0);
    const avg = days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0;
    return { sampleSize: days.length, avgDays: Math.round(avg * 100) / 100 };
  }

  async reportForecastAccuracy(user: AuthedUser) {
    const closed = await this.prisma.opportunity.findMany({
      where: {
        deletedAt: null,
        status: { in: ["won", "lost", "converted"] },
        ...this.branchFilter(user),
      },
      select: { status: true, expectedRevenuePoisha: true, probabilityBps: true },
      take: 500,
    });
    let forecasted = 0;
    let actual = 0;
    for (const o of closed) {
      forecasted += Math.round((o.expectedRevenuePoisha * o.probabilityBps) / 10000);
      if (o.status === "won" || o.status === "converted") actual += o.expectedRevenuePoisha;
    }
    const accuracy =
      forecasted > 0 ? Math.round((1 - Math.abs(actual - forecasted) / forecasted) * 10000) / 100 : null;
    return { sampleSize: closed.length, forecastedPoisha: forecasted, actualPoisha: actual, accuracyPct: accuracy };
  }
}
