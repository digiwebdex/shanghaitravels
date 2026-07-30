import { Download, FileText, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { CONTRACTS, ContractStatus, CONTRACT_STATUS, fmtAED } from "./data";

const STATUS_ICON: Record<ContractStatus, any> = {
  active:         CheckCircle2,
  expiring:       Clock,
  expired:        AlertCircle,
  pending_review: Clock,
};

const th = "px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]";

export default function Contracts() {
  const active   = CONTRACTS.filter(c => c.status === "active");
  const expiring = CONTRACTS.filter(c => c.status === "expiring");
  const totalValue = CONTRACTS.filter(c => c.status === "active" || c.status === "expiring").reduce((s, c) => s + c.value, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">Contracts</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">{CONTRACTS.length} contracts · {active.length} active</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active",          value: String(active.length),                        color: "text-emerald-600" },
          { label: "Expiring Soon",   value: String(expiring.length),                      color: "text-amber-600"  },
          { label: "Pending Review",  value: String(CONTRACTS.filter(c => c.status === "pending_review").length), color: "text-violet-600" },
          { label: "Total Value",     value: fmtAED(totalValue),                           color: "text-slate-800"  },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-2">{c.label}</p>
            <p className={`text-[22px] font-bold leading-none ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Expiry alerts */}
      {expiring.length > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock size={14} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-amber-800">
              {expiring.length} contract{expiring.length > 1 ? "s" : ""} expiring soon:
            </p>
            <p className="text-[11px] text-amber-700">
              {expiring.map(c => `${c.title} with ${c.agentName} (expires ${c.expiryDate})`).join(" · ")}
            </p>
          </div>
          <button className="ml-auto text-[11px] font-bold text-amber-700 hover:underline whitespace-nowrap px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors">
            Request Renewal
          </button>
        </div>
      )}

      {/* Contracts table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Contract","Agent","Type","Signed","Expires","Value","Status",""].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CONTRACTS.map(c => {
                const cfg = CONTRACT_STATUS[c.status];
                const Icon = STATUS_ICON[c.status];
                return (
                  <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${c.status === "expiring" ? "bg-amber-50/20" : c.status === "expired" ? "opacity-60" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${c.status === "active" ? "bg-emerald-50" : c.status === "expiring" ? "bg-amber-50" : c.status === "expired" ? "bg-slate-100" : "bg-violet-50"}`}>
                          <FileText size={13} className={c.status === "active" ? "text-emerald-600" : c.status === "expiring" ? "text-amber-600" : c.status === "expired" ? "text-slate-400" : "text-violet-600"} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-800">{c.title}</p>
                          <p className="text-[9px] text-slate-400">{c.fileSize}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-slate-700">{c.agentName}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{c.type}</span>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-slate-400 whitespace-nowrap">{c.signedDate}</td>
                    <td className="px-5 py-4 text-[11px] text-slate-700 font-semibold whitespace-nowrap">{c.expiryDate}</td>
                    <td className="px-5 py-4 text-[12px] font-bold font-mono text-slate-800">{fmtAED(c.value)}</td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full w-fit ${cfg.bg} ${cfg.color}`}>
                        <Icon size={10} /> {cfg.label}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors">
                          <Download size={11} /> PDF
                        </button>
                        {(c.status === "expiring" || c.status === "expired" || c.status === "pending_review") && (
                          <button className="text-[11px] font-semibold text-violet-600 hover:text-violet-700 px-2 py-1 rounded-md hover:bg-violet-50 transition-colors whitespace-nowrap">
                            {c.status === "pending_review" ? "Review" : "Renew"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info footer */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[12px] font-bold text-slate-800 mb-2">About Your Contracts</p>
        <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
          All contracts are managed by your Shanghai Travels account manager. To renew expiring contracts, request amendments, or add new agents to your supplier network, contact <a href="mailto:yasmin@shanghaitravels.com" className="text-violet-600 hover:underline font-semibold">yasmin@shanghaitravels.com</a> or call <span className="font-semibold">+971 50 991 2233</span>.
        </p>
      </div>
    </div>
  );
}
