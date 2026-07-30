import { useState } from "react";
import {
  Search, Plus, ChevronDown, CheckCircle2, XCircle, Clock,
  Plane, Users, Briefcase, FileText, BarChart2, RotateCcw, AlertTriangle,
} from "lucide-react";
import {
  FLIGHT_OPTIONS, PNR_RECORDS, CORPORATE_ACCOUNTS, GROUP_BOOKINGS, TICKET_INVOICES,
  FlightOption, PNRRecord, fmtAED,
} from "./data";

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  confirmed: { label:"Confirmed", color:"text-blue-700",    bg:"bg-blue-100"    },
  issued:    { label:"Issued",    color:"text-emerald-700", bg:"bg-emerald-100" },
  pending:   { label:"Pending",   color:"text-amber-700",   bg:"bg-amber-100"   },
  cancelled: { label:"Cancelled", color:"text-red-700",     bg:"bg-red-100"     },
  refunded:  { label:"Refunded",  color:"text-violet-700",  bg:"bg-violet-100"  },
};
const CLASS_CFG = {
  economy:  { label:"Economy",  color:"text-slate-600",  bg:"bg-slate-100"  },
  business: { label:"Business", color:"text-blue-700",   bg:"bg-blue-100"   },
  first:    { label:"First",    color:"text-amber-700",  bg:"bg-amber-100"  },
};
const INVOICE_STATUS_CFG = {
  paid:    { label:"Paid",    color:"text-emerald-700", bg:"bg-emerald-100" },
  pending: { label:"Pending", color:"text-amber-700",   bg:"bg-amber-100"   },
  overdue: { label:"Overdue", color:"text-red-700",     bg:"bg-red-100"     },
};
const TYPE_CFG = {
  individual: { label:"Individual", color:"text-slate-600",  bg:"bg-slate-100"  },
  group:      { label:"Group",      color:"text-violet-700", bg:"bg-violet-100" },
  corporate:  { label:"Corporate",  color:"text-blue-700",   bg:"bg-blue-100"   },
};

type ModTab = "search"|"fares"|"booking"|"pnr"|"issue"|"reissue"|"group"|"corporate"|"reports";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"search",    label:"Flight Search"        },
  { key:"fares",     label:"Fare & Availability"  },
  { key:"booking",   label:"Booking"              },
  { key:"pnr",       label:"PNR / Ticket View"    },
  { key:"issue",     label:"Issue Ticket"         },
  { key:"reissue",   label:"Reissue / Cancel / Refund" },
  { key:"group",     label:"Group Booking"        },
  { key:"corporate", label:"Corporate Booking"    },
  { key:"reports",   label:"Invoice & Report"     },
];

// ── Flight Search Tab ─────────────────────────────────────────────────────────
function FlightSearchTab({ onSearch }: { onSearch: () => void }) {
  const [formData, setFormData] = useState({ origin:"Dubai (DXB)", dest:"London (LHR)", date:"22 Jan 2025", returnDate:"29 Jan 2025", pax:"1", cls:"Economy", tripType:"return" });
  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-5">
          {["return","one_way","multi_city"].map(t => (
            <label key={t} className="flex items-center gap-1.5 cursor-pointer">
              <div className={`size-4 rounded-full border-2 flex items-center justify-center ${formData.tripType===t?"border-amber-500":"border-slate-300"}`}>
                {formData.tripType===t && <div className="size-2 rounded-full bg-amber-500"/>}
              </div>
              <span className="text-[11px] font-semibold text-slate-700 capitalize">{t.replace("_"," ")}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_1fr_140px_140px_100px_120px] gap-3 items-end">
          {[
            { label:"From",       key:"origin",     placeholder:"City or Airport" },
            { label:"To",         key:"dest",       placeholder:"City or Airport" },
            { label:"Departure",  key:"date",       placeholder:"dd/mm/yyyy"     },
            { label:"Return",     key:"returnDate", placeholder:"dd/mm/yyyy"     },
            { label:"Passengers", key:"pax",        placeholder:"1"              },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">{f.label}</label>
              <input value={(formData as any)[f.key]} onChange={e=>setFormData(p=>({...p,[f.key]:e.target.value}))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
            </div>
          ))}
          <div>
            <label className="block text-[9.5px] font-bold text-slate-400 uppercase mb-1">Class</label>
            <select value={formData.cls} onChange={e=>setFormData(p=>({...p,cls:e.target.value}))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50">
              <option>Economy</option><option>Business</option><option>First</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {["Direct only","Flexible dates","Add corporate code"].map(opt => (
              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                <div className="size-3.5 rounded border border-slate-300"/>
                <span className="text-[10px] text-slate-500">{opt}</span>
              </label>
            ))}
          </div>
          <button onClick={onSearch}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white text-[11px] font-bold rounded-xl hover:bg-amber-600 transition-colors">
            <Search size={13}/> Search Flights
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fare Results Tab ──────────────────────────────────────────────────────────
function FaresTab({ onBook }: { onBook: (f: FlightOption) => void }) {
  const [selectedCls, setSelectedCls] = useState<"all"|"economy"|"business"|"first">("all");
  const [sortBy, setSortBy] = useState<"price"|"duration"|"airline">("price");
  const filtered = FLIGHT_OPTIONS
    .filter(f => selectedCls==="all" || f.fareClass===selectedCls)
    .sort((a,b) => sortBy==="price" ? a.fareAED-b.fareAED : sortBy==="duration" ? a.duration.localeCompare(b.duration) : a.airline.localeCompare(b.airline));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[12px] font-bold text-slate-700">{filtered.length} flights found</p>
          <p className="text-[10px] text-slate-400">Dubai (DXB) → London (LHR) · 22 Jan 2025 · 1 Adult</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Sort:</span>
          {["price","duration","airline"].map(s => (
            <button key={s} onClick={() => setSortBy(s as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${sortBy===s?"bg-amber-500 text-white":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{s}</button>
          ))}
          <div className="w-px h-4 bg-slate-200 mx-1"/>
          {["all","economy","business","first"].map(c => (
            <button key={c} onClick={() => setSelectedCls(c as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${selectedCls===c?"bg-amber-500 text-white":"bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{c==="all"?"All Classes":c}</button>
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        {filtered.map(f => {
          const cc = CLASS_CFG[f.fareClass];
          return (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-5 hover:border-amber-300 hover:shadow-sm transition-all">
              <div className="w-20 flex-shrink-0 text-center">
                <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-0.5">
                  <span className="text-[10px] font-black text-slate-700">{f.logo}</span>
                </div>
                <p className="text-[9px] text-slate-500">{f.airline}</p>
                <p className="text-[8.5px] font-mono text-slate-400">{f.flightNo}</p>
              </div>
              <div className="flex-1 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[18px] font-bold text-slate-800 font-mono">{f.departure}</p>
                  <p className="text-[10px] text-slate-500">{f.originCode}</p>
                </div>
                <div className="flex-1 relative flex flex-col items-center">
                  <p className="text-[9px] text-slate-400 mb-1">{f.duration} · {f.stops===0?"Non-stop":f.stops===1?`1 stop via ${f.stopInfo}`:`${f.stops} stops`}</p>
                  <div className="w-full flex items-center gap-1">
                    <div className="flex-1 h-px bg-slate-300"/>
                    {f.stops===0 ? <Plane size={10} className="text-slate-400 flex-shrink-0"/> : <div className="size-1.5 rounded-full bg-amber-400 flex-shrink-0"/>}
                    <div className="flex-1 h-px bg-slate-300"/>
                  </div>
                  {f.stops>0 && <p className="text-[8px] text-amber-600 font-semibold mt-0.5">{f.stopInfo}</p>}
                </div>
                <div className="text-center">
                  <p className="text-[18px] font-bold text-slate-800 font-mono">{f.arrival}</p>
                  <p className="text-[10px] text-slate-500">{f.destinationCode}</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${cc.bg} ${cc.color}`}>{cc.label}</span>
                <p className="text-[9.5px] text-slate-400">{f.baggage} baggage</p>
                <p className="text-[9.5px] text-slate-400">{f.available} seats left</p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-[9px] text-slate-400">per person</p>
                <p className="text-[20px] font-bold font-mono text-slate-800">{fmtAED(f.fareAED)}</p>
                <button onClick={() => onBook(f)}
                  className="mt-1.5 px-4 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600 transition-colors w-full">
                  Select
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Booking Tab ───────────────────────────────────────────────────────────────
function BookingTab({ selected }: { selected: FlightOption | null }) {
  if (!selected) {
    return (
      <div className="text-center py-16">
        <Plane size={32} className="text-slate-300 mx-auto mb-3"/>
        <p className="text-[12px] font-bold text-slate-500">No flight selected</p>
        <p className="text-[10.5px] text-slate-400 mt-1">Go to Fare & Availability to select a flight</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      <div className="space-y-4">
        {/* Selected flight summary */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="size-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <span className="text-[11px] font-black text-amber-700">{selected.logo}</span>
          </div>
          <div className="flex-1">
            <p className="text-[11.5px] font-bold text-slate-800">{selected.airline} {selected.flightNo}</p>
            <p className="text-[10px] text-slate-600">{selected.originCode} → {selected.destinationCode} · {selected.departure} – {selected.arrival} · {selected.duration}</p>
          </div>
          <div className="text-right">
            <p className="text-[18px] font-bold font-mono text-amber-700">{fmtAED(selected.fareAED)}</p>
            <p className="text-[9px] text-amber-600">per person</p>
          </div>
        </div>
        {/* Passenger details */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Passenger 1 — Lead Traveller</p>
          <div className="grid grid-cols-2 gap-3">
            {[["Title","Mr / Mrs / Ms"],["Given Name",""],["Surname",""],["Passport No",""],["Nationality",""],["Date of Birth","dd/mm/yyyy"],["Passport Expiry","dd/mm/yyyy"],["Email",""]].map(([l,p]) => (
              <div key={l}>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
                <input placeholder={p || l} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
              </div>
            ))}
          </div>
        </div>
        {/* Seat selection (mock grid) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Seat Selection</p>
          <div className="flex gap-3 mb-3">
            {[{label:"Available",cls:"bg-slate-100 border-slate-300"},{label:"Selected",cls:"bg-amber-400 border-amber-500"},{label:"Occupied",cls:"bg-slate-400 border-slate-400"}].map(({label,cls})=>(
              <div key={label} className="flex items-center gap-1.5">
                <div className={`size-4 rounded border ${cls}`}/>
                <span className="text-[9px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          <div className="font-mono text-[9px] space-y-1 max-h-[160px] overflow-y-auto">
            {[22,23,24,25,26,27,28].map(row => (
              <div key={row} className="flex items-center gap-1">
                <span className="w-5 text-slate-400">{row}</span>
                <div className="flex gap-1">
                  {["A","B","C"].map(seat => {
                    const occupied = ["22A","22C","23B","24A","25C","26B"].includes(`${row}${seat}`);
                    const selected2 = "24C" === `${row}${seat}`;
                    return (
                      <div key={seat} className={`size-6 rounded border flex items-center justify-center cursor-pointer text-[8px] font-bold
                        ${occupied?"bg-slate-300 border-slate-400 text-slate-500 cursor-default":selected2?"bg-amber-400 border-amber-500 text-white":"bg-slate-100 border-slate-300 text-slate-600 hover:bg-amber-100 hover:border-amber-300"}`}>
                        {seat}
                      </div>
                    );
                  })}
                </div>
                <div className="w-4"/>
                <div className="flex gap-1">
                  {["D","E","F"].map(seat => {
                    const occupied = ["22D","23E","25F","27D"].includes(`${row}${seat}`);
                    return (
                      <div key={seat} className={`size-6 rounded border flex items-center justify-center cursor-pointer text-[8px] font-bold
                        ${occupied?"bg-slate-300 border-slate-400 text-slate-500 cursor-default":"bg-slate-100 border-slate-300 text-slate-600 hover:bg-amber-100 hover:border-amber-300"}`}>
                        {seat}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Fare summary */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Fare Breakdown</p>
          {[["Base Fare","1 pax",selected.fareAED],["Taxes & Fees","",Math.round(selected.fareAED*0.15)],["Service Fee","",180]].map(([l,n,v])=>(
            <div key={String(l)} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 text-[10.5px]">
              <span className="text-slate-600">{l}{n&&<span className="text-slate-400"> ({n})</span>}</span>
              <span className="font-mono font-bold text-slate-700">{fmtAED(Number(v))}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-1 border-t-2 border-slate-200">
            <span className="text-[11px] font-bold text-slate-800">Total</span>
            <span className="font-mono font-bold text-[14px] text-amber-600">{fmtAED(selected.fareAED + Math.round(selected.fareAED*0.15) + 180)}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Payment Method</p>
          {["Corporate Account","Credit Card","Bank Transfer"].map((m,i) => (
            <label key={m} className="flex items-center gap-2 py-1.5 cursor-pointer">
              <div className={`size-4 rounded-full border-2 flex items-center justify-center ${i===0?"border-amber-500":"border-slate-300"}`}>
                {i===0 && <div className="size-2 rounded-full bg-amber-500"/>}
              </div>
              <span className="text-[10.5px] text-slate-700">{m}</span>
            </label>
          ))}
        </div>
        <button className="w-full py-3 bg-amber-500 text-white text-[11px] font-bold rounded-xl hover:bg-amber-600 transition-colors">
          Confirm Booking & Hold PNR
        </button>
        <p className="text-[9px] text-slate-400 text-center">Ticketing deadline: 24h from hold</p>
      </div>
    </div>
  );
}

// ── PNR / Ticket View ─────────────────────────────────────────────────────────
function PNRTab() {
  const [selected, setSelected] = useState<PNRRecord>(PNR_RECORDS[0]);
  const sc = STATUS_CFG[selected.status];
  const cc = { economy:"Economy", business:"Business", first:"First" }[selected.fareClass.toLowerCase()] ?? selected.fareClass;
  return (
    <div className="grid grid-cols-[280px_1fr] gap-5">
      {/* PNR list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
          <p className="text-[9.5px] font-bold text-slate-500 uppercase">All PNRs ({PNR_RECORDS.length})</p>
        </div>
        {PNR_RECORDS.map(pnr => {
          const scc = STATUS_CFG[pnr.status];
          return (
            <button key={pnr.id} onClick={() => setSelected(pnr)}
              className={`w-full text-left px-3 py-3 border-b border-slate-100 transition-colors ${selected.id===pnr.id?"bg-amber-50":"hover:bg-slate-50"}`}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-800 font-mono">{pnr.pnrCode}</p>
                <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${scc.bg} ${scc.color}`}>{scc.label}</span>
              </div>
              <p className="text-[9.5px] text-slate-500">{pnr.route}</p>
              <p className="text-[9px] text-slate-400">{pnr.passengers.length} pax · {fmtAED(pnr.totalFare)}</p>
            </button>
          );
        })}
      </div>
      {/* Ticket detail — e-ticket style */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* E-ticket header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-[8px] font-bold uppercase tracking-widest mb-0.5">Electronic Ticket</p>
            <p className="text-white text-[18px] font-bold font-mono">{selected.pnrCode}</p>
            <p className="text-white/60 text-[9px] font-mono">{selected.ticketNo}</p>
          </div>
          <div className="text-right">
            <p className="text-white text-[10px] font-semibold">{selected.airline}</p>
            <p className="text-white/60 text-[9px]">{selected.flightNo}</p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded mt-1 inline-block ${sc.bg} ${sc.color}`}>{sc.label}</span>
          </div>
        </div>
        {/* Flight info */}
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-6">
            {[["Departure",selected.route.split("→")[0]?.trim(),selected.departure],["Arrival",selected.route.split("→")[1]?.trim(),selected.arrival]].map(([label,loc,time],i) => (
              <div key={i} className={i===0?"":"text-right"}>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-[22px] font-bold font-mono text-slate-800">{time?.split(" ")[1] ?? time}</p>
                <p className="text-[11px] font-bold text-slate-700">{loc}</p>
                <p className="text-[9px] text-slate-400">{time?.split(" ").slice(0,2).join(" ")}</p>
              </div>
            ))}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 h-px bg-slate-300"/>
                <Plane size={14} className="text-slate-400 flex-shrink-0"/>
                <div className="flex-1 h-px bg-slate-300"/>
              </div>
              <p className="text-[9.5px] text-slate-500 mt-1">{cc} · {selected.fareClass}</p>
            </div>
          </div>
        </div>
        {/* Passengers */}
        <div className="px-5 py-4 border-b border-slate-200">
          <p className="text-[9.5px] font-bold text-slate-400 uppercase mb-3">Passengers ({selected.passengers.length})</p>
          <div className="space-y-2">
            {selected.passengers.map((p,i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                <div className="size-6 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black flex items-center justify-center">{i+1}</div>
                <p className="flex-1 font-bold text-[11px] text-slate-800">{p.name}</p>
                <p className="font-mono text-[10px] text-slate-500">{p.passport}</p>
                <p className="text-[10px] text-slate-500 w-10 text-center">{p.seat || "—"}</p>
                <p className="font-mono font-bold text-[10.5px] text-slate-700 w-24 text-right">{fmtAED(p.fare)}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
          <div>
            <p className="text-[9px] text-slate-400">Issued by {selected.issuedBy} · {selected.issuedAt}</p>
            {selected.groupName && <p className="text-[9px] text-violet-600 font-semibold">Group: {selected.groupName}</p>}
            {selected.corporateRef && <p className="text-[9px] text-blue-600 font-semibold">Corporate: {selected.corporateRef}</p>}
          </div>
          <div className="flex items-center gap-2">
            <p className="font-mono font-bold text-[16px] text-slate-800">{fmtAED(selected.totalFare)}</p>
            <button className="px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:bg-amber-600">Print E-Ticket</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Issue Ticket Tab ──────────────────────────────────────────────────────────
function IssueTab() {
  const pending = PNR_RECORDS.filter(p => p.status==="confirmed");
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Confirmed Bookings — Ready to Issue ({pending.length})</p>
      <div className="space-y-2">
        {pending.map(pnr => (
          <div key={pnr.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="size-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[11px]">
              {pnr.airline.slice(0,2)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-bold font-mono text-slate-800">{pnr.pnrCode}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TYPE_CFG[pnr.type].bg} ${TYPE_CFG[pnr.type].color}`}>{TYPE_CFG[pnr.type].label}</span>
              </div>
              <p className="text-[10px] text-slate-500">{pnr.route} · {pnr.departure} · {pnr.passengers.length} pax</p>
            </div>
            <p className="font-mono font-bold text-[14px] text-slate-800">{fmtAED(pnr.totalFare)}</p>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600 transition-colors">
              <CheckCircle2 size={12}/> Issue Ticket
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reissue / Cancel / Refund ─────────────────────────────────────────────────
function ReissueTab() {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<"reissue"|"cancel"|"refund"|null>(null);
  const found = search ? PNR_RECORDS.find(p => p.pnrCode.toLowerCase()===search.toLowerCase() || p.ticketNo.includes(search)) : null;
  const REFUND_CFG = { eligible:{label:"Fully Refundable",color:"text-emerald-700",bg:"bg-emerald-100"}, partial:{label:"Partial Refund",color:"text-amber-700",bg:"bg-amber-100"}, non_refundable:{label:"Non-Refundable",color:"text-red-700",bg:"bg-red-100"} };
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Reissue / Cancel / Refund</p>
      <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl mb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Search by PNR or Ticket Number</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Enter PNR (e.g. EK7ABC) or ticket number…"
              className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
          </div>
          <button className="px-4 py-2.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600">Find</button>
        </div>
      </div>
      {!search && (
        <div className="text-center py-10 text-slate-400"><RotateCcw size={28} className="mx-auto mb-2 text-slate-300"/><p className="text-[11px]">Enter a PNR or ticket number to proceed</p></div>
      )}
      {search && !found && (
        <div className="text-center py-10"><AlertTriangle size={24} className="mx-auto mb-2 text-amber-400"/><p className="text-[11px] text-slate-500">No ticket found for "{search}"</p><p className="text-[10px] text-slate-400">Try: EK7ABC · BA9XYZ · EY4DEF</p></div>
      )}
      {found && (
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-5 max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[14px] font-bold font-mono text-slate-800">{found.pnrCode}</p>
              <p className="text-[10px] text-slate-500">{found.route} · {found.departure} · {found.passengers.length} pax</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_CFG[found.status].bg} ${STATUS_CFG[found.status].color}`}>{STATUS_CFG[found.status].label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${REFUND_CFG[found.refundStatus].bg} ${REFUND_CFG[found.refundStatus].color}`}>{REFUND_CFG[found.refundStatus].label}</span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-700 mb-3">Total Fare: {fmtAED(found.totalFare)}</p>
          <div className="flex gap-2">
            {[{key:"reissue",label:"Reissue",cls:"bg-blue-500 text-white hover:bg-blue-600"},{key:"cancel",label:"Cancel",cls:"bg-red-500 text-white hover:bg-red-600"},{key:"refund",label:"Process Refund",cls:"bg-emerald-500 text-white hover:bg-emerald-600"}].map(a => (
              <button key={a.key} onClick={() => setAction(a.key as any)} className={`px-4 py-2 text-[10.5px] font-bold rounded-xl transition-colors ${a.cls}`}>{a.label}</button>
            ))}
          </div>
          {action && <p className="mt-3 text-[10px] text-amber-600 font-semibold">{action.charAt(0).toUpperCase()+action.slice(1)} flow initiated — confirmation required.</p>}
        </div>
      )}
    </div>
  );
}

// ── Group Booking Tab ─────────────────────────────────────────────────────────
function GroupTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Group Bookings ({GROUP_BOOKINGS.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Group</button>
      </div>
      <div className="space-y-3 mb-5">
        {GROUP_BOOKINGS.map(g => {
          const sc = STATUS_CFG[g.status];
          return (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center"><Users size={15}/></div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{g.groupName}</p>
                <p className="text-[10px] text-slate-500">{g.route} · {g.travelDate} · {g.airline} · {g.fareClass}</p>
              </div>
              <span className="text-[11px] font-bold text-slate-700">{g.pax} pax</span>
              <p className="font-mono font-bold text-slate-800">{fmtAED(g.totalFare)}</p>
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <button className="px-3 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">Manage</button>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-700 mb-3">New Group Request</p>
        <div className="grid grid-cols-3 gap-3">
          {["Group Name","Airline Preference","Route","Travel Date","No. of Passengers","Fare Class"].map(l => (
            <div key={l}>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
              <input placeholder={l} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
            </div>
          ))}
        </div>
        <button className="mt-4 px-5 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600">Submit Group Request</button>
      </div>
    </div>
  );
}

// ── Corporate Booking Tab ─────────────────────────────────────────────────────
function CorporateTab() {
  const [selected, setSelected] = useState(CORPORATE_ACCOUNTS[0]);
  return (
    <div className="grid grid-cols-[280px_1fr] gap-5">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Corporate Accounts</p>
        {CORPORATE_ACCOUNTS.map(ca => {
          const pct = Math.round((ca.used/ca.creditLimit)*100);
          return (
            <button key={ca.id} onClick={() => setSelected(ca)}
              className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${selected.id===ca.id?"bg-amber-50 border-amber-300":"bg-white border-slate-200 hover:border-amber-200"}`}>
              <p className="text-[11px] font-bold text-slate-800">{ca.name}</p>
              <p className="text-[9px] font-mono text-slate-400 mb-1.5">{ca.ref}</p>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{width:`${pct}%`}}/>
              </div>
              <p className="text-[8.5px] text-slate-400 mt-0.5">{fmtAED(ca.used)} / {fmtAED(ca.creditLimit)} used</p>
            </button>
          );
        })}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-bold text-slate-800">{selected.name}</h3>
            <p className="text-[10px] text-slate-400">{selected.ref} · {selected.contact}</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Corporate Account</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[["Credit Limit",fmtAED(selected.creditLimit)],["Used",fmtAED(selected.used)],["Available",fmtAED(selected.creditLimit-selected.used)]].map(([l,v]) => (
            <div key={l} className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
              <p className="text-[16px] font-bold font-mono text-slate-800">{v}</p>
              <p className="text-[9px] text-slate-400">{l}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">New Booking for {selected.name}</p>
        <div className="grid grid-cols-2 gap-3">
          {["Traveller Name","Passport Number","Route","Travel Date","Fare Class","Budget Reference","Approver Name","Special Requirements"].map(l => (
            <div key={l}>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
              <input placeholder={l} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button className="px-5 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600">Search & Book</button>
          <button className="px-5 py-2 border border-slate-200 text-slate-600 text-[10.5px] font-semibold rounded-xl hover:bg-slate-50">View Account History</button>
        </div>
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const INVOICE_STATUS_CFG = { paid:{label:"Paid",color:"text-emerald-700",bg:"bg-emerald-100"}, pending:{label:"Pending",color:"text-amber-700",bg:"bg-amber-100"}, overdue:{label:"Overdue",color:"text-red-700",bg:"bg-red-100"} };
  const total = TICKET_INVOICES.reduce((s,i) => s+i.amount, 0);
  const paid  = TICKET_INVOICES.filter(i=>i.status==="paid").reduce((s,i) => s+i.amount, 0);
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Invoice & Revenue Summary</p>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Revenue",fmtAED(total),""],["Collected",fmtAED(paid),"text-emerald-600"],["Pending",fmtAED(total-paid),"text-amber-600"],["Bookings","25",""]].map(([l,v,c]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-[20px] font-bold font-mono ${c||"text-slate-800"}`}>{v}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Invoice Ref","Type","Customer","Amount","Date","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TICKET_INVOICES.map((inv, i) => {
              const sc = INVOICE_STATUS_CFG[inv.status];
              return (
                <tr key={inv.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{inv.ref}</td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded capitalize ${TYPE_CFG[inv.type as keyof typeof TYPE_CFG].bg} ${TYPE_CFG[inv.type as keyof typeof TYPE_CFG].color}`}>{inv.type}</span></td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{inv.customer}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-700">{fmtAED(inv.amount)}</td>
                  <td className="px-3 py-2.5 text-slate-500">{inv.date}</td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function TicketingModule() {
  const [tab, setTab] = useState<ModTab>("search");
  const [selectedFlight, setSelectedFlight] = useState<FlightOption|null>(null);

  function handleFlightSelect(f: FlightOption) { setSelectedFlight(f); setTab("booking"); }
  function handleSearch() { setTab("fares"); }

  const issued   = PNR_RECORDS.filter(p => p.status==="issued").length;
  const pending  = PNR_RECORDS.filter(p => p.status==="pending").length;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Air Ticketing</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{PNR_RECORDS.length} bookings · {issued} issued · {pending} pending</p>
          </div>
          <div className="flex items-center gap-2">
            {pending > 0 && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-lg"><Clock size={11}/>{pending} Pending Issue</span>}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Booking</button>
          </div>
        </div>
        <div className="flex gap-0 overflow-x-auto">
          {MOD_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 py-2.5 text-[10.5px] font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0
                ${tab===t.key?"border-amber-500 text-amber-600":"border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab==="search"    && <FlightSearchTab onSearch={handleSearch}/>}
        {tab==="fares"     && <FaresTab onBook={handleFlightSelect}/>}
        {tab==="booking"   && <BookingTab selected={selectedFlight}/>}
        {tab==="pnr"       && <PNRTab/>}
        {tab==="issue"     && <IssueTab/>}
        {tab==="reissue"   && <ReissueTab/>}
        {tab==="group"     && <GroupTab/>}
        {tab==="corporate" && <CorporateTab/>}
        {tab==="reports"   && <ReportsTab/>}
      </div>
    </div>
  );
}
