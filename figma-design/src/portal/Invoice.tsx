import { useParams, Link } from "react-router";
import { Download, Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import { MOCK_APPLICATIONS } from "./data";
import { CORPORATE_OFFICE, EMAIL, HOTLINE } from "../company";

export default function Invoice() {
  const { id } = useParams();
  const app = MOCK_APPLICATIONS.find(a => a.id === id) ?? MOCK_APPLICATIONS[0];

  const invoiceNum = `INV-${app.ref.replace("TRV-", "")}`;
  const issueDate = "02 Jan 2025";

  const lineItems = [
    { desc: `${app.service} — Government Fee`, qty: app.travellers, unit: "AED 320", total: `AED ${320 * app.travellers}` },
    { desc: "TravelOS Service & Consultation Fee", qty: 1, unit: "AED 300", total: "AED 300" },
    { desc: "Document Handling & Courier", qty: 1, unit: "AED 80", total: "AED 80" },
  ];

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <Link to={`/portal/track/${app.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Application
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"><Printer size={13} /> Print</button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"><Download size={13} /> Download PDF</button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden" id="invoice-print">
        {/* Header strip */}
        <div className="bg-primary px-10 py-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="size-9 rounded-lg bg-accent flex items-center justify-center"><span className="text-white font-black">T</span></div>
              <div><p className="text-white font-bold">TravelOS</p><p className="text-white/40 text-[10px]">Shanghai Travels LLC</p></div>
            </div>
            <p className="text-white/50 text-xs">{CORPORATE_OFFICE.street}</p>
            <p className="text-white/50 text-xs">{CORPORATE_OFFICE.area}</p>
            <p className="text-white/50 text-xs mt-1">{HOTLINE} · {EMAIL}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Tax Invoice</p>
            <p className="text-white text-2xl font-bold">{invoiceNum}</p>
            <p className="text-white/60 text-xs mt-2">Issue Date: {issueDate}</p>
            <p className="text-white/60 text-xs">Due Date: {issueDate}</p>
            {app.feePaid && (
              <div className="flex items-center justify-end gap-1.5 mt-3">
                <CheckCircle2 size={13} className="text-green-400" />
                <span className="text-green-400 text-xs font-bold">PAID</span>
              </div>
            )}
          </div>
        </div>

        {/* Billed to */}
        <div className="px-10 py-7 grid grid-cols-2 gap-8 border-b border-border">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Billed To</p>
            <p className="text-foreground font-bold">Ahmad Al-Rashidi</p>
            <p className="text-sm text-muted-foreground">ahmad@example.com</p>
            <p className="text-sm text-muted-foreground">+971 50 000 0000</p>
            <p className="text-sm text-muted-foreground mt-1">Dubai, UAE</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Application Details</p>
            <div className="space-y-1 text-sm">
              {[
                ["Reference",   app.ref],
                ["Service",     app.service],
                ["Destination", app.destination],
                ["Travel Date", app.travelDate],
                ["Travellers",  `${app.travellers} adult(s)`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-muted-foreground min-w-[90px]">{k}</span>
                  <span className="font-medium text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="px-10 py-7">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-3">Description</th>
                <th className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-3">Qty</th>
                <th className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-3">Unit Price</th>
                <th className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-4 text-sm text-foreground">{item.desc}</td>
                  <td className="py-4 text-sm text-center text-muted-foreground">{item.qty}</td>
                  <td className="py-4 text-sm text-right text-muted-foreground font-mono">{item.unit}</td>
                  <td className="py-4 text-sm text-right text-foreground font-bold font-mono">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-5">
            <div className="w-64 space-y-2">
              {[["Subtotal", "AED 1,020"], ["VAT (5%)", "AED 0"], ["Discount", "— AED 0"]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium text-foreground">{v}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-border pt-2">
                <span className="text-foreground">Total</span>
                <span className="text-xl text-foreground font-mono">AED 1,020</span>
              </div>
              {app.feePaid && (
                <div className="flex justify-between text-green-600 font-semibold text-sm">
                  <span>Amount Paid</span><span className="font-mono">— AED 1,020</span>
                </div>
              )}
              {app.feePaid && (
                <div className="flex justify-between font-bold text-sm text-muted-foreground">
                  <span>Balance Due</span><span className="font-mono">AED 0</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-muted border-t border-border">
          <div className="grid grid-cols-2 gap-8 text-xs text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground mb-1">Payment Terms</p>
              <p>Due on receipt. Bank transfer or card accepted. Late payments may delay application processing.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Company Details</p>
              <p>Shanghai Travels LLC · Trade License: DED-123456 · IATA Code: 97-2-1234 · TRN: 100123456789003</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
