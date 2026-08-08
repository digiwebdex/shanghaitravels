import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/**
 * V5 Phase 4 — reusable commercial PDF engine (pdfkit). One renderer, one template
 * registry, one generator for every printable document (invoice, receipt, quotation,
 * booking confirmation, vouchers, statements). Documents are added by registering a
 * builder — no rewrite of the engine.
 *
 * Roles named in the spec map here as:
 *  - PdfService        = this injectable (render pipeline + helpers)
 *  - PdfTemplateEngine = the private layout helpers (brandHeader/kvGrid/itemsTable/…)
 *  - DocumentRenderer  = each `renderX(doc, data)` builder
 *  - TemplateRegistry  = RENDERERS map
 *  - DocumentGenerator = generate(type, data)
 */

const COMPANY = {
  name: "Shanghai Travels",
  address: "Vatara, Dhaka-1212, Bangladesh",
  regNo: "0017053",
  regAuthority: "Ministry of Civil Aviation & Tourism, Bangladesh",
  phone: "+880 1333-356393",
  phone2: "+880 1742-255003",
  email: "info@shanghaitravels.com.bd",
  site: "shanghaitravels.com.bd",
};
const NAVY = "#14213D";
const ACCENT = "#F97316";
const MUTED = "#5c6b7a";
const LOGO_PATH = process.env.INVOICE_LOGO_PATH || "/var/www/ShanghaiTravels/assets/logo-BFtk4tFh.png";
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || "https://shanghaitravels.com.bd";

const fmtMoney = (minor?: number | null, currency = "BDT") =>
  `${currency === "BDT" ? "৳" : currency + " "}${((minor ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const fmtDate = (s?: string | Date | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");

export type PdfDocType = "invoice" | "receipt" | "quotation" | "statement" | "agent";

@Injectable()
export class PdfService {
  /** Verification URL a QR points to; also the human-viewable public verify page. */
  verifyUrl(no: string) {
    return `${PUBLIC_BASE}/erp/#/verify/${encodeURIComponent(no)}`;
  }

  private render(build: (doc: PDFKit.PDFDocument) => void | Promise<void>): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: COMPANY.name } });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      Promise.resolve(build(doc))
        .then(() => doc.end())
        .catch(reject);
    });
  }

  // ---- PdfTemplateEngine helpers (shared by every document) ----
  private async brandHeader(doc: PDFKit.PDFDocument, title: string) {
    const top = 48;
    try {
      if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, 48, top, { fit: [46, 46] });
    } catch {
      /* logo optional */
    }
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(18).text(COMPANY.name, 104, top + 2);
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(`Reg. No. ${COMPANY.regNo} · ${COMPANY.regAuthority}`, 104, top + 24);
    doc.text(`${COMPANY.address} · ${COMPANY.phone} · ${COMPANY.email}`, 104, top + 34);
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(20).text(title.toUpperCase(), 48, top, { align: "right" });
    doc.moveTo(48, top + 56).lineTo(547, top + 56).strokeColor(ACCENT).lineWidth(1.5).stroke();
    doc.moveDown(2);
    doc.y = top + 70;
  }

  private kvGrid(doc: PDFKit.PDFDocument, pairs: [string, string][]) {
    const colW = 249;
    const startY = doc.y;
    pairs.forEach(([k, v], i) => {
      const x = 48 + (i % 2) * colW;
      const y = startY + Math.floor(i / 2) * 16;
      doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(k.toUpperCase(), x, y, { width: 90, continued: false });
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text(v || "—", x + 92, y, { width: colW - 96 });
    });
    doc.y = startY + Math.ceil(pairs.length / 2) * 16 + 8;
  }

  private itemsTable(doc: PDFKit.PDFDocument, items: { description: string; quantity: number; unitPrice: number; amount: number }[], currency: string) {
    const y0 = doc.y + 4;
    doc.rect(48, y0, 499, 18).fill(NAVY);
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(8.5);
    doc.text("DESCRIPTION", 54, y0 + 5, { width: 250 });
    doc.text("QTY", 310, y0 + 5, { width: 40, align: "right" });
    doc.text("UNIT", 360, y0 + 5, { width: 80, align: "right" });
    doc.text("AMOUNT", 450, y0 + 5, { width: 90, align: "right" });
    let y = y0 + 22;
    doc.font("Helvetica").fontSize(9);
    for (const it of items.length ? items : [{ description: "—", quantity: 0, unitPrice: 0, amount: 0 }]) {
      doc.fillColor(NAVY).text(it.description, 54, y, { width: 250 });
      doc.text(String(it.quantity), 310, y, { width: 40, align: "right" });
      doc.text(fmtMoney(it.unitPrice, currency), 360, y, { width: 80, align: "right" });
      doc.text(fmtMoney(it.amount, currency), 450, y, { width: 90, align: "right" });
      y += 16;
      doc.moveTo(48, y - 3).lineTo(547, y - 3).strokeColor("#e6e9ef").lineWidth(0.5).stroke();
    }
    doc.y = y + 4;
  }

  private totals(doc: PDFKit.PDFDocument, rows: [string, string, boolean?][]) {
    const startY = doc.y;
    rows.forEach(([label, value, strong], i) => {
      const y = startY + i * 15;
      doc.font(strong ? "Helvetica-Bold" : "Helvetica").fontSize(strong ? 10.5 : 9);
      doc.fillColor(strong ? ACCENT : MUTED).text(label, 360, y, { width: 90, align: "right" });
      doc.fillColor(strong ? ACCENT : NAVY).text(value, 450, y, { width: 90, align: "right" });
    });
    doc.y = startY + rows.length * 15 + 6;
  }

  private async qrVerify(doc: PDFKit.PDFDocument, no: string) {
    const url = this.verifyUrl(no);
    const y = Math.max(doc.y + 10, 660);
    try {
      const png = await QRCode.toBuffer(url, { margin: 1, width: 120 });
      doc.image(png, 48, y, { fit: [70, 70] });
    } catch {
      /* qr optional */
    }
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text("Verify this document", 124, y + 4);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9).text(no, 124, y + 15);
    doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(url, 124, y + 28, { width: 260 });
    // signature area (right)
    doc.strokeColor("#c9d0dd").lineWidth(0.7).moveTo(430, y + 46).lineTo(547, y + 46).stroke();
    doc.fillColor(MUTED).fontSize(7.5).text("Authorised signature", 430, y + 50, { width: 117, align: "center" });
    doc.y = y + 80;
  }

  private footer(doc: PDFKit.PDFDocument, terms: string) {
    doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(terms, 48, 760, { width: 499, align: "center" });
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(7.5).text(`${COMPANY.name} · ${COMPANY.site}`, 48, 776, { width: 499, align: "center" });
  }

  // ---- DocumentRenderers ----
  private renderInvoice(doc: PDFKit.PDFDocument, d: any) {
    const inv = d.invoice;
    const cur = inv.currency || "BDT";
    return (async () => {
      await this.brandHeader(doc, d.isQuotation ? "Quotation" : "Invoice");
      this.kvGrid(doc, [
        [d.isQuotation ? "Quotation No" : "Invoice No", inv.invoiceNo],
        ["Status", String(inv.status || "").toUpperCase()],
        ["Booking No", d.bookingNo || "—"],
        ["Reference", d.bookingNo || inv.invoiceNo],
        ["Customer", d.customerName || "—"],
        ["Passport", d.passportNo || "—"],
        ["Nationality", d.nationality || "—"],
        ["Service", d.serviceType || "—"],
        ["Agent", d.agentName || "—"],
        ["Booking Date", fmtDate(d.bookingDate)],
        ["Issue Date", fmtDate(inv.issuedAt || inv.createdAt)],
        ["Due Date", fmtDate(inv.dueAt)],
      ]);
      this.itemsTable(doc, inv.items || [], cur);
      this.totals(doc, [
        ["Subtotal", fmtMoney(inv.subtotal, cur)],
        ["Discount", fmtMoney(inv.discount, cur)],
        ["Tax", fmtMoney(inv.tax, cur)],
        ["Total", fmtMoney(inv.total, cur), true],
        ...(d.isQuotation ? [] : ([["Paid", fmtMoney(inv.paid, cur)], ["Due", fmtMoney(inv.due, cur), true]] as [string, string, boolean?][])),
      ]);
      await this.qrVerify(doc, inv.invoiceNo);
      this.footer(
        doc,
        d.isQuotation
          ? "This quotation is valid subject to availability. Prices may change until confirmed."
          : "Payment due by the date shown. This is a computer-generated invoice.",
      );
    })();
  }

  private renderReceipt(doc: PDFKit.PDFDocument, d: any) {
    const p = d.payment;
    const cur = d.currency || "BDT";
    return (async () => {
      await this.brandHeader(doc, "Money Receipt");
      this.kvGrid(doc, [
        ["Receipt No", d.receiptNo],
        ["Date", fmtDate(p.receivedAt)],
        ["Invoice Ref", d.invoiceNo || "—"],
        ["Booking No", d.bookingNo || "—"],
        ["Customer", d.customerName || "—"],
        ["Method", String(p.method || "").toUpperCase()],
        ["Reference", p.reference || "—"],
        ["Cashier", d.cashier || "—"],
      ]);
      doc.moveDown(0.5);
      this.totals(doc, [
        ["Received", fmtMoney(p.amount, cur), true],
        ["Invoice Total", fmtMoney(d.invoiceTotal, cur)],
        ["Outstanding", fmtMoney(d.outstanding, cur), true],
      ]);
      await this.qrVerify(doc, d.invoiceNo || d.receiptNo);
      this.footer(doc, "Received with thanks. This receipt confirms the payment above.");
    })();
  }

  private renderStatement(doc: PDFKit.PDFDocument, d: any) {
    const cur = d.currency || "BDT";
    return (async () => {
      await this.brandHeader(doc, `${d.partyType || "Customer"} Statement`);
      this.kvGrid(doc, [
        ["Statement No", d.statementNo],
        ["Date", fmtDate(new Date())],
        ["Account", d.partyName || "—"],
        ["Period", d.period || "—"],
      ]);
      // running-balance rows reuse the items table shape
      this.itemsTable(
        doc,
        (d.lines || []).map((l: any) => ({ description: l.label, quantity: 1, unitPrice: l.amount, amount: l.balance })),
        cur,
      );
      this.totals(doc, [["Closing Balance", fmtMoney(d.closingBalance, cur), true]]);
      await this.qrVerify(doc, d.statementNo);
      this.footer(doc, "Statement of account. Contact us for any discrepancy.");
    })();
  }

  /** Agent onboarding profile — reuses the branded header + key/value grid engine. */
  private renderAgent(doc: PDFKit.PDFDocument, d: any) {
    return (async () => {
      await this.brandHeader(doc, `Agent Profile — ${d.code || ""}`);
      this.kvGrid(doc, [
        ["Agent", d.name || "—"],
        ["Owner / Proprietor", d.ownerName || "—"],
        ["Company", d.companyName || "—"],
        ["Contact Person", d.contactPerson || "—"],
        ["Phone", d.phone || "—"],
        ["Email", d.email || "—"],
        ["Status", d.status || "—"],
        ["Tier", d.tier || "—"],
        ["Trade License", d.tradeLicenseNo || "—"],
        ["National ID", d.nationalId || "—"],
        ["Passport", d.passportNo || "—"],
        ["Business Type", d.businessType || "—"],
        ["Commission", d.commission || "—"],
        ["Wallet Balance", d.wallet || "—"],
        ["City", d.city || "—"],
        ["Country", d.country || "—"],
        ["Bank", d.bank || "—"],
        ["Mobile Banking", d.mobile || "—"],
        ["KYC", d.kycStatus || "—"],
        ["Emergency Contact", d.emergency || "—"],
      ]);
      this.footer(doc, "Agent onboarding profile. Generated from the live ERP.");
    })();
  }

  // ---- TemplateRegistry ----
  private RENDERERS: Record<PdfDocType, (doc: PDFKit.PDFDocument, data: any) => void | Promise<void>> = {
    invoice: (doc, data) => this.renderInvoice(doc, data),
    quotation: (doc, data) => this.renderInvoice(doc, { ...data, isQuotation: true }),
    receipt: (doc, data) => this.renderReceipt(doc, data),
    statement: (doc, data) => this.renderStatement(doc, data),
    agent: (doc, data) => this.renderAgent(doc, data),
  };

  // ---- DocumentGenerator ----
  generate(type: PdfDocType, data: any): Promise<Buffer> {
    const renderer = this.RENDERERS[type];
    if (!renderer) throw new Error(`No PDF renderer for '${type}'`);
    return this.render((doc) => renderer(doc, data));
  }
}
