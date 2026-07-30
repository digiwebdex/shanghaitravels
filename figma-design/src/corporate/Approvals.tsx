import { useState } from "react";
import { CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { APPLICATIONS, DEPT_SPEND, PRIORITY_CFG, fmtAED } from "./data";

export default function Approvals() {
  const [decisions, setDecisions] = useState<Record<string, "approved" | "rejected">>({});
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [notes,     setNotes]     = useState<Record<string, string>>({});

  const queue      = APPLICATIONS.filter(a => a.status === "pending_approval");
  const remaining  = queue.filter(a => !decisions[a.id]);
  const decided    = queue.filter(a =>  decisions[a.id]);
  const pendingAmt = remaining.reduce((s, a) => s + a.amount, 0);
  const approvedAmt= queue.filter(a => decisions[a.id] === "approved").reduce((s, a) => s + a.amount, 0);

  const decide = (id: string, d: "approved" | "rejected") => {
    setDecisions(prev => ({ ...prev, [id]: d }));
    setExpanded(null);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0B1829] text-[20px] font-bold">Approvals & Billing</h1>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            {remaining.length} pending · {decided.length} decided this session
          </p>
        </div>
        {decided.length > 0 && (
          <button className="px-4 py-2 rounded-lg bg-[#0B1829] text-white text-[12px] font-bold hover:bg-[#162840] transition-colors">
            Submit {decided.length} Decision{decided.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* ── Approval queue ────────────────────────────────── */}
        <div className="col-span-2 space-y-4">
          {/* Mini-KPI row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pending Review", value: remaining.length, sub: fmtAED(pendingAmt),  cls: "border-orange-200 bg-orange-50", val: "text-orange-600" },
              { label: "Approved",       value: decided.filter(a => decisions[a.id] === "approved").length, sub: fmtAED(approvedAmt), cls: "border-emerald-200 bg-emerald-50", val: "text-emerald-600" },
              { label: "Rejected",       value: decided.filter(a => decisions[a.id] === "rejected").length, sub: "This session",       cls: "border-red-200 bg-red-50",           val: "text-red-600" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 ${s.cls}`}>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-2">{s.label}</p>
                <p className={`text-[24px] font-bold ${s.val}`}>{s.value}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {queue.map(app => {
              const dec    = decisions[app.id];
              const pri    = PRIORITY_CFG[app.priority];
              const isOpen = expanded === app.id;

              return (
                <div key={app.id} className={`bg-white rounded-xl border transition-all ${dec === "approved" ? "border-emerald-200 opacity-60" : dec === "rejected" ? "border-red-200 opacity-60" : "border-[#E2E5EA]"}`}>
                  <div className="flex items-start gap-4 p-5">
                    {/* State icon */}
                    <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${dec === "approved" ? "bg-emerald-100" : dec === "rejected" ? "bg-red-100" : "bg-orange-100"}`}>
                      {dec === "approved" ? <CheckCircle2 size={16} className="text-emerald-600" />
                        : dec === "rejected" ? <XCircle size={16} className="text-red-500" />
                        : <Clock size={16} className="text-orange-500" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-bold text-[#0B1829]">{app.service}</p>
                        <div className="flex items-center gap-1">
                          <span className={`size-1.5 rounded-full ${pri.dot}`} />
                          <span className="text-[9px] text-[#94A3B8] font-medium">{pri.label} Priority</span>
                        </div>
                        {app.priority === "high" && <AlertCircle size={11} className="text-orange-500" />}
                      </div>
                      <p className="text-[10px] text-[#94A3B8]">
                        {app.ref} · {app.employeeName} · {app.department} · {app.destination} · Travel: {app.travelDate}
                      </p>
                      {app.notes && (
                        <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                          <AlertCircle size={10} /> {app.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-[18px] font-bold font-mono text-[#0B1829]">{fmtAED(app.amount)}</p>

                      {!dec ? (
                        <div className="flex gap-2">
                          <button onClick={() => decide(app.id, "approved")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 transition-colors">
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button onClick={() => decide(app.id, "rejected")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-colors">
                            <XCircle size={12} /> Reject
                          </button>
                          <button onClick={() => setExpanded(isOpen ? null : app.id)} className="p-2 rounded-lg hover:bg-[#EEF0F4] text-[#94A3B8] transition-colors">
                            <ChevronDown size={13} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ${dec === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {dec === "approved" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {dec.charAt(0).toUpperCase() + dec.slice(1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable notes */}
                  {isOpen && (
                    <div className="border-t border-[#E2E5EA] px-5 pb-5 pt-4">
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-2">
                        Notes for requestor (optional)
                      </label>
                      <textarea
                        value={notes[app.id] ?? ""}
                        onChange={e => setNotes(n => ({ ...n, [app.id]: e.target.value }))}
                        className="w-full px-3 py-2.5 text-[12px] border border-[#E2E5EA] rounded-lg bg-[#F8FAFC] focus:outline-none resize-none"
                        rows={2}
                        placeholder="Reason for approval or rejection…"
                      />
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => decide(app.id, "approved")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 transition-colors"><CheckCircle2 size={11} /> Approve</button>
                        <button onClick={() => decide(app.id, "rejected")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors"><XCircle size={11} /> Reject with Note</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {queue.length === 0 && (
              <div className="bg-white rounded-xl border border-[#E2E5EA] p-12 text-center">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-[#0B1829] font-semibold">Inbox zero — all caught up.</p>
                <p className="text-[11px] text-[#94A3B8] mt-1">No pending approvals at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Billing sidebar ───────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E5EA] p-5">
            <p className="text-[12px] font-bold text-[#0B1829] mb-4">Billing Summary — Jan 2025</p>
            <div className="space-y-2.5">
              {[
                { label: "Invoiced (Dec 2024)", amount: 28700,      note: "Paid",                  pos: true },
                { label: "Current Month Est.",  amount: 47800,      note: "Invoice due 31 Jan"             },
                { label: "Pending Approval",    amount: pendingAmt, note: `${remaining.length} requests`,  hi: true },
                { label: "Available Credit",    amount: 152800,     note: "of AED 500k limit"              },
              ].map(r => (
                <div key={r.label} className={`flex justify-between items-start p-3 rounded-lg ${r.hi ? "bg-orange-50 border border-orange-100" : "bg-[#F8FAFC]"}`}>
                  <div>
                    <p className="text-[11px] font-semibold text-[#0B1829]">{r.label}</p>
                    <p className="text-[10px] text-[#94A3B8]">{r.note}</p>
                  </div>
                  <p className={`text-[13px] font-bold font-mono ${r.pos ? "text-emerald-600" : r.hi ? "text-orange-600" : "text-[#0B1829]"}`}>
                    {fmtAED(r.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E5EA] p-5">
            <p className="text-[12px] font-bold text-[#0B1829] mb-4">Spend by Department</p>
            <div className="space-y-3">
              {DEPT_SPEND.map(d => (
                <div key={d.dept}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#64748B]">{d.dept}</span>
                    <span className="font-mono font-semibold text-[#0B1829]">{fmtAED(d.spend)}</span>
                  </div>
                  <div className="h-1 bg-[#EEF0F4] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B1829] rounded-full" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0B1829] rounded-xl p-5">
            <p className="text-white font-bold text-[12px] mb-1">Raise your credit limit?</p>
            <p className="text-white/45 text-[11px] mb-4">Contact your TravelOS account manager for a credit review.</p>
            <button className="w-full py-2 rounded-lg bg-[#F97316] text-white text-[11px] font-bold hover:bg-orange-500 transition-colors">Request Credit Increase</button>
          </div>
        </div>
      </div>
    </div>
  );
}
