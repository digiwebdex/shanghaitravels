import { useState } from "react";
import { Search, Plus, Upload, Download, ChevronUp, ChevronDown, Edit2, Trash2, X, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { PASSENGERS, Passenger, isPassportExpiringSoon } from "./data";

const NATIONALITIES = ["All","UAE","India","UK","Egypt","Australia","United States","France","Pakistan","Jordan","Japan","Philippines","China","Sweden","Bangladesh","Italy","Turkey","Ireland","Canada","Singapore","Thailand"];
const TAGS = ["All","VIP","Corporate"];
type SK = "name" | "nationality" | "passportExpiry" | "bookings";

const ExpiryBadge = ({ expiry }: { expiry: string }) => {
  const s = isPassportExpiringSoon(expiry);
  if (s === "expired") return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><AlertCircle size={9} />{expiry}</span>;
  if (s === "soon")    return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><Clock size={9} />{expiry}</span>;
  return <span className="text-[10px] text-slate-500">{expiry}</span>;
};

export default function Passengers() {
  const [search,   setSearch]   = useState("");
  const [nat,      setNat]      = useState("All");
  const [tag,      setTag]      = useState("All");
  const [sortKey,  setSortKey]  = useState<SK>("name");
  const [sortDir,  setSortDir]  = useState<1|-1>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal,    setModal]    = useState<Passenger | null | "new">(null);

  const handleSort = (k: SK) => { if (sortKey === k) setSortDir(d => d === 1 ? -1 : 1); else { setSortKey(k); setSortDir(1); } };
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const expiring = PASSENGERS.filter(p => isPassportExpiringSoon(p.passportExpiry) !== "ok").length;

  const rows = PASSENGERS
    .filter(p =>
      (nat === "All" || p.nationality === nat) &&
      (tag === "All" || p.tags.includes(tag)) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.passportNo.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortKey === "bookings") return (a.bookings - b.bookings) * sortDir;
      return String((a as any)[sortKey]).localeCompare(String((b as any)[sortKey])) * sortDir;
    });

  const SortIco = ({ k }: { k: SK }) =>
    sortKey === k ? sortDir === 1 ? <ChevronUp size={10} className="text-[#F97316]" /> : <ChevronDown size={10} className="text-[#F97316]" /> : <ChevronDown size={10} className="text-slate-200" />;

  const th = "px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] cursor-pointer select-none whitespace-nowrap";
  const td = "px-4 py-3.5";

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">Passenger Management</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {PASSENGERS.length} passengers on file
            {expiring > 0 && <span className="text-amber-600 font-semibold"> · {expiring} passport{expiring > 1 ? "s" : ""} expiring soon</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><Upload size={12} /> Import CSV</button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><Download size={12} /> Export</button>
          <button onClick={() => setModal("new")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54] transition-colors"><Plus size={13} /> Add Passenger</button>
        </div>
      </div>

      {expiring > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {PASSENGERS.filter(p => isPassportExpiringSoon(p.passportExpiry) !== "ok").slice(0, 4).map(p => {
            const s = isPassportExpiringSoon(p.passportExpiry);
            return (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border text-[11px] ${s === "expired" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                {s === "expired" ? <AlertCircle size={13} className="text-red-500 flex-shrink-0" /> : <Clock size={13} className="text-amber-500 flex-shrink-0" />}
                <span className="font-semibold text-slate-700">{p.name}</span>
                <span className="text-slate-400">Passport {s === "expired" ? "expired" : "expires"} {p.passportExpiry}</span>
                <button className="ml-auto text-[10px] font-bold text-[#F97316] hover:underline whitespace-nowrap">Update</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, passport no or email…" className="w-full pl-8 pr-3 py-2 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D] placeholder:text-slate-400" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tag === t ? "bg-[#14213D] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{t}</button>
          ))}
        </div>
        <select value={nat} onChange={e => setNat(e.target.value)} className="text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 appearance-none focus:outline-none text-slate-600">
          {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
        </select>
        <span className="text-[11px] text-slate-400 ml-auto">{rows.length} result{rows.length !== 1 ? "s" : ""}</span>
      </div>

      {selected.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 bg-[#14213D] rounded-xl">
          <span className="text-white text-[12px] font-semibold">{selected.length} selected</span>
          <div className="flex gap-2 ml-auto">
            {[{l:"Add to Booking",c:"bg-emerald-500 text-white hover:bg-emerald-600"},{l:"Export Selected",c:"bg-white/10 text-white/70 hover:bg-white/20"},{l:"Delete",c:"bg-white/10 text-red-400 hover:bg-white/20"}].map(a => (
              <button key={a.l} className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${a.c}`}>{a.l}</button>
            ))}
            <button onClick={() => setSelected([])} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/50"><X size={12} /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="accent-[#F97316]" checked={selected.length === rows.length && rows.length > 0} onChange={() => setSelected(selected.length === rows.length ? [] : rows.map(p => p.id))} />
                </th>
                <th className={th} onClick={() => handleSort("name")}><span className="flex items-center gap-1">Name <SortIco k="name" /></span></th>
                <th className={th} onClick={() => handleSort("nationality")}><span className="flex items-center gap-1">Nationality <SortIco k="nationality" /></span></th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">Passport No</th>
                <th className={th} onClick={() => handleSort("passportExpiry")}><span className="flex items-center gap-1">Passport Expiry <SortIco k="passportExpiry" /></span></th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">Tags</th>
                <th className={th} onClick={() => handleSort("bookings")}><span className="flex items-center gap-1">Bookings <SortIco k="bookings" /></span></th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(p => (
                <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${selected.includes(p.id) ? "bg-blue-50/50" : ""}`}>
                  <td className="px-4 py-3.5"><input type="checkbox" className="accent-[#F97316]" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} /></td>
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full bg-[#14213D] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {p.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={td + " text-[12px] text-slate-600"}>{p.nationality}</td>
                  <td className={td + " font-mono text-[11px] text-slate-600"}>{p.passportNo}</td>
                  <td className={td}><ExpiryBadge expiry={p.passportExpiry} /></td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map(t => <span key={t} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t === "VIP" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{t}</span>)}
                    </div>
                  </td>
                  <td className={td + " text-[12px] font-bold text-slate-700"}>{p.bookings}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex gap-0.5">
                      <button onClick={() => setModal(p)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Edit2 size={12} /></button>
                      <button className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[11px] text-slate-400">Showing {rows.length} of {PASSENGERS.length} passengers</p>
          <div className="flex gap-1">
            {[1,2].map(p => <button key={p} className={`size-7 rounded-lg text-[11px] font-semibold ${p === 1 ? "bg-[#14213D] text-white" : "text-slate-400 hover:bg-slate-100"}`}>{p}</button>)}
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-slate-800 font-bold">{modal === "new" ? "Add Passenger" : "Edit Passenger"}</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                {label:"Full Name (as in passport)",key:"name",col:"col-span-2",ph:"Mohammed Al-Rashidi"},
                {label:"Passport Number",key:"passportNo",col:"",ph:"A12345678"},
                {label:"Nationality",key:"nationality",col:"",ph:"UAE"},
                {label:"Date of Birth",key:"dob",col:"",ph:"15 Mar 1985"},
                {label:"Passport Expiry",key:"passportExpiry",col:"",ph:"10 Aug 2027"},
                {label:"Phone",key:"phone",col:"",ph:"+971501234567"},
                {label:"Email",key:"email",col:"",ph:"passenger@email.com"},
              ].map(f => (
                <div key={f.key} className={f.col}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">{f.label}</label>
                  <input defaultValue={modal !== "new" ? (modal as any)[f.key] ?? "" : ""} placeholder={f.ph} className="w-full px-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D]" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => setModal(null)} className="px-5 py-2 rounded-lg bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54]">
                {modal === "new" ? "Add Passenger" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
