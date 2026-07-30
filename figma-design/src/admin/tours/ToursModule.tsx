import { useState } from "react";
import { Plus, Search, Star, MapPin, Users, FileText, Calendar, Clock, ChevronRight, Printer } from "lucide-react";
import {
  TOUR_PACKAGES, TOUR_GUIDES, TOUR_GROUPS, TOUR_BOOKINGS, TOUR_QUOTATIONS, TOUR_INVOICES,
  TourPackage, TourGuide, fmtAED,
} from "./data";

type ModTab = "builder"|"itinerary"|"groups"|"guides"|"pricing"|"quotations"|"bookings"|"reports";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"builder",    label:"Package Builder"     },
  { key:"itinerary",  label:"Itinerary View"      },
  { key:"groups",     label:"Group Management"    },
  { key:"guides",     label:"Guide Management"    },
  { key:"pricing",    label:"Pricing Config"      },
  { key:"quotations", label:"Quotation Generator" },
  { key:"bookings",   label:"Booking List"        },
  { key:"reports",    label:"Invoice & Report"    },
];

const TYPE_BADGE: Record<string,string> = {
  cultural:"bg-purple-100 text-purple-700", adventure:"bg-green-100 text-green-700",
  beach:"bg-sky-100 text-sky-700",          city:"bg-slate-100 text-slate-600",
  religious:"bg-amber-100 text-amber-700",  safari:"bg-orange-100 text-orange-700",
};
const STATUS_CFG: Record<string,{ bg:string;color:string;label:string }> = {
  active:    { bg:"bg-emerald-100", color:"text-emerald-700", label:"Active"    },
  draft:     { bg:"bg-slate-100",   color:"text-slate-500",   label:"Draft"     },
  full:      { bg:"bg-red-100",     color:"text-red-700",     label:"Full"      },
  completed: { bg:"bg-blue-100",    color:"text-blue-700",    label:"Completed" },
  cancelled: { bg:"bg-red-100",     color:"text-red-700",     label:"Cancelled" },
};
const QUOTE_STATUS_CFG: Record<string,{ bg:string;color:string;label:string }> = {
  draft:    { bg:"bg-slate-100",   color:"text-slate-500",   label:"Draft"    },
  sent:     { bg:"bg-blue-100",    color:"text-blue-700",    label:"Sent"     },
  accepted: { bg:"bg-emerald-100", color:"text-emerald-700", label:"Accepted" },
  rejected: { bg:"bg-red-100",     color:"text-red-700",     label:"Rejected" },
};
const INVOICE_CFG: Record<string,{ bg:string;color:string;label:string }> = {
  paid:    { bg:"bg-emerald-100", color:"text-emerald-700", label:"Paid"    },
  pending: { bg:"bg-amber-100",   color:"text-amber-700",   label:"Pending" },
  overdue: { bg:"bg-red-100",     color:"text-red-700",     label:"Overdue" },
};

// ── Package Builder ───────────────────────────────────────────────────────────
function BuilderTab() {
  const [days, setDays] = useState(3);
  return (
    <div className="grid grid-cols-[320px_1fr] gap-5">
      {/* Left: basic info */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Package Info</p>
          {[["Package Name","e.g. European Grand Tour"],["Destination","e.g. Paris · Rome · Barcelona"],["Duration","e.g. 14 Nights / 15 Days"],["Min Pax","10"],["Max Pax","25"]].map(([l,p]) => (
            <div key={l} className="mb-2">
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
              <input placeholder={p} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
            </div>
          ))}
          <div className="mb-2">
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Tour Type</label>
            <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50">
              <option>Cultural</option><option>Adventure</option><option>Beach</option>
              <option>City</option><option>Religious</option><option>Safari</option>
            </select>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Inclusions</p>
          <div className="space-y-1.5">
            {["Hotel Accommodation","Daily Breakfast","Guided Tours","Coach Transport","Airport Transfers"].map(inc => (
              <label key={inc} className="flex items-center gap-2 cursor-pointer">
                <div className="size-3.5 rounded border-2 border-amber-400 bg-amber-50 flex items-center justify-center">
                  <div className="size-1.5 rounded-sm bg-amber-500"/>
                </div>
                <span className="text-[10.5px] text-slate-700">{inc}</span>
              </label>
            ))}
            {["Visa Fees","International Flights","Travel Insurance","Personal Expenses"].map(exc => (
              <label key={exc} className="flex items-center gap-2 cursor-pointer opacity-50">
                <div className="size-3.5 rounded border border-slate-300"/>
                <span className="text-[10.5px] text-slate-500 line-through">{exc}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      {/* Right: itinerary builder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-700">Itinerary Days ({days})</p>
          <div className="flex gap-2">
            <button onClick={() => setDays(d=>Math.max(1,d-1))} className="size-7 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 font-bold text-[14px]">−</button>
            <button onClick={() => setDays(d=>d+1)}             className="size-7 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 font-bold text-[14px]">+</button>
          </div>
        </div>
        {Array.from({length:days}).map((_,i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">{i+1}</div>
              <input placeholder={`Day ${i+1} Title`} className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="Accommodation" className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
              <input placeholder="Meals (e.g. B/D)" className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
              <input placeholder="Activities" className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
            </div>
          </div>
        ))}
        <button className="w-full py-2.5 bg-amber-500 text-white text-[11px] font-bold rounded-xl hover:bg-amber-600">Save Package</button>
      </div>
    </div>
  );
}

// ── Itinerary View ────────────────────────────────────────────────────────────
function ItineraryTab() {
  const [sel, setSel] = useState<TourPackage>(TOUR_PACKAGES[0]);
  return (
    <div className="grid grid-cols-[220px_1fr] gap-5">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
          <p className="text-[9.5px] font-bold text-slate-500 uppercase">Packages</p>
        </div>
        {TOUR_PACKAGES.map(p => (
          <button key={p.id} onClick={() => setSel(p)}
            className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${sel.id===p.id?"bg-amber-50":"hover:bg-slate-50"}`}>
            <p className="text-[10px] font-bold text-slate-800 truncate">{p.name}</p>
            <p className="text-[9px] text-slate-400">{p.duration}</p>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <MapPin size={16} className="text-amber-600"/>
          <div>
            <p className="text-[13px] font-bold text-slate-800">{sel.name}</p>
            <p className="text-[10px] text-slate-500">{sel.destination} · {sel.duration}</p>
          </div>
          <span className={`ml-auto text-[9.5px] font-bold px-2 py-0.5 rounded capitalize ${TYPE_BADGE[sel.type]}`}>{sel.type}</span>
        </div>
        {sel.itinerary.map(day => (
          <div key={day.day} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
            <div className="size-8 rounded-xl bg-slate-800 text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0">{day.day}</div>
            <div className="flex-1">
              <p className="text-[11.5px] font-bold text-slate-800 mb-0.5">{day.title}</p>
              <p className="text-[9.5px] text-slate-500 mb-2">{day.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">🏨 {day.accommodation}</span>
                <span className="text-[9px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded">🍽 {day.meals}</span>
                {day.activities.map(a => <span key={a} className="text-[9px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">{a}</span>)}
              </div>
            </div>
          </div>
        ))}
        {sel.itinerary.length < sel.days && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
            <p className="text-[10px] text-slate-400">{sel.days - sel.itinerary.length} more days not yet detailed</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Group Management ──────────────────────────────────────────────────────────
function GroupsTab() {
  const GROUP_STATUS_CFG: Record<string,{ bg:string;color:string;label:string }> = {
    forming:   { bg:"bg-amber-100",   color:"text-amber-700",   label:"Forming"   },
    confirmed: { bg:"bg-blue-100",    color:"text-blue-700",    label:"Confirmed" },
    ongoing:   { bg:"bg-emerald-100", color:"text-emerald-700", label:"Ongoing"   },
    completed: { bg:"bg-slate-100",   color:"text-slate-500",   label:"Completed" },
    cancelled: { bg:"bg-red-100",     color:"text-red-700",     label:"Cancelled" },
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Tour Groups ({TOUR_GROUPS.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Group</button>
      </div>
      <div className="space-y-3">
        {TOUR_GROUPS.map(g => {
          const sc = GROUP_STATUS_CFG[g.status];
          return (
            <div key={g.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><Users size={14}/></div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{g.packageName}</p>
                <p className="text-[10px] text-slate-500">{g.destination} · {g.guideName}</p>
                <p className="text-[9.5px] text-slate-400">{g.departure} → {g.returnDate}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-600"><Users size={10}/>{g.pilgrims} pax</div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <button className="px-3 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">Roster</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Guide Management ──────────────────────────────────────────────────────────
function GuidesTab() {
  const GUIDE_STATUS_CFG: Record<string,{ bg:string;color:string;label:string }> = {
    available: { bg:"bg-emerald-100", color:"text-emerald-700", label:"Available" },
    on_tour:   { bg:"bg-blue-100",    color:"text-blue-700",    label:"On Tour"   },
    off_duty:  { bg:"bg-slate-100",   color:"text-slate-500",   label:"Off Duty"  },
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Tour Guides ({TOUR_GUIDES.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add Guide</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Guide","Nationality","Languages","Specialization","Tours","Rating","Status",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOUR_GUIDES.map((g, i) => {
              const sc = GUIDE_STATUS_CFG[g.status];
              return (
                <tr key={g.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-800">{g.name}</p>
                    <p className="text-[9px] text-slate-400">{g.email}</p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{g.nationality}</td>
                  <td className="px-3 py-2.5"><div className="flex flex-wrap gap-0.5">{g.languages.slice(0,3).map(l => <span key={l} className="text-[8px] font-semibold px-1 py-0.5 bg-slate-100 text-slate-500 rounded">{l}</span>)}</div></td>
                  <td className="px-3 py-2.5"><div className="flex flex-wrap gap-0.5">{g.specialization.map(s => <span key={s} className={`text-[8px] font-semibold px-1.5 py-0.5 rounded capitalize ${TYPE_BADGE[s]}`}>{s}</span>)}</div></td>
                  <td className="px-3 py-2.5 font-bold text-slate-700 text-center">{g.totalTours}</td>
                  <td className="px-3 py-2.5"><div className="flex items-center gap-0.5"><Star size={9} className="text-amber-400 fill-amber-400"/><span className="font-bold text-slate-700">{g.rating}</span></div></td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                  <td className="px-3 py-2.5"><button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">Profile</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Pricing Config ────────────────────────────────────────────────────────────
function PricingTab() {
  const [sel, setSel] = useState<TourPackage>(TOUR_PACKAGES[0]);
  return (
    <div className="grid grid-cols-[220px_1fr] gap-5">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
          <p className="text-[9.5px] font-bold text-slate-500 uppercase">Packages</p>
        </div>
        {TOUR_PACKAGES.map(p => (
          <button key={p.id} onClick={() => setSel(p)}
            className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${sel.id===p.id?"bg-amber-50":"hover:bg-slate-50"}`}>
            <p className="text-[10px] font-bold text-slate-800 truncate">{p.name}</p>
            <p className="text-[9px] text-slate-400 capitalize">{p.type}</p>
          </button>
        ))}
      </div>
      <div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div>
            <p className="text-[12px] font-bold text-slate-800">{sel.name}</p>
            <p className="text-[10px] text-slate-500">{sel.destination} · {sel.duration}</p>
          </div>
        </div>
        <div className="space-y-3">
          {sel.pricingTiers.map((tier, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-[11px] font-bold text-slate-800">{tier.label}</p>
                <span className="text-[9px] text-slate-400">{tier.minPax}–{tier.maxPax} pax</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["Price per Pax (AED)",String(tier.pricePerPax)],["Single Supplement (AED)",String(tier.singleSupp)],["Estimated Total (2 pax)",fmtAED(tier.pricePerPax*2)]].map(([l,v]) => (
                  <div key={l}>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
                    <input defaultValue={v} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] font-mono focus:outline-none focus:border-amber-400 bg-slate-50"/>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-amber-300 text-amber-600 text-[10.5px] font-bold rounded-xl hover:bg-amber-50 w-full justify-center"><Plus size={12}/> Add Pricing Tier</button>
          <button className="w-full py-2.5 bg-amber-500 text-white text-[11px] font-bold rounded-xl hover:bg-amber-600">Save Pricing</button>
        </div>
      </div>
    </div>
  );
}

// ── Quotation Generator ───────────────────────────────────────────────────────
function QuotationsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Quotations ({TOUR_QUOTATIONS.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Quotation</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Ref","Client","Package","Pax","Departure","Total (AED)","Valid Until","Status",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOUR_QUOTATIONS.map((q,i) => {
              const sc = QUOTE_STATUS_CFG[q.status];
              return (
                <tr key={q.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{q.ref}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{q.clientName}</td>
                  <td className="px-3 py-2.5 text-slate-600">{q.packageName}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{q.pax}</td>
                  <td className="px-3 py-2.5 text-slate-500">{q.departure}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{fmtAED(q.totalAED)}</td>
                  <td className="px-3 py-2.5 text-slate-400">{q.validUntil}</td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                  <td className="px-3 py-2.5 flex gap-2">
                    <button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">View</button>
                    {q.status==="draft" && <button className="text-[9.5px] text-blue-600 font-bold hover:text-blue-700">Send</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Quotation builder form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-700 mb-3">Generate New Quotation</p>
        <div className="grid grid-cols-3 gap-3">
          {["Client Name","Email","Phone","Select Package","Departure Date","Number of Pax","Room Type","Special Requests","Validity Days"].map(l => (
            <div key={l} className={l==="Special Requests"?"col-span-3":""}>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
              <input placeholder={l} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button className="px-5 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600">Generate Quotation</button>
          <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-[10.5px] font-semibold rounded-xl hover:bg-slate-50"><Printer size={11}/> Preview PDF</button>
        </div>
      </div>
    </div>
  );
}

// ── Booking List ──────────────────────────────────────────────────────────────
function BookingsTab() {
  const [search, setSearch] = useState("");
  const shown = search ? TOUR_BOOKINGS.filter(b => b.passengerName.toLowerCase().includes(search.toLowerCase())) : TOUR_BOOKINGS;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search passenger…"
            className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:border-amber-400 bg-white w-48"/>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Booking</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Ref","Passenger","Package","Pax","Departure","Total","Type","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((b, i) => {
              const sc = STATUS_CFG[b.status];
              return (
                <tr key={b.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{b.ref}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{b.passengerName}</td>
                  <td className="px-3 py-2.5 text-slate-600 max-w-[180px] truncate">{b.packageName}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{b.pax}</td>
                  <td className="px-3 py-2.5 text-slate-500">{b.departure}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{fmtAED(b.totalFare)}</td>
                  <td className="px-3 py-2.5 capitalize text-slate-500">{b.type}</td>
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

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const total = TOUR_INVOICES.reduce((s,i) => s+i.amount, 0);
  const paid  = TOUR_INVOICES.filter(i=>i.status==="paid").reduce((s,i) => s+i.amount, 0);
  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Revenue",fmtAED(total),"text-slate-800"],["Collected",fmtAED(paid),"text-emerald-600"],["Pending",fmtAED(total-paid),"text-amber-600"],["Bookings",String(TOUR_BOOKINGS.length),"text-blue-600"]].map(([l,v,c]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-[18px] font-bold font-mono ${c}`}>{v}</p>
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
            {TOUR_INVOICES.map((inv, i) => {
              const sc = INVOICE_CFG[inv.status];
              return (
                <tr key={inv.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{inv.ref}</td>
                  <td className="px-3 py-2.5 capitalize text-slate-600">{inv.type}</td>
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
export default function ToursModule() {
  const [tab, setTab] = useState<ModTab>("builder");
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Tour Package Management</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{TOUR_PACKAGES.length} packages · {TOUR_GROUPS.length} groups · {TOUR_BOOKINGS.length} bookings</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Package</button>
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
        {tab==="builder"    && <BuilderTab/>}
        {tab==="itinerary"  && <ItineraryTab/>}
        {tab==="groups"     && <GroupsTab/>}
        {tab==="guides"     && <GuidesTab/>}
        {tab==="pricing"    && <PricingTab/>}
        {tab==="quotations" && <QuotationsTab/>}
        {tab==="bookings"   && <BookingsTab/>}
        {tab==="reports"    && <ReportsTab/>}
      </div>
    </div>
  );
}
