import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";

const ACCOUNT_TYPES = new Set(["asset", "liability", "equity", "income", "expense"]);
const JOURNAL_TYPES = new Set(["standard", "opening", "closing", "adjustment"]);
const EDITABLE = new Set(["draft", "rejected"]);

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

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

  private num(v: unknown): number {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new BadRequestException("invalid number");
    return Math.round(n);
  }

  // ---------- Bootstrap ----------
  async bootstrap(user: AuthedUser) {
    const existing = await this.prisma.glAccount.count({ where: { deletedAt: null } });
    if (existing > 0) {
      return { bootstrapped: false, message: "GL already has accounts" };
    }

    await this.prisma.currency.upsert({
      where: { code: "BDT" },
      create: { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", isBase: true, decimalPlaces: 2 },
      update: { isBase: true, isActive: true, deletedAt: null },
    });
    await this.prisma.currency.upsert({
      where: { code: "USD" },
      create: { code: "USD", name: "US Dollar", symbol: "$", isBase: false, decimalPlaces: 2 },
      update: { isActive: true, deletedAt: null },
    });
    await this.prisma.currency.upsert({
      where: { code: "SAR" },
      create: { code: "SAR", name: "Saudi Riyal", symbol: "﷼", isBase: false, decimalPlaces: 2 },
      update: { isActive: true, deletedAt: null },
    });

    const groups = [
      { code: "1", name: "Assets", type: "asset", sortOrder: 1 },
      { code: "2", name: "Liabilities", type: "liability", sortOrder: 2 },
      { code: "3", name: "Equity", type: "equity", sortOrder: 3 },
      { code: "4", name: "Income", type: "income", sortOrder: 4 },
      { code: "5", name: "Expenses", type: "expense", sortOrder: 5 },
    ];
    const groupIds: Record<string, string> = {};
    for (const g of groups) {
      const row = await this.prisma.glAccountGroup.create({ data: g });
      groupIds[g.type] = row.id;
    }

    const accounts = [
      { code: "1000", name: "Current Assets", type: "asset", isHeader: true, isPostable: false },
      { code: "1100", name: "Cash on Hand", type: "asset", isHeader: false, isPostable: true },
      { code: "1200", name: "Bank Accounts", type: "asset", isHeader: false, isPostable: true },
      { code: "1300", name: "Accounts Receivable", type: "asset", isHeader: false, isPostable: true },
      { code: "2000", name: "Current Liabilities", type: "liability", isHeader: true, isPostable: false },
      { code: "2100", name: "Accounts Payable", type: "liability", isHeader: false, isPostable: true },
      { code: "2200", name: "VAT Payable", type: "liability", isHeader: false, isPostable: true, taxCode: "VAT" },
      { code: "3000", name: "Owner Equity", type: "equity", isHeader: false, isPostable: true },
      { code: "3100", name: "Retained Earnings", type: "equity", isHeader: false, isPostable: true },
      { code: "4000", name: "Service Revenue", type: "income", isHeader: false, isPostable: true },
      { code: "4100", name: "Tour Package Revenue", type: "income", isHeader: false, isPostable: true },
      { code: "5000", name: "Operating Expenses", type: "expense", isHeader: true, isPostable: false },
      { code: "5100", name: "Office Expense", type: "expense", isHeader: false, isPostable: true },
      { code: "5200", name: "Supplier Cost", type: "expense", isHeader: false, isPostable: true },
      { code: "5300", name: "Salaries", type: "expense", isHeader: false, isPostable: true },
    ];
    for (const [i, a] of accounts.entries()) {
      await this.prisma.glAccount.create({
        data: {
          ...a,
          groupId: groupIds[a.type],
          sortOrder: i + 1,
          createdBy: user.id,
        },
      });
    }

    const year = new Date().getFullYear();
    const fy = await this.prisma.fiscalYear.create({
      data: {
        code: `FY${year}`,
        name: `Fiscal Year ${year}`,
        startDate: new Date(`${year}-01-01T00:00:00Z`),
        endDate: new Date(`${year}-12-31T23:59:59Z`),
        status: "open",
        createdBy: user.id,
      },
    });
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let m = 0; m < 12; m++) {
      const start = new Date(Date.UTC(year, m, 1));
      const end = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59));
      await this.prisma.accountingPeriod.create({
        data: {
          fiscalYearId: fy.id,
          code: `${year}-${String(m + 1).padStart(2, "0")}`,
          name: `${months[m]} ${year}`,
          startDate: start,
          endDate: end,
          status: "open",
        },
      });
    }

    await this.prisma.costCenter.create({
      data: { code: "HQ", name: "Head Office", createdBy: user.id },
    });

    await this.audit(user.id, "gl.bootstrap", "GlAccount", null, { year, accounts: accounts.length });
    return { bootstrapped: true, fiscalYear: fy.code, accounts: accounts.length };
  }

  // ---------- Groups ----------
  listGroups() {
    return this.prisma.glAccountGroup.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      include: { _count: { select: { accounts: true } } },
    });
  }

  async createGroup(dto: any, user: AuthedUser) {
    const code = String(dto?.code || "").trim();
    const name = String(dto?.name || "").trim();
    const type = String(dto?.type || "").trim();
    if (!code || !name) throw new BadRequestException("code and name required");
    if (!ACCOUNT_TYPES.has(type)) throw new BadRequestException("invalid type");
    const row = await this.prisma.glAccountGroup.create({
      data: {
        code,
        name,
        type,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder != null ? this.num(dto.sortOrder) : 0,
        isActive: dto.isActive !== false,
      },
    });
    await this.audit(user.id, "gl.group.create", "GlAccountGroup", row.id, row);
    return row;
  }

  async updateGroup(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.glAccountGroup.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Group not found");
    const data: any = {};
    if (dto.code !== undefined) data.code = String(dto.code).trim();
    if (dto.name !== undefined) data.name = String(dto.name).trim();
    if (dto.type !== undefined) {
      if (!ACCOUNT_TYPES.has(String(dto.type))) throw new BadRequestException("invalid type");
      data.type = String(dto.type);
    }
    if (dto.parentId !== undefined) data.parentId = dto.parentId || null;
    if (dto.sortOrder !== undefined) data.sortOrder = this.num(dto.sortOrder);
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    const row = await this.prisma.glAccountGroup.update({ where: { id }, data });
    await this.audit(user.id, "gl.group.update", "GlAccountGroup", id, row);
    return row;
  }

  // ---------- Accounts ----------
  listAccounts(q?: string, type?: string, active?: string) {
    const where: any = { deletedAt: null };
    if (active === "true") where.isActive = true;
    if (type) where.type = type;
    if (q?.trim()) {
      where.OR = [
        { code: { contains: q.trim(), mode: "insensitive" } },
        { name: { contains: q.trim(), mode: "insensitive" } },
      ];
    }
    return this.prisma.glAccount.findMany({
      where,
      orderBy: [{ code: "asc" }],
      include: { group: { select: { id: true, code: true, name: true } } },
      take: 500,
    });
  }

  async createAccount(dto: any, user: AuthedUser) {
    const code = String(dto?.code || "").trim();
    const name = String(dto?.name || "").trim();
    const type = String(dto?.type || "").trim();
    if (!code || !name) throw new BadRequestException("code and name required");
    if (!ACCOUNT_TYPES.has(type)) throw new BadRequestException("invalid type");
    const isHeader = !!dto.isHeader;
    const row = await this.prisma.glAccount.create({
      data: {
        code,
        name,
        type,
        groupId: dto.groupId || null,
        parentId: dto.parentId || null,
        isHeader,
        isPostable: dto.isPostable != null ? !!dto.isPostable : !isHeader,
        currencyCode: dto.currencyCode || null,
        branchId: dto.branchId || null,
        taxCode: dto.taxCode || null,
        costCenterRequired: !!dto.costCenterRequired,
        description: dto.description || null,
        sortOrder: dto.sortOrder != null ? this.num(dto.sortOrder) : 0,
        isActive: dto.isActive !== false,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "gl.account.create", "GlAccount", row.id, row);
    return row;
  }

  async updateAccount(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.glAccount.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Account not found");
    const data: any = {};
    for (const k of ["name", "description", "currencyCode", "branchId", "taxCode"] as const) {
      if (dto[k] !== undefined) data[k] = dto[k] == null ? null : String(dto[k]);
    }
    if (dto.code !== undefined) data.code = String(dto.code).trim();
    if (dto.type !== undefined) {
      if (!ACCOUNT_TYPES.has(String(dto.type))) throw new BadRequestException("invalid type");
      data.type = String(dto.type);
    }
    if (dto.groupId !== undefined) data.groupId = dto.groupId || null;
    if (dto.parentId !== undefined) data.parentId = dto.parentId || null;
    if (dto.isHeader !== undefined) data.isHeader = !!dto.isHeader;
    if (dto.isPostable !== undefined) data.isPostable = !!dto.isPostable;
    if (dto.costCenterRequired !== undefined) data.costCenterRequired = !!dto.costCenterRequired;
    if (dto.sortOrder !== undefined) data.sortOrder = this.num(dto.sortOrder);
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    const row = await this.prisma.glAccount.update({ where: { id }, data });
    await this.audit(user.id, "gl.account.update", "GlAccount", id, row);
    return row;
  }

  // ---------- Fiscal years / periods ----------
  listFiscalYears() {
    return this.prisma.fiscalYear.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: "desc" },
      include: { periods: { where: { deletedAt: null }, orderBy: { startDate: "asc" } } },
    });
  }

  async createFiscalYear(dto: any, user: AuthedUser) {
    const code = String(dto?.code || "").trim();
    const name = String(dto?.name || "").trim();
    if (!code || !name || !dto.startDate || !dto.endDate) {
      throw new BadRequestException("code, name, startDate, endDate required");
    }
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (!(end > start)) throw new BadRequestException("endDate must be after startDate");
    const fy = await this.prisma.fiscalYear.create({
      data: { code, name, startDate: start, endDate: end, status: "open", createdBy: user.id },
    });
    if (dto.createMonthlyPeriods) {
      let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
      while (cursor <= end) {
        const pStart = new Date(cursor);
        const pEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0, 23, 59, 59));
        const clippedEnd = pEnd > end ? end : pEnd;
        await this.prisma.accountingPeriod.create({
          data: {
            fiscalYearId: fy.id,
            code: `${pStart.getUTCFullYear()}-${String(pStart.getUTCMonth() + 1).padStart(2, "0")}`,
            name: pStart.toLocaleString("en", { month: "short", year: "numeric", timeZone: "UTC" }),
            startDate: pStart < start ? start : pStart,
            endDate: clippedEnd,
            status: "open",
          },
        });
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
      }
    }
    await this.audit(user.id, "gl.fiscal.create", "FiscalYear", fy.id, fy);
    return this.prisma.fiscalYear.findUnique({
      where: { id: fy.id },
      include: { periods: { orderBy: { startDate: "asc" } } },
    });
  }

  async createPeriod(dto: any, user: AuthedUser) {
    if (!dto.fiscalYearId || !dto.code || !dto.name || !dto.startDate || !dto.endDate) {
      throw new BadRequestException("fiscalYearId, code, name, startDate, endDate required");
    }
    const fy = await this.prisma.fiscalYear.findFirst({ where: { id: dto.fiscalYearId, deletedAt: null } });
    if (!fy) throw new NotFoundException("Fiscal year not found");
    if (fy.status === "closed") throw new BadRequestException("Fiscal year is closed");
    const row = await this.prisma.accountingPeriod.create({
      data: {
        fiscalYearId: fy.id,
        code: String(dto.code).trim(),
        name: String(dto.name).trim(),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: "open",
      },
    });
    await this.audit(user.id, "gl.period.create", "AccountingPeriod", row.id, row);
    return row;
  }

  async closePeriod(id: string, user: AuthedUser) {
    const period = await this.prisma.accountingPeriod.findFirst({ where: { id, deletedAt: null } });
    if (!period) throw new NotFoundException("Period not found");
    if (period.status === "closed" || period.status === "locked") {
      throw new BadRequestException("Period already closed");
    }
    const openDrafts = await this.prisma.journalEntry.count({
      where: { periodId: id, deletedAt: null, status: { in: ["draft", "pending_approval"] } },
    });
    if (openDrafts > 0) {
      throw new BadRequestException(`Cannot close: ${openDrafts} unposted journal(s) in period`);
    }
    const row = await this.prisma.accountingPeriod.update({
      where: { id },
      data: { status: "closed", closedAt: new Date(), closedBy: user.id },
    });
    await this.audit(user.id, "gl.period.close", "AccountingPeriod", id, row);
    return row;
  }

  async reopenPeriod(id: string, user: AuthedUser) {
    const period = await this.prisma.accountingPeriod.findFirst({ where: { id, deletedAt: null } });
    if (!period) throw new NotFoundException("Period not found");
    if (period.status === "locked") throw new BadRequestException("Locked periods cannot be reopened");
    const row = await this.prisma.accountingPeriod.update({
      where: { id },
      data: { status: "open", closedAt: null, closedBy: null },
    });
    await this.audit(user.id, "gl.period.reopen", "AccountingPeriod", id, row);
    return row;
  }

  // ---------- Cost centers ----------
  listCostCenters() {
    return this.prisma.costCenter.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      take: 200,
    });
  }

  async createCostCenter(dto: any, user: AuthedUser) {
    const code = String(dto?.code || "").trim();
    const name = String(dto?.name || "").trim();
    if (!code || !name) throw new BadRequestException("code and name required");
    const row = await this.prisma.costCenter.create({
      data: {
        code,
        name,
        branchId: dto.branchId || null,
        notes: dto.notes || null,
        isActive: dto.isActive !== false,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "gl.costcenter.create", "CostCenter", row.id, row);
    return row;
  }

  async updateCostCenter(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.costCenter.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Cost center not found");
    const data: any = {};
    if (dto.code !== undefined) data.code = String(dto.code).trim();
    if (dto.name !== undefined) data.name = String(dto.name).trim();
    if (dto.branchId !== undefined) data.branchId = dto.branchId || null;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    const row = await this.prisma.costCenter.update({ where: { id }, data });
    await this.audit(user.id, "gl.costcenter.update", "CostCenter", id, row);
    return row;
  }

  // ---------- Currencies / FX ----------
  listCurrencies() {
    return this.prisma.currency.findMany({ where: { deletedAt: null }, orderBy: { code: "asc" } });
  }

  async createCurrency(dto: any, user: AuthedUser) {
    const code = String(dto?.code || "").trim().toUpperCase();
    const name = String(dto?.name || "").trim();
    if (!code || !name) throw new BadRequestException("code and name required");
    if (dto.isBase) {
      await this.prisma.currency.updateMany({ data: { isBase: false }, where: { isBase: true } });
    }
    const row = await this.prisma.currency.create({
      data: {
        code,
        name,
        symbol: dto.symbol || null,
        decimalPlaces: dto.decimalPlaces != null ? this.num(dto.decimalPlaces) : 2,
        isBase: !!dto.isBase,
        isActive: dto.isActive !== false,
      },
    });
    await this.audit(user.id, "gl.currency.create", "Currency", row.id, row);
    return row;
  }

  async updateCurrency(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.currency.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Currency not found");
    if (dto.isBase) {
      await this.prisma.currency.updateMany({ data: { isBase: false }, where: { isBase: true } });
    }
    const data: any = {};
    if (dto.name !== undefined) data.name = String(dto.name).trim();
    if (dto.symbol !== undefined) data.symbol = dto.symbol;
    if (dto.decimalPlaces !== undefined) data.decimalPlaces = this.num(dto.decimalPlaces);
    if (dto.isBase !== undefined) data.isBase = !!dto.isBase;
    if (dto.isActive !== undefined) data.isActive = !!dto.isActive;
    const row = await this.prisma.currency.update({ where: { id }, data });
    await this.audit(user.id, "gl.currency.update", "Currency", id, row);
    return row;
  }

  listExchangeRates() {
    return this.prisma.exchangeRate.findMany({
      where: { deletedAt: null },
      orderBy: { rateDate: "desc" },
      take: 200,
    });
  }

  async createExchangeRate(dto: any, user: AuthedUser) {
    const fromCode = String(dto?.fromCode || "").trim().toUpperCase();
    const toCode = String(dto?.toCode || "").trim().toUpperCase();
    if (!fromCode || !toCode || !dto.rate || !dto.rateDate) {
      throw new BadRequestException("fromCode, toCode, rate, rateDate required");
    }
    const rate = Number(dto.rate);
    if (!Number.isFinite(rate) || rate <= 0) throw new BadRequestException("invalid rate");
    const rateScaled = BigInt(Math.round(rate * 1e8));
    const from = await this.prisma.currency.findFirst({ where: { code: fromCode, deletedAt: null } });
    const to = await this.prisma.currency.findFirst({ where: { code: toCode, deletedAt: null } });
    if (!from || !to) throw new BadRequestException("Unknown currency code");
    const row = await this.prisma.exchangeRate.create({
      data: {
        fromCode,
        toCode,
        rateScaled,
        rateDate: new Date(dto.rateDate),
        source: dto.source || null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "gl.fx.create", "ExchangeRate", row.id, {
      fromCode,
      toCode,
      rate,
      rateDate: dto.rateDate,
    });
    return { ...row, rateScaled: row.rateScaled.toString(), rate };
  }

  // ---------- Journals ----------
  private async nextJournalNo(entryDate: Date) {
    const y = entryDate.getUTCFullYear();
    const prefix = `JV-${y}-`;
    const last = await this.prisma.journalEntry.findFirst({
      where: { journalNo: { startsWith: prefix } },
      orderBy: { journalNo: "desc" },
    });
    const seq = last ? Number(last.journalNo.slice(prefix.length)) + 1 : 1;
    return `${prefix}${String(seq).padStart(5, "0")}`;
  }

  private async resolvePeriod(entryDate: Date, periodId?: string) {
    if (periodId) {
      const p = await this.prisma.accountingPeriod.findFirst({ where: { id: periodId, deletedAt: null } });
      if (!p) throw new NotFoundException("Period not found");
      return p;
    }
    const p = await this.prisma.accountingPeriod.findFirst({
      where: { deletedAt: null, startDate: { lte: entryDate }, endDate: { gte: entryDate } },
      orderBy: { startDate: "desc" },
    });
    if (!p) throw new BadRequestException("No accounting period covers this entry date");
    return p;
  }

  private async normalizeLines(lines: any[]) {
    if (!Array.isArray(lines) || lines.length < 2) {
      throw new BadRequestException("Journal requires at least 2 lines");
    }
    const out: {
      lineNo: number;
      glAccountId: string;
      costCenterId: string | null;
      debitPoisha: number;
      creditPoisha: number;
      currencyCode: string;
      fxRateScaled: bigint | null;
      debitBasePoisha: number;
      creditBasePoisha: number;
      memo: string | null;
    }[] = [];
    let td = 0;
    let tc = 0;
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      const glAccountId = String(L.glAccountId || "").trim();
      if (!glAccountId) throw new BadRequestException(`Line ${i + 1}: glAccountId required`);
      const acc = await this.prisma.glAccount.findFirst({ where: { id: glAccountId, deletedAt: null } });
      if (!acc) throw new BadRequestException(`Line ${i + 1}: account not found`);
      if (!acc.isActive || !acc.isPostable || acc.isHeader) {
        throw new BadRequestException(`Line ${i + 1}: account ${acc.code} is not postable`);
      }
      const debit = L.debitPoisha != null ? this.num(L.debitPoisha) : 0;
      const credit = L.creditPoisha != null ? this.num(L.creditPoisha) : 0;
      if (debit < 0 || credit < 0) throw new BadRequestException(`Line ${i + 1}: amounts must be ≥ 0`);
      if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        throw new BadRequestException(`Line ${i + 1}: enter either debit or credit`);
      }
      if (acc.costCenterRequired && !L.costCenterId) {
        throw new BadRequestException(`Line ${i + 1}: cost center required for ${acc.code}`);
      }
      const currencyCode = String(L.currencyCode || "BDT").toUpperCase();
      let fxRateScaled: bigint | null = null;
      let debitBase = debit;
      let creditBase = credit;
      if (currencyCode !== "BDT") {
        const rate = L.fxRate != null ? Number(L.fxRate) : null;
        if (!rate || rate <= 0) throw new BadRequestException(`Line ${i + 1}: fxRate required for ${currencyCode}`);
        fxRateScaled = BigInt(Math.round(rate * 1e8));
        debitBase = Math.round(debit * rate);
        creditBase = Math.round(credit * rate);
      }
      td += debitBase;
      tc += creditBase;
      out.push({
        lineNo: i + 1,
        glAccountId,
        costCenterId: L.costCenterId || null,
        debitPoisha: debit,
        creditPoisha: credit,
        currencyCode,
        fxRateScaled,
        debitBasePoisha: debitBase,
        creditBasePoisha: creditBase,
        memo: L.memo != null ? String(L.memo) : null,
      });
    }
    if (td !== tc) {
      throw new BadRequestException(`Journal unbalanced: debit ${td} ≠ credit ${tc} (poisha)`);
    }
    if (td === 0) throw new BadRequestException("Journal total cannot be zero");
    return { lines: out, totalDebitPoisha: td, totalCreditPoisha: tc };
  }

  listJournals(q?: { status?: string; periodId?: string; type?: string; limit?: number }) {
    const where: any = { deletedAt: null };
    if (q?.status) where.status = q.status;
    if (q?.periodId) where.periodId = q.periodId;
    if (q?.type) where.type = q.type;
    return this.prisma.journalEntry.findMany({
      where,
      orderBy: [{ entryDate: "desc" }, { journalNo: "desc" }],
      take: Math.min(200, q?.limit || 100),
      include: {
        period: { select: { id: true, code: true, name: true, status: true } },
        _count: { select: { lines: true } },
      },
    });
  }

  async getJournal(id: string) {
    const row = await this.prisma.journalEntry.findFirst({
      where: { id, deletedAt: null },
      include: {
        period: true,
        lines: {
          orderBy: { lineNo: "asc" },
          include: {
            glAccount: { select: { id: true, code: true, name: true, type: true } },
            costCenter: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException("Journal not found");
    return {
      ...row,
      lines: row.lines.map((l) => ({
        ...l,
        fxRateScaled: l.fxRateScaled != null ? l.fxRateScaled.toString() : null,
      })),
    };
  }

  async createJournal(dto: any, user: AuthedUser) {
    const entryDate = new Date(dto.entryDate || Date.now());
    if (Number.isNaN(entryDate.getTime())) throw new BadRequestException("invalid entryDate");
    const type = String(dto.type || "standard");
    if (!JOURNAL_TYPES.has(type)) throw new BadRequestException("invalid journal type");
    const period = await this.resolvePeriod(entryDate, dto.periodId);
    if (period.status !== "open") {
      throw new BadRequestException(
        period.status === "locked" ? "Period is locked — cannot create journal" : "Period is closed — cannot create journal",
      );
    }
    const { lines, totalDebitPoisha, totalCreditPoisha } = await this.normalizeLines(dto.lines || []);
    const journalNo = dto.journalNo?.trim() || (await this.nextJournalNo(entryDate));
    const row = await this.prisma.$transaction(async (tx) => {
      const je = await tx.journalEntry.create({
        data: {
          journalNo,
          entryDate,
          periodId: period.id,
          branchId: dto.branchId || null,
          currencyCode: String(dto.currencyCode || "BDT").toUpperCase(),
          type,
          status: "draft",
          memo: dto.memo || null,
          reference: dto.reference || null,
          totalDebitPoisha,
          totalCreditPoisha,
          createdBy: user.id,
          lines: {
            create: lines.map((l) => ({
              lineNo: l.lineNo,
              glAccountId: l.glAccountId,
              costCenterId: l.costCenterId,
              debitPoisha: l.debitPoisha,
              creditPoisha: l.creditPoisha,
              currencyCode: l.currencyCode,
              fxRateScaled: l.fxRateScaled,
              debitBasePoisha: l.debitBasePoisha,
              creditBasePoisha: l.creditBasePoisha,
              memo: l.memo,
            })),
          },
        },
      });
      return je;
    });
    await this.audit(user.id, "gl.journal.create", "JournalEntry", row.id, {
      journalNo: row.journalNo,
      totalDebitPoisha,
      totalCreditPoisha,
    });
    return this.getJournal(row.id);
  }

  async updateJournal(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.journalEntry.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Journal not found");
    if (!EDITABLE.has(existing.status)) {
      throw new BadRequestException(`Cannot edit journal in status ${existing.status}`);
    }
    const entryDate = dto.entryDate ? new Date(dto.entryDate) : existing.entryDate;
    const period = await this.resolvePeriod(entryDate, dto.periodId || existing.periodId);
    if (period.status !== "open") throw new BadRequestException("Period is closed");
    const type = dto.type != null ? String(dto.type) : existing.type;
    if (!JOURNAL_TYPES.has(type)) throw new BadRequestException("invalid journal type");
    const { lines, totalDebitPoisha, totalCreditPoisha } = await this.normalizeLines(
      dto.lines || (await this.prisma.journalLine.findMany({ where: { journalId: id } })),
    );
    await this.prisma.$transaction(async (tx) => {
      await tx.journalLine.deleteMany({ where: { journalId: id } });
      await tx.journalEntry.update({
        where: { id },
        data: {
          entryDate,
          periodId: period.id,
          branchId: dto.branchId !== undefined ? dto.branchId || null : existing.branchId,
          currencyCode: dto.currencyCode ? String(dto.currencyCode).toUpperCase() : existing.currencyCode,
          type,
          status: "draft",
          memo: dto.memo !== undefined ? dto.memo : existing.memo,
          reference: dto.reference !== undefined ? dto.reference : existing.reference,
          totalDebitPoisha,
          totalCreditPoisha,
          rejectedBy: null,
          rejectedAt: null,
          rejectReason: null,
          lines: {
            create: lines.map((l) => ({
              lineNo: l.lineNo,
              glAccountId: l.glAccountId,
              costCenterId: l.costCenterId,
              debitPoisha: l.debitPoisha,
              creditPoisha: l.creditPoisha,
              currencyCode: l.currencyCode,
              fxRateScaled: l.fxRateScaled,
              debitBasePoisha: l.debitBasePoisha,
              creditBasePoisha: l.creditBasePoisha,
              memo: l.memo,
            })),
          },
        },
      });
    });
    await this.audit(user.id, "gl.journal.update", "JournalEntry", id, { totalDebitPoisha, totalCreditPoisha });
    return this.getJournal(id);
  }

  async submitJournal(id: string, user: AuthedUser) {
    const j = await this.prisma.journalEntry.findFirst({
      where: { id, deletedAt: null },
      include: { lines: true, period: true },
    });
    if (!j) throw new NotFoundException("Journal not found");
    if (!EDITABLE.has(j.status)) throw new BadRequestException(`Cannot submit from ${j.status}`);
    if (j.period.status !== "open") throw new BadRequestException("Period is closed");
    if (j.totalDebitPoisha !== j.totalCreditPoisha) throw new BadRequestException("Journal unbalanced");
    if (j.lines.length < 2) throw new BadRequestException("Journal needs ≥ 2 lines");
    const row = await this.prisma.journalEntry.update({
      where: { id },
      data: { status: "pending_approval", submittedBy: user.id, submittedAt: new Date() },
    });
    await this.audit(user.id, "gl.journal.submit", "JournalEntry", id, row);
    return this.getJournal(id);
  }

  async approveJournal(id: string, user: AuthedUser) {
    const j = await this.prisma.journalEntry.findFirst({ where: { id, deletedAt: null } });
    if (!j) throw new NotFoundException("Journal not found");
    if (j.status !== "pending_approval") throw new BadRequestException("Journal is not pending approval");
    const row = await this.prisma.journalEntry.update({
      where: { id },
      data: { status: "pending_approval", approvedBy: user.id, approvedAt: new Date() },
    });
    // Keep pending_approval but mark approved — post is separate. Or move to approved status?
    // Spec: Journal Approval Workflow + Posting Engine as separate steps.
    // Use status 'approved' intermediate — but our enum uses pending_approval until post.
    // Store approvedBy/At and allow post from pending_approval only if approvedBy set,
    // OR transition to a soft 'approved' via keeping pending and requiring approvedBy for post.
    await this.prisma.journalEntry.update({
      where: { id },
      data: { approvedBy: user.id, approvedAt: new Date() },
    });
    await this.audit(user.id, "gl.journal.approve", "JournalEntry", id, row);
    return this.getJournal(id);
  }

  async rejectJournal(id: string, user: AuthedUser, reason?: string) {
    const j = await this.prisma.journalEntry.findFirst({ where: { id, deletedAt: null } });
    if (!j) throw new NotFoundException("Journal not found");
    if (j.status !== "pending_approval") throw new BadRequestException("Journal is not pending approval");
    const row = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        status: "rejected",
        rejectedBy: user.id,
        rejectedAt: new Date(),
        rejectReason: reason || null,
        approvedBy: null,
        approvedAt: null,
      },
    });
    await this.audit(user.id, "gl.journal.reject", "JournalEntry", id, row);
    return this.getJournal(id);
  }

  async postJournal(id: string, user: AuthedUser) {
    const j = await this.prisma.journalEntry.findFirst({
      where: { id, deletedAt: null },
      include: { lines: true, period: true },
    });
    if (!j) throw new NotFoundException("Journal not found");
    if (j.status === "posted") throw new BadRequestException("Already posted");
    if (j.status === "void") throw new BadRequestException("Journal is void");
    if (j.status !== "pending_approval" && j.status !== "draft") {
      throw new BadRequestException(`Cannot post from status ${j.status}`);
    }
    // Approval required when submitted; drafts can be posted by approver (fast-path for accounts_manager)
    if (j.status === "pending_approval" && !j.approvedBy) {
      throw new BadRequestException("Journal must be approved before posting");
    }
    if (j.period.status !== "open") {
      throw new BadRequestException(
        j.period.status === "locked" ? "Period is locked — cannot post" : "Period is closed — cannot post",
      );
    }
    if (j.totalDebitPoisha !== j.totalCreditPoisha || j.lines.length < 2) {
      throw new BadRequestException("Journal unbalanced or incomplete");
    }
    let td = 0;
    let tc = 0;
    for (const l of j.lines) {
      td += l.debitBasePoisha;
      tc += l.creditBasePoisha;
    }
    if (td !== tc) throw new BadRequestException("Line totals do not balance");

    const row = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        status: "posted",
        postedBy: user.id,
        postedAt: new Date(),
        approvedBy: j.approvedBy || user.id,
        approvedAt: j.approvedAt || new Date(),
      },
    });
    await this.audit(user.id, "gl.journal.post", "JournalEntry", id, {
      journalNo: row.journalNo,
      totalDebitPoisha: j.totalDebitPoisha,
      totalCreditPoisha: j.totalCreditPoisha,
    });
    return this.getJournal(id);
  }

  async voidJournal(id: string, user: AuthedUser, reason?: string) {
    const j = await this.prisma.journalEntry.findFirst({ where: { id, deletedAt: null } });
    if (!j) throw new NotFoundException("Journal not found");
    if (j.status === "void") throw new BadRequestException("Already void");
    if (j.status === "posted") {
      // C1: mark void with audit; reversing entry is a later enhancement
      const period = await this.prisma.accountingPeriod.findFirst({ where: { id: j.periodId } });
      if (period && period.status !== "open") {
        throw new BadRequestException("Cannot void posted journal in a closed period");
      }
    }
    const row = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        status: "void",
        voidedBy: user.id,
        voidedAt: new Date(),
        voidReason: reason || null,
      },
    });
    await this.audit(user.id, "gl.journal.void", "JournalEntry", id, row);
    return this.getJournal(id);
  }

  // ---------- Reports ----------
  async reportChartOfAccounts() {
    const [groups, accounts] = await Promise.all([this.listGroups(), this.listAccounts(undefined, undefined, "true")]);
    return { groups, accounts };
  }

  async reportJournalRegister(q?: { status?: string; periodId?: string; from?: string; to?: string }) {
    const where: any = { deletedAt: null };
    if (q?.status) where.status = q.status;
    if (q?.periodId) where.periodId = q.periodId;
    if (q?.from || q?.to) {
      where.entryDate = {};
      if (q.from) where.entryDate.gte = new Date(q.from);
      if (q.to) where.entryDate.lte = new Date(q.to);
    }
    const rows = await this.prisma.journalEntry.findMany({
      where,
      orderBy: [{ entryDate: "asc" }, { journalNo: "asc" }],
      take: 500,
      include: {
        period: { select: { code: true, name: true } },
        lines: {
          orderBy: { lineNo: "asc" },
          include: { glAccount: { select: { code: true, name: true } } },
        },
      },
    });
    return {
      data: rows.map((r) => ({
        ...r,
        lines: r.lines.map((l) => ({
          ...l,
          fxRateScaled: l.fxRateScaled != null ? l.fxRateScaled.toString() : null,
        })),
      })),
      total: rows.length,
    };
  }

  async reportTrialBalance(q?: { periodId?: string; asOf?: string }) {
    const lineWhere: any = {
      journal: { status: "posted", deletedAt: null },
    };
    if (q?.periodId) lineWhere.journal.periodId = q.periodId;
    if (q?.asOf) lineWhere.journal.entryDate = { lte: new Date(q.asOf) };

    const grouped = await this.prisma.journalLine.groupBy({
      by: ["glAccountId"],
      where: lineWhere,
      _sum: { debitBasePoisha: true, creditBasePoisha: true },
    });
    const accounts = await this.prisma.glAccount.findMany({
      where: { id: { in: grouped.map((g) => g.glAccountId) }, deletedAt: null },
    });
    const byId = new Map(accounts.map((a) => [a.id, a]));
    const rows = grouped
      .map((g) => {
        const a = byId.get(g.glAccountId);
        const debit = g._sum.debitBasePoisha || 0;
        const credit = g._sum.creditBasePoisha || 0;
        return {
          glAccountId: g.glAccountId,
          code: a?.code || "?",
          name: a?.name || "?",
          type: a?.type || "?",
          debitPoisha: debit,
          creditPoisha: credit,
          balancePoisha: debit - credit,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
    const totalDebit = rows.reduce((s, r) => s + r.debitPoisha, 0);
    const totalCredit = rows.reduce((s, r) => s + r.creditPoisha, 0);
    return {
      rows,
      totalDebitPoisha: totalDebit,
      totalCreditPoisha: totalCredit,
      balanced: totalDebit === totalCredit,
    };
  }
}
