import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { AutomationService } from "../automation/automation.service";

const HQ_ROLES = new Set(["super_admin", "general_manager"]);
const money = (m?: number | null) => `৳${((m ?? 0) / 100).toFixed(2)}`;

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService, private auto: AutomationService) {}

  private branchFilter(user: AuthedUser, field = "branchId") {
    return HQ_ROLES.has(user.role) ? {} : { [field]: user.branchId ?? "__none__" };
  }

  // ---------- Accounts (cash & bank) ----------
  listAccounts(user: AuthedUser) {
    return this.prisma.account.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  }
  async createAccount(dto: any) {
    const opening = Math.round(Number(dto.openingBalance) || 0);
    const acc = await this.prisma.account.create({
      data: { name: dto.name, type: dto.type, bankName: dto.bankName, accountNo: dto.accountNo,
        openingBalance: opening, currentBalance: opening, branchId: dto.branchId ?? null },
    });
    if (opening !== 0)
      await this.prisma.ledgerEntry.create({ data: { accountId: acc.id, amount: opening, sourceType: "opening", createdBy: "system", memo: "Opening balance" } });
    return acc;
  }
  ledger(accountId: string) {
    return this.prisma.ledgerEntry.findMany({ where: { accountId }, orderBy: { postedAt: "desc" }, take: 200 });
  }

  /** Post a signed ledger entry and keep the account's denormalized balance in sync — MUST run inside a $transaction. */
  private async post(tx: any, accountId: string, amount: number, sourceType: string, sourceId: string | null, memo: string, userId: string) {
    const acc = await tx.account.findFirst({ where: { id: accountId, deletedAt: null } });
    if (!acc) throw new NotFoundException("Account not found");
    await tx.ledgerEntry.create({ data: { accountId, amount, sourceType, sourceId, memo, createdBy: userId } });
    await tx.account.update({ where: { id: accountId }, data: { currentBalance: acc.currentBalance + amount } });
  }

  // ---------- Invoices (receivables) ----------
  async listInvoices(user: AuthedUser, q: any) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.status) where.status = q.status;
    if (q.customerId) where.customerId = q.customerId;
    // Invoices belonging to a B2B agent = invoices whose linked application was referred by that agent.
    // (Ad-hoc invoices with no application are intentionally excluded from an agent-scoped view.)
    if (q.agentId) where.application = { agentId: q.agentId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
        include: { customer: { select: { fullName: true, code: true } } } }),
      this.prisma.invoice.count({ where }),
    ]);
    const withPaid = await Promise.all(data.map(async (inv) => ({ ...inv, paid: await this.paidTotal(inv.id), due: inv.total - (await this.paidTotal(inv.id)) })));
    return { data: withPaid, total, page, limit };
  }

  async getInvoice(id: string, user: AuthedUser) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, deletedAt: null, ...this.branchFilter(user) },
      include: { items: true, payments: { where: { deletedAt: null } }, customer: { select: { fullName: true, code: true } } } });
    if (!inv) throw new NotFoundException("Invoice not found");
    const paid = await this.paidTotal(id);
    return { ...inv, paid, due: inv.total - paid };
  }

  private async paidTotal(invoiceId: string) {
    const rows = await this.prisma.payment.findMany({ where: { invoiceId, deletedAt: null } });
    return rows.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);
  }

  private computeTotals(items: any[], discount = 0, tax = 0) {
    const subtotal = items.reduce((s, it) => s + Math.round(Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
    const d = Math.round(Number(discount) || 0);
    const t = Math.round(Number(tax) || 0);
    // F-1: discount must sit within [0, subtotal] so the invoice total can never
    // go negative. Reject invalid input rather than silently clamping it.
    if (d < 0) throw new BadRequestException("Discount cannot be negative.");
    if (d > subtotal) throw new BadRequestException("Discount cannot be greater than invoice subtotal.");
    return { subtotal, total: subtotal - d + t };
  }

  async createInvoice(dto: any, user: AuthedUser) {
    if (!dto.customerId) throw new BadRequestException("customerId required");
    const items = (dto.items || []).map((it: any) => ({ description: it.description, quantity: Number(it.quantity) || 1,
      unitPrice: Math.round(Number(it.unitPrice) || 0), amount: Math.round((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)) }));
    const { subtotal, total } = this.computeTotals(items, dto.discount, dto.tax);
    const invoiceNo = `INV-${String((await this.prisma.invoice.count()) + 1).padStart(6, "0")}`;
    return this.prisma.invoice.create({
      data: { branchId: user.branchId ?? dto.branchId, invoiceNo, customerId: dto.customerId, applicationId: dto.applicationId ?? null,
        status: "draft", subtotal, discount: Math.round(dto.discount || 0), tax: Math.round(dto.tax || 0), total,
        notes: dto.notes, dueAt: dto.dueAt ? new Date(dto.dueAt) : null, createdBy: user.id, items: { create: items } },
      include: { items: true },
    });
  }

  async issueInvoice(id: string, user: AuthedUser) {
    const inv = await this.getInvoice(id, user);
    if (inv.status !== "draft") throw new BadRequestException("Only draft invoices can be issued");
    const updated = await this.prisma.invoice.update({ where: { id }, data: { status: "issued", issuedAt: new Date() } });
    await this.writeInvoiceAudit("invoice.issued", id, { status: inv.status }, { status: "issued" }, user);
    return updated;
  }

  // ---------- V5 lifecycle transitions (each writes an AuditLog row) ----------
  private static TERMINAL = ["void", "cancelled", "refunded"];

  private async writeInvoiceAudit(action: string, invoiceId: string, before: any, after: any, user: AuthedUser) {
    try {
      await this.prisma.auditLog.create({
        data: { userId: user.id, action, entityType: "Invoice", entityId: invoiceId, before, after },
      });
    } catch {
      /* audit is best-effort; never block the transition */
    }
  }

  private async transition(id: string, user: AuthedUser, to: string, data: Record<string, any>, guard: (inv: any) => string | null, action: string) {
    const inv = await this.getInvoice(id, user);
    const bad = guard(inv);
    if (bad) throw new BadRequestException(bad);
    const updated = await this.prisma.invoice.update({ where: { id }, data: { status: to as any, ...data } });
    await this.writeInvoiceAudit(action, id, { status: inv.status }, { status: to }, user);
    return updated;
  }

  async approveInvoice(id: string, user: AuthedUser) {
    const inv = await this.transition(id, user, "approved", { approvedAt: new Date(), approvedBy: user.id },
      (i) => (FinanceService.TERMINAL.includes(i.status) || i.status === "paid" ? `Cannot approve a ${i.status} invoice` : null),
      "invoice.approved");
    await this.auto.notify("invoice.approved", { customerId: inv.customerId, invoiceId: inv.id, templateCode: "inv_whatsapp", vars: { invoiceNo: inv.invoiceNo, amount: money(inv.total), dueAmount: money(inv.total) } });
    return inv;
  }
  async markSent(id: string, user: AuthedUser) {
    const inv = await this.transition(id, user, "sent", { sentAt: new Date() },
      (i) => (FinanceService.TERMINAL.includes(i.status) ? `Cannot send a ${i.status} invoice` : null),
      "invoice.sent");
    await this.auto.notify("invoice.sent", { customerId: inv.customerId, invoiceId: inv.id, templateCode: "inv_whatsapp", vars: { invoiceNo: inv.invoiceNo, amount: money(inv.total), dueAmount: money(inv.total) } });
    return inv;
  }
  markViewed(id: string, user: AuthedUser) {
    return this.transition(id, user, "viewed", { viewedAt: new Date() },
      (inv) => (FinanceService.TERMINAL.includes(inv.status) ? `Cannot mark a ${inv.status} invoice viewed` : null),
      "invoice.viewed");
  }
  cancelInvoice(id: string, user: AuthedUser) {
    return this.transition(id, user, "cancelled", { cancelledAt: new Date(), cancelledBy: user.id },
      (inv) => (inv.paid ? "Cannot cancel an invoice with payments; void or refund instead"
        : FinanceService.TERMINAL.includes(inv.status) || inv.status === "paid" ? `Cannot cancel a ${inv.status} invoice` : null),
      "invoice.cancelled");
  }
  voidInvoice(id: string, user: AuthedUser) {
    return this.transition(id, user, "void", { cancelledAt: new Date(), cancelledBy: user.id },
      (inv) => (inv.status === "void" || inv.status === "refunded" ? `Invoice is already ${inv.status}` : null),
      "invoice.void");
  }
  markRefunded(id: string, user: AuthedUser) {
    return this.transition(id, user, "refunded", {},
      (inv) => (inv.status === "refunded" ? "Invoice is already refunded" : null),
      "invoice.refunded");
  }

  async invoiceAudit(id: string, user: AuthedUser) {
    await this.getInvoice(id, user); // branch/scope check
    return this.prisma.auditLog.findMany({
      where: { entityType: "Invoice", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async softDeleteInvoice(id: string, user: AuthedUser) {
    const inv = await this.getInvoice(id, user);
    if (inv.paid !== 0) throw new BadRequestException("Cannot delete an invoice with payments; void instead");
    await this.prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
    return { ok: true };
  }

  private async refreshInvoiceStatus(tx: any, invoiceId: string) {
    const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv) return;
    const rows = await tx.payment.findMany({ where: { invoiceId, deletedAt: null } });
    const paid = rows.reduce((s: number, p: any) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);
    let status = inv.status;
    // Payments advance any non-terminal status to partially_paid/paid; removing all
    // payments falls a paid/partial invoice back to issued/draft. Sendable states
    // (generated/approved/sent/viewed/overdue) are preserved while still unpaid.
    if (!["void", "cancelled", "refunded"].includes(inv.status)) {
      if (paid > 0) status = paid >= inv.total ? "paid" : "partially_paid";
      else if (["partially_paid", "paid"].includes(inv.status)) status = inv.issuedAt ? "issued" : "draft";
    }
    await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
  }

  // ---------- Payments (money IN) and Refunds (money OUT, separate perm) ----------
  async recordPayment(dto: any, user: AuthedUser, kind: "payment" | "refund") {
    const amount = Math.round(Number(dto.amount));
    if (!(amount > 0)) throw new BadRequestException("amount must be positive (minor units)");
    if (!dto.accountId) throw new BadRequestException("accountId required");
    const pay = await this.prisma.$transaction(async (tx) => {
      // F-2: a customer payment can never exceed the invoice's outstanding
      // balance. Lock the invoice row FOR UPDATE first so two concurrent
      // payments serialize and cannot both pass the check (refunds are exempt —
      // they reduce the paid amount, not exceed the due).
      if (kind === "payment" && dto.invoiceId) {
        await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${dto.invoiceId} FOR UPDATE`;
        const inv = await tx.invoice.findUnique({ where: { id: dto.invoiceId } });
        if (!inv) throw new NotFoundException("Invoice not found");
        const prior = await tx.payment.findMany({ where: { invoiceId: dto.invoiceId, deletedAt: null } });
        const paid = prior.reduce((s: number, p: any) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);
        const outstanding = inv.total - paid;
        if (amount > outstanding) {
          throw new BadRequestException("Payment amount cannot exceed the outstanding invoice balance.");
        }
      }
      const pay = await tx.payment.create({ data: { kind, invoiceId: dto.invoiceId ?? null, customerId: dto.customerId ?? null,
        accountId: dto.accountId, amount, method: dto.method || "cash", reference: dto.reference, note: dto.note,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(), recordedBy: user.id } });
      // ledger: payment increases the account (+), refund decreases (-)
      await this.post(tx, dto.accountId, kind === "refund" ? -amount : amount, kind, pay.id,
        `${kind} ${dto.invoiceId ? "for invoice" : ""}`.trim(), user.id);
      if (dto.invoiceId) await this.refreshInvoiceStatus(tx, dto.invoiceId);
      return pay;
    });
    if (dto.invoiceId) {
      await this.writeInvoiceAudit(kind === "refund" ? "invoice.refund" : "invoice.payment", dto.invoiceId, null,
        { amount, method: dto.method || "cash", paymentId: pay.id }, user);
      const inv = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId }, select: { customerId: true, invoiceNo: true } });
      await this.auto.notify(kind === "refund" ? "payment.refund" : "payment.received", {
        customerId: inv?.customerId,
        invoiceId: dto.invoiceId,
        templateCode: "inv_whatsapp",
        vars: { invoiceNo: inv?.invoiceNo || "", amount: money(amount), dueAmount: "" },
      });
    }
    return pay;
  }

  // ---------- Expenses (money OUT) ----------
  async listExpenses(user: AuthedUser, q: any) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const where: any = { deletedAt: null, ...this.branchFilter(user) };
    if (q.category) where.category = q.category;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({ where, orderBy: { paidAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.expense.count({ where }),
    ]);
    return { data, total, page, limit };
  }
  async createExpense(dto: any, user: AuthedUser) {
    const amount = Math.round(Number(dto.amount));
    if (!(amount > 0)) throw new BadRequestException("amount must be positive");
    if (!dto.accountId) throw new BadRequestException("accountId required");
    return this.prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({ data: { branchId: user.branchId ?? dto.branchId, category: dto.category || "other",
        description: dto.description, amount, vendorName: dto.vendorName, supplierId: dto.supplierId ?? null,
        accountId: dto.accountId, method: dto.method || "cash", reference: dto.reference,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(), recordedBy: user.id } });
      await this.post(tx, dto.accountId, -amount, "expense", exp.id, dto.category || "expense", user.id);
      return exp;
    });
  }

  // ---------- Reports (REAL, derived — replaces the old hardcoded stub) ----------
  async summary(user: AuthedUser) {
    const invWhere: any = { deletedAt: null, ...this.branchFilter(user) };
    const invoices = await this.prisma.invoice.findMany({ where: invWhere, select: { id: true, total: true, status: true } });
    let receivable = 0, invoiced = 0;
    for (const inv of invoices) { invoiced += inv.total; receivable += inv.total - (await this.paidTotal(inv.id)); }
    const payAgg = await this.prisma.payment.groupBy({ by: ["kind"], where: { deletedAt: null }, _sum: { amount: true } });
    const paymentsIn = payAgg.find((a) => a.kind === "payment")?._sum.amount || 0;
    const refunds = payAgg.find((a) => a.kind === "refund")?._sum.amount || 0;
    const expenses = (await this.prisma.expense.aggregate({ where: { deletedAt: null }, _sum: { amount: true } }))._sum.amount || 0;
    const accounts = await this.prisma.account.findMany({ where: { deletedAt: null }, select: { name: true, type: true, currentBalance: true } });
    const cashPosition = accounts.reduce((s, a) => s + a.currentBalance, 0);
    return {
      currency: "BDT", note: "amounts in minor units (poisha); divide by 100 for BDT",
      invoiced, collected: paymentsIn - refunds, receivable, refunds, expenses,
      netCash: paymentsIn - refunds - expenses, cashPosition, accounts,
    };
  }

  /**
   * Consolidated commercial reports — computed from the existing Invoice/Payment data
   * (no GL/analytics duplication). Branch-scoped, date-filtered, and audited on access.
   */
  async report(type: string, q: any, user: AuthedUser) {
    const branch = this.branchFilter(user);
    const isHQ = HQ_ROLES.has(user.role);
    const from = q.from ? new Date(String(q.from)) : new Date(Date.now() - 30 * 86400000);
    const to = q.to ? new Date(String(q.to) + "T23:59:59.999Z") : new Date();
    try {
      await this.prisma.auditLog.create({ data: { userId: user.id, action: `finance.report.${type}`, entityType: "FinanceReport", entityId: type, after: { from, to } } });
    } catch {
      /* audit best-effort */
    }
    const period = { from, to };

    if (type === "collection" || type === "receipts" || type === "refunds") {
      const kind = type === "refunds" ? "refund" : "payment";
      const pays = await this.prisma.payment.findMany({
        where: { deletedAt: null, kind, receivedAt: { gte: from, lte: to } },
        include: { invoice: { select: { invoiceNo: true, branchId: true } }, customer: { select: { fullName: true } } },
        orderBy: { receivedAt: "desc" },
        take: 2000,
      });
      const rows = pays
        .filter((p) => isHQ || !p.invoice || p.invoice.branchId === user.branchId)
        .map((p) => ({ date: p.receivedAt, invoiceNo: p.invoice?.invoiceNo || "—", customer: p.customer?.fullName || "—", method: p.method, amount: p.amount, reference: p.reference || "" }));
      return { type, period, rows, total: rows.reduce((s, r) => s + r.amount, 0), count: rows.length };
    }

    if (type === "outstanding" || type === "overdue") {
      const where: any = { deletedAt: null, ...branch, status: { in: ["issued", "sent", "approved", "viewed", "partially_paid", "overdue"] } };
      if (type === "overdue") where.dueAt = { lt: new Date() };
      const invoices = await this.prisma.invoice.findMany({ where, include: { customer: { select: { fullName: true } } }, orderBy: { dueAt: "asc" }, take: 2000 });
      const rows: any[] = [];
      for (const inv of invoices) {
        const paid = await this.paidTotal(inv.id);
        const due = inv.total - paid;
        if (due <= 0) continue;
        rows.push({ invoiceNo: inv.invoiceNo, customer: inv.customer?.fullName || "—", total: inv.total, paid, due, dueAt: inv.dueAt, status: inv.status });
      }
      return { type, period, rows, total: rows.reduce((s, r) => s + r.due, 0), count: rows.length };
    }

    // revenue / invoices / tax — invoices raised in the period
    if (type === "revenue" || type === "invoices" || type === "tax") {
      const invoices = await this.prisma.invoice.findMany({
        where: { deletedAt: null, ...branch, createdAt: { gte: from, lte: to } },
        include: { customer: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 2000,
      });
      const rows = invoices.map((inv) => ({ invoiceNo: inv.invoiceNo, customer: inv.customer?.fullName || "—", date: inv.createdAt, subtotal: inv.subtotal, discount: inv.discount, tax: inv.tax, total: inv.total, status: inv.status }));
      const total = rows.reduce((s, r) => s + (type === "tax" ? r.tax : r.total), 0);
      return { type, period, rows, total, count: rows.length };
    }

    throw new BadRequestException(`Unknown report type '${type}'`);
  }
}
