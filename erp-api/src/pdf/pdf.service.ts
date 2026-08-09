import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { amountInWords } from "../util/amount-words";

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

/**
 * Money for PDFs. Uses the ISO code, never the "৳" sign: pdfkit's standard
 * Helvetica is WinAnsi-encoded and cannot represent U+09F3, which previously
 * rendered every amount as mojibake ("Ÿ3cBÃƒã"). Formatting only — the value is
 * unchanged.
 */
const fmtMoney = (minor?: number | null, currency = "BDT") =>
  `${currency} ${((minor ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (s?: string | Date | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");

// ---- V16 enterprise invoice design system ----
const LIGHT = "#e6e9ef";      // light gray borders
const SOFT = "#f7f8fa";       // card / zebra fill
const DARK = "#1f2937";       // dark gray body text
const PAGE = { left: 48, right: 547, width: 499, bottom: 742 }; // A4 @ 48pt margins

/** Semantic colour for a payment status (statuses come from the backend enum only). */
const statusColor = (s: string): string => {
  const v = (s || "").toLowerCase();
  if (v === "paid") return "#0f7b3e";                                  // green
  if (v === "partially_paid" || v === "partial") return "#b45309";     // orange
  if (v === "overdue" || v === "void" || v === "cancelled") return "#b42318"; // red
  if (v === "refunded") return "#6b7280";                              // neutral
  return NAVY;
};

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

  // ================= V16 enterprise invoice primitives =================
  // Presentation only. Every value passed in is already computed upstream.

  /** Invoice letterhead: logo + company block (left), large title (right). */
  private async invoiceHeader(doc: PDFKit.PDFDocument, title: string) {
    const top = 42;
    try {
      if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, PAGE.left, top, { fit: [52, 52] });
    } catch { /* logo optional */ }
    const x = PAGE.left + 62;
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(17).text(COMPANY.name, x, top + 1, { width: 300 });
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.2);
    doc.text(`Reg. No. ${COMPANY.regNo}`, x, top + 21, { width: 300 });
    doc.text(COMPANY.regAuthority, x, top + 30, { width: 300 });
    doc.text(COMPANY.address, x, top + 41, { width: 300 });
    doc.text(`${COMPANY.phone} · ${COMPANY.email}`, x, top + 50, { width: 300 });
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(28).text(title.toUpperCase(), PAGE.left, top + 12, {
      width: PAGE.width, align: "right",
    });
    doc.moveTo(PAGE.left, top + 66).lineTo(PAGE.right, top + 66).strokeColor(ACCENT).lineWidth(2).stroke();
    doc.y = top + 78;
  }

  /** Navy section heading bar used above each block. */
  private sectionBar(doc: PDFKit.PDFDocument, label: string, y?: number) {
    const yy = y ?? doc.y;
    doc.rect(PAGE.left, yy, PAGE.width, 15).fill(NAVY);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), PAGE.left + 7, yy + 4.2, {
      width: PAGE.width - 14, characterSpacing: 0.4,
    });
    doc.y = yy + 15;
  }

  /** Bordered card with an optional tinted background; returns its bottom edge. */
  private card(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill = true) {
    if (fill) doc.rect(x, y, w, h).fill(SOFT);
    doc.rect(x, y, w, h).strokeColor(LIGHT).lineWidth(0.8).stroke();
    return y + h;
  }

  /** Label/value line inside a card. */
  private cardLine(doc: PDFKit.PDFDocument, x: number, y: number, w: number, label: string, value: string, strong = false) {
    doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(label.toUpperCase(), x, y, { width: w });
    doc.fillColor(strong ? NAVY : DARK).font(strong ? "Helvetica-Bold" : "Helvetica").fontSize(8.6)
      .text(value || "—", x, y + 8.5, { width: w });
  }

  /**
   * Generic paginated table. Repeats the header row on every page and never
   * writes past the bottom margin. Row heights adapt to wrapped text.
   */
  private table(
    doc: PDFKit.PDFDocument,
    cols: { label: string; width: number; align?: "left" | "right" | "center" }[],
    rows: string[][],
    onNewPage?: () => void,
  ) {
    const drawHead = () => {
      const y = doc.y;
      doc.rect(PAGE.left, y, PAGE.width, 17).fill(NAVY);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7.4);
      let x = PAGE.left;
      cols.forEach((c) => {
        doc.text(c.label.toUpperCase(), x + 5, y + 5.5, { width: c.width - 10, align: c.align || "left", lineBreak: false });
        x += c.width;
      });
      doc.y = y + 17;
    };
    drawHead();
    doc.font("Helvetica").fontSize(8);
    rows.forEach((r, idx) => {
      // measure tallest cell so wrapped text never overlaps
      let hgt = 0;
      let x = PAGE.left;
      cols.forEach((c, i) => {
        const h = doc.heightOfString(r[i] ?? "—", { width: c.width - 10 });
        if (h > hgt) hgt = h;
        x += c.width;
      });
      const rowH = Math.max(hgt + 8, 18);
      // page break BEFORE drawing a row that would not fit
      if (doc.y + rowH > PAGE.bottom) {
        doc.addPage();
        doc.y = 56;
        onNewPage?.();
        drawHead();
        doc.font("Helvetica").fontSize(8);
      }
      const y = doc.y;
      if (idx % 2 === 1) doc.rect(PAGE.left, y, PAGE.width, rowH).fill(SOFT);
      x = PAGE.left;
      cols.forEach((c, i) => {
        doc.fillColor(DARK).font("Helvetica").fontSize(8)
          .text(r[i] ?? "—", x + 5, y + 4, { width: c.width - 10, align: c.align || "left" });
        x += c.width;
      });
      doc.moveTo(PAGE.left, y + rowH).lineTo(PAGE.right, y + rowH).strokeColor(LIGHT).lineWidth(0.5).stroke();
      doc.y = y + rowH;
    });
    // outer border
    doc.rect(PAGE.left, doc.y, PAGE.width, 0).strokeColor(LIGHT).lineWidth(0.5).stroke();
  }

  /** Ensure `need` points remain on the page; otherwise start a new one. */
  private ensure(doc: PDFKit.PDFDocument, need: number) {
    if (doc.y + need > PAGE.bottom) {
      doc.addPage();
      doc.y = 56;
    }
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
  /**
   * V16 — canonical enterprise invoice/quotation template. ONE renderer serves
   * every service vertical (visa, ticket, hotel, transport, tour, hajj, student,
   * manpower) and both individual and corporate customers; sections that have no
   * data are simply omitted. Purely presentational: every amount, status and
   * number is rendered exactly as supplied by the finance layer.
   */
  private renderInvoice(doc: PDFKit.PDFDocument, d: any) {
    const inv = d.invoice;
    const cur = inv.currency || "BDT";
    const isQ = !!d.isQuotation;
    const money = (v?: number | null) => fmtMoney(v, cur);
    return (async () => {
      const title = isQ ? "Quotation" : "Invoice";
      await this.invoiceHeader(doc, title);

      // ---------- INVOICE TO + META (two cards side by side) ----------
      const gap = 12;
      const leftW = Math.round((PAGE.width - gap) * 0.56);
      const rightW = PAGE.width - gap - leftW;
      const rightX = PAGE.left + leftW + gap;
      const cardTop = doc.y;

      const toLines: [string, string][] = [];
      if (d.customerName) toLines.push(["Name", d.customerName]);
      if (d.customerCode) toLines.push(["Customer Code", d.customerCode]);
      if (d.customerType === "corporate" && d.companyName) toLines.push(["Company", d.companyName]);
      if (d.customerAddress) toLines.push(["Address", d.customerAddress]);
      if (d.customerEmail) toLines.push(["Email", d.customerEmail]);
      if (d.customerMobile) toLines.push(["Mobile", d.customerMobile]);
      if (!toLines.length) toLines.push(["Name", "—"]);

      const metaLines: [string, string][] = [
        [isQ ? "Quotation Date" : "Invoice Date", fmtDate(inv.issuedAt || inv.createdAt)],
        [isQ ? "Quotation No" : "Invoice No", inv.invoiceNo],
        ["Sales Date", fmtDate(d.salesDate || inv.createdAt)],
        ["Sales By", d.salesBy || "—"],
      ];
      if (d.bookingNo) metaLines.push(["Booking No", d.bookingNo]);
      if (!isQ && inv.dueAt) metaLines.push(["Due Date", fmtDate(inv.dueAt)]);

      // measure card height from the taller column (address may wrap)
      let toH = 22;
      doc.font("Helvetica").fontSize(8.6);
      toLines.forEach(([, v]) => { toH += Math.max(doc.heightOfString(v, { width: leftW - 20 }), 9) + 11; });
      const metaH = 22 + metaLines.length * 20;
      const cardH = Math.max(toH, metaH);

      this.sectionBar(doc, isQ ? "Quotation To" : "Invoice To", cardTop);
      const bodyTop = doc.y;
      this.card(doc, PAGE.left, bodyTop, leftW, cardH);
      let ly = bodyTop + 9;
      toLines.forEach(([k, v]) => {
        this.cardLine(doc, PAGE.left + 10, ly, leftW - 20, k, v, k === "Name");
        ly += Math.max(doc.heightOfString(v, { width: leftW - 20 }), 9) + 11;
      });
      // meta card (own heading, aligned to the same band)
      doc.rect(rightX, cardTop, rightW, 15).fill(NAVY);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8).text("DETAILS", rightX + 7, cardTop + 4.2, { width: rightW - 14 });
      this.card(doc, rightX, bodyTop, rightW, cardH);
      let my = bodyTop + 9;
      metaLines.forEach(([k, v]) => { this.cardLine(doc, rightX + 10, my, rightW - 20, k, v, k.includes("No")); my += 20; });
      doc.y = bodyTop + cardH + 14;

      // ---------- PASSPORT INFO (omitted when no traveller data) ----------
      const travellers: any[] = Array.isArray(d.travellers) ? d.travellers : [];
      const hasPax = travellers.some((t) => t && (t.passportNo || t.dob || t.issueDate || t.expiryDate));
      if (hasPax) {
        this.ensure(doc, 70);
        this.sectionBar(doc, "Passport Information");
        this.table(
          doc,
          [
            { label: "SL", width: 22, align: "center" },
            { label: "Name", width: 102 },
            { label: "Passport No", width: 68 },
            { label: "Nationality", width: 64 },
            { label: "Mobile", width: 71 },
            { label: "DOB", width: 58, align: "center" },
            { label: "Issue", width: 57, align: "center" },
            { label: "Expiry", width: 57, align: "center" },
          ],
          travellers.map((t, i) => [
            String(i + 1), t?.name || "—", t?.passportNo || "—", t?.nationality || "—",
            t?.mobile || "—", fmtDate(t?.dob), fmtDate(t?.issueDate), fmtDate(t?.expiryDate),
          ]),
          () => this.sectionBar(doc, "Passport Information (continued)"),
        );
        doc.y += 14;
      }

      // ---------- BILLING INFO ----------
      this.ensure(doc, 70);
      this.sectionBar(doc, "Billing Information");
      const items: any[] = inv.items?.length ? inv.items : [];
      this.table(
        doc,
        [
          { label: "SL", width: 22, align: "center" },
          { label: "Product", width: 140 },
          { label: "Country", width: 58 },
          { label: "Category", width: 56 },
          { label: "Type", width: 45 },
          { label: "Qty", width: 26, align: "right" },
          { label: "Unit Price", width: 76, align: "right" },
          { label: "Sub Total", width: 76, align: "right" },
        ],
        (items.length ? items : [{ description: "—", quantity: 0, unitPrice: 0, amount: 0 }]).map((it, i) => [
          String(i + 1),
          it.description || "—",
          d.country || d.nationality || "—",
          d.serviceType ? String(d.serviceType).replace(/_/g, " ") : "—",
          d.serviceCategory || (d.bookingNo ? "Booking" : "Service"),
          String(it.quantity ?? 0),
          money(it.unitPrice),
          money(it.amount),
        ]),
        () => this.sectionBar(doc, "Billing Information (continued)"),
      );
      doc.y += 14;

      // ---------- FINANCIAL SUMMARY + AMOUNT IN WORDS ----------
      this.ensure(doc, 132);
      const sumW = 236;
      const sumX = PAGE.right - sumW;
      const rows: [string, string, boolean?][] = [
        ["Sub Total", money(inv.subtotal)],
        ["Discount", money(inv.discount)],
      ];
      if (inv.tax) rows.push(["Tax", money(inv.tax)]);
      rows.push(["Net Total", money(inv.total), true]);
      if (!isQ) {
        rows.push(["Payment", money(inv.paid)]);
        rows.push(["Due", money(inv.due), true]);
      }
      const sumTop = doc.y;
      const sumH = rows.length * 17 + 34;
      this.card(doc, sumX, sumTop, sumW, sumH, false);
      let sy = sumTop + 9;
      rows.forEach(([label, value, strong]) => {
        if (strong) doc.rect(sumX + 1, sy - 4, sumW - 2, 20).fill(label === "Net Total" ? "#eef1f6" : "#ffffff");
        doc.font(strong ? "Helvetica-Bold" : "Helvetica").fontSize(strong ? 10 : 8.6);
        doc.fillColor(strong ? NAVY : MUTED).text(label, sumX + 10, sy, { width: sumW / 2 - 12 });
        doc.fillColor(strong ? (label === "Due" ? statusColor(inv.status) : NAVY) : DARK)
          .text(value, sumX + sumW / 2, sy, { width: sumW / 2 - 10, align: "right" });
        sy += strong ? 20 : 17;
      });
      // payment status pill
      const st = String(inv.status || "").toUpperCase().replace(/_/g, " ");
      const pillW = Math.max(doc.widthOfString(st) + 18, 62);
      doc.roundedRect(sumX + sumW - pillW - 10, sy - 2, pillW, 15, 3).fill(statusColor(inv.status));
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7.6)
        .text(st, sumX + sumW - pillW - 10, sy + 2.2, { width: pillW, align: "center" });
      doc.fillColor(MUTED).font("Helvetica").fontSize(7).text("PAYMENT STATUS", sumX + 10, sy + 3);

      // amount in words (left of the summary card)
      doc.fillColor(MUTED).font("Helvetica").fontSize(7).text("NET TOTAL IN WORD", PAGE.left, sumTop + 6, { width: sumX - PAGE.left - 14 });
      // "Taka …" already names BDT; other currencies are named by their ISO code.
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(9)
        .text(amountInWords(inv.total, cur === "BDT" ? "Taka" : cur), PAGE.left, sumTop + 17, { width: sumX - PAGE.left - 14 });
      doc.y = Math.max(sumTop + sumH, sy + 22) + 12;

      // ---------- NOTE (hidden entirely when empty) ----------
      if (d.note && String(d.note).trim()) {
        const txt = String(d.note).trim();
        doc.font("Helvetica").fontSize(8.4);
        const noteH = doc.heightOfString(txt, { width: PAGE.width - 20 }) + 26;
        this.ensure(doc, noteH + 10);
        const ny = doc.y;
        this.card(doc, PAGE.left, ny, PAGE.width, noteH);
        doc.rect(PAGE.left, ny, 3, noteH).fill(ACCENT);
        doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7).text("NOTE", PAGE.left + 12, ny + 7);
        doc.fillColor(DARK).font("Helvetica").fontSize(8.4).text(txt, PAGE.left + 12, ny + 17, { width: PAGE.width - 24 });
        doc.y = ny + noteH + 12;
      }

      // ---------- QR VERIFICATION + SIGNATURE ----------
      this.ensure(doc, 96);
      const qy = doc.y;
      const url = this.verifyUrl(inv.invoiceNo);
      try {
        // margin:2 keeps the required quiet zone; 320px source keeps it crisp at 72dpi
        const png = await QRCode.toBuffer(url, { margin: 2, width: 320, errorCorrectionLevel: "M" });
        doc.image(png, PAGE.left, qy, { fit: [76, 76] });
      } catch { /* qr optional */ }
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(8.4).text("Verify this document", PAGE.left + 86, qy + 6);
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10).text(inv.invoiceNo, PAGE.left + 86, qy + 19);
      doc.fillColor(MUTED).font("Helvetica").fontSize(6.8).text(url, PAGE.left + 86, qy + 34, { width: 230 });
      // signature block (right)
      doc.strokeColor("#c9d0dd").lineWidth(0.8).moveTo(PAGE.right - 150, qy + 54).lineTo(PAGE.right, qy + 54).stroke();
      doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(7.6)
        .text("Authorised Signature", PAGE.right - 150, qy + 59, { width: 150, align: "center" });
      if (d.salesBy) {
        doc.fillColor(MUTED).font("Helvetica").fontSize(7)
          .text(d.salesBy, PAGE.right - 150, qy + 69, { width: 150, align: "center" });
      }
      doc.y = qy + 88;

      this.footer(
        doc,
        isQ
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
