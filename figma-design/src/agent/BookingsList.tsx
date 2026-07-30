import { useState } from "react";
import { Link } from "react-router";
import { Search, Download, X, Eye, Copy, XCircle } from "lucide-react";
import { BOOKINGS, BookingStatus, BookingType, STATUS_CFG, TYPE_CFG, fmtAED } from "./data";

const STATUS_PILLS: { key: BookingStatus | "all"; label: string }[] = [
  { key: "all", label: "All" }, { key: "draft", label: "Draft" }, { key: "submitted", label: "Submitted" },
  { key: "processing", label: "Processing" }, { key: "approved", label: "Approved" },
  { key: "completed", label: "Completed" }, { key: "cancelled", label: "Cancelled" },
];
const TYPE_PILLS: { key: BookingType | "all"; label: string }[] = [
  { key: "all", label: "All Types" }, { key: "visa", label: "Visa" }, { key: "ticket", label: "Ticket" },
  { key: "hotel", label: "Hotel" }, { key: "transport", label: "Transport" }, { key: "catering", label: "Catering" },
];

const th = "px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] whitespace-nowrap";
const td = "px-4 py-3.5";

export default function BookingsList() {
  const [statusF, setStatusF] = useState<BookingStatus | "all">("all");
  const [typeF,   setTypeF]   = useState<BookingType | "all">("all");
  const [search,  setSearch]  = useState("");
  const [sel,     setSel]     = useState<string[]>([]);

  const rows = BOOKINGS.filter(b =>
    (statusF === "all" || b.status === statusF) &&
    (typeF   === "all" || b.type   === typeF)   &&
    (b.service.toLowerCase().includes(search.toLowerCase()) || b.ref.toLowerCase().includes(search.toLowerCase()) || b.destination.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle    = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSel(sel.length === rows.length ? [] : rows.map(b => b.id));
  const totalAmt  = sel.reduce((sum, id) => sum + (BOOKINGS.find(x => x.id === id)?.amount ?? 0), 0);
  const totalComm = sel.reduce((sum, id) => sum + (BOOKINGS.find(x => x.id === id)?.commission ?? 0), 0);

  return (
    <div className="p-6 max-w-[1400px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">Bookings</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">{BOOKINGS.length} total bookings</p>
        </div>
        <Link to="/agent/book" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54] transition-colors">+ New Booking</Link>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_PILLS.map(p => {
          const count = p.key === "all" ? BOOKINGS.length : BOOKINGS.filter(b => b.status === p.key).length;
          return (
            <button key={p.key} onClick={() => setStatusF(p.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${statusF === p.key ? "bg-[#14213D] text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"}`}>
              {p.label}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusF === p.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by service, ref, destination…" className="w-full pl-8 pr-3 py-2 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D] placeholder:text-slate-400" />
        </div>
        <div className="flex gap-1.5">
          {TYPE_PILLS.map(p => (
            <button key={p.key} onClick={() => setTypeF(p.key)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${typeF === p.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{p.label}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 ml-auto"><Download size={12} /> Export</button>
      </div>

      {/* Bulk bar */}
      {sel.length > 0 && (
        <div className="flex items-center gap-5 px-4 py-3 bg-[#14213D] rounded-xl">
          <span className="text-white text-[12px] font-semibold">{sel.length} selected</span>
          <div className="text-[11px] text-white/50">
            Total: <span className="text-white font-mono font-bold">{fmtAED(totalAmt)}</span>
            <span className="mx-2">·</span>
            Commission: <span className="text-emerald-400 font-mono font-bold">+{fmtAED(totalComm)}</span>
          </div>
          <div className="flex gap-2 ml-auto">
            {[{l:"Download Docs",c:"bg-white/10 text-white/70 hover:bg-white/20"},{l:"Export CSV",c:"bg-white/10 text-white/70 hover:bg-white/20"},{l:"Cancel",c:"bg-white/10 text-red-400 hover:bg-white/20"}].map(a => (
              <button key={a.l} className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${a.c}`}>{a.l}</button>
            ))}
            <button onClick={() => setSel([])} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/50"><X size={12} /></button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="accent-[#F97316]" checked={sel.length === rows.length && rows.length > 0} onChange={toggleAll} />
                </th>
                {["Ref","Service","Type","Destination","Travel Date","PAX","Amount","Commission","Status",""].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(b => {
                const st = STATUS_CFG[b.status];
                const ty = TYPE_CFG[b.type];
                const isSelected = sel.includes(b.id);
                return (
                  <tr key={b.id} className={`transition-colors hover:bg-slate-50/50 ${isSelected ? "bg-blue-50/30" : ""}`}>
                    <td className="px-4 py-3.5"><input type="checkbox" className="accent-[#F97316]" checked={isSelected} onChange={() => toggle(b.id)} /></td>
                    <td className={td + " font-mono text-[11px] text-slate-500"}>{b.ref}</td>
                    <td className={td}>
                      <p className="text-[12px] font-semibold text-slate-800">{b.service}</p>
                      {b.clientRef && <p className="text-[10px] text-slate-400">Client: {b.clientRef}</p>}
                    </td>
                    <td className={td}><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${ty.bg} ${ty.color}`}>{ty.label}</span></td>
                    <td className={td + " text-[12px] text-slate-600"}>{b.destination}</td>
                    <td className={td + " text-[11px] text-slate-500 font-mono"}>{b.travelDate}</td>
                    <td className={td + " text-[12px] font-semibold text-slate-700"}>{b.passengerCount}</td>
                    <td className={td + " text-[12px] font-bold font-mono text-slate-800"}>{fmtAED(b.amount)}</td>
                    <td className={td}><span className="text-[12px] font-bold font-mono text-emerald-600">+{fmtAED(b.commission)}</span></td>
                    <td className={td}><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span></td>
                    <td className="px-3 py-3.5">
                      <div className="flex gap-0.5">
                        <button title="View"      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Eye size={12} /></button>
                        <button title="Duplicate" className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Copy size={12} /></button>
                        {b.status !== "cancelled" && <button title="Cancel" className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><XCircle size={12} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[11px] text-slate-400">Showing {rows.length} of {BOOKINGS.length} bookings</p>
          <div className="flex gap-1">
            {[1,2,3].map(p => <button key={p} className={`size-7 rounded-lg text-[11px] font-semibold ${p === 1 ? "bg-[#14213D] text-white" : "text-slate-400 hover:bg-slate-100"}`}>{p}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}
