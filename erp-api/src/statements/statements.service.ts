import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { AccountingService } from "../accounting/accounting.service";

type BalRow = {
  glAccountId: string;
  code: string;
  name: string;
  type: string;
  debitPoisha: number;
  creditPoisha: number;
  balancePoisha: number;
};

@Injectable()
export class StatementsService {
  constructor(
    private prisma: PrismaService,
    private gl: AccountingService,
  ) {}

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

  private async glIdByCode(code: string) {
    const acc = await this.prisma.glAccount.findFirst({
      where: { code, deletedAt: null, isPostable: true },
    });
    if (!acc) throw new BadRequestException(`GL account ${code} not found`);
    return acc.id;
  }

  private journalFilter(q?: {
    periodId?: string;
    fiscalYearId?: string;
    from?: string;
    to?: string;
    asOf?: string;
    branchId?: string;
  }) {
    const journal: any = { status: "posted", deletedAt: null };
    if (q?.periodId) journal.periodId = q.periodId;
    if (q?.fiscalYearId) journal.period = { fiscalYearId: q.fiscalYearId, deletedAt: null };
    if (q?.branchId) journal.branchId = q.branchId;
    if (q?.asOf) journal.entryDate = { lte: new Date(q.asOf) };
    if (q?.from || q?.to) {
      journal.entryDate = journal.entryDate || {};
      if (q.from) journal.entryDate.gte = new Date(q.from);
      if (q.to) journal.entryDate.lte = new Date(q.to);
    }
    // Perpetual GL already carries BS balances; exclude OB roll-forward journals from life-to-date.
    if (!q?.periodId && !q?.fiscalYearId) {
      journal.type = { not: "opening" };
    }
    return journal;
  }

  /** Aggregate posted balances by account (asset natural debit positive). */
  async accountBalances(q?: {
    periodId?: string;
    from?: string;
    to?: string;
    asOf?: string;
    branchId?: string;
    types?: string[];
  }): Promise<BalRow[]> {
    const lineWhere: any = { journal: this.journalFilter(q) };
    const grouped = await this.prisma.journalLine.groupBy({
      by: ["glAccountId"],
      where: lineWhere,
      _sum: { debitBasePoisha: true, creditBasePoisha: true },
    });
    if (grouped.length === 0) return [];
    const accounts = await this.prisma.glAccount.findMany({
      where: {
        id: { in: grouped.map((g) => g.glAccountId) },
        deletedAt: null,
        ...(q?.types?.length ? { type: { in: q.types } } : {}),
      },
    });
    const byId = new Map(accounts.map((a) => [a.id, a]));
    return grouped
      .map((g) => {
        const a = byId.get(g.glAccountId);
        if (!a) return null;
        const debit = g._sum.debitBasePoisha || 0;
        const credit = g._sum.creditBasePoisha || 0;
        return {
          glAccountId: g.glAccountId,
          code: a.code,
          name: a.name,
          type: a.type,
          debitPoisha: debit,
          creditPoisha: credit,
          balancePoisha: debit - credit,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.code.localeCompare(b!.code)) as BalRow[];
  }

  // ---------- Ledger inquiry ----------
  async ledgerInquiry(q: {
    glAccountId?: string;
    periodId?: string;
    from?: string;
    to?: string;
    branchId?: string;
    costCenterId?: string;
    currencyCode?: string;
    limit?: number;
  }) {
    const where: any = { journal: this.journalFilter(q) };
    if (q.glAccountId) where.glAccountId = q.glAccountId;
    if (q.costCenterId) where.costCenterId = q.costCenterId;
    if (q.currencyCode) where.currencyCode = q.currencyCode.toUpperCase();
    const lines = await this.prisma.journalLine.findMany({
      where,
      orderBy: [{ journal: { entryDate: "asc" } }, { journal: { journalNo: "asc" } }, { lineNo: "asc" }],
      take: Math.min(1000, q.limit || 500),
      include: {
        glAccount: { select: { id: true, code: true, name: true, type: true } },
        costCenter: { select: { id: true, code: true, name: true } },
        journal: {
          select: {
            id: true,
            journalNo: true,
            entryDate: true,
            type: true,
            memo: true,
            reference: true,
            branchId: true,
            currencyCode: true,
            period: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
    let running = 0;
    const entries = lines.map((l) => {
      running += l.debitBasePoisha - l.creditBasePoisha;
      return {
        journalId: l.journal.id,
        journalNo: l.journal.journalNo,
        entryDate: l.journal.entryDate,
        type: l.journal.type,
        memo: l.memo || l.journal.memo,
        reference: l.journal.reference,
        account: l.glAccount,
        costCenter: l.costCenter,
        branchId: l.journal.branchId,
        currencyCode: l.currencyCode,
        debitPoisha: l.debitBasePoisha,
        creditPoisha: l.creditBasePoisha,
        balancePoisha: running,
        period: l.journal.period,
      };
    });
    return { entries, closingPoisha: running, total: entries.length };
  }

  async ledgerDrilldown(glAccountId: string, q?: { periodId?: string; from?: string; to?: string }) {
    const acc = await this.prisma.glAccount.findFirst({ where: { id: glAccountId, deletedAt: null } });
    if (!acc) throw new NotFoundException("Account not found");
    const inquiry = await this.ledgerInquiry({ ...q, glAccountId });
    return { account: acc, ...inquiry };
  }

  trialBalance(q?: { periodId?: string; asOf?: string; from?: string; to?: string }) {
    return this.gl.reportTrialBalance(q);
  }

  // ---------- Financial statements ----------
  async balanceSheet(q?: { asOf?: string; periodId?: string; compareAsOf?: string }) {
    const asOf = q?.asOf || new Date().toISOString();
    const rows = await this.accountBalances({ asOf, periodId: q?.periodId });
    const assets = rows.filter((r) => r.type === "asset");
    const liabilities = rows.filter((r) => r.type === "liability");
    const equity = rows.filter((r) => r.type === "equity");
    // Unclosed P&L net into equity for BS presentation
    const income = rows.filter((r) => r.type === "income");
    const expense = rows.filter((r) => r.type === "expense");
    const netIncome = income.reduce((s, r) => s + r.creditPoisha - r.debitPoisha, 0) - expense.reduce((s, r) => s + r.debitPoisha - r.creditPoisha, 0);
    const totalAssets = assets.reduce((s, r) => s + r.balancePoisha, 0);
    const totalLiab = liabilities.reduce((s, r) => s + -r.balancePoisha, 0); // credit-normal → positive liability
    const totalEquity = equity.reduce((s, r) => s + -r.balancePoisha, 0) + netIncome;
    const result = {
      asOf,
      assets: assets.map((r) => ({ ...r, displayPoisha: r.balancePoisha })),
      liabilities: liabilities.map((r) => ({ ...r, displayPoisha: -r.balancePoisha })),
      equity: [
        ...equity.map((r) => ({ ...r, displayPoisha: -r.balancePoisha })),
        {
          glAccountId: "net-income",
          code: "NI",
          name: "Current Period Net Income/(Loss)",
          type: "equity",
          debitPoisha: 0,
          creditPoisha: 0,
          balancePoisha: -netIncome,
          displayPoisha: netIncome,
        },
      ],
      totals: {
        assetsPoisha: totalAssets,
        liabilitiesPoisha: totalLiab,
        equityPoisha: totalEquity,
        liabilitiesAndEquityPoisha: totalLiab + totalEquity,
        balanced: totalAssets === totalLiab + totalEquity,
      },
      netIncomePoisha: netIncome,
    };
    if (q?.compareAsOf) {
      const prior = await this.balanceSheet({ asOf: q.compareAsOf });
      return { current: result, prior, comparative: true };
    }
    return result;
  }

  async profitAndLoss(q?: { from?: string; to?: string; periodId?: string; compareFrom?: string; compareTo?: string }) {
    const rows = await this.accountBalances({
      from: q?.from,
      to: q?.to,
      periodId: q?.periodId,
      types: ["income", "expense"],
    });
    const income = rows
      .filter((r) => r.type === "income")
      .map((r) => ({ ...r, displayPoisha: r.creditPoisha - r.debitPoisha }));
    const expenses = rows
      .filter((r) => r.type === "expense")
      .map((r) => ({ ...r, displayPoisha: r.debitPoisha - r.creditPoisha }));
    const totalIncome = income.reduce((s, r) => s + r.displayPoisha, 0);
    const totalExpense = expenses.reduce((s, r) => s + r.displayPoisha, 0);
    const result = {
      from: q?.from || null,
      to: q?.to || null,
      periodId: q?.periodId || null,
      income,
      expenses,
      totals: {
        incomePoisha: totalIncome,
        expensePoisha: totalExpense,
        netIncomePoisha: totalIncome - totalExpense,
      },
    };
    if (q?.compareFrom || q?.compareTo) {
      const prior = await this.profitAndLoss({ from: q.compareFrom, to: q.compareTo });
      return { current: result, prior, comparative: true };
    }
    return result;
  }

  async cashFlow(q?: { from?: string; to?: string }) {
    const cashCodes = ["1100", "1200"];
    const cashAccounts = await this.prisma.glAccount.findMany({
      where: { code: { in: cashCodes }, deletedAt: null },
    });
    const ids = cashAccounts.map((a) => a.id);
    const openingAsOf = q?.from ? new Date(new Date(q.from).getTime() - 86400000) : null;
    const openingRows = openingAsOf
      ? await this.accountBalances({ asOf: openingAsOf.toISOString() })
      : [];
    const closingRows = await this.accountBalances({ asOf: q?.to || new Date().toISOString() });
    const openCash = openingRows.filter((r) => ids.includes(r.glAccountId)).reduce((s, r) => s + r.balancePoisha, 0);
    const closeCash = closingRows.filter((r) => ids.includes(r.glAccountId)).reduce((s, r) => s + r.balancePoisha, 0);
    const pl = await this.profitAndLoss(q);
    const netIncome = (pl as any).totals?.netIncomePoisha ?? (pl as any).current?.totals?.netIncomePoisha ?? 0;
    // Simplified indirect: net income + non-cash approximation = change in cash (plug working capital as residual)
    const netChange = closeCash - openCash;
    const workingCapital = netChange - netIncome;
    return {
      from: q?.from || null,
      to: q?.to || null,
      operating: {
        netIncomePoisha: netIncome,
        workingCapitalAdjustPoisha: workingCapital,
        netOperatingPoisha: netChange,
      },
      investing: { netPoisha: 0 },
      financing: { netPoisha: 0 },
      openingCashPoisha: openCash,
      closingCashPoisha: closeCash,
      netChangePoisha: netChange,
      method: "simplified_indirect",
    };
  }

  async equityStatement(q?: { from?: string; to?: string }) {
    const openingAsOf = q?.from ? new Date(new Date(q.from).getTime() - 86400000).toISOString() : undefined;
    const openEq = openingAsOf
      ? (await this.accountBalances({ asOf: openingAsOf, types: ["equity"] })).reduce((s, r) => s + -r.balancePoisha, 0)
      : 0;
    const closeEq = (
      await this.accountBalances({ asOf: q?.to || new Date().toISOString(), types: ["equity"] })
    ).reduce((s, r) => s + -r.balancePoisha, 0);
    const pl = await this.profitAndLoss(q);
    const netIncome = (pl as any).totals?.netIncomePoisha ?? 0;
    return {
      from: q?.from || null,
      to: q?.to || null,
      openingEquityPoisha: openEq,
      netIncomePoisha: netIncome,
      otherChangesPoisha: closeEq - openEq - netIncome,
      closingEquityPoisha: closeEq,
    };
  }

  async comparative(q: { report: string; asOf?: string; compareAsOf?: string; from?: string; to?: string; compareFrom?: string; compareTo?: string }) {
    const report = q.report || "balance-sheet";
    if (report === "profit-loss") {
      return this.profitAndLoss({
        from: q.from,
        to: q.to,
        compareFrom: q.compareFrom,
        compareTo: q.compareTo,
      });
    }
    return this.balanceSheet({ asOf: q.asOf, compareAsOf: q.compareAsOf });
  }

  async multiPeriod(q: { report: string; periodIds: string }) {
    const ids = String(q.periodIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length < 1) throw new BadRequestException("periodIds required (comma-separated)");
    const periods = await this.prisma.accountingPeriod.findMany({
      where: { id: { in: ids }, deletedAt: null },
      orderBy: { startDate: "asc" },
    });
    const columns: { period: (typeof periods)[number]; data: unknown }[] = [];
    for (const p of periods) {
      if (q.report === "profit-loss") {
        columns.push({ period: p, data: await this.profitAndLoss({ periodId: p.id }) });
      } else {
        columns.push({ period: p, data: await this.balanceSheet({ periodId: p.id, asOf: p.endDate.toISOString() }) });
      }
    }
    return { report: q.report || "balance-sheet", columns };
  }

  // ---------- Analysis ----------
  async analysisAccount(glAccountId: string, q?: { from?: string; to?: string }) {
    return this.ledgerDrilldown(glAccountId, q);
  }

  async analysisCostCenter(q?: { costCenterId?: string; from?: string; to?: string }) {
    const where: any = { journal: this.journalFilter(q), costCenterId: q?.costCenterId ? q.costCenterId : { not: null } };
    const grouped = await this.prisma.journalLine.groupBy({
      by: ["costCenterId"],
      where,
      _sum: { debitBasePoisha: true, creditBasePoisha: true },
    });
    const centers = await this.prisma.costCenter.findMany({
      where: { id: { in: grouped.map((g) => g.costCenterId!).filter(Boolean) } },
    });
    const byId = new Map(centers.map((c) => [c.id, c]));
    return {
      rows: grouped.map((g) => ({
        costCenterId: g.costCenterId,
        code: byId.get(g.costCenterId!)?.code,
        name: byId.get(g.costCenterId!)?.name,
        debitPoisha: g._sum.debitBasePoisha || 0,
        creditPoisha: g._sum.creditBasePoisha || 0,
        netPoisha: (g._sum.debitBasePoisha || 0) - (g._sum.creditBasePoisha || 0),
      })),
    };
  }

  async analysisBranch(q?: { from?: string; to?: string }) {
    const journals = await this.prisma.journalEntry.findMany({
      where: this.journalFilter(q),
      select: { id: true, branchId: true },
    });
    const byBranch = new Map<string, string[]>();
    for (const j of journals) {
      const key = j.branchId || "__none__";
      if (!byBranch.has(key)) byBranch.set(key, []);
      byBranch.get(key)!.push(j.id);
    }
    const rows: {
      branchId: string | null;
      journalCount: number;
      debitPoisha: number;
      creditPoisha: number;
    }[] = [];
    for (const [branchId, ids] of byBranch) {
      const agg = await this.prisma.journalLine.aggregate({
        where: { journalId: { in: ids } },
        _sum: { debitBasePoisha: true, creditBasePoisha: true },
      });
      rows.push({
        branchId: branchId === "__none__" ? null : branchId,
        journalCount: ids.length,
        debitPoisha: agg._sum.debitBasePoisha || 0,
        creditPoisha: agg._sum.creditBasePoisha || 0,
      });
    }
    return { rows };
  }

  async analysisCurrency(q?: { from?: string; to?: string }) {
    const grouped = await this.prisma.journalLine.groupBy({
      by: ["currencyCode"],
      where: { journal: this.journalFilter(q) },
      _sum: { debitPoisha: true, creditPoisha: true, debitBasePoisha: true, creditBasePoisha: true },
    });
    return {
      rows: grouped.map((g) => ({
        currencyCode: g.currencyCode,
        debitPoisha: g._sum.debitPoisha || 0,
        creditPoisha: g._sum.creditPoisha || 0,
        debitBasePoisha: g._sum.debitBasePoisha || 0,
        creditBasePoisha: g._sum.creditBasePoisha || 0,
      })),
    };
  }

  // ---------- Controls ----------
  async lockPeriod(id: string, user: AuthedUser) {
    const period = await this.prisma.accountingPeriod.findFirst({ where: { id, deletedAt: null } });
    if (!period) throw new NotFoundException("Period not found");
    if (period.status === "open") {
      throw new BadRequestException("Close the period before locking");
    }
    if (period.status === "locked") throw new BadRequestException("Already locked");
    const row = await this.prisma.accountingPeriod.update({
      where: { id },
      data: { status: "locked" },
    });
    await this.audit(user.id, "fs.period.lock", "AccountingPeriod", id, row);
    return row;
  }

  async requestReopen(id: string, reason: string, user: AuthedUser) {
    const period = await this.prisma.accountingPeriod.findFirst({ where: { id, deletedAt: null } });
    if (!period) throw new NotFoundException("Period not found");
    if (period.status === "open") throw new BadRequestException("Period is already open");
    if (!reason?.trim()) throw new BadRequestException("reason required");
    const pending = await this.prisma.periodReopenRequest.findFirst({
      where: { periodId: id, status: "pending" },
    });
    if (pending) throw new BadRequestException("A reopen request is already pending");
    const row = await this.prisma.periodReopenRequest.create({
      data: { periodId: id, reason: reason.trim(), requestedBy: user.id },
    });
    await this.audit(user.id, "fs.period.reopen_request", "PeriodReopenRequest", row.id, row);
    return row;
  }

  async approveReopen(id: string, user: AuthedUser, note?: string) {
    const req = await this.prisma.periodReopenRequest.findFirst({
      where: { periodId: id, status: "pending" },
      orderBy: { requestedAt: "desc" },
    });
    if (!req) throw new NotFoundException("No pending reopen request");
    const period = await this.prisma.accountingPeriod.update({
      where: { id },
      data: { status: "open", closedAt: null, closedBy: null },
    });
    const row = await this.prisma.periodReopenRequest.update({
      where: { id: req.id },
      data: {
        status: "approved",
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    });
    await this.audit(user.id, "fs.period.reopen_approve", "AccountingPeriod", id, { period, request: row });
    return { period, request: row };
  }

  async rejectReopen(id: string, user: AuthedUser, note?: string) {
    const req = await this.prisma.periodReopenRequest.findFirst({
      where: { periodId: id, status: "pending" },
      orderBy: { requestedAt: "desc" },
    });
    if (!req) throw new NotFoundException("No pending reopen request");
    const row = await this.prisma.periodReopenRequest.update({
      where: { id: req.id },
      data: {
        status: "rejected",
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    });
    await this.audit(user.id, "fs.period.reopen_reject", "PeriodReopenRequest", row.id, row);
    return row;
  }

  listReopenRequests(status?: string) {
    return this.prisma.periodReopenRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedAt: "desc" },
      take: 100,
      include: { period: { select: { id: true, code: true, name: true, status: true } } },
    });
  }

  async reverseJournal(journalId: string, user: AuthedUser, memo?: string) {
    const src = await this.gl.getJournal(journalId);
    if (src.status !== "posted") throw new BadRequestException("Only posted journals can be reversed");
    const existing = await this.prisma.journalEntry.findFirst({
      where: { reversesJournalId: journalId, deletedAt: null, status: { not: "void" } },
    });
    if (existing) throw new BadRequestException(`Already reversed by ${existing.journalNo}`);
    const period = await this.prisma.accountingPeriod.findFirst({ where: { id: src.periodId } });
    if (!period || period.status !== "open") {
      throw new BadRequestException("Period must be open to post a reversal");
    }
    const lines = (src.lines || []).map((l: any) => ({
      glAccountId: l.glAccountId,
      costCenterId: l.costCenterId,
      debitPoisha: l.creditPoisha,
      creditPoisha: l.debitPoisha,
      currencyCode: l.currencyCode || "BDT",
      memo: l.memo,
    }));
    const je = await this.gl.createJournal(
      {
        entryDate: new Date().toISOString(),
        periodId: src.periodId,
        type: "adjustment",
        memo: memo || `Reversal of ${src.journalNo}`,
        reference: `REV-${src.journalNo}`,
        branchId: src.branchId,
        currencyCode: src.currencyCode,
        lines,
      },
      user,
    );
    await this.prisma.journalEntry.update({
      where: { id: je.id },
      data: { reversesJournalId: journalId },
    });
    const posted = await this.gl.postJournal(je.id, user);
    await this.audit(user.id, "fs.journal.reverse", "JournalEntry", posted.id, {
      reverses: src.journalNo,
      reversal: posted.journalNo,
    });
    return posted;
  }

  /** Year-end: close income/expense into RE (3100), close FY + lock periods. */
  async yearEndClose(fiscalYearId: string, user: AuthedUser) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id: fiscalYearId, deletedAt: null },
      include: { periods: { where: { deletedAt: null } } },
    });
    if (!fy) throw new NotFoundException("Fiscal year not found");
    if (fy.status === "closed") throw new BadRequestException("Fiscal year already closed");
    const openPeriods = fy.periods.filter((p) => p.status === "open");
    if (openPeriods.length > 0) {
      throw new BadRequestException(`Close all periods first (${openPeriods.length} still open)`);
    }
    const rows = await this.accountBalances({
      from: fy.startDate.toISOString(),
      to: fy.endDate.toISOString(),
      types: ["income", "expense"],
    });
    const lines: { glAccountId: string; debitPoisha: number; creditPoisha: number; memo?: string }[] = [];
    let net = 0;
    for (const r of rows) {
      if (r.type === "income") {
        const amt = r.creditPoisha - r.debitPoisha;
        if (amt === 0) continue;
        lines.push({ glAccountId: r.glAccountId, debitPoisha: amt, creditPoisha: 0, memo: "Year-end close" });
        net += amt;
      } else if (r.type === "expense") {
        const amt = r.debitPoisha - r.creditPoisha;
        if (amt === 0) continue;
        lines.push({ glAccountId: r.glAccountId, debitPoisha: 0, creditPoisha: amt, memo: "Year-end close" });
        net -= amt;
      }
    }
    const reId = await this.glIdByCode("3100");
    if (net > 0) lines.push({ glAccountId: reId, debitPoisha: 0, creditPoisha: net, memo: "To retained earnings" });
    else if (net < 0) lines.push({ glAccountId: reId, debitPoisha: -net, creditPoisha: 0, memo: "To retained earnings" });

    let closingJournalId: string | null = null;
    if (lines.length >= 2) {
      const lastPeriod = [...fy.periods].sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0];
      // Temporarily reopen last period to post closing entry
      if (lastPeriod.status !== "open") {
        await this.prisma.accountingPeriod.update({ where: { id: lastPeriod.id }, data: { status: "open" } });
      }
      const je = await this.gl.createJournal(
        {
          entryDate: fy.endDate.toISOString(),
          periodId: lastPeriod.id,
          type: "closing",
          memo: `Year-end closing ${fy.code}`,
          reference: `YE-CLOSE-${fy.code}`,
          lines,
        },
        user,
      );
      const posted = await this.gl.postJournal(je.id, user);
      closingJournalId = posted.id;
      await this.prisma.accountingPeriod.update({
        where: { id: lastPeriod.id },
        data: { status: "locked", closedAt: new Date(), closedBy: user.id },
      });
    }
    for (const p of fy.periods) {
      if (p.status !== "locked") {
        await this.prisma.accountingPeriod.update({ where: { id: p.id }, data: { status: "locked" } });
      }
    }
    await this.prisma.fiscalYear.update({ where: { id: fy.id }, data: { status: "closed" } });
    const run = await this.prisma.closingRun.create({
      data: {
        type: "year_end",
        fiscalYearId: fy.id,
        closingJournalId,
        status: "completed",
        createdBy: user.id,
        completedAt: new Date(),
        notes: `Closed ${fy.code}`,
        meta: { netIncomePoisha: net, lines: lines.length },
      },
    });
    await this.audit(user.id, "fs.year_end.close", "ClosingRun", run.id, run);
    return run;
  }

  /** Roll forward: create next FY + monthly periods + opening BS journal. */
  async rollForward(fiscalYearId: string, user: AuthedUser) {
    const fy = await this.prisma.fiscalYear.findFirst({ where: { id: fiscalYearId, deletedAt: null } });
    if (!fy) throw new NotFoundException("Fiscal year not found");
    if (fy.status !== "closed") throw new BadRequestException("Close the fiscal year before roll-forward");
    const nextYear = fy.endDate.getUTCFullYear() + 1;
    const code = `FY${nextYear}`;
    const existing = await this.prisma.fiscalYear.findFirst({ where: { code, deletedAt: null } });
    if (existing) throw new BadRequestException(`${code} already exists`);
    const start = new Date(`${nextYear}-01-01T00:00:00Z`);
    const end = new Date(`${nextYear}-12-31T23:59:59Z`);
    const newFy = await this.gl.createFiscalYear(
      {
        code,
        name: `Fiscal Year ${nextYear}`,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        createMonthlyPeriods: true,
      },
      user,
    );
    const bs = await this.accountBalances({ asOf: fy.endDate.toISOString(), types: ["asset", "liability", "equity"] });
    const lines: { glAccountId: string; debitPoisha: number; creditPoisha: number }[] = [];
    for (const r of bs) {
      if (r.balancePoisha === 0) continue;
      if (r.balancePoisha > 0) lines.push({ glAccountId: r.glAccountId, debitPoisha: r.balancePoisha, creditPoisha: 0 });
      else lines.push({ glAccountId: r.glAccountId, debitPoisha: 0, creditPoisha: -r.balancePoisha });
    }
    let openingJournalId: string | null = null;
    if (lines.length >= 2) {
      const firstPeriod = await this.prisma.accountingPeriod.findFirst({
        where: { fiscalYearId: newFy!.id, deletedAt: null },
        orderBy: { startDate: "asc" },
      });
      const je = await this.gl.createJournal(
        {
          entryDate: start.toISOString(),
          periodId: firstPeriod!.id,
          type: "opening",
          memo: `Opening balances from ${fy.code}`,
          reference: `OB-${code}`,
          lines,
        },
        user,
      );
      const posted = await this.gl.postJournal(je.id, user);
      openingJournalId = posted.id;
    }
    const run = await this.prisma.closingRun.create({
      data: {
        type: "roll_forward",
        fiscalYearId: newFy!.id,
        openingJournalId,
        status: "completed",
        createdBy: user.id,
        completedAt: new Date(),
        notes: `Roll forward from ${fy.code} → ${code}`,
        meta: { fromFiscalYearId: fy.id, lineCount: lines.length },
      },
    });
    await this.audit(user.id, "fs.year_end.roll_forward", "ClosingRun", run.id, run);
    return { fiscalYear: newFy, run };
  }

  listClosingRuns() {
    return this.prisma.closingRun.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }

  // ---------- Exports ----------
  async exportReport(report: string, format: string, q: Record<string, string>) {
    let data: any;
    switch (report) {
      case "trial-balance":
        data = await this.trialBalance(q);
        break;
      case "balance-sheet":
        data = await this.balanceSheet(q);
        break;
      case "profit-loss":
        data = await this.profitAndLoss(q);
        break;
      case "cash-flow":
        data = await this.cashFlow(q);
        break;
      case "equity":
        data = await this.equityStatement(q);
        break;
      case "ledger":
        data = await this.ledgerInquiry(q);
        break;
      default:
        throw new BadRequestException("Unknown report");
    }
    if (format === "csv") {
      return { contentType: "text/csv; charset=utf-8", body: this.toCsv(report, data), filename: `${report}.csv` };
    }
    return {
      contentType: "text/html; charset=utf-8",
      body: this.toHtml(report, data),
      filename: `${report}.html`,
    };
  }

  private toCsv(report: string, data: any): string {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    if (report === "trial-balance" || report === "ledger") {
      const rows = data.rows || data.entries || [];
      if (report === "trial-balance") {
        const header = ["code", "name", "type", "debitPoisha", "creditPoisha", "balancePoisha"];
        return [header.join(","), ...rows.map((r: any) => header.map((h) => esc(r[h])).join(","))].join("\n");
      }
      const header = ["journalNo", "entryDate", "debitPoisha", "creditPoisha", "balancePoisha", "memo"];
      return [header.join(","), ...rows.map((r: any) => header.map((h) => esc(r[h])).join(","))].join("\n");
    }
    return esc(JSON.stringify(data));
  }

  private toHtml(report: string, data: any): string {
    const title = report.replace(/-/g, " ").toUpperCase();
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#0f172a}h1{font-size:18px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left}th{background:#f8fafc}@media print{button{display:none}}</style>
</head><body>
<button onclick="window.print()">Print / Save PDF</button>
<h1>Shanghai Travels — ${title}</h1>
<pre style="white-space:pre-wrap;font-size:11px;background:#f8fafc;padding:12px;border-radius:8px">${JSON.stringify(data, null, 2)}</pre>
</body></html>`;
  }

  /** Travel ERP validation: counts of case-linked posted journals by service. */
  async travelValidation() {
    const apps = await this.prisma.application.findMany({
      where: { deletedAt: null },
      select: { id: true, serviceType: true, referenceNo: true },
      take: 5000,
    });
    const byService: Record<string, { cases: number; arPosted: number; apPosted: number }> = {};
    for (const a of apps) {
      const key = a.serviceType;
      if (!byService[key]) byService[key] = { cases: 0, arPosted: 0, apPosted: 0 };
      byService[key].cases += 1;
    }
    const ar = await this.prisma.arDocument.groupBy({
      by: ["applicationId"],
      where: { deletedAt: null, status: "posted", applicationId: { not: null } },
    });
    const ap = await this.prisma.apDocument.groupBy({
      by: ["applicationId"],
      where: { deletedAt: null, status: "posted", applicationId: { not: null } },
    });
    const appById = new Map(apps.map((a) => [a.id, a.serviceType]));
    for (const row of ar) {
      const st = appById.get(row.applicationId!);
      if (st && byService[st]) byService[st].arPosted += 1;
    }
    for (const row of ap) {
      const st = appById.get(row.applicationId!);
      if (st && byService[st]) byService[st].apPosted += 1;
    }
    const tb = await this.trialBalance();
    const banking = await this.prisma.bankMovement.count({ where: { status: "posted", deletedAt: null } });
    return {
      byService,
      trialBalanceBalanced: tb.balanced,
      postedBankMovements: banking,
      postedJournals: await this.prisma.journalEntry.count({ where: { status: "posted", deletedAt: null } }),
    };
  }
}
