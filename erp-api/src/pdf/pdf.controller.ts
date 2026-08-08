import { Controller, Get, NotFoundException, Param, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { PrismaService } from "../prisma.service";
import { AuthedUser, CurrentUser, Permissions } from "../rbac";
import { PdfService, type PdfDocType } from "./pdf.service";

const HQ = (u: AuthedUser) => u.role === "super_admin" || u.role === "general_manager";
const paidOf = (payments: { kind: string; amount: number }[]) =>
  payments.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);

@Controller()
export class PdfController {
  constructor(private prisma: PrismaService, private pdf: PdfService) {}

  private async audit(user: AuthedUser, action: string, entityType: string, entityId: string) {
    try {
      await this.prisma.auditLog.create({ data: { userId: user.id, action, entityType, entityId } });
    } catch {
      /* audit best-effort */
    }
  }

  private send(res: Response, buf: Buffer, filename: string, download?: boolean) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${download ? "attachment" : "inline"}; filename="${filename}"`);
    res.send(buf);
  }

  private async invoiceData(id: string, user: AuthedUser) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        payments: { where: { deletedAt: null } },
        customer: { include: { passports: true } },
        application: true,
      },
    });
    if (!inv || (!HQ(user) && inv.branchId !== user.branchId)) throw new NotFoundException("Invoice not found");
    const paid = paidOf(inv.payments);
    let agentName: string | undefined;
    const agentId = (inv.application as { agentId?: string | null } | null)?.agentId;
    if (agentId) {
      const ag = await this.prisma.agent.findUnique({ where: { id: agentId }, select: { name: true, code: true } });
      if (ag) agentName = `${ag.name} · ${ag.code}`;
    }
    return {
      invoice: { ...inv, paid, due: inv.total - paid },
      bookingNo: inv.application?.referenceNo,
      customerName: inv.customer?.fullName,
      passportNo: inv.customer?.passports?.[0]?.passportNo,
      nationality: inv.customer?.nationality || inv.customer?.passports?.[0]?.issuingCountry,
      serviceType: inv.application?.serviceType,
      agentName,
      bookingDate: inv.application?.createdAt,
    };
  }

  @Get("agents/:id/pdf")
  @Permissions("commission:read")
  async agentPdf(@Param("id") id: string, @Query("download") dl: string, @CurrentUser() u: AuthedUser, @Res() res: Response) {
    const a = await this.prisma.agent.findUnique({ where: { id }, include: { tier: true } });
    if (!a) throw new NotFoundException("Agent not found");
    const money = (m?: number | null) => `৳${((m ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    const data = {
      code: a.code,
      name: a.name,
      ownerName: a.ownerName,
      companyName: a.companyName,
      contactPerson: a.contactPerson,
      phone: a.phone,
      email: a.email,
      status: (a.status || "").toUpperCase(),
      tier: a.tier?.name,
      tradeLicenseNo: a.tradeLicenseNo,
      nationalId: a.nationalId,
      passportNo: a.passportNo,
      businessType: a.businessType,
      commission: `${(a.commissionRateBps / 100).toFixed(2)}%`,
      wallet: money(a.walletBalance),
      city: [a.city, a.district].filter(Boolean).join(", "),
      country: a.country,
      bank: [a.bankName, a.bankBranch, a.bankAccountNumber].filter(Boolean).join(" / "),
      mobile: [a.bkash && `bKash ${a.bkash}`, a.nagad && `Nagad ${a.nagad}`, a.rocket && `Rocket ${a.rocket}`]
        .filter(Boolean)
        .join(" · "),
      kycStatus: (a.kycStatus || "").toUpperCase(),
      emergency: [a.emergencyName, a.emergencyPhone].filter(Boolean).join(" — "),
    };
    const buf = await this.pdf.generate("agent", data);
    await this.audit(u, "agent.pdf", "Agent", id);
    this.send(res, buf, `${a.code}.pdf`, dl === "1");
  }

  @Get("invoices/:id/pdf")
  @Permissions("invoice:amount:read")
  async invoicePdf(@Param("id") id: string, @Query("download") dl: string, @CurrentUser() u: AuthedUser, @Res() res: Response) {
    const data = await this.invoiceData(id, u);
    const buf = await this.pdf.generate("invoice", data);
    await this.audit(u, "invoice.pdf", "Invoice", id);
    this.send(res, buf, `${data.invoice.invoiceNo}.pdf`, dl === "1");
  }

  @Get("invoices/:id/quotation")
  @Permissions("invoice:amount:read")
  async quotationPdf(@Param("id") id: string, @Query("download") dl: string, @CurrentUser() u: AuthedUser, @Res() res: Response) {
    const data = await this.invoiceData(id, u);
    const buf = await this.pdf.generate("quotation", data);
    await this.audit(u, "quotation.pdf", "Invoice", id);
    this.send(res, buf, `${data.invoice.invoiceNo}-quotation.pdf`, dl === "1");
  }

  @Get("payments/:id/receipt")
  @Permissions("invoice:amount:read")
  async receiptPdf(@Param("id") id: string, @Query("download") dl: string, @CurrentUser() u: AuthedUser, @Res() res: Response) {
    const p = await this.prisma.payment.findFirst({
      where: { id, deletedAt: null },
      include: { invoice: { include: { payments: { where: { deletedAt: null } }, customer: true, application: true } }, customer: true },
    });
    if (!p || (!HQ(u) && p.invoice && p.invoice.branchId !== u.branchId)) throw new NotFoundException("Payment not found");
    const cashier = await this.prisma.user.findUnique({ where: { id: p.recordedBy }, select: { fullName: true } });
    const invPaid = p.invoice ? paidOf(p.invoice.payments) : 0;
    const receiptNo = `RCPT-${p.id.slice(0, 8).toUpperCase()}`;
    const data = {
      payment: p,
      receiptNo,
      invoiceNo: p.invoice?.invoiceNo,
      bookingNo: p.invoice?.application?.referenceNo,
      customerName: p.customer?.fullName || p.invoice?.customer?.fullName,
      cashier: cashier?.fullName,
      invoiceTotal: p.invoice?.total,
      outstanding: p.invoice ? p.invoice.total - invPaid : 0,
      currency: p.invoice?.currency || "BDT",
    };
    const buf = await this.pdf.generate("receipt", data);
    await this.audit(u, "receipt.pdf", "Payment", id);
    this.send(res, buf, `${receiptNo}.pdf`, dl === "1");
  }
}
