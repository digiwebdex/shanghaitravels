import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { AccountingService } from "../accounting/accounting.service";

const MOV_TYPES = new Set([
  "deposit",
  "withdrawal",
  "transfer",
  "bank_charge",
  "interest",
  "cash_receipt",
  "cash_payment",
]);
const CHEQUE_STATUSES = new Set([
  "received",
  "issued",
  "printed",
  "deposited",
  "cleared",
  "bounced",
  "cancelled",
]);

@Injectable()
export class BankingService {
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

  private num(v: unknown): number {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) throw new BadRequestException("invalid number");
    return n;
  }

  private async glIdByCode(code: string): Promise<string> {
    const acc = await this.prisma.glAccount.findFirst({
      where: { code, deletedAt: null, isActive: true, isPostable: true },
    });
    if (!acc) throw new BadRequestException(`GL account ${code} not found — run /gl/bootstrap`);
    return acc.id;
  }

  private async createAndPostJournal(
    user: AuthedUser,
    entryDate: Date,
    memo: string,
    reference: string,
    lines: { glAccountId: string; debitPoisha: number; creditPoisha: number }[],
  ) {
    const je = await this.gl.createJournal(
      {
        entryDate: entryDate.toISOString(),
        type: "standard",
        memo,
        reference,
        currencyCode: "BDT",
        lines: lines.map((l) => ({ ...l, currencyCode: "BDT" })),
      },
      user,
    );
    return this.gl.postJournal(je.id, user);
  }

  private async nextNo(prefix: string) {
    const y = new Date().getUTCFullYear();
    const p = `${prefix}-${y}-`;
    const last = await this.prisma.bankMovement.findFirst({
      where: { movementNo: { startsWith: p } },
      orderBy: { movementNo: "desc" },
    });
    const seq = last ? Number(last.movementNo.slice(p.length)) + 1 : 1;
    return `${p}${String(seq).padStart(5, "0")}`;
  }

  // ---------- Masters ----------
  listMasters() {
    return this.prisma.bankMaster.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      include: { _count: { select: { accounts: true } } },
    });
  }

  async createMaster(dto: any, user: AuthedUser) {
    const code = String(dto?.code || "").trim();
    const name = String(dto?.name || "").trim();
    if (!code || !name) throw new BadRequestException("code and name required");
    const row = await this.prisma.bankMaster.create({
      data: {
        code,
        name,
        swiftBic: dto.swiftBic || null,
        countryCode: dto.countryCode || "BD",
        notes: dto.notes || null,
        isActive: dto.isActive !== false,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "banking.master.create", "BankMaster", row.id, row);
    return row;
  }

  async updateMaster(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.bankMaster.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("Bank master not found");
    const row = await this.prisma.bankMaster.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? String(dto.name).trim() : undefined,
        swiftBic: dto.swiftBic !== undefined ? dto.swiftBic : undefined,
        countryCode: dto.countryCode !== undefined ? dto.countryCode : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        isActive: dto.isActive !== undefined ? !!dto.isActive : undefined,
      },
    });
    await this.audit(user.id, "banking.master.update", "BankMaster", id, row);
    return row;
  }

  // ---------- Accounts ----------
  listAccounts(q?: { kind?: string; active?: string }) {
    const where: any = { deletedAt: null };
    if (q?.kind) where.kind = q.kind;
    if (q?.active === "true") where.isActive = true;
    return this.prisma.bankAccount.findMany({
      where,
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      include: {
        bankMaster: { select: { id: true, code: true, name: true } },
        glAccount: { select: { id: true, code: true, name: true } },
        cashAccount: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async createAccount(dto: any, user: AuthedUser) {
    const name = String(dto?.name || "").trim();
    const kind = String(dto?.kind || "bank");
    if (!name) throw new BadRequestException("name required");
    if (!["cash", "bank", "petty_cash"].includes(kind)) throw new BadRequestException("invalid kind");
    let glAccountId = dto.glAccountId;
    if (!glAccountId) {
      glAccountId = await this.glIdByCode(kind === "bank" ? "1200" : "1100");
    }
    const gl = await this.prisma.glAccount.findFirst({ where: { id: glAccountId, deletedAt: null } });
    if (!gl || !gl.isPostable) throw new BadRequestException("Invalid GL account");
    const opening = this.num(dto.openingBalancePoisha || 0);
    const row = await this.prisma.bankAccount.create({
      data: {
        branchId: dto.branchId || user.branchId || null,
        bankMasterId: dto.bankMasterId || null,
        kind,
        name,
        accountNo: dto.accountNo || null,
        iban: dto.iban || null,
        currencyCode: String(dto.currencyCode || "BDT").toUpperCase(),
        glAccountId,
        cashAccountId: dto.cashAccountId || null,
        openingBalancePoisha: opening,
        notes: dto.notes || null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "banking.account.create", "BankAccount", row.id, row);
    if (opening !== 0 && dto.postOpening) {
      await this.postOpening(row.id, user);
    }
    return this.getAccount(row.id);
  }

  async getAccount(id: string) {
    const row = await this.prisma.bankAccount.findFirst({
      where: { id, deletedAt: null },
      include: {
        bankMaster: true,
        glAccount: { select: { id: true, code: true, name: true } },
        cashAccount: { select: { id: true, name: true, type: true, currentBalance: true } },
      },
    });
    if (!row) throw new NotFoundException("Bank account not found");
    return row;
  }

  async updateAccount(id: string, dto: any, user: AuthedUser) {
    await this.getAccount(id);
    const row = await this.prisma.bankAccount.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? String(dto.name).trim() : undefined,
        accountNo: dto.accountNo !== undefined ? dto.accountNo : undefined,
        iban: dto.iban !== undefined ? dto.iban : undefined,
        bankMasterId: dto.bankMasterId !== undefined ? dto.bankMasterId || null : undefined,
        branchId: dto.branchId !== undefined ? dto.branchId || null : undefined,
        cashAccountId: dto.cashAccountId !== undefined ? dto.cashAccountId || null : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
        isActive: dto.isActive !== undefined ? !!dto.isActive : undefined,
      },
    });
    await this.audit(user.id, "banking.account.update", "BankAccount", id, row);
    return this.getAccount(id);
  }

  async postOpening(id: string, user: AuthedUser) {
    const acc = await this.getAccount(id);
    if (acc.openingBalancePoisha === 0) throw new BadRequestException("Opening balance is zero");
    const equityId = await this.glIdByCode("3000");
    const amt = Math.abs(acc.openingBalancePoisha);
    const lines =
      acc.openingBalancePoisha > 0
        ? [
            { glAccountId: acc.glAccountId, debitPoisha: amt, creditPoisha: 0 },
            { glAccountId: equityId, debitPoisha: 0, creditPoisha: amt },
          ]
        : [
            { glAccountId: equityId, debitPoisha: amt, creditPoisha: 0 },
            { glAccountId: acc.glAccountId, debitPoisha: 0, creditPoisha: amt },
          ];
    const je = await this.createAndPostJournal(user, new Date(), `Opening balance ${acc.name}`, `OPEN-${acc.id.slice(0, 8)}`, lines);
    await this.audit(user.id, "banking.account.opening", "BankAccount", id, { journalNo: je.journalNo });
    return { account: acc, journal: je };
  }

  /** Book balance from posted GL lines for this account's GL. */
  async bookBalance(bankAccountId: string, asOf?: Date) {
    const acc = await this.getAccount(bankAccountId);
    const where: any = {
      glAccountId: acc.glAccountId,
      journal: { status: "posted", deletedAt: null },
    };
    if (asOf) where.journal.entryDate = { lte: asOf };
    const agg = await this.prisma.journalLine.aggregate({
      where,
      _sum: { debitBasePoisha: true, creditBasePoisha: true },
    });
    const debit = agg._sum.debitBasePoisha || 0;
    const credit = agg._sum.creditBasePoisha || 0;
    return { bankAccountId, glAccountId: acc.glAccountId, balancePoisha: debit - credit };
  }

  // ---------- Movements ----------
  listMovements(q?: { status?: string; type?: string; bankAccountId?: string; limit?: number }) {
    const where: any = { deletedAt: null };
    if (q?.status) where.status = q.status;
    if (q?.type) where.type = q.type;
    if (q?.bankAccountId) {
      where.OR = [{ fromBankAccountId: q.bankAccountId }, { toBankAccountId: q.bankAccountId }];
    }
    return this.prisma.bankMovement.findMany({
      where,
      orderBy: [{ movementDate: "desc" }, { movementNo: "desc" }],
      take: Math.min(200, q?.limit || 100),
      include: {
        fromBankAccount: { select: { id: true, name: true, kind: true, accountNo: true } },
        toBankAccount: { select: { id: true, name: true, kind: true, accountNo: true } },
        journal: { select: { id: true, journalNo: true, status: true } },
      },
    });
  }

  async getMovement(id: string) {
    const row = await this.prisma.bankMovement.findFirst({
      where: { id, deletedAt: null },
      include: {
        fromBankAccount: { include: { glAccount: { select: { id: true, code: true, name: true } } } },
        toBankAccount: { include: { glAccount: { select: { id: true, code: true, name: true } } } },
        journal: { select: { id: true, journalNo: true, status: true } },
      },
    });
    if (!row) throw new NotFoundException("Movement not found");
    return row;
  }

  async createMovement(dto: any, user: AuthedUser) {
    const type = String(dto?.type || "").trim();
    if (!MOV_TYPES.has(type)) throw new BadRequestException("invalid movement type");
    const amount = this.num(dto.amountPoisha);
    if (amount <= 0) throw new BadRequestException("amountPoisha must be > 0");
    const movementDate = new Date(dto.movementDate || Date.now());
    this.validateMovementAccounts(type, dto.fromBankAccountId, dto.toBankAccountId);
    const movementNo = dto.movementNo?.trim() || (await this.nextNo(type === "transfer" ? "XFR" : "BNK"));
    const row = await this.prisma.bankMovement.create({
      data: {
        movementNo,
        type,
        status: "draft",
        branchId: dto.branchId || user.branchId || null,
        fromBankAccountId: dto.fromBankAccountId || null,
        toBankAccountId: dto.toBankAccountId || null,
        amountPoisha: amount,
        movementDate,
        memo: dto.memo || null,
        reference: dto.reference || null,
        chequeId: dto.chequeId || null,
        arDocumentId: dto.arDocumentId || null,
        apDocumentId: dto.apDocumentId || null,
        paymentId: dto.paymentId || null,
        applicationId: dto.applicationId || null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "banking.movement.create", "BankMovement", row.id, { movementNo, type, amount });
    if (dto.postImmediately) return this.postMovement(row.id, user);
    return this.getMovement(row.id);
  }

  private validateMovementAccounts(type: string, fromId?: string, toId?: string) {
    if (type === "transfer") {
      if (!fromId || !toId) throw new BadRequestException("transfer requires from and to accounts");
      if (fromId === toId) throw new BadRequestException("from and to must differ");
      return;
    }
    if (["deposit", "interest", "cash_receipt"].includes(type) && !toId) {
      throw new BadRequestException(`${type} requires toBankAccountId`);
    }
    if (["withdrawal", "bank_charge", "cash_payment"].includes(type) && !fromId) {
      throw new BadRequestException(`${type} requires fromBankAccountId`);
    }
  }

  private async journalLinesForMovement(m: {
    type: string;
    amountPoisha: number;
    fromBankAccountId: string | null;
    toBankAccountId: string | null;
  }) {
    const amt = m.amountPoisha;
    if (m.type === "transfer") {
      const from = await this.getAccount(m.fromBankAccountId!);
      const to = await this.getAccount(m.toBankAccountId!);
      return [
        { glAccountId: to.glAccountId, debitPoisha: amt, creditPoisha: 0 },
        { glAccountId: from.glAccountId, debitPoisha: 0, creditPoisha: amt },
      ];
    }
    if (m.type === "deposit" || m.type === "cash_receipt") {
      const to = await this.getAccount(m.toBankAccountId!);
      const cashGl = m.fromBankAccountId
        ? (await this.getAccount(m.fromBankAccountId)).glAccountId
        : await this.glIdByCode("1100");
      // Money into bank from cash (or external): Dr bank, Cr cash
      return [
        { glAccountId: to.glAccountId, debitPoisha: amt, creditPoisha: 0 },
        { glAccountId: cashGl, debitPoisha: 0, creditPoisha: amt },
      ];
    }
    if (m.type === "withdrawal" || m.type === "cash_payment") {
      const from = await this.getAccount(m.fromBankAccountId!);
      const cashGl = m.toBankAccountId
        ? (await this.getAccount(m.toBankAccountId)).glAccountId
        : await this.glIdByCode("1100");
      return [
        { glAccountId: cashGl, debitPoisha: amt, creditPoisha: 0 },
        { glAccountId: from.glAccountId, debitPoisha: 0, creditPoisha: amt },
      ];
    }
    if (m.type === "bank_charge") {
      const from = await this.getAccount(m.fromBankAccountId!);
      const exp = await this.glIdByCode("5100");
      return [
        { glAccountId: exp, debitPoisha: amt, creditPoisha: 0 },
        { glAccountId: from.glAccountId, debitPoisha: 0, creditPoisha: amt },
      ];
    }
    if (m.type === "interest") {
      const to = await this.getAccount(m.toBankAccountId!);
      const rev = await this.glIdByCode("4000");
      return [
        { glAccountId: to.glAccountId, debitPoisha: amt, creditPoisha: 0 },
        { glAccountId: rev, debitPoisha: 0, creditPoisha: amt },
      ];
    }
    throw new BadRequestException(`No posting map for ${m.type}`);
  }

  async postMovement(id: string, user: AuthedUser) {
    const m = await this.getMovement(id);
    if (m.status === "posted") throw new BadRequestException("Already posted");
    if (m.status === "void") throw new BadRequestException("Movement is void");
    const lines = await this.journalLinesForMovement(m);
    const je = await this.createAndPostJournal(
      user,
      m.movementDate,
      m.memo || `Bank ${m.type} ${m.movementNo}`,
      m.movementNo,
      lines,
    );
    await this.prisma.bankMovement.update({
      where: { id },
      data: { status: "posted", journalId: je.id, postedBy: user.id, postedAt: new Date() },
    });
    await this.audit(user.id, "banking.movement.post", "BankMovement", id, { journalNo: je.journalNo });
    return this.getMovement(id);
  }

  async voidMovement(id: string, user: AuthedUser, reason?: string) {
    const m = await this.prisma.bankMovement.findFirst({ where: { id, deletedAt: null } });
    if (!m) throw new NotFoundException("Movement not found");
    if (m.status === "void") throw new BadRequestException("Already void");
    if (m.status === "posted") {
      throw new BadRequestException("Void posted movements via reversing journal; mark void only for drafts");
    }
    await this.prisma.bankMovement.update({
      where: { id },
      data: { status: "void", voidedBy: user.id, voidedAt: new Date(), voidReason: reason || null },
    });
    await this.audit(user.id, "banking.movement.void", "BankMovement", id, { reason });
    return this.getMovement(id);
  }

  // ---------- Cheques ----------
  listCheques(q?: { status?: string; bankAccountId?: string; limit?: number }) {
    const where: any = { deletedAt: null };
    if (q?.status) where.status = q.status;
    if (q?.bankAccountId) where.bankAccountId = q.bankAccountId;
    return this.prisma.cheque.findMany({
      where,
      orderBy: [{ chequeDate: "desc" }, { chequeNo: "desc" }],
      take: Math.min(200, q?.limit || 100),
      include: { bankAccount: { select: { id: true, name: true, accountNo: true } } },
    });
  }

  async createCheque(dto: any, user: AuthedUser) {
    if (!dto.bankAccountId || !dto.chequeNo || !dto.direction) {
      throw new BadRequestException("bankAccountId, chequeNo, direction required");
    }
    if (!["incoming", "outgoing"].includes(dto.direction)) throw new BadRequestException("invalid direction");
    const amount = this.num(dto.amountPoisha);
    if (amount <= 0) throw new BadRequestException("amountPoisha must be > 0");
    await this.getAccount(dto.bankAccountId);
    const row = await this.prisma.cheque.create({
      data: {
        bankAccountId: dto.bankAccountId,
        direction: dto.direction,
        chequeNo: String(dto.chequeNo).trim(),
        chequeDate: new Date(dto.chequeDate || Date.now()),
        amountPoisha: amount,
        payeeOrDrawer: dto.payeeOrDrawer || null,
        status: dto.direction === "outgoing" ? "issued" : "received",
        memo: dto.memo || null,
        arDocumentId: dto.arDocumentId || null,
        apDocumentId: dto.apDocumentId || null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "banking.cheque.create", "Cheque", row.id, row);
    return row;
  }

  async updateChequeStatus(id: string, status: string, user: AuthedUser, extra?: { bounceReason?: string }) {
    const ch = await this.prisma.cheque.findFirst({ where: { id, deletedAt: null } });
    if (!ch) throw new NotFoundException("Cheque not found");
    if (!CHEQUE_STATUSES.has(status)) throw new BadRequestException("invalid status");
    const data: any = { status };
    if (status === "cleared") data.clearedAt = new Date();
    if (status === "bounced") data.bounceReason = extra?.bounceReason || null;
    const row = await this.prisma.cheque.update({ where: { id }, data });
    await this.audit(user.id, "banking.cheque.status", "Cheque", id, { status });
    return row;
  }

  async printCheque(id: string, user: AuthedUser) {
    const ch = await this.prisma.cheque.findFirst({
      where: { id, deletedAt: null },
      include: { bankAccount: true },
    });
    if (!ch) throw new NotFoundException("Cheque not found");
    const cfg =
      (await this.prisma.chequePrintConfig.findFirst({ where: { name: "default", isActive: true } })) ||
      (await this.prisma.chequePrintConfig.findFirst({ where: { isActive: true } }));
    if (!cfg) throw new BadRequestException("No cheque print config");
    const payload = {
      chequeNo: ch.chequeNo,
      date: ch.chequeDate.toISOString().slice(0, 10),
      payee: ch.payeeOrDrawer || "",
      amount: (ch.amountPoisha / 100).toFixed(2),
      amountWords: this.amountInWords(ch.amountPoisha),
      bankAccount: ch.bankAccount.name,
      accountNo: ch.bankAccount.accountNo,
      template: cfg.template,
    };
    const row = await this.prisma.cheque.update({
      where: { id },
      data: { status: "printed", printedAt: new Date(), printPayload: payload as any },
    });
    await this.audit(user.id, "banking.cheque.print", "Cheque", id, { chequeNo: ch.chequeNo });
    return { cheque: row, print: payload };
  }

  private amountInWords(poisha: number): string {
    const taka = Math.floor(poisha / 100);
    return `Taka ${taka.toLocaleString("en-BD")} only`;
  }

  async getChequePrintConfig() {
    return (
      (await this.prisma.chequePrintConfig.findFirst({ where: { name: "default" } })) ||
      (await this.prisma.chequePrintConfig.findFirst())
    );
  }

  async putChequePrintConfig(dto: any, user: AuthedUser) {
    if (!dto?.template) throw new BadRequestException("template required");
    const existing = await this.prisma.chequePrintConfig.findFirst({ where: { name: "default" } });
    const row = existing
      ? await this.prisma.chequePrintConfig.update({
          where: { id: existing.id },
          data: { template: dto.template, isActive: dto.isActive !== false, updatedBy: user.id },
        })
      : await this.prisma.chequePrintConfig.create({
          data: { name: "default", template: dto.template, isActive: true, updatedBy: user.id },
        });
    await this.audit(user.id, "banking.cheque.config", "ChequePrintConfig", row.id, row);
    return row;
  }

  // ---------- Statements / reconciliation ----------
  listStatements(bankAccountId?: string) {
    return this.prisma.bankStatement.findMany({
      where: { deletedAt: null, ...(bankAccountId ? { bankAccountId } : {}) },
      orderBy: { statementDate: "desc" },
      take: 50,
      include: { bankAccount: { select: { id: true, name: true } }, _count: { select: { lines: true } } },
    });
  }

  async getStatement(id: string) {
    const row = await this.prisma.bankStatement.findFirst({
      where: { id, deletedAt: null },
      include: {
        bankAccount: true,
        lines: { orderBy: { lineNo: "asc" } },
      },
    });
    if (!row) throw new NotFoundException("Statement not found");
    return row;
  }

  async createStatement(dto: any, user: AuthedUser) {
    if (!dto.bankAccountId) throw new BadRequestException("bankAccountId required");
    await this.getAccount(dto.bankAccountId);
    const lines = Array.isArray(dto.lines) ? dto.lines : [];
    const row = await this.prisma.bankStatement.create({
      data: {
        bankAccountId: dto.bankAccountId,
        statementDate: new Date(dto.statementDate || Date.now()),
        periodStart: dto.periodStart ? new Date(dto.periodStart) : null,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
        openingBalancePoisha: this.num(dto.openingBalancePoisha || 0),
        closingBalancePoisha: this.num(dto.closingBalancePoisha || 0),
        source: dto.source || "manual",
        importRef: dto.importRef || null,
        createdBy: user.id,
        lines: {
          create: lines.map((L: any, i: number) => ({
            lineNo: i + 1,
            txnDate: new Date(L.txnDate || Date.now()),
            description: String(L.description || "Line"),
            amountPoisha: this.num(L.amountPoisha),
            bankRef: L.bankRef || null,
          })),
        },
      },
    });
    await this.audit(user.id, "banking.statement.create", "BankStatement", row.id, { lines: lines.length });
    return this.getStatement(row.id);
  }

  /** CSV: date,description,amount,ref — amount positive=credit, negative=debit */
  async importCsv(dto: { bankAccountId: string; csv: string; statementDate?: string }, user: AuthedUser) {
    if (!dto.bankAccountId || !dto.csv) throw new BadRequestException("bankAccountId and csv required");
    const rows = dto.csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (rows.length < 2) throw new BadRequestException("CSV needs header + rows");
    const header = rows[0].toLowerCase();
    if (!header.includes("date") || !header.includes("amount")) {
      throw new BadRequestException("CSV header must include date and amount columns");
    }
    const cols = rows[0].split(",").map((c) => c.trim().toLowerCase());
    const di = cols.findIndex((c) => c.includes("date"));
    const desci = cols.findIndex((c) => c.includes("desc"));
    const ai = cols.findIndex((c) => c.includes("amount"));
    const ri = cols.findIndex((c) => c.includes("ref"));
    const lines: { txnDate: string; description: string; amountPoisha: number; bankRef?: string }[] = [];
    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i].split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
      if (parts.length < 2) continue;
      const raw = parts[ai];
      const amt = Number(raw);
      if (!Number.isFinite(amt)) continue;
      // Treat CSV amounts as BDT major units (supports decimals)
      lines.push({
        txnDate: parts[di],
        description: desci >= 0 ? parts[desci] : "Import",
        amountPoisha: Math.round(amt * 100),
        bankRef: ri >= 0 ? parts[ri] : undefined,
      });
    }
    if (lines.length === 0) throw new BadRequestException("No data rows parsed");
    return this.createStatement(
      {
        bankAccountId: dto.bankAccountId,
        statementDate: dto.statementDate || new Date().toISOString(),
        source: "csv",
        importRef: `csv-${Date.now()}`,
        closingBalancePoisha: lines.reduce((s, l) => s + l.amountPoisha, 0),
        lines,
      },
      user,
    );
  }

  async startReconciliation(dto: any, user: AuthedUser) {
    if (!dto.bankAccountId) throw new BadRequestException("bankAccountId required");
    const asOf = new Date(dto.asOfDate || Date.now());
    const book = await this.bookBalance(dto.bankAccountId, asOf);
    const statementBalance = this.num(dto.statementBalancePoisha ?? book.balancePoisha);
    const row = await this.prisma.bankReconciliation.create({
      data: {
        bankAccountId: dto.bankAccountId,
        statementId: dto.statementId || null,
        asOfDate: asOf,
        statementBalancePoisha: statementBalance,
        bookBalancePoisha: book.balancePoisha,
        differencePoisha: statementBalance - book.balancePoisha,
        notes: dto.notes || null,
        createdBy: user.id,
      },
    });
    if (dto.statementId) {
      await this.prisma.bankStatement.update({
        where: { id: dto.statementId },
        data: { status: "in_progress" },
      });
    }
    await this.audit(user.id, "banking.recon.start", "BankReconciliation", row.id, row);
    return row;
  }

  async matchLine(dto: { lineId: string; movementId?: string; journalId?: string }, user: AuthedUser) {
    const line = await this.prisma.bankStatementLine.findFirst({ where: { id: dto.lineId } });
    if (!line) throw new NotFoundException("Statement line not found");
    if (!dto.movementId && !dto.journalId) throw new BadRequestException("movementId or journalId required");
    const row = await this.prisma.bankStatementLine.update({
      where: { id: dto.lineId },
      data: {
        matchStatus: "matched",
        matchedMovementId: dto.movementId || null,
        matchedJournalId: dto.journalId || null,
      },
    });
    await this.audit(user.id, "banking.recon.match", "BankStatementLine", row.id, dto);
    return row;
  }

  async unmatchLine(lineId: string, user: AuthedUser) {
    const row = await this.prisma.bankStatementLine.update({
      where: { id: lineId },
      data: { matchStatus: "unmatched", matchedMovementId: null, matchedJournalId: null },
    });
    await this.audit(user.id, "banking.recon.unmatch", "BankStatementLine", lineId, {});
    return row;
  }

  async completeReconciliation(id: string, user: AuthedUser) {
    const recon = await this.prisma.bankReconciliation.findFirst({ where: { id, deletedAt: null } });
    if (!recon) throw new NotFoundException("Reconciliation not found");
    if (recon.status === "completed") throw new BadRequestException("Already completed");
    const book = await this.bookBalance(recon.bankAccountId, recon.asOfDate);
    const row = await this.prisma.bankReconciliation.update({
      where: { id },
      data: {
        status: "completed",
        bookBalancePoisha: book.balancePoisha,
        differencePoisha: recon.statementBalancePoisha - book.balancePoisha,
        completedAt: new Date(),
        completedBy: user.id,
      },
    });
    if (recon.statementId) {
      await this.prisma.bankStatement.update({
        where: { id: recon.statementId },
        data: { status: "reconciled" },
      });
    }
    await this.audit(user.id, "banking.recon.complete", "BankReconciliation", id, row);
    return row;
  }

  listReconciliations(bankAccountId?: string) {
    return this.prisma.bankReconciliation.findMany({
      where: { deletedAt: null, ...(bankAccountId ? { bankAccountId } : {}) },
      orderBy: { asOfDate: "desc" },
      take: 50,
    });
  }

  // ---------- Travel ERP bridges ----------
  async bridgeArReceipt(arDocId: string, dto: { toBankAccountId: string }, user: AuthedUser) {
    const ar = await this.prisma.arDocument.findFirst({ where: { id: arDocId, deletedAt: null, status: "posted" } });
    if (!ar) throw new NotFoundException("Posted AR document not found");
    if (!["receipt", "advance", "refund"].includes(ar.type)) {
      throw new BadRequestException("Bridge only for AR receipt/advance/refund");
    }
    const existing = await this.prisma.bankMovement.findFirst({
      where: { arDocumentId: arDocId, deletedAt: null },
    });
    if (existing) return this.getMovement(existing.id);
    const type = ar.type === "refund" ? "cash_payment" : "cash_receipt";
    return this.createMovement(
      {
        type,
        toBankAccountId: type === "cash_receipt" ? dto.toBankAccountId : undefined,
        fromBankAccountId: type === "cash_payment" ? dto.toBankAccountId : undefined,
        amountPoisha: ar.totalPoisha,
        movementDate: ar.issueDate,
        memo: `Bridge AR ${ar.docNo}`,
        reference: ar.docNo,
        arDocumentId: ar.id,
        applicationId: ar.applicationId,
        postImmediately: true,
      },
      user,
    );
  }

  async bridgeApPayment(apDocId: string, dto: { fromBankAccountId: string }, user: AuthedUser) {
    const ap = await this.prisma.apDocument.findFirst({ where: { id: apDocId, deletedAt: null, status: "posted" } });
    if (!ap) throw new NotFoundException("Posted AP document not found");
    if (!["payment", "advance"].includes(ap.type)) throw new BadRequestException("Bridge only for AP payment/advance");
    const existing = await this.prisma.bankMovement.findFirst({
      where: { apDocumentId: apDocId, deletedAt: null },
    });
    if (existing) return this.getMovement(existing.id);
    return this.createMovement(
      {
        type: "cash_payment",
        fromBankAccountId: dto.fromBankAccountId,
        amountPoisha: ap.totalPoisha,
        movementDate: ap.issueDate,
        memo: `Bridge AP ${ap.docNo}`,
        reference: ap.docNo,
        apDocumentId: ap.id,
        applicationId: ap.applicationId,
        postImmediately: true,
      },
      user,
    );
  }

  // ---------- Reports ----------
  async reportBankBook(bankAccountId: string, from?: string, to?: string) {
    const acc = await this.getAccount(bankAccountId);
    const where: any = {
      glAccountId: acc.glAccountId,
      journal: { status: "posted", deletedAt: null },
    };
    if (from || to) {
      where.journal.entryDate = {};
      if (from) where.journal.entryDate.gte = new Date(from);
      if (to) where.journal.entryDate.lte = new Date(to);
    }
    const lines = await this.prisma.journalLine.findMany({
      where,
      orderBy: [{ journal: { entryDate: "asc" } }, { lineNo: "asc" }],
      include: { journal: { select: { journalNo: true, entryDate: true, memo: true, reference: true } } },
      take: 500,
    });
    let running = 0;
    const entries = lines.map((l) => {
      running += l.debitBasePoisha - l.creditBasePoisha;
      return {
        journalNo: l.journal.journalNo,
        entryDate: l.journal.entryDate,
        memo: l.journal.memo || l.memo,
        reference: l.journal.reference,
        debitPoisha: l.debitBasePoisha,
        creditPoisha: l.creditBasePoisha,
        balancePoisha: running,
      };
    });
    return { account: acc, entries, closingPoisha: running };
  }

  async reportCashBook(from?: string, to?: string) {
    const cashAccounts = await this.prisma.bankAccount.findMany({
      where: { deletedAt: null, isActive: true, kind: { in: ["cash", "petty_cash"] } },
    });
    const books: Awaited<ReturnType<BankingService["reportBankBook"]>>[] = [];
    for (const a of cashAccounts) {
      books.push(await this.reportBankBook(a.id, from, to));
    }
    return { books };
  }

  async reportDailyCashPosition(asOf?: string) {
    const asOfDate = asOf ? new Date(asOf) : new Date();
    const accounts = await this.prisma.bankAccount.findMany({
      where: { deletedAt: null, isActive: true },
      include: { glAccount: { select: { code: true, name: true } } },
    });
    const rows: {
      id: string;
      name: string;
      kind: string;
      accountNo: string | null;
      glCode: string;
      balancePoisha: number;
    }[] = [];
    let total = 0;
    for (const a of accounts) {
      const bal = await this.bookBalance(a.id, asOfDate);
      rows.push({
        id: a.id,
        name: a.name,
        kind: a.kind,
        accountNo: a.accountNo,
        glCode: a.glAccount.code,
        balancePoisha: bal.balancePoisha,
      });
      total += bal.balancePoisha;
    }
    return { asOf: asOfDate.toISOString(), rows, totalPoisha: total };
  }

  async reportReconciliation(id: string) {
    const recon = await this.prisma.bankReconciliation.findFirst({
      where: { id, deletedAt: null },
    });
    if (!recon) throw new NotFoundException("Reconciliation not found");
    let unmatched: any[] = [];
    if (recon.statementId) {
      unmatched = await this.prisma.bankStatementLine.findMany({
        where: { statementId: recon.statementId, matchStatus: "unmatched" },
        orderBy: { lineNo: "asc" },
      });
    }
    return { reconciliation: recon, unmatchedLines: unmatched };
  }

  async reportCashFlowSummary(from?: string, to?: string) {
    const movements = await this.prisma.bankMovement.findMany({
      where: {
        deletedAt: null,
        status: "posted",
        ...(from || to
          ? {
              movementDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
    });
    const summary = {
      deposits: 0,
      withdrawals: 0,
      transfers: 0,
      charges: 0,
      interest: 0,
      cashReceipts: 0,
      cashPayments: 0,
    };
    for (const m of movements) {
      if (m.type === "deposit") summary.deposits += m.amountPoisha;
      else if (m.type === "withdrawal") summary.withdrawals += m.amountPoisha;
      else if (m.type === "transfer") summary.transfers += m.amountPoisha;
      else if (m.type === "bank_charge") summary.charges += m.amountPoisha;
      else if (m.type === "interest") summary.interest += m.amountPoisha;
      else if (m.type === "cash_receipt") summary.cashReceipts += m.amountPoisha;
      else if (m.type === "cash_payment") summary.cashPayments += m.amountPoisha;
    }
    return { from, to, summary, netPoisha: summary.deposits + summary.cashReceipts + summary.interest - summary.withdrawals - summary.cashPayments - summary.charges };
  }

  /** Bootstrap default bank master + cash/bank accounts if empty. */
  async bootstrap(user: AuthedUser) {
    const count = await this.prisma.bankAccount.count({ where: { deletedAt: null } });
    if (count > 0) return { bootstrapped: false, message: "Bank accounts already exist" };
    const master = await this.prisma.bankMaster.create({
      data: { code: "DBBL", name: "Dutch-Bangla Bank", countryCode: "BD", createdBy: user.id },
    });
    const cashGl = await this.glIdByCode("1100");
    const bankGl = await this.glIdByCode("1200");
    const cashWallet = await this.prisma.account.findFirst({ where: { type: "cash", deletedAt: null } });
    const bankWallet = await this.prisma.account.findFirst({ where: { type: "bank", deletedAt: null } });
    await this.prisma.bankAccount.create({
      data: {
        kind: "cash",
        name: "Cash on Hand",
        glAccountId: cashGl,
        cashAccountId: cashWallet?.id || null,
        branchId: user.branchId || null,
        createdBy: user.id,
      },
    });
    await this.prisma.bankAccount.create({
      data: {
        kind: "petty_cash",
        name: "Petty Cash",
        glAccountId: cashGl,
        branchId: user.branchId || null,
        createdBy: user.id,
      },
    });
    await this.prisma.bankAccount.create({
      data: {
        kind: "bank",
        name: "Main Operating Bank",
        bankMasterId: master.id,
        accountNo: "0000000000",
        glAccountId: bankGl,
        cashAccountId: bankWallet?.id || null,
        branchId: user.branchId || null,
        createdBy: user.id,
      },
    });
    await this.audit(user.id, "banking.bootstrap", "BankAccount", null, { master: master.code });
    return { bootstrapped: true, accounts: 3 };
  }
}
