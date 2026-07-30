import { useState } from "react";
import { Link } from "react-router";
import {
  Search, ChevronUp, ChevronDown, Filter, X,
  CheckCircle2, XCircle, Eye, Download, Plus,
} from "lucide-react";
import {
  APPLICATIONS, CorpApplication, AppStatus, Priority,
  STATUS_CFG, PRIORITY_CFG, fmtAED,
} from "./data";

const DEPTS   = ["All","Executive","Sales","Marketing","Finance","Operations","IT","HR"];
const ALL_ST: AppStatus[] = ["pending_approval","approved","processing","completed","rejected"];
type SK = keyof Pick<CorpApplication, "ref"|"employeeName"|"department"|"service"|"amount"|"submittedDate"|"travelDate">;

export default function Applications() {
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState<AppStatus|"all">("all");
  const [dept,     setDept]     = useState("All");
  const [priF,     setPriF]     = useState<Priority|"all">("all");
  const [sortKey,  setSortKey]  = useState<SK>("submittedDate");
  const [sortDir,  setSortDir]  = useState<1|-1>(-1);
  const [selected, setSelected] = useState<string[]>([]);
  const [adv,      setAdv]      = useState(false);

  const handleSort = (k: SK) => { if (sortKey === k) setSortDir(d => d === 1 ? -1 : 1); else { setSortKey(k); setSortDir(-1); } };
  const toggle     = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const rows = APPLICATIONS
    .filter(a =>
      (statusF === "all" || a.status === statusF) &&
      (dept    === "All" || a.department === dept) &&
      (priF    === "all" || a.priority   === priF) &&
      (a.employeeName.toLowerCase().includes(search.toLowerCase()) ||
       a.ref.toLowerCase().includes(search.toLowerCase())          ||
       a.service.toLowerCase().includes(search.toLowerCase())      ||
       a.destination.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const av = (a as any)[sortKey], bv = (b as any)[sortKey];
      return typeof av === "number" ? (av - bv) * sortDir : String(av).localeCompare(String(bv)) * sortDir;
    });

  const selAmt = selected.reduce((s, id) => s + (APPLICATIONS.find(a => a.id === id)?.amount ?? 0), 0);

  const SortIco = ({ k }: { k: SK }) =>
    sortKey === k
      ? sortDir === 1 ? <ChevronUp size={10} className="text-[#F97316]" /> : <ChevronDown size={10} className="text-[#F97316]" />
      : <ChevronDown size={10} className="text-[#D1D5DB]" />;

  const th = "px-3 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] cursor-pointer select-none whitespace-nowrap";
  const td = "px-3 py-3.5 text-[11.5px]";

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0B1829] text-[20px] font-bold">Application Management</h1>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            {APPLICATIONS.length} total · {APPLICATIONS.filter(a => a.status === "pending_approval").length} pending approval
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAdv(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-semibold transition-colors ${adv ? "bg-[#0B1829] text-white border-[#0B1829]" : "border-[#E2E5EA] text-[#64748B] hover:bg-[#EEF0F4]"}`}>
            <Filter size={12} /> Filters
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E5EA] text-[12px] font-semibold text-[#64748B] hover:bg-[#EEF0F4] transition-colors">
            <Download size={12} /> Export
          </button>
          <Link to="/portal/apply" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1829] text-white text-[12px] font-semibold hover:bg-[#162840] transition-colors">
            <Plus size={12} /> New Application
          </Link>
        </div>
      </div>

      {/* Search + status pills */}
      <div className="bg-white rounded-xl border border-[#E2E5EA] p-3.5 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E2E5EA] rounded-lg bg-[#F8FAFC] focus:outline-none focus:border-[#0B1829] placeholder:text-[#94A3B8]" placeholder="Employee, reference, service or destination…" />
          </div>
          <span className="text-[11px] text-[#94A3B8] self-center">{rows.length} result{rows.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setStatusF("all")} className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${statusF === "all" ? "bg-[#0B1829] text-white" : "bg-[#EEF0F4] text-[#64748B] hover:bg-[#E2E5EA]"}`}>All</button>
          {ALL_ST.map(s => {
            const cfg = STATUS_CFG[s];
            const n   = APPLICATIONS.filter(a => a.status === s).length;
            return (
              <button key={s} onClick={() => setStatusF(s)} className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${statusF === s ? `${cfg.bg} ${cfg.color}` : "bg-[#EEF0F4] text-[#64748B] hover:bg-[#E2E5EA]"}`}>
                {cfg.label} <span className="opacity-50">{n}</span>
              </button>
            );
          })}
        </div>

        {adv && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-[#E2E5EA]">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">Dept</label>
              <select value={dept} onChange={e => setDept(e.target.value)} className="text-[11px] border border-[#E2E5EA] rounded-lg px-2.5 py-1.5 bg-[#F8FAFC] appearance-none focus:outline-none">
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">Priority</label>
              <select value={priF} onChange={e => setPriF(e.target.value as Priority|"all")} className="text-[11px] border border-[#E2E5EA] rounded-lg px-2.5 py-1.5 bg-[#F8FAFC] appearance-none focus:outline-none">
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-[#0B1829] rounded-xl">
          <span className="text-white text-[12px] font-semibold">{selected.length} selected · {fmtAED(selAmt)}</span>
          <div className="flex gap-2 ml-auto">
            <button className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"><CheckCircle2 size={11} /> Approve All</button>
            <button className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"><XCircle size={11} /> Reject All</button>
            <button className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors">Export</button>
            <button onClick={() => setSelected([])} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/50"><X size={12} /></button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E5EA] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E5EA]">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" className="accent-[#F97316]" checked={selected.length === rows.length && rows.length > 0} onChange={() => setSelected(selected.length === rows.length ? [] : rows.map(a => a.id))} />
                </th>
                {([["ref","Reference"],["employeeName","Employee"],["department","Dept"],["service","Service / Destination"],["status","Status"],["priority","Priority"],["amount","Amount"],["travelDate","Travel Date"]] as [SK, string][]).map(([k, l]) => (
                  <th key={k} className={th} onClick={() => handleSort(k)}>
                    <span className="flex items-center gap-1">{l} <SortIco k={k} /></span>
                  </th>
                ))}
                <th className="px-3 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F6F9]">
              {rows.map(app => {
                const cfg = STATUS_CFG[app.status];
                const pri = PRIORITY_CFG[app.priority];
                return (
                  <tr key={app.id} className={`hover:bg-[#FAFBFC] transition-colors ${selected.includes(app.id) ? "bg-[#F0F4FF]" : ""}`}>
                    <td className="px-3 py-3.5 w-10"><input type="checkbox" className="accent-[#F97316]" checked={selected.includes(app.id)} onChange={() => toggle(app.id)} /></td>
                    <td className={td}><span className="font-mono font-semibold text-[#0B1829]">{app.ref}</span></td>
                    <td className={td}>
                      <p className="font-semibold text-[#0B1829]">{app.employeeName}</p>
                      <p className="text-[10px] text-[#94A3B8]">{app.employeeId}</p>
                    </td>
                    <td className={`${td} text-[#64748B]`}>{app.department}</td>
                    <td className={td}>
                      <p className="font-medium text-[#0B1829] leading-tight">{app.service}</p>
                      <p className="text-[10px] text-[#94A3B8]">{app.destination}</p>
                    </td>
                    <td className={td}><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span></td>
                    <td className={td}>
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${pri.dot}`} />
                        <span className="text-[11px] text-[#64748B]">{pri.label}</span>
                      </div>
                    </td>
                    <td className={td}><span className="font-mono font-bold text-[#0B1829]">{fmtAED(app.amount)}</span></td>
                    <td className={`${td} text-[#94A3B8]`}>{app.travelDate}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex gap-0.5">
                        <Link to="/portal/track/app-001" className="p-1.5 rounded-md hover:bg-[#EEF0F4] text-[#94A3B8] hover:text-[#0B1829] transition-colors"><Eye size={12} /></Link>
                        {app.status === "pending_approval" && (
                          <>
                            <button className="p-1.5 rounded-md hover:bg-emerald-50 text-[#94A3B8] hover:text-emerald-600 transition-colors"><CheckCircle2 size={12} /></button>
                            <button className="p-1.5 rounded-md hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors"><XCircle size={12} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E5EA] bg-[#F8FAFC]">
          <p className="text-[11px] text-[#94A3B8]">Showing {rows.length} of {APPLICATIONS.length} applications</p>
          <div className="flex gap-1">
            {[1, 2].map(p => <button key={p} className={`size-7 rounded-lg text-[11px] font-semibold ${p === 1 ? "bg-[#0B1829] text-white" : "text-[#94A3B8] hover:bg-[#EEF0F4]"}`}>{p}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}
