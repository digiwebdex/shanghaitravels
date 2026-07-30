import { useState } from "react";
import { Download, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { AGENT_INVOICES, WALLET_TXS, AgentInvoice, fmtAED } from "./data";

const INV_CFG: Record<AgentInvoice["status"], { label: string; color: string; bg: string; icon: any }> = {
  paid:    { label: "Paid",     color: "text-emerald-700", bg: "bg-emerald-100", icon: CheckCircle2 },
  unpaid:  { label: "Unpaid",   color: "text-blue-700",    bg: "bg-blue-100",    icon: Clock },
  overdue: { label: "Overdue",  color: "text-red-700",     bg: "bg-red-100",     icon: AlertCircle },
};

const th = "px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]";

export default function AgentLedger() {
  const [tab, setTab] = useState<"invoices"|"ledger">("invoices");

  const outstanding = AGENT_INVOICES.filter(i => i.status !== "paid");
  const totalOutstanding = outstanding.reduce((s, i) => s + i.amount, 0);
  const totalComm = AGENT_INVOICES.filter(i => i.status === "paid").reduce((s, i) => s + i.commission, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">Invoices & Ledger</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Financial records and transaction history</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><Download size={13} /> Download All</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Outstanding Balance", value: fmtAED(totalOutstanding), sub: `${outstanding.length} invoice${outstanding.length !== 1 ? "s" : ""} pending`, color: outstanding.length > 0 ? "text-red-600" : "text-slate-800" },
          { label: "Commission Earned",   value: fmtAED(totalComm),        sub: "From paid invoices",     color: "text-emerald-600" },
          { label: "Total Invoiced",      value: fmtAED(AGENT_INVOICES.reduce((s,i) => s+i.amount, 0)), sub: `${AGENT_INVOICES.length} invoices total`, color: "text-slate-800" },
          { label: "Overdue Amount",      value: fmtAED(AGENT_INVOICES.filter(i=>i.status==="overdue").reduce((s,i)=>s+i.amount,0)), sub: `${AGENT_INVOICES.filter(i=>i.status==="overdue").length} overdue`, color: "text-red-600" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-3">{c.label}</p>
            <p className={`text-[22px] font-bold font-mono leading-none mb-1 ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {AGENT_INVOICES.some(i => i.status === "overdue") && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-700">
            You have {AGENT_INVOICES.filter(i => i.status === "overdue").length} overdue invoice{AGENT_INVOICES.filter(i => i.status === "overdue").length > 1 ? "s" : ""}.
            Late payment may affect your credit facility.
          </p>
          <button className="ml-auto text-[11px] font-bold text-red-600 hover:underline whitespace-nowrap">Pay Now</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {([["invoices","Invoices"],["ledger","Transaction Ledger"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${tab === k ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{l}</button>
        ))}
      </div>

      {tab === "invoices" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Invoice No","Description","Date","Due Date","Bookings","Amount","Commission","Status",""].map(h => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {AGENT_INVOICES.map(inv => {
                  const cfg = INV_CFG[inv.status];
                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50/50 transition-colors ${inv.status === "overdue" ? "bg-red-50/30" : ""}`}>
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-700 font-semibold">{inv.number}</td>
                      <td className="px-5 py-4 text-[12px] text-slate-700 max-w-[200px] truncate">{inv.description}</td>
                      <td className="px-5 py-4 text-[11px] text-slate-400 whitespace-nowrap">{inv.date}</td>
                      <td className="px-5 py-4 text-[11px] text-slate-400 whitespace-nowrap">{inv.dueDate}</td>
                      <td className="px-5 py-4 text-[12px] font-semibold text-slate-700">{inv.bookings}</td>
                      <td className="px-5 py-4 text-[12px] font-bold font-mono text-slate-800">{fmtAED(inv.amount)}</td>
                      <td className="px-5 py-4 text-[12px] font-bold font-mono text-emerald-600">+{fmtAED(inv.commission)}</td>
                      <td className="px-5 py-4">
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full w-fit ${cfg.bg} ${cfg.color}`}>
                          <cfg.icon size={10} /> {cfg.label}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"><Download size={11} /> PDF</button>
                          {inv.status !== "paid" && <button className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors">Pay</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Date","Description","Reference","Amount","Balance"].map(h => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {WALLET_TXS.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">{tx.date}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-700">{tx.description}</td>
                    <td className="px-5 py-3.5 text-[11px] font-mono text-slate-400">{tx.ref}</td>
                    <td className="px-5 py-3.5">
                      <div className={`flex items-center gap-1 text-[12px] font-bold font-mono ${tx.type === "credit" ? "text-emerald-600" : "text-slate-800"}`}>
                        {tx.type === "credit" ? <ArrowDownLeft size={11} className="text-emerald-500" /> : <ArrowUpRight size={11} className="text-slate-400" />}
                        {tx.type === "credit" ? "+" : "−"}{fmtAED(tx.amount)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] font-mono font-semibold text-slate-700">{fmtAED(tx.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
