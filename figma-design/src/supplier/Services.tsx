import { useState } from "react";
import { Edit2, X, CheckCircle2, AlertCircle, Toggle } from "lucide-react";
import { SERVICES, Service, ServiceStatus, fmtAED } from "./data";

const STATUS_CFG: Record<ServiceStatus, { label: string; color: string; bg: string }> = {
  active:      { label: "Active",      color: "text-emerald-700", bg: "bg-emerald-100" },
  inactive:    { label: "Inactive",    color: "text-slate-500",   bg: "bg-slate-100"   },
  maintenance: { label: "Maintenance", color: "text-amber-700",   bg: "bg-amber-100"   },
};

const CAT_COLORS: Record<string, string> = {
  Room:   "bg-blue-50 text-blue-700",
  Suite:  "bg-purple-50 text-purple-700",
  Event:  "bg-teal-50 text-teal-700",
  "Add-on": "bg-orange-50 text-orange-700",
};

const inp = "w-full px-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-violet-400 placeholder:text-slate-400";
const lbl = "block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5";

export default function Services() {
  const [services, setServices] = useState(SERVICES);
  const [editing,  setEditing]  = useState<Service | null>(null);
  const [editRate, setEditRate] = useState("");
  const [saved,    setSaved]    = useState<string | null>(null);

  const toggleAvail = (id: string) => {
    setServices(sv => sv.map(s => s.id === id ? { ...s, available: !s.available } : s));
  };

  const openEdit = (s: Service) => { setEditing(s); setEditRate(String(s.baseRate)); setSaved(null); };
  const saveEdit = () => {
    if (!editing) return;
    setServices(sv => sv.map(s => s.id === editing.id ? { ...s, baseRate: Number(editRate) } : s));
    setSaved(editing.id);
    setTimeout(() => { setEditing(null); setSaved(null); }, 800);
  };

  const occupancyPct = (s: Service) => s.capacity > 0 ? Math.round((s.booked / s.capacity) * 100) : 0;

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-slate-800 text-[20px] font-bold">Manage Services</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">{services.filter(s => s.status === "active").length} active services · {services.length} total</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Services",    value: String(services.filter(s => s.status === "active").length),      sub: "Currently bookable"    },
          { label: "In Maintenance",     value: String(services.filter(s => s.status === "maintenance").length), sub: "Temporarily offline"   },
          { label: "Avg Occupancy",      value: `${Math.round(services.reduce((s, sv) => s + occupancyPct(sv), 0) / services.length)}%`, sub: "Across all rooms/units" },
          { label: "Avg Base Rate",      value: fmtAED(Math.round(services.reduce((s, sv) => s + sv.baseRate, 0) / services.length)), sub: "Per night" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-2">{c.label}</p>
            <p className="text-[22px] font-bold text-slate-800 leading-none mb-1">{c.value}</p>
            <p className="text-[10px] text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Service list */}
      <div className="space-y-3">
        {services.map(s => {
          const occ = occupancyPct(s);
          const stCfg = STATUS_CFG[s.status];
          const catColor = CAT_COLORS[s.category] ?? "bg-slate-100 text-slate-600";

          return (
            <div key={s.id} className={`bg-white rounded-xl border transition-all ${s.status === "maintenance" ? "border-amber-200 bg-amber-50/20" : "border-slate-200"}`}>
              <div className="flex items-center gap-5 px-5 py-4">
                {/* Toggle */}
                <button
                  onClick={() => toggleAvail(s.id)}
                  disabled={s.status === "maintenance"}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors disabled:opacity-40 ${s.available ? "bg-emerald-500" : "bg-slate-200"}`}
                >
                  <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform my-0.5 ${s.available ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>

                {/* Info */}
                <div className="flex-1 grid grid-cols-4 gap-4 items-center min-w-0">
                  <div className="col-span-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[12px] font-bold text-slate-800 truncate">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${catColor}`}>{s.category}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${stCfg.bg} ${stCfg.color}`}>{stCfg.label}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Base Rate</p>
                    <p className="text-[13px] font-bold font-mono text-slate-800">{fmtAED(s.baseRate)}<span className="text-[10px] font-normal text-slate-400">/night</span></p>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">Occupancy</span>
                      <span className="font-bold text-slate-700">{s.booked}/{s.capacity} ({occ}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${occ >= 80 ? "bg-red-400" : occ >= 60 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${occ}%` }} />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 mb-1">Amenities</p>
                    <div className="flex flex-wrap gap-1">
                      {s.amenities.slice(0, 3).map(a => <span key={a} className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{a}</span>)}
                      {s.amenities.length > 3 && <span className="text-[9px] text-slate-400">+{s.amenities.length - 3}</span>}
                    </div>
                  </div>
                </div>

                <button onClick={() => openEdit(s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0">
                  <Edit2 size={11} /> Edit Rate
                </button>
              </div>

              {s.status === "maintenance" && (
                <div className="mx-5 mb-4 flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle size={12} /> Room is under maintenance and not available for booking.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">{editing.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Update rate & availability</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Base Rate (AED / night)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold">AED</span>
                  <input type="number" value={editRate} onChange={e => setEditRate(e.target.value)} className={inp + " pl-10 font-mono"} />
                </div>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select className={inp + " appearance-none"}>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Maintenance</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Availability Note (optional)</label>
                <textarea rows={2} placeholder="e.g. Unavailable 20–25 Jan for refurbishment" className={inp + " resize-none"} />
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500">
                Current rate: <span className="font-bold text-slate-800 font-mono">{fmtAED(editing.baseRate)}/night</span>
                {Number(editRate) !== editing.baseRate && editRate && (
                  <span className={`ml-2 font-bold ${Number(editRate) > editing.baseRate ? "text-emerald-600" : "text-red-600"}`}>
                    → {fmtAED(Number(editRate))}/night
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={saveEdit} className={`px-5 py-2 rounded-lg text-[12px] font-bold transition-colors flex items-center gap-1.5 ${saved === editing.id ? "bg-emerald-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                {saved === editing.id ? <><CheckCircle2 size={13} /> Saved!</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
