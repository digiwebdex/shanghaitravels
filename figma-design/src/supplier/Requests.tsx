import { useState } from "react";
import { Check, X, MessageSquare, ChevronDown, Clock, AlertCircle, Filter } from "lucide-react";
import { REQUESTS, BookingRequest, RequestStatus, STATUS_CFG, fmtAED } from "./data";

const TABS: { key: RequestStatus | "all"; label: string }[] = [
  { key: "all",       label: "All"       },
  { key: "pending",   label: "Pending"   },
  { key: "accepted",  label: "Accepted"  },
  { key: "countered", label: "Countered" },
  { key: "rejected",  label: "Rejected"  },
  { key: "expired",   label: "Expired"   },
];

interface CounterModal { req: BookingRequest; rate: string }

export default function Requests() {
  const [tab,     setTab]     = useState<RequestStatus | "all">("pending");
  const [counter, setCounter] = useState<CounterModal | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, RequestStatus>>({});

  const effectiveStatus = (r: BookingRequest): RequestStatus => statuses[r.id] ?? r.status;

  const rows = REQUESTS.filter(r =>
    tab === "all" || effectiveStatus(r) === tab
  ).sort((a, b) => {
    const priority = { high: 0, normal: 1, low: 2 };
    return priority[a.priority] - priority[b.priority];
  });

  const pending = REQUESTS.filter(r => effectiveStatus(r) === "pending");

  const accept  = (id: string) => setStatuses(s => ({ ...s, [id]: "accepted" }));
  const reject  = (id: string) => setStatuses(s => ({ ...s, [id]: "rejected" }));
  const doCounter = (id: string) => { setStatuses(s => ({ ...s, [id]: "countered" })); setCounter(null); };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">Booking Requests</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {pending.length} pending · {REQUESTS.length} total
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          <Filter size={12} /> Filter
        </button>
      </div>

      {/* Urgent banner */}
      {pending.filter(r => r.priority === "high").length > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Clock size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-amber-700">
            {pending.filter(r => r.priority === "high").length} request{pending.filter(r => r.priority === "high").length > 1 ? "s" : ""} expire within 24 hours — respond before time runs out.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => {
          const count = t.key === "all" ? REQUESTS.length : REQUESTS.filter(r => effectiveStatus(r) === t.key).length;
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

      {/* Request cards */}
      <div className="space-y-3">
        {rows.map(r => {
          const status = effectiveStatus(r);
          const cfg = STATUS_CFG[status];
          const isOpen = expanded === r.id;
          const isPending = status === "pending";
          const rateMatch = r.requestedRate >= r.ourRate;

          return (
            <div key={r.id} className={`bg-white rounded-xl border transition-all ${isPending ? "border-slate-200 shadow-sm" : "border-slate-100"}`}>
              {/* Main row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Priority dot */}
                <div className={`size-2 rounded-full flex-shrink-0 ${r.priority === "high" ? "bg-red-400" : r.priority === "normal" ? "bg-amber-400" : "bg-slate-300"}`} />

                {/* Info */}
                <div className="flex-1 min-w-0 grid grid-cols-4 gap-4 items-center">
                  <div className="col-span-1 min-w-0">
                    <p className="text-[12px] font-bold text-slate-800 truncate">{r.serviceName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{r.ref}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{r.agentName}</p>
                    <p className="text-[10px] text-slate-400">{r.checkIn} → {r.checkOut}{r.nights ? ` · ${r.nights}N` : ""}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Guests / Rooms</p>
                    <p className="text-[11px] font-semibold text-slate-700">{r.guests} guests{r.rooms ? ` · ${r.rooms} room${r.rooms > 1 ? "s" : ""}` : ""}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Requested rate</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold font-mono text-slate-800">{fmtAED(r.requestedRate)}<span className="text-[9px] font-normal text-slate-400">/night</span></span>
                      {!rateMatch && isPending && <AlertCircle size={11} className="text-amber-500 flex-shrink-0" title="Below our rate" />}
                    </div>
                    <p className="text-[9px] text-slate-400">Our rate: {fmtAED(r.ourRate)}/night</p>
                  </div>
                </div>

                {/* Total + status */}
                <div className="text-right flex-shrink-0 mr-2">
                  <p className="text-[13px] font-bold font-mono text-slate-800">{fmtAED(r.totalValue)}</p>
                  <p className="text-[9px] text-slate-400">total value</p>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>

                {/* Actions */}
                {isPending && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => accept(r.id)} title="Accept"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 transition-colors">
                      <Check size={12} /> Accept
                    </button>
                    <button onClick={() => setCounter({ req: r, rate: String(r.ourRate) })} title="Counter"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 text-[11px] font-bold hover:bg-violet-200 transition-colors">
                      <MessageSquare size={12} /> Counter
                    </button>
                    <button onClick={() => reject(r.id)} title="Reject"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <button onClick={() => setExpanded(isOpen ? null : r.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-300 transition-colors flex-shrink-0">
                  <ChevronDown size={13} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-5 pb-4 border-t border-slate-50 pt-4 grid grid-cols-3 gap-5 text-[12px]">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Request Details</p>
                    {[
                      ["Received", r.receivedAt],
                      ["Expires",  r.expiresAt],
                      ["Agent ID", r.agentId],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}</span>
                        <span className="font-semibold text-slate-700">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rate Comparison</p>
                    {[
                      ["Requested", fmtAED(r.requestedRate) + "/night"],
                      ["Our Rate",  fmtAED(r.ourRate) + "/night"],
                      ["Difference", `${r.requestedRate >= r.ourRate ? "+" : "−"}${fmtAED(Math.abs(r.requestedRate - r.ourRate))}/night`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{k}</span>
                        <span className="font-semibold text-slate-700">{v}</span>
                      </div>
                    ))}
                  </div>
                  {r.notes && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Agent Notes</p>
                      <p className="text-slate-600 leading-relaxed">{r.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
            <p className="text-slate-400 text-[13px]">No {tab === "all" ? "" : tab} requests found.</p>
          </div>
        )}
      </div>

      {/* Counter modal */}
      {counter && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setCounter(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Counter Offer</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{counter.req.ref} · {counter.req.serviceName}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-400 mb-0.5">Agent requested</p>
                  <p className="font-bold text-slate-800 font-mono">{fmtAED(counter.req.requestedRate)}/night</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-400 mb-0.5">Our listed rate</p>
                  <p className="font-bold text-slate-800 font-mono">{fmtAED(counter.req.ourRate)}/night</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Your Counter Rate (AED / night)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold">AED</span>
                  <input type="number" value={counter.rate} onChange={e => setCounter(c => c ? { ...c, rate: e.target.value } : null)}
                    className="w-full pl-10 pr-3 py-2.5 text-[13px] font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-violet-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Message to Agent (optional)</label>
                <textarea rows={3} placeholder="Reason for counter offer, conditions, etc." className="w-full px-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-violet-400 placeholder:text-slate-400 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setCounter(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => doCounter(counter.req.id)} className="px-5 py-2 rounded-lg bg-violet-600 text-white text-[12px] font-bold hover:bg-violet-700">Send Counter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
