import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

type Filters = { from?: Date; to?: Date; branchId?: string | null };

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private isHq(user: AuthedUser) {
    return ["super_admin", "general_manager"].includes(user.role);
  }

  private parseFilters(q: any, user: AuthedUser): Filters {
    const from = q.from ? new Date(q.from) : undefined;
    const to = q.to ? new Date(q.to) : undefined;
    if (from && Number.isNaN(from.getTime())) throw new BadRequestException("Invalid from date");
    if (to && Number.isNaN(to.getTime())) throw new BadRequestException("Invalid to date");
    let branchId: string | null | undefined = q.branchId || undefined;
    if (!this.isHq(user)) branchId = user.branchId ?? "__none__";
    return { from, to, branchId };
  }

  private branchWhere(f: Filters, field = "branchId") {
    return f.branchId ? { [field]: f.branchId } : {};
  }

  private dateWhere(f: Filters, field = "createdAt") {
    if (!f.from && !f.to) return {};
    const range: any = {};
    if (f.from) range.gte = f.from;
    if (f.to) range.lte = f.to;
    return { [field]: range };
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

  async bootstrap(user: AuthedUser) {
    const defaults: Array<[string, string, string, string, string[]]> = [
      ["exec_overview", "Executive overview", "executive", "Pipeline, forecast, conversion", ["pipeline", "forecast", "monthlyTrend", "branchPerformance"]],
      ["customer_intel", "Customer intelligence", "customer", "CLV and segmentation", ["clv", "repeatRate", "segmentation"]],
      ["sales_intel", "Sales intelligence", "sales", "Win/loss and cycle", ["winLoss", "stageConversion", "quoteAcceptance"]],
      ["comms_intel", "Communication intelligence", "comms", "SLA and channel metrics", ["responseTime", "sla", "channelMetrics"]],
      ["finance_link", "Finance-linked analytics", "finance", "Revenue and AR/AP", ["revenueByService", "outstanding", "collections"]],
    ];
    let created = 0;
    for (const [code, name, category, description, metrics] of defaults) {
      const exists = await this.prisma.analyticsReportTemplate.findFirst({ where: { code } });
      if (exists) continue;
      await this.prisma.analyticsReportTemplate.create({
        data: {
          code,
          name,
          category,
          description,
          definition: { metrics, defaultFilters: {} },
          isSystem: true,
          createdBy: user.id,
          branchId: user.branchId ?? null,
        },
      });
      created++;
    }
    await this.audit(user.id, "analytics.bootstrap", "AnalyticsReportTemplate", null, { created });
    return { ok: true, created, templates: await this.listTemplates(user) };
  }

  // ---------- Executive ----------
  async executive(q: any, user: AuthedUser) {
    const f = this.parseFilters(q, user);
    const oppWhere = { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f) };
    const leadWhere = { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f) };
    const appWhere = { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f) };

    const [pipeline, forecastOpps, leadsBySource, appsByService, branches, team, monthlyApps, monthlyInvoices] =
      await Promise.all([
        this.prisma.opportunity.groupBy({
          by: ["stage"],
          where: { ...oppWhere, status: "open" },
          _count: { _all: true },
          _sum: { expectedRevenuePoisha: true },
        }),
        this.prisma.opportunity.findMany({
          where: { ...oppWhere, status: "open" },
          select: { expectedRevenuePoisha: true, probabilityBps: true },
          take: 2000,
        }),
        this.prisma.lead.groupBy({
          by: ["source"],
          where: leadWhere,
          _count: { _all: true },
        }),
        this.prisma.application.groupBy({
          by: ["serviceType"],
          where: appWhere,
          _count: { _all: true },
        }),
        this.prisma.application.groupBy({
          by: ["branchId"],
          where: appWhere,
          _count: { _all: true },
        }),
        this.prisma.opportunity.groupBy({
          by: ["assignedTo"],
          where: oppWhere,
          _count: { _all: true },
          _sum: { expectedRevenuePoisha: true },
        }),
        this.prisma.application.findMany({
          where: appWhere,
          select: { createdAt: true },
          take: 5000,
        }),
        this.prisma.invoice.groupBy({
          by: ["status"],
          where: { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f, "createdAt") },
          _sum: { total: true },
          _count: { _all: true },
        }),
      ]);

    const unweighted = forecastOpps.reduce((s, o) => s + o.expectedRevenuePoisha, 0);
    const weighted = forecastOpps.reduce((s, o) => s + Math.round((o.expectedRevenuePoisha * o.probabilityBps) / 10000), 0);

    const monthMap = new Map<string, number>();
    for (const a of monthlyApps) {
      const m = a.createdAt.toISOString().slice(0, 7);
      monthMap.set(m, (monthMap.get(m) || 0) + 1);
    }
    const monthlyTrend = [...monthMap.entries()]
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    const [leadsTotal, leadsConverted, appsTotal, appsCompleted] = await Promise.all([
      this.prisma.lead.count({ where: leadWhere }),
      this.prisma.lead.count({ where: { ...leadWhere, status: "converted" } }),
      this.prisma.application.count({ where: appWhere }),
      this.prisma.application.count({ where: { ...appWhere, status: "completed" } }),
    ]);

    const branchNames = await this.prisma.branch.findMany({
      where: { id: { in: branches.map((b) => b.branchId).filter(Boolean) } },
      select: { id: true, name: true },
    });

    return {
      filters: { from: f.from?.toISOString() || null, to: f.to?.toISOString() || null, branchId: f.branchId || null },
      pipeline: {
        rows: pipeline.map((r) => ({
          stage: r.stage,
          count: r._count._all,
          expectedRevenuePoisha: r._sum.expectedRevenuePoisha || 0,
        })),
      },
      revenueForecast: { openCount: forecastOpps.length, unweightedRevenuePoisha: unweighted, weightedRevenuePoisha: weighted },
      monthlySalesTrend: {
        bookings: monthlyTrend,
        invoicedPoisha: monthlyInvoices
          .filter((i) => i.status !== "draft" && i.status !== "void")
          .reduce((s, i) => s + (i._sum.total || 0), 0),
      },
      branchPerformance: branches.map((b) => ({
        branchId: b.branchId,
        branchName: branchNames.find((n) => n.id === b.branchId)?.name || b.branchId,
        bookings: b._count._all,
      })),
      teamPerformance: team.map((t) => ({
        assignedTo: t.assignedTo,
        opportunities: t._count._all,
        pipelinePoisha: t._sum.expectedRevenuePoisha || 0,
      })),
      bookingConversion: {
        leadsTotal,
        leadsConverted,
        leadConversionRate: leadsTotal ? Math.round((leadsConverted / leadsTotal) * 10000) / 100 : 0,
        applicationsTotal: appsTotal,
        applicationsCompleted: appsCompleted,
        bookingCompletionRate: appsTotal ? Math.round((appsCompleted / appsTotal) * 10000) / 100 : 0,
        byService: appsByService.map((r) => ({ serviceType: r.serviceType, count: r._count._all })),
      },
      leadSourceEffectiveness: leadsBySource.map((r) => ({ source: r.source || "unknown", count: r._count._all })),
    };
  }

  // ---------- Customer ----------
  async customer(q: any, user: AuthedUser) {
    const f = this.parseFilters(q, user);
    const custWhere = { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f) };
    const customers = await this.prisma.customer.findMany({
      where: custWhere,
      select: {
        id: true,
        type: true,
        nationality: true,
        address: true,
        createdAt: true,
        applications: { where: { deletedAt: null }, select: { id: true, createdAt: true, serviceType: true } },
        invoices: {
          where: { deletedAt: null, status: { notIn: ["draft", "void"] } },
          select: { total: true, issuedAt: true },
        },
        payments: { where: { deletedAt: null, kind: "payment" }, select: { amount: true } },
      },
      take: 2000,
    });

    const withClv = customers.map((c) => {
      const collected = c.payments.reduce((s, p) => s + p.amount, 0);
      const invoiced = c.invoices.reduce((s, i) => s + i.total, 0);
      const bookings = c.applications.length;
      return {
        customerId: c.id,
        type: c.type,
        nationality: c.nationality || "unknown",
        bookings,
        invoicedPoisha: invoiced,
        collectedPoisha: collected,
        clvPoisha: collected || invoiced,
      };
    });

    const totalCustomers = withClv.length;
    const repeat = withClv.filter((c) => c.bookings >= 2).length;
    const avgClv = totalCustomers ? Math.round(withClv.reduce((s, c) => s + c.clvPoisha, 0) / totalCustomers) : 0;
    const avgFrequency = totalCustomers ? Math.round((withClv.reduce((s, c) => s + c.bookings, 0) / totalCustomers) * 100) / 100 : 0;

    const segments = [
      { segment: "high_value", count: withClv.filter((c) => c.clvPoisha >= 5000000).length },
      { segment: "mid_value", count: withClv.filter((c) => c.clvPoisha >= 1000000 && c.clvPoisha < 5000000).length },
      { segment: "low_value", count: withClv.filter((c) => c.clvPoisha > 0 && c.clvPoisha < 1000000).length },
      { segment: "no_revenue", count: withClv.filter((c) => c.clvPoisha === 0).length },
    ];

    const corporate = withClv.filter((c) => c.type === "corporate");
    const b2c = withClv.filter((c) => c.type !== "corporate");

    const geoMap = new Map<string, number>();
    for (const c of withClv) geoMap.set(c.nationality, (geoMap.get(c.nationality) || 0) + 1);

    return {
      filters: { from: f.from?.toISOString() || null, to: f.to?.toISOString() || null, branchId: f.branchId || null },
      lifetimeValue: { sampleSize: totalCustomers, averageClvPoisha: avgClv, top: withClv.sort((a, b) => b.clvPoisha - a.clvPoisha).slice(0, 10) },
      bookingFrequency: { averageBookingsPerCustomer: avgFrequency },
      repeatCustomerRate: {
        totalCustomers,
        repeatCustomers: repeat,
        ratePct: totalCustomers ? Math.round((repeat / totalCustomers) * 10000) / 100 : 0,
      },
      segmentation: segments,
      corporateVsB2c: {
        corporate: { count: corporate.length, clvPoisha: corporate.reduce((s, c) => s + c.clvPoisha, 0) },
        b2c: { count: b2c.length, clvPoisha: b2c.reduce((s, c) => s + c.clvPoisha, 0) },
      },
      geographicDistribution: [...geoMap.entries()].map(([nationality, count]) => ({ nationality, count })).sort((a, b) => b.count - a.count),
    };
  }

  // ---------- Sales ----------
  async sales(q: any, user: AuthedUser) {
    const f = this.parseFilters(q, user);
    const where = { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f) };
    const [won, lost, open, byStage, quotes, converted, closed] = await Promise.all([
      this.prisma.opportunity.count({ where: { ...where, status: "won" } }),
      this.prisma.opportunity.count({ where: { ...where, status: "lost" } }),
      this.prisma.opportunity.count({ where: { ...where, status: "open" } }),
      this.prisma.opportunity.groupBy({
        by: ["stage"],
        where,
        _count: { _all: true },
      }),
      this.prisma.quotation.groupBy({
        by: ["status"],
        where: { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f) },
        _count: { _all: true },
        _sum: { totalPoisha: true },
      }),
      this.prisma.opportunity.findMany({
        where: { ...where, status: "converted", convertedAt: { not: null } },
        select: { createdAt: true, convertedAt: true, assignedTo: true, expectedRevenuePoisha: true, probabilityBps: true },
        take: 500,
      }),
      this.prisma.opportunity.findMany({
        where: { ...where, status: { in: ["won", "lost", "converted"] } },
        select: { status: true, expectedRevenuePoisha: true, probabilityBps: true, lostReason: true },
        take: 1000,
      }),
    ]);

    const decided = won + lost;
    const cycleDays = converted
      .map((o) => (o.convertedAt!.getTime() - o.createdAt.getTime()) / 86400000)
      .filter((d) => d >= 0);
    const avgCycle = cycleDays.length ? cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length : 0;

    let forecasted = 0;
    let actual = 0;
    for (const o of closed) {
      forecasted += Math.round((o.expectedRevenuePoisha * o.probabilityBps) / 10000);
      if (o.status === "won" || o.status === "converted") actual += o.expectedRevenuePoisha;
    }
    const accuracy = forecasted > 0 ? Math.round((1 - Math.abs(actual - forecasted) / forecasted) * 10000) / 100 : null;

    const lostReasons = new Map<string, number>();
    for (const o of closed.filter((x) => x.status === "lost")) {
      const k = o.lostReason || "unspecified";
      lostReasons.set(k, (lostReasons.get(k) || 0) + 1);
    }

    const accepted = quotes.find((q) => q.status === "accepted")?._count._all || 0;
    const convertedQ = quotes.find((q) => q.status === "converted")?._count._all || 0;
    const sent = quotes.filter((q) => ["sent", "approved", "accepted", "converted"].includes(q.status)).reduce((s, q) => s + q._count._all, 0);
    const acceptanceRate = sent ? Math.round(((accepted + convertedQ) / sent) * 10000) / 100 : 0;

    const byExec = await this.prisma.opportunity.groupBy({
      by: ["assignedTo"],
      where,
      _count: { _all: true },
      _sum: { expectedRevenuePoisha: true },
    });

    return {
      filters: { from: f.from?.toISOString() || null, to: f.to?.toISOString() || null, branchId: f.branchId || null },
      winLoss: {
        won,
        lost,
        open,
        winRate: decided ? Math.round((won / decided) * 10000) / 100 : 0,
        lostReasons: [...lostReasons.entries()].map(([reason, count]) => ({ reason, count })),
      },
      stageConversion: byStage.map((r) => ({ stage: r.stage, count: r._count._all })),
      salesCycleDuration: { sampleSize: cycleDays.length, avgDays: Math.round(avgCycle * 100) / 100 },
      forecastAccuracy: { sampleSize: closed.length, forecastedPoisha: forecasted, actualPoisha: actual, accuracyPct: accuracy },
      executiveProductivity: byExec.map((r) => ({
        assignedTo: r.assignedTo,
        opportunities: r._count._all,
        pipelinePoisha: r._sum.expectedRevenuePoisha || 0,
      })),
      quotationAcceptance: {
        byStatus: quotes.map((r) => ({ status: r.status, count: r._count._all, totalPoisha: r._sum.totalPoisha || 0 })),
        acceptanceRatePct: acceptanceRate,
      },
    };
  }

  // ---------- Comms ----------
  async comms(q: any, user: AuthedUser) {
    const f = this.parseFilters(q, user);
    const msgWhere = { ...this.branchWhere(f), ...this.dateWhere(f) };
    const [byChannel, byStatus, activities, slaOpen, slaOverdue, slaDone, slaEsc] = await Promise.all([
      this.prisma.commMessage.groupBy({ by: ["channel"], where: msgWhere, _count: { _all: true } }),
      this.prisma.commMessage.groupBy({ by: ["channel", "status"], where: msgWhere, _count: { _all: true } }),
      this.prisma.crmActivity.groupBy({
        by: ["status"],
        where: { ...this.branchWhere(f), ...this.dateWhere(f) },
        _count: { _all: true },
      }),
      this.prisma.crmActivity.count({ where: { status: "open", ...this.branchWhere(f) } }),
      this.prisma.crmActivity.count({ where: { status: "open", slaDueAt: { lt: new Date() }, ...this.branchWhere(f) } }),
      this.prisma.crmActivity.count({ where: { status: "done", ...this.branchWhere(f) } }),
      this.prisma.crmActivity.count({ where: { status: "escalated", ...this.branchWhere(f) } }),
    ]);

    const threads = await this.prisma.commThread.findMany({
      where: { ...this.branchWhere(f) },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 8 } },
      take: 100,
    });
    const deltas: number[] = [];
    for (const t of threads) {
      const inbound = t.messages.find((m) => m.direction === "inbound");
      const outbound = t.messages.find((m) => m.direction === "outbound" && inbound && m.createdAt > inbound.createdAt);
      if (inbound && outbound) deltas.push((outbound.createdAt.getTime() - inbound.createdAt.getTime()) / 3600000);
    }
    const avgHours = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
    const channelMetric = (ch: string) => ({
      channel: ch,
      total: byChannel.find((c) => c.channel === ch)?._count._all || 0,
      sent: byStatus.filter((s) => s.channel === ch && ["sent", "delivered"].includes(s.status)).reduce((n, s) => n + s._count._all, 0),
      failed: byStatus.find((s) => s.channel === ch && s.status === "failed")?._count._all || 0,
      queued: byStatus.find((s) => s.channel === ch && s.status === "queued")?._count._all || 0,
    });

    const denom = slaOpen + slaOverdue + slaDone;
    return {
      filters: { from: f.from?.toISOString() || null, to: f.to?.toISOString() || null, branchId: f.branchId || null },
      responseTimes: { sampleSize: deltas.length, avgResponseHours: Math.round(avgHours * 100) / 100 },
      slaCompliance: {
        open: slaOpen,
        overdue: slaOverdue,
        escalated: slaEsc,
        done: slaDone,
        compliancePct: denom ? Math.round((slaDone / denom) * 10000) / 100 : 100,
      },
      emailMetrics: channelMetric("email"),
      whatsappMetrics: channelMetric("whatsapp"),
      smsMetrics: channelMetric("sms"),
      activityCompletion: activities.map((a) => ({ status: a.status, count: a._count._all })),
    };
  }

  // ---------- Finance-linked ----------
  async finance(q: any, user: AuthedUser) {
    const f = this.parseFilters(q, user);
    const apps = await this.prisma.application.findMany({
      where: { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f) },
      select: {
        id: true,
        serviceType: true,
        branchId: true,
        invoices: {
          where: { deletedAt: null, status: { notIn: ["draft", "void"] } },
          select: { total: true },
        },
      },
      take: 3000,
    });

    const byService = new Map<string, { revenuePoisha: number; bookings: number }>();
    for (const a of apps) {
      const cur = byService.get(a.serviceType) || { revenuePoisha: 0, bookings: 0 };
      cur.bookings += 1;
      cur.revenuePoisha += a.invoices.reduce((s, i) => s + i.total, 0);
      byService.set(a.serviceType, cur);
    }

    const expenses = await this.prisma.expense.groupBy({
      by: ["category"],
      where: { deletedAt: null, ...this.branchWhere(f), ...this.dateWhere(f, "paidAt") },
      _sum: { amount: true },
    });
    const expenseTotal = expenses.reduce((s, e) => s + (e._sum.amount || 0), 0);
    const revenueTotal = [...byService.values()].reduce((s, v) => s + v.revenuePoisha, 0);

    const arOutstanding = await this.prisma.arDocument.aggregate({
      where: {
        status: "posted",
        type: "invoice",
        balancePoisha: { gt: 0 },
        ...(f.branchId ? { branchId: f.branchId } : {}),
      },
      _sum: { balancePoisha: true },
      _count: { _all: true },
    });
    const apOutstanding = await this.prisma.apDocument.aggregate({
      where: {
        status: "posted",
        type: "bill",
        balancePoisha: { gt: 0 },
        ...(f.branchId ? { branchId: f.branchId } : {}),
      },
      _sum: { balancePoisha: true },
      _count: { _all: true },
    });

    const collections = await this.prisma.payment.aggregate({
      where: {
        deletedAt: null,
        kind: "payment",
        ...this.dateWhere(f, "receivedAt"),
        ...(f.branchId
          ? { customer: { branchId: f.branchId } }
          : {}),
      },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const branchRev = new Map<string, number>();
    for (const a of apps) {
      branchRev.set(a.branchId, (branchRev.get(a.branchId) || 0) + a.invoices.reduce((s, i) => s + i.total, 0));
    }
    const branchNames = await this.prisma.branch.findMany({
      where: { id: { in: [...branchRev.keys()] } },
      select: { id: true, name: true },
    });

    const profitRows = [...byService.entries()].map(([serviceType, v]) => {
      const share = revenueTotal ? v.revenuePoisha / revenueTotal : 0;
      const allocatedExpense = Math.round(expenseTotal * share);
      return {
        serviceType,
        revenuePoisha: v.revenuePoisha,
        bookings: v.bookings,
        allocatedExpensePoisha: allocatedExpense,
        contributionPoisha: v.revenuePoisha - allocatedExpense,
      };
    });

    return {
      filters: { from: f.from?.toISOString() || null, to: f.to?.toISOString() || null, branchId: f.branchId || null },
      revenueByService: [...byService.entries()].map(([serviceType, v]) => ({ serviceType, ...v })),
      outstandingReceivables: {
        count: arOutstanding._count._all,
        balancePoisha: arOutstanding._sum.balancePoisha || 0,
      },
      outstandingPayables: {
        count: apOutstanding._count._all,
        balancePoisha: apOutstanding._sum.balancePoisha || 0,
      },
      collections: {
        count: collections._count._all,
        amountPoisha: collections._sum.amount || 0,
      },
      profitContributionByService: profitRows,
      branchFinancialPerformance: [...branchRev.entries()].map(([branchId, revenuePoisha]) => ({
        branchId,
        branchName: branchNames.find((b) => b.id === branchId)?.name || branchId,
        revenuePoisha,
      })),
    };
  }

  // ---------- Templates / schedules ----------
  listTemplates(user: AuthedUser) {
    return this.prisma.analyticsReportTemplate.findMany({
      where: { deletedAt: null, isActive: true, ...(this.isHq(user) ? {} : { OR: [{ branchId: user.branchId }, { branchId: null }, { isSystem: true }] }) },
      orderBy: { category: "asc" },
      take: 100,
    });
  }

  async createTemplate(dto: any, user: AuthedUser) {
    if (!dto?.code?.trim() || !dto?.name?.trim() || !dto?.category) {
      throw new BadRequestException("code, name, category required");
    }
    const cats = new Set(["executive", "customer", "sales", "comms", "finance"]);
    if (!cats.has(dto.category)) throw new BadRequestException("Invalid category");
    const row = await this.prisma.analyticsReportTemplate.create({
      data: {
        code: String(dto.code).trim(),
        name: String(dto.name).trim(),
        category: dto.category,
        description: dto.description || null,
        definition: dto.definition || { metrics: [], defaultFilters: {} },
        createdBy: user.id,
        branchId: user.branchId ?? null,
      },
    });
    await this.audit(user.id, "analytics.template.create", "AnalyticsReportTemplate", row.id, row);
    return row;
  }

  listSchedules(user: AuthedUser) {
    return this.prisma.analyticsScheduledReport.findMany({
      where: { deletedAt: null, ...(this.isHq(user) ? {} : { branchId: user.branchId ?? "__none__" }) },
      include: { template: { select: { id: true, code: true, name: true, category: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async createSchedule(dto: any, user: AuthedUser) {
    if (!dto?.templateId || !dto?.name?.trim() || !dto?.cronExpr?.trim()) {
      throw new BadRequestException("templateId, name, cronExpr required");
    }
    const tpl = await this.prisma.analyticsReportTemplate.findFirst({
      where: { id: dto.templateId, deletedAt: null },
    });
    if (!tpl) throw new NotFoundException("Template not found");
    const format = String(dto.format || "csv");
    if (!["csv", "excel", "html", "pdf"].includes(format)) throw new BadRequestException("Invalid format");
    const row = await this.prisma.analyticsScheduledReport.create({
      data: {
        templateId: dto.templateId,
        name: String(dto.name).trim(),
        cronExpr: String(dto.cronExpr).trim(),
        format,
        filters: dto.filters || {},
        recipients: dto.recipients || [],
        isActive: dto.isActive !== false,
        nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : null,
        createdBy: user.id,
        branchId: user.branchId ?? null,
      },
      include: { template: true },
    });
    await this.audit(user.id, "analytics.schedule.create", "AnalyticsScheduledReport", row.id, {
      id: row.id,
      note: "definition only — execution engine deferred",
    });
    return row;
  }

  async patchSchedule(id: string, dto: any, user: AuthedUser) {
    const row = await this.prisma.analyticsScheduledReport.findFirst({
      where: { id, deletedAt: null, ...(this.isHq(user) ? {} : { branchId: user.branchId ?? "__none__" }) },
    });
    if (!row) throw new NotFoundException("Schedule not found");
    const updated = await this.prisma.analyticsScheduledReport.update({
      where: { id },
      data: {
        name: dto.name != null ? String(dto.name).trim() : undefined,
        cronExpr: dto.cronExpr != null ? String(dto.cronExpr).trim() : undefined,
        format: dto.format || undefined,
        filters: dto.filters !== undefined ? dto.filters : undefined,
        recipients: dto.recipients !== undefined ? dto.recipients : undefined,
        isActive: dto.isActive != null ? !!dto.isActive : undefined,
        nextRunAt: dto.nextRunAt !== undefined ? (dto.nextRunAt ? new Date(dto.nextRunAt) : null) : undefined,
      },
    });
    await this.audit(user.id, "analytics.schedule.patch", "AnalyticsScheduledReport", id, updated);
    return updated;
  }

  // ---------- Export ----------
  async getReportPayload(report: string, q: any, user: AuthedUser) {
    switch (report) {
      case "executive":
        return this.executive(q, user);
      case "customer":
        return this.customer(q, user);
      case "sales":
        return this.sales(q, user);
      case "comms":
        return this.comms(q, user);
      case "finance":
        return this.finance(q, user);
      default:
        throw new BadRequestException("Unknown report — use executive|customer|sales|comms|finance");
    }
  }

  async exportReport(report: string, format: string, q: any, user: AuthedUser) {
    const data = await this.getReportPayload(report, q, user);
    await this.audit(user.id, "analytics.export", "AnalyticsReport", report, { format });
    const fmt = (format || "csv").toLowerCase();
    if (fmt === "csv" || fmt === "excel") {
      const body = this.toCsv(report, data);
      return {
        contentType: fmt === "excel" ? "application/vnd.ms-excel; charset=utf-8" : "text/csv; charset=utf-8",
        body,
        filename: `${report}.${fmt === "excel" ? "xls" : "csv"}`,
      };
    }
    if (fmt === "html" || fmt === "pdf") {
      const body = this.toHtml(report, data);
      return { contentType: "text/html; charset=utf-8", body, filename: `${report}.html` };
    }
    throw new BadRequestException("format must be csv|excel|html|pdf");
  }

  private flatten(obj: any, prefix = ""): Record<string, string | number> {
    const out: Record<string, string | number> = {};
    if (obj == null) return out;
    if (typeof obj !== "object") {
      out[prefix || "value"] = obj as any;
      return out;
    }
    if (Array.isArray(obj)) {
      out[prefix || "items"] = obj.length;
      return out;
    }
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v != null && typeof v === "object" && !Array.isArray(v)) Object.assign(out, this.flatten(v, key));
      else if (Array.isArray(v)) out[key] = v.length;
      else out[key] = v as any;
    }
    return out;
  }

  private toCsv(report: string, data: any): string {
    const rows: string[][] = [["report", report], ["exportedAt", new Date().toISOString()]];
    const flat = this.flatten(data);
    rows.push(["metric", "value"]);
    for (const [k, v] of Object.entries(flat)) rows.push([k, String(v)]);
    // Also dump known array sections as blocks
    for (const [section, val] of Object.entries(data || {})) {
      if (!Array.isArray(val) && val && typeof val === "object") {
        for (const [sk, sv] of Object.entries(val as any)) {
          if (Array.isArray(sv) && sv.length && typeof sv[0] === "object") {
            rows.push([]);
            rows.push([`${section}.${sk}`]);
            const keys = Object.keys(sv[0]);
            rows.push(keys);
            for (const item of sv) rows.push(keys.map((k) => String((item as any)[k] ?? "")));
          }
        }
      }
    }
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  private toHtml(report: string, data: any): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${report}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}pre{background:#f8fafc;padding:12px;border-radius:8px;font-size:11px;overflow:auto}@media print{button{display:none}}</style>
</head><body>
<button onclick="window.print()">Print / Save PDF</button>
<h1>Shanghai Travels — ${report} analytics</h1>
<p>Generated ${new Date().toLocaleString("en-BD")}</p>
<pre>${JSON.stringify(data, null, 2).replace(/</g, "&lt;")}</pre>
</body></html>`;
  }
}
