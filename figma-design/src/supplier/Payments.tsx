import { DollarSign, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { PAYMENTS, PAY_STATUS, fmtAED } from "./data";

const th = "px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]";

export default function Payments() {
  const received  = PAYMENTS.filter(p => p.status === "received");
  const scheduled = PAYMENTS.filter(p => p.status === "scheduled");

  const totalReceived  = received.reduce((s, p) => s + p.amount, 0);
  const totalScheduled = scheduled.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-slate-800 text-[20px] font-bold">Payments</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Payment history and scheduled receipts</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Received (YTD)",  value: fmtAED(totalReceived),  sub: `${received.length} payments`,  icon: CheckCircle2, color: "text-emerald-600", ic: "bg-emerald-50 text-emerald-600" },
          { label: "Scheduled",       value: fmtAED(totalScheduled), sub: `${scheduled.length} pending`,  icon: Clock,        color: "text-blue-600",    ic: "bg-blue-50 text-blue-600"       },
          { label: "Total",           value: fmtAED(totalReceived + totalScheduled), sub: "All time",     icon: DollarSign,   color: "text-slate-800",   ic: "bg-slate-100 text-slate-600"    },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">{c.label}</p>
              <div className={`size-7 rounded-lg flex items-center justify-center ${c.ic}`}><c.icon size={13} /></div>
            </div>
            <p className={`text-[22px] font-bold font-mono leading-none mb-1 ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      {scheduled.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-blue-600" />
            <p className="text-[12px] font-bold text-blue-800">Upcoming Payments</p>
          </div>
          <div className="space-y-2">
            {scheduled.map(p => {
              const st = PAY_STATUS[p.status];
              return (
                <div key={p.id} className="flex items-center gap-4 bg-white rounded-lg px-4 py-3 border border-blue-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800">{p.invoiceRef}</p>
                    <p className="text-[10px] text-slate-400">{p.agentName}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 whitespace-nowrap">Expected {p.date}</p>
                  <p className="text-[13px] font-bold font-mono text-slate-800">{fmtAED(p.amount)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment history table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[13px] font-bold text-slate-800">Payment History</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Invoice","Agent","Date","Method","Reference","Amount","Status"].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {PAYMENTS.map(p => {
                const st = PAY_STATUS[p.status];
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">{p.invoiceRef}</td>
                    <td className="px-5 py-3.5 text-[12px] text-slate-700">{p.agentName}</td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">{p.date}</td>
                    <td className="px-5 py-3.5 text-[11px] text-slate-600">{p.method}</td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">{p.ref}</td>
                    <td className="px-5 py-3.5 text-[12px] font-bold font-mono text-slate-800">{fmtAED(p.amount)}</td>
                    <td className="px-5 py-3.5">
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full w-fit ${st.bg} ${st.color}`}>
                        {p.status === "received" ? <CheckCircle2 size={10} /> : p.status === "scheduled" ? <Clock size={10} /> : <AlertCircle size={10} />}
                        {st.label}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank details reminder */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[12px] font-bold text-slate-800 mb-3">Registered Payment Account</p>
        <div className="grid grid-cols-3 gap-4 text-[11px]">
          {[["Bank","Abu Dhabi Commercial Bank"],["IBAN","AE07 0030 0012 3456 7890 001"],["Account Name","Grand Meridian Hotels & Resorts LLC"]].map(([k,v]) => (
            <div key={k}>
              <p className="text-slate-400 mb-0.5">{k}</p>
              <p className="font-mono font-semibold text-slate-800">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">To update your payment details, contact your account manager.</p>
      </div>
    </div>
  );
}
