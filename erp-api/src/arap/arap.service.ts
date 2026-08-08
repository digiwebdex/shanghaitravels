import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { AuthedUser } from "../rbac";
import { AccountingService } from "../accounting/accounting.service";

const AR_TYPES = new Set(["invoice", "receipt", "advance", "credit_note", "debit_note", "refund"]);
const AP_TYPES = new Set(["bill", "payment", "advance", "credit_note", "debit_note"]);
const EDITABLE = new Set(["draft", "rejected"]);

/** Doc types that increase customer receivable balance when posted. */
const AR_INCREASE = new Set(["invoice", "debit_note"]);
/** Doc types that decrease customer receivable (cash in / credit). */
const AR_DECREASE = new Set(["receipt", "advance", "credit_note", "refund"]);

const AP_INCREASE = new Set(["bill", "debit_note"]);
const AP_DECREASE = new Set(["payment", "advance", "credit_note"]);

@Injectable()
export class ArApService {
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

  private async caseEvent(applicationId: string | null | undefined, userId: string, type: string, message: string, meta?: unknown) {
    if (!applicationId) return;
    await this.prisma.applicationEvent.create({
      data: {
        applicationId,
        type,
        message,
        meta: meta == null ? undefined : (meta as any),
        userId,
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
    if (!acc) throw new BadRequestException(`GL account code ${code} not found — run /gl/bootstrap`);
    return acc.id;
  }

  private normalizeLines(lines: any[]) {
    if (!Array.isArray(lines) || lines.length < 1) throw new BadRequestException("At least one line required");
    return lines.map((L, i) => {
      const qty = this.num(L.quantity ?? 1) || 1;
      const unit = this.num(L.unitPricePoisha ?? L.unitPrice ?? 0);
      const amount = L.amountPoisha != null ? this.num(L.amountPoisha) : qty * unit;
      if (amount <= 0) throw new BadRequestException(`Line ${i + 1}: amount must be > 0`);
      return {
        lineNo: i + 1,
        description: String(L.description || `Line ${i + 1}`).trim(),
        quantity: qty,
        unitPricePoisha: unit,
        amountPoisha: amount,
        glAccountCode: L.glAccountCode ? String(L.glAccountCode) : null,
      };
    });
  }

  private async nextDocNo(prefix: string) {
    const y = new Date().getUTCFullYear();
    const p = `${prefix}-${y}-`;
    const last = await (prefix.startsWith("AP")
      ? this.prisma.apDocument.findFirst({ where: { docNo: { startsWith: p } }, orderBy: { docNo: "desc" } })
      : this.prisma.arDocument.findFirst({ where: { docNo: { startsWith: p } }, orderBy: { docNo: "desc" } }));
    const seq = last ? Number(String(last.docNo).slice(p.length)) + 1 : 1;
    return `${p}${String(seq).padStart(5, "0")}`;
  }

  private async createAndPostJournal(
    user: AuthedUser,
    entryDate: Date,
    memo: string,
    reference: string,
    lines: { glAccountId: string; debitPoisha: number; creditPoisha: number; memo?: string }[],
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

  // ---------- AR customers ----------
  async listArCustomers() {
    const rows = await this.prisma.arDocument.findMany({
      where: { deletedAt: null, status: "posted", type: { in: [...AR_INCREASE, ...AR_DECREASE] } },
      select: { customerId: true, type: true, balancePoisha: true, totalPoisha: true },
    });
    const map = new Map<string, { outstanding: number; invoiceCount: number }>();
    for (const r of rows) {
      const cur = map.get(r.customerId) || { outstanding: 0, invoiceCount: 0 };
      if (AR_INCREASE.has(r.type)) {
        cur.outstanding += r.balancePoisha;
        if (r.type === "invoice") cur.invoiceCount += 1;
      }
      map.set(r.customerId, cur);
    }
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: [...map.keys()] }, deletedAt: null },
      select: { id: true, code: true, fullName: true, phone: true, email: true },
      orderBy: { fullName: "asc" },
    });
    return customers.map((c) => ({
      ...c,
      outstandingPoisha: map.get(c.id)?.outstanding || 0,
      invoiceCount: map.get(c.id)?.invoiceCount || 0,
    }));
  }

  // ---------- AR documents ----------
  listArDocuments(q?: { status?: string; type?: string; customerId?: string; applicationId?: string; limit?: number }) {
    const where: any = { deletedAt: null };
    if (q?.status) where.status = q.status;
    if (q?.type) where.type = q.type;
    if (q?.customerId) where.customerId = q.customerId;
    if (q?.applicationId) where.applicationId = q.applicationId;
    return this.prisma.arDocument.findMany({
      where,
      orderBy: [{ issueDate: "desc" }, { docNo: "desc" }],
      take: Math.min(200, q?.limit || 100),
      include: {
        customer: { select: { id: true, code: true, fullName: true } },
        application: { select: { id: true, referenceNo: true, serviceType: true } },
        _count: { select: { lines: true } },
      },
    });
  }

  async getArDocument(id: string) {
    const row = await this.prisma.arDocument.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { select: { id: true, code: true, fullName: true, phone: true } },
        application: { select: { id: true, referenceNo: true, serviceType: true, title: true } },
        invoice: { select: { id: true, invoiceNo: true, status: true, total: true } },
        lines: { orderBy: { lineNo: "asc" } },
        journal: { select: { id: true, journalNo: true, status: true } },
        allocationsFrom: true,
        allocationsTo: true,
      },
    });
    if (!row) throw new NotFoundException("AR document not found");
    return row;
  }

  async createArDocument(dto: any, user: AuthedUser) {
    const type = String(dto?.type || "").trim();
    if (!AR_TYPES.has(type)) throw new BadRequestException("invalid AR type");
    if (!dto.customerId) throw new BadRequestException("customerId required");
    const cust = await this.prisma.customer.findFirst({ where: { id: dto.customerId, deletedAt: null } });
    if (!cust) throw new NotFoundException("Customer not found");
    const lines = this.normalizeLines(dto.lines || []);
    const subtotal = lines.reduce((s, l) => s + l.amountPoisha, 0);
    const tax = this.num(dto.taxPoisha || 0);
    const total = subtotal + tax;
    const issueDate = new Date(dto.issueDate || Date.now());
    const docNo = dto.docNo?.trim() || (await this.nextDocNo(type === "invoice" ? "AR-INV" : `AR-${type.slice(0, 3).toUpperCase()}`));
    const row = await this.prisma.arDocument.create({
      data: {
        docNo,
        type,
        status: "draft",
        branchId: dto.branchId || user.branchId || null,
        customerId: dto.customerId,
        applicationId: dto.applicationId || null,
        invoiceId: dto.invoiceId || null,
        currencyCode: String(dto.currencyCode || "BDT").toUpperCase(),
        issueDate,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        subtotalPoisha: subtotal,
        taxPoisha: tax,
        totalPoisha: total,
        balancePoisha: AR_INCREASE.has(type) ? total : total,
        memo: dto.memo || null,
        reference: dto.reference || null,
        createdBy: user.id,
        lines: { create: lines },
      },
    });
    await this.audit(user.id, "ar.doc.create", "ArDocument", row.id, { docNo, type, total });
    await this.caseEvent(row.applicationId, user.id, "ar.created", `AR ${type} ${docNo} created`, { id: row.id, total });
    return this.getArDocument(row.id);
  }

  async updateArDocument(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.arDocument.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("AR document not found");
    if (!EDITABLE.has(existing.status)) throw new BadRequestException(`Cannot edit ${existing.status}`);
    const lines = dto.lines ? this.normalizeLines(dto.lines) : null;
    const subtotal = lines ? lines.reduce((s, l) => s + l.amountPoisha, 0) : existing.subtotalPoisha;
    const tax = dto.taxPoisha != null ? this.num(dto.taxPoisha) : existing.taxPoisha;
    const total = subtotal + tax;
    await this.prisma.$transaction(async (tx) => {
      if (lines) {
        await tx.arDocumentLine.deleteMany({ where: { documentId: id } });
        await tx.arDocumentLine.createMany({
          data: lines.map((l) => ({ ...l, documentId: id })),
        });
      }
      await tx.arDocument.update({
        where: { id },
        data: {
          status: "draft",
          memo: dto.memo !== undefined ? dto.memo : existing.memo,
          reference: dto.reference !== undefined ? dto.reference : existing.reference,
          applicationId: dto.applicationId !== undefined ? dto.applicationId || null : existing.applicationId,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : existing.issueDate,
          dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : existing.dueDate,
          subtotalPoisha: subtotal,
          taxPoisha: tax,
          totalPoisha: total,
          balancePoisha: total,
          rejectedBy: null,
          rejectedAt: null,
          rejectReason: null,
        },
      });
    });
    await this.audit(user.id, "ar.doc.update", "ArDocument", id, { total });
    return this.getArDocument(id);
  }

  async submitAr(id: string, user: AuthedUser) {
    const d = await this.getArDocument(id);
    if (!EDITABLE.has(d.status)) throw new BadRequestException(`Cannot submit from ${d.status}`);
    if (d.totalPoisha <= 0) throw new BadRequestException("Total must be > 0");
    const row = await this.prisma.arDocument.update({
      where: { id },
      data: { status: "pending_approval", submittedBy: user.id, submittedAt: new Date() },
    });
    await this.audit(user.id, "ar.doc.submit", "ArDocument", id, row);
    return this.getArDocument(id);
  }

  async approveAr(id: string, user: AuthedUser) {
    const d = await this.prisma.arDocument.findFirst({ where: { id, deletedAt: null } });
    if (!d) throw new NotFoundException("AR document not found");
    if (d.status !== "pending_approval") throw new BadRequestException("Not pending approval");
    await this.prisma.arDocument.update({
      where: { id },
      data: { status: "approved", approvedBy: user.id, approvedAt: new Date() },
    });
    await this.audit(user.id, "ar.doc.approve", "ArDocument", id, { approvedBy: user.id });
    return this.getArDocument(id);
  }

  async rejectAr(id: string, user: AuthedUser, reason?: string) {
    const d = await this.prisma.arDocument.findFirst({ where: { id, deletedAt: null } });
    if (!d) throw new NotFoundException("AR document not found");
    if (d.status !== "pending_approval") throw new BadRequestException("Not pending approval");
    await this.prisma.arDocument.update({
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
    await this.audit(user.id, "ar.doc.reject", "ArDocument", id, { reason });
    return this.getArDocument(id);
  }

  private async journalLinesForAr(type: string, amount: number, lineOverride?: string | null) {
    const arId = await this.glIdByCode("1300");
    const revId = await this.glIdByCode(lineOverride || "4000");
    const cashId = await this.glIdByCode("1100");
    if (type === "invoice" || type === "debit_note") {
      return [
        { glAccountId: arId, debitPoisha: amount, creditPoisha: 0 },
        { glAccountId: revId, debitPoisha: 0, creditPoisha: amount },
      ];
    }
    if (type === "credit_note") {
      return [
        { glAccountId: revId, debitPoisha: amount, creditPoisha: 0 },
        { glAccountId: arId, debitPoisha: 0, creditPoisha: amount },
      ];
    }
    if (type === "receipt" || type === "advance") {
      return [
        { glAccountId: cashId, debitPoisha: amount, creditPoisha: 0 },
        { glAccountId: arId, debitPoisha: 0, creditPoisha: amount },
      ];
    }
    if (type === "refund") {
      return [
        { glAccountId: arId, debitPoisha: amount, creditPoisha: 0 },
        { glAccountId: cashId, debitPoisha: 0, creditPoisha: amount },
      ];
    }
    throw new BadRequestException(`No posting map for AR type ${type}`);
  }

  async postAr(id: string, user: AuthedUser) {
    const d = await this.getArDocument(id);
    if (d.status === "posted") throw new BadRequestException("Already posted");
    if (d.status === "void") throw new BadRequestException("Document is void");
    if (d.status !== "approved" && d.status !== "pending_approval" && d.status !== "draft") {
      throw new BadRequestException(`Cannot post from ${d.status}`);
    }
    if (d.status === "pending_approval" && !d.approvedBy) {
      throw new BadRequestException("Approve before posting");
    }
    const override = d.lines[0]?.glAccountCode || null;
    const jLines = await this.journalLinesForAr(d.type, d.totalPoisha, override);
    const je = await this.createAndPostJournal(
      user,
      d.issueDate,
      d.memo || `AR ${d.type} ${d.docNo}`,
      d.docNo,
      jLines,
    );
    const balance = AR_INCREASE.has(d.type) ? d.totalPoisha : d.totalPoisha;
    await this.prisma.arDocument.update({
      where: { id },
      data: {
        status: "posted",
        journalId: je.id,
        postedBy: user.id,
        postedAt: new Date(),
        approvedBy: d.approvedBy || user.id,
        approvedAt: d.approvedAt || new Date(),
        balancePoisha: balance,
      },
    });
    await this.audit(user.id, "ar.doc.post", "ArDocument", id, { journalNo: je.journalNo, total: d.totalPoisha });
    await this.caseEvent(d.applicationId, user.id, "ar.posted", `AR ${d.type} ${d.docNo} posted to GL`, {
      journalId: je.id,
      journalNo: je.journalNo,
    });
    return this.getArDocument(id);
  }

  async voidAr(id: string, user: AuthedUser, reason?: string) {
    const d = await this.prisma.arDocument.findFirst({ where: { id, deletedAt: null } });
    if (!d) throw new NotFoundException("AR document not found");
    if (d.status === "void") throw new BadRequestException("Already void");
    if (d.status === "posted") {
      throw new BadRequestException("Void posted AR via reversing credit/debit note in C2; mark void only for unposted");
    }
    await this.prisma.arDocument.update({
      where: { id },
      data: { status: "void", voidedBy: user.id, voidedAt: new Date(), voidReason: reason || null },
    });
    await this.audit(user.id, "ar.doc.void", "ArDocument", id, { reason });
    return this.getArDocument(id);
  }

  async allocateAr(dto: any, user: AuthedUser) {
    const amount = this.num(dto.amountPoisha);
    if (amount <= 0) throw new BadRequestException("amountPoisha must be > 0");
    const from = await this.prisma.arDocument.findFirst({ where: { id: dto.fromDocId, deletedAt: null, status: "posted" } });
    const to = await this.prisma.arDocument.findFirst({ where: { id: dto.toDocId, deletedAt: null, status: "posted" } });
    if (!from || !to) throw new NotFoundException("Documents not found or not posted");
    if (from.customerId !== to.customerId) throw new BadRequestException("Customer mismatch");
    if (!AR_DECREASE.has(from.type)) throw new BadRequestException("fromDoc must be receipt/advance/credit/refund");
    if (!AR_INCREASE.has(to.type)) throw new BadRequestException("toDoc must be invoice/debit_note");
    if (to.balancePoisha < amount) throw new BadRequestException("Allocation exceeds invoice balance");
    if (from.balancePoisha < amount) throw new BadRequestException("Allocation exceeds source balance");
    const row = await this.prisma.$transaction(async (tx) => {
      const alloc = await tx.arAllocation.create({
        data: { fromDocId: from.id, toDocId: to.id, amountPoisha: amount, createdBy: user.id },
      });
      await tx.arDocument.update({ where: { id: from.id }, data: { balancePoisha: from.balancePoisha - amount } });
      await tx.arDocument.update({ where: { id: to.id }, data: { balancePoisha: to.balancePoisha - amount } });
      return alloc;
    });
    await this.audit(user.id, "ar.allocate", "ArAllocation", row.id, { amount, from: from.docNo, to: to.docNo });
    return row;
  }

  async bridgeFromInvoice(invoiceId: string, user: AuthedUser) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null },
      include: { items: true },
    });
    if (!inv) throw new NotFoundException("Invoice not found");
    if (!["issued", "partially_paid", "paid"].includes(inv.status)) {
      throw new BadRequestException("Issue the operational invoice before bridging to AR");
    }
    const existing = await this.prisma.arDocument.findFirst({
      where: { invoiceId, deletedAt: null, type: "invoice" },
    });
    if (existing) return this.getArDocument(existing.id);

    const lines =
      inv.items.length > 0
        ? inv.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPricePoisha: it.unitPrice,
            amountPoisha: it.amount,
          }))
        : [{ description: `Invoice ${inv.invoiceNo}`, quantity: 1, unitPricePoisha: inv.total, amountPoisha: inv.total }];

    const doc = await this.createArDocument(
      {
        type: "invoice",
        customerId: inv.customerId,
        applicationId: inv.applicationId,
        invoiceId: inv.id,
        issueDate: inv.issuedAt || inv.createdAt,
        dueDate: inv.dueAt,
        taxPoisha: inv.tax,
        memo: inv.notes || `Bridged from ${inv.invoiceNo}`,
        reference: inv.invoiceNo,
        lines,
      },
      user,
    );
    // Fast-path: approve + post for operational bridge
    await this.prisma.arDocument.update({
      where: { id: doc.id },
      data: { status: "approved", approvedBy: user.id, approvedAt: new Date(), submittedBy: user.id, submittedAt: new Date() },
    });
    return this.postAr(doc.id, user);
  }

  async bridgeFromPayment(paymentId: string, user: AuthedUser) {
    const pay = await this.prisma.payment.findFirst({ where: { id: paymentId, deletedAt: null } });
    if (!pay) throw new NotFoundException("Payment not found");
    if (pay.kind !== "payment") throw new BadRequestException("Only receipts (payment kind) bridge to AR");
    if (!pay.customerId) throw new BadRequestException("Payment missing customerId");
    let applicationId: string | null = null;
    let invoiceId: string | null = pay.invoiceId;
    if (pay.invoiceId) {
      const inv = await this.prisma.invoice.findFirst({ where: { id: pay.invoiceId } });
      applicationId = inv?.applicationId || null;
    }
    const existing = await this.prisma.arDocument.findFirst({
      where: { deletedAt: null, type: "receipt", reference: `PAY-${pay.id}` },
    });
    if (existing) return this.getArDocument(existing.id);

    const doc = await this.createArDocument(
      {
        type: "receipt",
        customerId: pay.customerId,
        applicationId,
        invoiceId,
        issueDate: pay.receivedAt,
        memo: pay.note || "Bridged cash receipt",
        reference: `PAY-${pay.id}`,
        lines: [{ description: "Customer receipt", quantity: 1, unitPricePoisha: pay.amount, amountPoisha: pay.amount }],
      },
      user,
    );
    await this.prisma.arDocument.update({
      where: { id: doc.id },
      data: { status: "approved", approvedBy: user.id, approvedAt: new Date(), submittedBy: user.id, submittedAt: new Date() },
    });
    const posted = await this.postAr(doc.id, user);
    if (invoiceId) {
      const arInv = await this.prisma.arDocument.findFirst({
        where: { invoiceId, type: "invoice", status: "posted", deletedAt: null },
      });
      if (arInv && arInv.balancePoisha > 0) {
        const amt = Math.min(pay.amount, arInv.balancePoisha, posted.balancePoisha);
        if (amt > 0) {
          await this.allocateAr({ fromDocId: posted.id, toDocId: arInv.id, amountPoisha: amt }, user);
        }
      }
    }
    return this.getArDocument(posted.id);
  }

  // ---------- AP ----------
  async listApSuppliers() {
    const rows = await this.prisma.apDocument.findMany({
      where: { deletedAt: null, status: "posted" },
      select: { supplierId: true, type: true, balancePoisha: true },
    });
    const map = new Map<string, number>();
    for (const r of rows) {
      if (AP_INCREASE.has(r.type)) map.set(r.supplierId, (map.get(r.supplierId) || 0) + r.balancePoisha);
    }
    const suppliers = await this.prisma.supplier.findMany({
      where: { id: { in: [...map.keys()] }, deletedAt: null },
      select: { id: true, code: true, name: true, type: true, phone: true },
      orderBy: { name: "asc" },
    });
    return suppliers.map((s) => ({ ...s, outstandingPoisha: map.get(s.id) || 0 }));
  }

  listApDocuments(q?: { status?: string; type?: string; supplierId?: string; applicationId?: string; limit?: number }) {
    const where: any = { deletedAt: null };
    if (q?.status) where.status = q.status;
    if (q?.type) where.type = q.type;
    if (q?.supplierId) where.supplierId = q.supplierId;
    if (q?.applicationId) where.applicationId = q.applicationId;
    return this.prisma.apDocument.findMany({
      where,
      orderBy: [{ issueDate: "desc" }, { docNo: "desc" }],
      take: Math.min(200, q?.limit || 100),
      include: {
        supplier: { select: { id: true, code: true, name: true, type: true } },
        application: { select: { id: true, referenceNo: true, serviceType: true } },
        _count: { select: { lines: true } },
      },
    });
  }

  async getApDocument(id: string) {
    const row = await this.prisma.apDocument.findFirst({
      where: { id, deletedAt: null },
      include: {
        supplier: { select: { id: true, code: true, name: true, type: true, phone: true } },
        application: { select: { id: true, referenceNo: true, serviceType: true, title: true } },
        lines: { orderBy: { lineNo: "asc" } },
        journal: { select: { id: true, journalNo: true, status: true } },
        allocationsFrom: true,
        allocationsTo: true,
      },
    });
    if (!row) throw new NotFoundException("AP document not found");
    return row;
  }

  async createApDocument(dto: any, user: AuthedUser) {
    const type = String(dto?.type || "").trim();
    if (!AP_TYPES.has(type)) throw new BadRequestException("invalid AP type");
    if (!dto.supplierId) throw new BadRequestException("supplierId required");
    const sup = await this.prisma.supplier.findFirst({ where: { id: dto.supplierId, deletedAt: null } });
    if (!sup) throw new NotFoundException("Supplier not found");
    const lines = this.normalizeLines(dto.lines || []);
    const subtotal = lines.reduce((s, l) => s + l.amountPoisha, 0);
    const tax = this.num(dto.taxPoisha || 0);
    const total = subtotal + tax;
    const issueDate = new Date(dto.issueDate || Date.now());
    const docNo = dto.docNo?.trim() || (await this.nextDocNo(type === "bill" ? "AP-BILL" : `AP-${type.slice(0, 3).toUpperCase()}`));
    const row = await this.prisma.apDocument.create({
      data: {
        docNo,
        type,
        status: "draft",
        branchId: dto.branchId || user.branchId || null,
        supplierId: dto.supplierId,
        applicationId: dto.applicationId || null,
        currencyCode: String(dto.currencyCode || "BDT").toUpperCase(),
        issueDate,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        subtotalPoisha: subtotal,
        taxPoisha: tax,
        totalPoisha: total,
        balancePoisha: total,
        memo: dto.memo || null,
        reference: dto.reference || null,
        createdBy: user.id,
        lines: { create: lines },
      },
    });
    await this.audit(user.id, "ap.doc.create", "ApDocument", row.id, { docNo, type, total });
    await this.caseEvent(row.applicationId, user.id, "ap.created", `AP ${type} ${docNo} created`, { id: row.id, total });
    return this.getApDocument(row.id);
  }

  async updateApDocument(id: string, dto: any, user: AuthedUser) {
    const existing = await this.prisma.apDocument.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException("AP document not found");
    if (!EDITABLE.has(existing.status)) throw new BadRequestException(`Cannot edit ${existing.status}`);
    const lines = dto.lines ? this.normalizeLines(dto.lines) : null;
    const subtotal = lines ? lines.reduce((s, l) => s + l.amountPoisha, 0) : existing.subtotalPoisha;
    const tax = dto.taxPoisha != null ? this.num(dto.taxPoisha) : existing.taxPoisha;
    const total = subtotal + tax;
    await this.prisma.$transaction(async (tx) => {
      if (lines) {
        await tx.apDocumentLine.deleteMany({ where: { documentId: id } });
        await tx.apDocumentLine.createMany({ data: lines.map((l) => ({ ...l, documentId: id })) });
      }
      await tx.apDocument.update({
        where: { id },
        data: {
          status: "draft",
          memo: dto.memo !== undefined ? dto.memo : existing.memo,
          reference: dto.reference !== undefined ? dto.reference : existing.reference,
          applicationId: dto.applicationId !== undefined ? dto.applicationId || null : existing.applicationId,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : existing.issueDate,
          dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : existing.dueDate,
          subtotalPoisha: subtotal,
          taxPoisha: tax,
          totalPoisha: total,
          balancePoisha: total,
          rejectedBy: null,
          rejectedAt: null,
          rejectReason: null,
        },
      });
    });
    await this.audit(user.id, "ap.doc.update", "ApDocument", id, { total });
    return this.getApDocument(id);
  }

  async submitAp(id: string, user: AuthedUser) {
    const d = await this.getApDocument(id);
    if (!EDITABLE.has(d.status)) throw new BadRequestException(`Cannot submit from ${d.status}`);
    await this.prisma.apDocument.update({
      where: { id },
      data: { status: "pending_approval", submittedBy: user.id, submittedAt: new Date() },
    });
    await this.audit(user.id, "ap.doc.submit", "ApDocument", id, {});
    return this.getApDocument(id);
  }

  async approveAp(id: string, user: AuthedUser) {
    const d = await this.prisma.apDocument.findFirst({ where: { id, deletedAt: null } });
    if (!d) throw new NotFoundException("AP document not found");
    if (d.status !== "pending_approval") throw new BadRequestException("Not pending approval");
    await this.prisma.apDocument.update({
      where: { id },
      data: { status: "approved", approvedBy: user.id, approvedAt: new Date() },
    });
    await this.audit(user.id, "ap.doc.approve", "ApDocument", id, {});
    return this.getApDocument(id);
  }

  async rejectAp(id: string, user: AuthedUser, reason?: string) {
    const d = await this.prisma.apDocument.findFirst({ where: { id, deletedAt: null } });
    if (!d) throw new NotFoundException("AP document not found");
    if (d.status !== "pending_approval") throw new BadRequestException("Not pending approval");
    await this.prisma.apDocument.update({
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
    await this.audit(user.id, "ap.doc.reject", "ApDocument", id, { reason });
    return this.getApDocument(id);
  }

  private async journalLinesForAp(type: string, amount: number, lineOverride?: string | null) {
    const apId = await this.glIdByCode("2100");
    const costId = await this.glIdByCode(lineOverride || "5200");
    const cashId = await this.glIdByCode("1100");
    if (type === "bill" || type === "debit_note") {
      return [
        { glAccountId: costId, debitPoisha: amount, creditPoisha: 0 },
        { glAccountId: apId, debitPoisha: 0, creditPoisha: amount },
      ];
    }
    if (type === "credit_note") {
      return [
        { glAccountId: apId, debitPoisha: amount, creditPoisha: 0 },
        { glAccountId: costId, debitPoisha: 0, creditPoisha: amount },
      ];
    }
    if (type === "payment" || type === "advance") {
      return [
        { glAccountId: apId, debitPoisha: amount, creditPoisha: 0 },
        { glAccountId: cashId, debitPoisha: 0, creditPoisha: amount },
      ];
    }
    throw new BadRequestException(`No posting map for AP type ${type}`);
  }

  async postAp(id: string, user: AuthedUser) {
    const d = await this.getApDocument(id);
    if (d.status === "posted") throw new BadRequestException("Already posted");
    if (d.status === "void") throw new BadRequestException("Document is void");
    if (d.status !== "approved" && d.status !== "pending_approval" && d.status !== "draft") {
      throw new BadRequestException(`Cannot post from ${d.status}`);
    }
    if (d.status === "pending_approval" && !d.approvedBy) {
      throw new BadRequestException("Approve before posting");
    }
    const override = d.lines[0]?.glAccountCode || null;
    const jLines = await this.journalLinesForAp(d.type, d.totalPoisha, override);
    const je = await this.createAndPostJournal(
      user,
      d.issueDate,
      d.memo || `AP ${d.type} ${d.docNo}`,
      d.docNo,
      jLines,
    );
    await this.prisma.apDocument.update({
      where: { id },
      data: {
        status: "posted",
        journalId: je.id,
        postedBy: user.id,
        postedAt: new Date(),
        approvedBy: d.approvedBy || user.id,
        approvedAt: d.approvedAt || new Date(),
        balancePoisha: d.totalPoisha,
      },
    });
    await this.audit(user.id, "ap.doc.post", "ApDocument", id, { journalNo: je.journalNo, total: d.totalPoisha });
    await this.caseEvent(d.applicationId, user.id, "ap.posted", `AP ${d.type} ${d.docNo} posted to GL`, {
      journalId: je.id,
      journalNo: je.journalNo,
    });
    return this.getApDocument(id);
  }

  async voidAp(id: string, user: AuthedUser, reason?: string) {
    const d = await this.prisma.apDocument.findFirst({ where: { id, deletedAt: null } });
    if (!d) throw new NotFoundException("AP document not found");
    if (d.status === "void") throw new BadRequestException("Already void");
    if (d.status === "posted") {
      throw new BadRequestException("Void posted AP via reversing note; mark void only for unposted");
    }
    await this.prisma.apDocument.update({
      where: { id },
      data: { status: "void", voidedBy: user.id, voidedAt: new Date(), voidReason: reason || null },
    });
    await this.audit(user.id, "ap.doc.void", "ApDocument", id, { reason });
    return this.getApDocument(id);
  }

  async allocateAp(dto: any, user: AuthedUser) {
    const amount = this.num(dto.amountPoisha);
    if (amount <= 0) throw new BadRequestException("amountPoisha must be > 0");
    const from = await this.prisma.apDocument.findFirst({ where: { id: dto.fromDocId, deletedAt: null, status: "posted" } });
    const to = await this.prisma.apDocument.findFirst({ where: { id: dto.toDocId, deletedAt: null, status: "posted" } });
    if (!from || !to) throw new NotFoundException("Documents not found or not posted");
    if (from.supplierId !== to.supplierId) throw new BadRequestException("Supplier mismatch");
    if (!AP_DECREASE.has(from.type)) throw new BadRequestException("fromDoc must be payment/advance/credit");
    if (!AP_INCREASE.has(to.type)) throw new BadRequestException("toDoc must be bill/debit_note");
    if (to.balancePoisha < amount || from.balancePoisha < amount) {
      throw new BadRequestException("Allocation exceeds available balance");
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const alloc = await tx.apAllocation.create({
        data: { fromDocId: from.id, toDocId: to.id, amountPoisha: amount, createdBy: user.id },
      });
      await tx.apDocument.update({ where: { id: from.id }, data: { balancePoisha: from.balancePoisha - amount } });
      await tx.apDocument.update({ where: { id: to.id }, data: { balancePoisha: to.balancePoisha - amount } });
      return alloc;
    });
    await this.audit(user.id, "ap.allocate", "ApAllocation", row.id, { amount, from: from.docNo, to: to.docNo });
    return row;
  }

  // ---------- Reports ----------
  private ageBucket(due: Date | null, asOf: Date): string {
    if (!due) return "current";
    const days = Math.floor((asOf.getTime() - due.getTime()) / 86400000);
    if (days <= 0) return "current";
    if (days <= 30) return "1-30";
    if (days <= 60) return "31-60";
    if (days <= 90) return "61-90";
    return "90+";
  }

  async reportArAging(asOf?: string) {
    const asOfDate = asOf ? new Date(asOf) : new Date();
    const rows = await this.prisma.arDocument.findMany({
      where: { deletedAt: null, status: "posted", type: { in: [...AR_INCREASE] }, balancePoisha: { gt: 0 } },
      include: { customer: { select: { id: true, code: true, fullName: true } } },
    });
    const buckets = ["current", "1-30", "31-60", "61-90", "90+"] as const;
    const byCustomer = new Map<string, any>();
    for (const r of rows) {
      const b = this.ageBucket(r.dueDate || r.issueDate, asOfDate);
      const cur = byCustomer.get(r.customerId) || {
        customerId: r.customerId,
        code: r.customer.code,
        name: r.customer.fullName,
        current: 0,
        "1-30": 0,
        "31-60": 0,
        "61-90": 0,
        "90+": 0,
        total: 0,
      };
      cur[b] += r.balancePoisha;
      cur.total += r.balancePoisha;
      byCustomer.set(r.customerId, cur);
    }
    const data = [...byCustomer.values()].sort((a, b) => b.total - a.total);
    const totals = buckets.reduce((acc, k) => ({ ...acc, [k]: data.reduce((s, r) => s + r[k], 0) }), {} as Record<string, number>);
    return { asOf: asOfDate.toISOString(), data, totals: { ...totals, total: data.reduce((s, r) => s + r.total, 0) } };
  }

  async reportApAging(asOf?: string) {
    const asOfDate = asOf ? new Date(asOf) : new Date();
    const rows = await this.prisma.apDocument.findMany({
      where: { deletedAt: null, status: "posted", type: { in: [...AP_INCREASE] }, balancePoisha: { gt: 0 } },
      include: { supplier: { select: { id: true, code: true, name: true } } },
    });
    const buckets = ["current", "1-30", "31-60", "61-90", "90+"] as const;
    const bySup = new Map<string, any>();
    for (const r of rows) {
      const b = this.ageBucket(r.dueDate || r.issueDate, asOfDate);
      const cur = bySup.get(r.supplierId) || {
        supplierId: r.supplierId,
        code: r.supplier.code,
        name: r.supplier.name,
        current: 0,
        "1-30": 0,
        "31-60": 0,
        "61-90": 0,
        "90+": 0,
        total: 0,
      };
      cur[b] += r.balancePoisha;
      cur.total += r.balancePoisha;
      bySup.set(r.supplierId, cur);
    }
    const data = [...bySup.values()].sort((a, b) => b.total - a.total);
    const totals = buckets.reduce((acc, k) => ({ ...acc, [k]: data.reduce((s, r) => s + r[k], 0) }), {} as Record<string, number>);
    return { asOf: asOfDate.toISOString(), data, totals: { ...totals, total: data.reduce((s, r) => s + r.total, 0) } };
  }

  async reportCustomerLedger(customerId: string) {
    if (!customerId) throw new BadRequestException("customerId required");
    const docs = await this.prisma.arDocument.findMany({
      where: { customerId, deletedAt: null, status: "posted" },
      orderBy: [{ issueDate: "asc" }, { docNo: "asc" }],
      include: { journal: { select: { journalNo: true } } },
    });
    let running = 0;
    const entries = docs.map((d) => {
      const debit = AR_INCREASE.has(d.type) ? d.totalPoisha : 0;
      const credit = AR_DECREASE.has(d.type) ? d.totalPoisha : 0;
      running += debit - credit;
      return {
        id: d.id,
        docNo: d.docNo,
        type: d.type,
        issueDate: d.issueDate,
        debitPoisha: debit,
        creditPoisha: credit,
        balancePoisha: running,
        journalNo: d.journal?.journalNo || null,
        memo: d.memo,
      };
    });
    return { customerId, entries, closingPoisha: running };
  }

  async reportSupplierLedger(supplierId: string) {
    if (!supplierId) throw new BadRequestException("supplierId required");
    const docs = await this.prisma.apDocument.findMany({
      where: { supplierId, deletedAt: null, status: "posted" },
      orderBy: [{ issueDate: "asc" }, { docNo: "asc" }],
      include: { journal: { select: { journalNo: true } } },
    });
    let running = 0;
    const entries = docs.map((d) => {
      const debit = AP_DECREASE.has(d.type) ? d.totalPoisha : 0;
      const credit = AP_INCREASE.has(d.type) ? d.totalPoisha : 0;
      running += credit - debit;
      return {
        id: d.id,
        docNo: d.docNo,
        type: d.type,
        issueDate: d.issueDate,
        debitPoisha: debit,
        creditPoisha: credit,
        balancePoisha: running,
        journalNo: d.journal?.journalNo || null,
        memo: d.memo,
      };
    });
    return { supplierId, entries, closingPoisha: running };
  }

  async reportOutstandingSummary() {
    const [ar, ap] = await Promise.all([this.reportArAging(), this.reportApAging()]);
    return {
      arOutstandingPoisha: ar.totals.total,
      apOutstandingPoisha: ap.totals.total,
      arCustomers: ar.data.length,
      apSuppliers: ap.data.length,
      arAging: ar.totals,
      apAging: ap.totals,
    };
  }
}
