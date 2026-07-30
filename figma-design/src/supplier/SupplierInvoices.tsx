import { useState } from "react";
import { Download, AlertCircle } from "lucide-react";
import { INVOICES, InvoiceStatus, INV_STATUS, fmtAED } from "./data";

const TABS: { key: InvoiceStatus | "all"; label: string }[] = [
  { key: "all",     label: "All"     },
  { key: "unpaid",  label: "Unpaid"  },
  { key: "overdue", label: "Overdue" },
  { key: "paid",    label: "Paid"    },
];

const th = "px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]";

export default function SupplierInvoices() {
  const [tab, setTab] = useState<InvoiceStatus | "all">("all");

  const rows = tab === "all" ? INVOICES : INVOICES.filter(i => i.status === tab);

  const totalUnpaid  = INVOICES.filter(i => i.status === "unpaid").reduce((s, i) => s + i.total, 0);
  const totalOverdue = INVOICES.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0);
  const totalPaid    = INVOICES.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">Invoices</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">{INVOICES.length} invoices issued</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          <Download size={13} /> Export All
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Awaiting Payment", value: fmtAED(totalUnpaid),  count: INVOICES.filter(i => i.status === "unpaid").length,  color: "text-blue-600" },
          { label: "Overdue",          value: fmtAED(totalOverdue), count: INVOICES.filter(i => i.status === "overdue").length, color: "text-red-600"  },
          { label: "Received",         value: fmtAED(totalPaid),    count: INVOICES.filter(i => i.status === "paid").length,    color: "text-emerald-600" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-2">{c.label}</p>
            <p className={`text-[22px] font-bold font-mono leading-none mb-1 ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-slate-400">{c.count} invoice{c.count !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {totalOverdue > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-700">
            {fmtAED(totalOverdue)} is overdue. Contact your account manager to follow up with the agent.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5">
        {TABS.map(t => {
          const count = t.key === "all" ? INVOICES.length : INVOICES.filter(i => i.status === t.key).length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                ${tab === t.key ? "bg-[#18181B] text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {t.label}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Invoice No","Agent","Service / Booking","Issued","Due Date","Amount","VAT","Total","Status",""].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(inv => {
                const st = INV_STATUS[inv.status];
                return (
                  <tr key={inv.id} className={`hover:bg-slate-50/50 transition-colors ${inv.status === "overdue" ? "bg-red-50/20" : ""}`}>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-700 font-semibold whitespace-nowrap">{inv.number}</td>
                    <td className="px-5 py-4 text-[12px] text-slate-700">{inv.agentName}</td>
                    <td className="px-5 py-4">
                      <p className="text-[12px] text-slate-700">{inv.serviceName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{inv.bookingRef}</p>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-slate-400 whitespace-nowrap">{inv.issuedDate}</td>
                    <td className="px-5 py-4 text-[11px] text-slate-400 whitespace-nowrap">{inv.dueDate}</td>
                    <td className="px-5 py-4 text-[12px] font-mono font-semibold text-slate-800">{fmtAED(inv.amount)}</td>
                    <td className="px-5 py-4 text-[11px] font-mono text-slate-500">{fmtAED(inv.vat)}</td>
                    <td className="px-5 py-4 text-[13px] font-bold font-mono text-slate-800">{fmtAED(inv.total)}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap">
                        <Download size={11} /> PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
