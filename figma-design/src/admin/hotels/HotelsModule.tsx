import { useState } from "react";
import {
  Search, Plus, Star, MapPin, CheckCircle2, XCircle, Clock,
  Users, FileText, BarChart2, RefreshCw, Building2, AlertTriangle,
} from "lucide-react";
import {
  HOTELS, HOTEL_BOOKINGS, RATE_SHEET, CHECK_RECORDS, CANCELLATIONS, HOTEL_INVOICES,
  HotelBooking, MEAL_PLAN_LABELS, fmtAED,
} from "./data";

// ── Design tokens ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  confirmed:   { label:"Confirmed",    color:"text-blue-700",    bg:"bg-blue-100"    },
  checked_in:  { label:"Checked In",   color:"text-emerald-700", bg:"bg-emerald-100" },
  checked_out: { label:"Checked Out",  color:"text-slate-600",   bg:"bg-slate-100"   },
  cancelled:   { label:"Cancelled",    color:"text-red-700",     bg:"bg-red-100"     },
  no_show:     { label:"No Show",      color:"text-red-700",     bg:"bg-red-100"     },
};
const CHECK_STATUS_CFG = {
  arriving_today: { label:"Arriving Today",  color:"text-blue-700",    bg:"bg-blue-100"    },
  in_house:       { label:"In House",        color:"text-emerald-700", bg:"bg-emerald-100" },
  departing_today:{ label:"Departing Today", color:"text-amber-700",   bg:"bg-amber-100"   },
  checked_out:    { label:"Checked Out",     color:"text-slate-600",   bg:"bg-slate-100"   },
};
const RATE_STATUS_CFG = {
  active:      { label:"Active",      color:"text-emerald-700", bg:"bg-emerald-100" },
  expired:     { label:"Expired",     color:"text-slate-600",   bg:"bg-slate-100"   },
  negotiating: { label:"Negotiating", color:"text-amber-700",   bg:"bg-amber-100"   },
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

type ModTab = "search"|"booking"|"vouchers"|"rates"|"checkinout"|"cancellations"|"group"|"corporate"|"reports";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"search",        label:"Hotel Search"      },
  { key:"booking",       label:"Booking"           },
  { key:"vouchers",      label:"Voucher Generator" },
  { key:"rates",         label:"Supplier Rate Sheet"},
  { key:"checkinout",    label:"Check-in/Out Tracker"},
  { key:"cancellations", label:"Cancellation Flow" },
  { key:"group",         label:"Group Booking"     },
  { key:"corporate",     label:"Corporate Rates"   },
  { key:"reports",       label:"Invoice & Report"  },
];

// ── Hotel Search Tab ──────────────────────────────────────────────────────────
function HotelSearchTab({ onResults }: { onResults: () => void }) {
  const [form, setForm] = useState({ dest:"Dubai, UAE", checkIn:"20 Jan 2025", checkOut:"25 Jan 2025", rooms:"1", adults:"2", stars:"Any", category:"Any" });
  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-4xl mb-6">
        <p className="text-[11px] font-bold text-slate-700 mb-3">Search Availability</p>
        <div className="grid grid-cols-[2fr_140px_140px_80px_80px_100px_100px] gap-3 items-end">
          {[
            { label:"Destination",key:"dest",placeholder:"City, hotel, landmark" },
            { label:"Check-in",   key:"checkIn",placeholder:"dd/mm/yyyy" },
            { label:"Check-out",  key:"checkOut",placeholder:"dd/mm/yyyy" },
            { label:"Rooms",      key:"rooms",placeholder:"1" },
            { label:"Adults",     key:"adults",placeholder:"2" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
            </div>
          ))}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Stars</label>
            <select className="w-full px-2 py-2.5 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50">
              <option>Any</option><option>3★</option><option>4★</option><option>5★</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Category</label>
            <select className="w-full px-2 py-2.5 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50">
              <option>Any</option><option>Business</option><option>Resort</option><option>Luxury</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {["Breakfast included","Free cancellation","Corporate rate"].map(opt => (
              <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                <div className="size-3.5 rounded border border-slate-300"/>
                <span className="text-[10px] text-slate-500">{opt}</span>
              </label>
            ))}
          </div>
          <button onClick={onResults} className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white text-[11px] font-bold rounded-xl hover:bg-amber-600 transition-colors">
            <Search size={13}/> Search Hotels
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hotel Results / Booking Tab ───────────────────────────────────────────────
function HotelCard({ hotel, onSelect }: { hotel: typeof HOTELS[0]; onSelect: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4 hover:border-amber-300 hover:shadow-sm transition-all">
      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
        <Building2 size={24} className="text-slate-500"/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-bold text-slate-800">{hotel.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({length:Math.min(hotel.stars,5)}).map((_,i) => (
                <Star key={i} size={9} className="text-amber-400 fill-amber-400"/>
              ))}
              {hotel.stars > 5 && <span className="text-[8px] font-bold text-amber-500 ml-0.5">+{hotel.stars-5}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[9px] text-slate-400">from</p>
            <p className="text-[18px] font-bold font-mono text-amber-600">{fmtAED(hotel.priceFrom)}</p>
            <p className="text-[9px] text-slate-400">per night</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <MapPin size={9} className="text-slate-400"/>
          <p className="text-[9.5px] text-slate-500">{hotel.address}</p>
          <span className="text-[9px] font-bold text-amber-600 ml-auto">★ {hotel.rating}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {hotel.amenities.slice(0,4).map(a => (
            <span key={a} className="text-[8px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{a}</span>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-end">
        <button onClick={onSelect} className="px-4 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600 transition-colors whitespace-nowrap">
          Select & Book
        </button>
      </div>
    </div>
  );
}

function BookingTab({ selectedHotel }: { selectedHotel: typeof HOTELS[0] | null }) {
  if (!selectedHotel) {
    return (
      <div>
        <p className="text-[12px] font-bold text-slate-700 mb-4">Search Results — Dubai, UAE · 20–25 Jan 2025 · 1 Room</p>
        <div className="space-y-3">
          {HOTELS.filter(h => h.city==="Dubai").map(h => <HotelCard key={h.id} hotel={h} onSelect={() => {}}/>)}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[1fr_300px] gap-5">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center"><Building2 size={16} className="text-amber-700"/></div>
          <div className="flex-1">
            <p className="text-[12px] font-bold text-slate-800">{selectedHotel.name}</p>
            <div className="flex items-center gap-1 mt-0.5">{Array.from({length:Math.min(selectedHotel.stars,5)}).map((_,i) => <Star key={i} size={9} className="text-amber-400 fill-amber-400"/>)}</div>
            <p className="text-[10px] text-slate-500">{selectedHotel.address}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Room Selection</p>
          {[["Deluxe King","1 King Bed · City View",selectedHotel.priceFrom],["Superior Suite","Separate Living Area · Sea View",selectedHotel.priceFrom*1.8],["Executive Room","King Bed · Lounge Access",selectedHotel.priceFrom*1.3]].map(([n,d,p],i) => (
            <label key={String(n)} className={`flex items-center gap-3 p-3 rounded-xl border mb-2 cursor-pointer ${i===0?"border-amber-300 bg-amber-50":"border-slate-200 hover:border-amber-200"}`}>
              <div className={`size-4 rounded-full border-2 flex items-center justify-center ${i===0?"border-amber-500":"border-slate-300"}`}>
                {i===0 && <div className="size-2 rounded-full bg-amber-500"/>}
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-800">{n}</p>
                <p className="text-[9.5px] text-slate-500">{d}</p>
              </div>
              <p className="font-mono font-bold text-[12px] text-slate-700">{fmtAED(Number(p))}<span className="text-[9px] text-slate-400 font-normal">/night</span></p>
            </label>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Guest Details</p>
          <div className="grid grid-cols-2 gap-3">
            {["Guest Full Name","Email Address","Phone Number","Nationality","Passport Number","Special Requests"].map(l => (
              <div key={l} className={l==="Special Requests"?"col-span-2":""}>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
                <input placeholder={l} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-3">Booking Summary</p>
          {[["Check-in","20 Jan 2025"],["Check-out","25 Jan 2025"],["Nights","5"],["Rooms","1"],["Room Type","Deluxe King"],["Meal Plan","Bed & Breakfast"],["Rate/Night",fmtAED(selectedHotel.priceFrom)]].map(([l,v]) => (
            <div key={l} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 text-[10.5px]">
              <span className="text-slate-500">{l}</span>
              <span className="font-semibold text-slate-700">{v}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 mt-1 border-t-2 border-slate-200">
            <span className="text-[11px] font-bold text-slate-800">Total</span>
            <span className="font-mono font-bold text-[14px] text-amber-600">{fmtAED(selectedHotel.priceFrom*5)}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-bold text-slate-700 mb-2">Meal Plan</p>
          {(["RO","BB","HB","FB"] as const).map((mp,i) => (
            <label key={mp} className="flex items-center gap-2 py-1 cursor-pointer">
              <div className={`size-3.5 rounded-full border-2 flex items-center justify-center ${i===1?"border-amber-500":"border-slate-300"}`}>
                {i===1 && <div className="size-2 rounded-full bg-amber-500"/>}
              </div>
              <span className="text-[10.5px] text-slate-700">{MEAL_PLAN_LABELS[mp]}</span>
            </label>
          ))}
        </div>
        <button className="w-full py-3 bg-amber-500 text-white text-[11px] font-bold rounded-xl hover:bg-amber-600 transition-colors">
          Confirm & Generate Voucher
        </button>
      </div>
    </div>
  );
}

// ── Voucher Generator Tab ─────────────────────────────────────────────────────
function VouchersTab() {
  const withVouchers = HOTEL_BOOKINGS.filter(b => b.voucherNo);
  const [selected, setSelected] = useState<HotelBooking>(withVouchers[0]);
  return (
    <div className="grid grid-cols-[260px_1fr] gap-5">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
          <p className="text-[9.5px] font-bold text-slate-500 uppercase">Vouchers ({withVouchers.length})</p>
        </div>
        {withVouchers.map(b => (
          <button key={b.id} onClick={() => setSelected(b)}
            className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${selected.id===b.id?"bg-amber-50":"hover:bg-slate-50"}`}>
            <p className="text-[10px] font-bold font-mono text-amber-700">{b.voucherNo}</p>
            <p className="text-[10px] font-semibold text-slate-800">{b.guestName}</p>
            <p className="text-[9px] text-slate-400">{b.hotel} · {b.checkIn}</p>
          </button>
        ))}
      </div>
      {/* Voucher preview — print-style */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-[8px] font-bold uppercase tracking-[0.2em] mb-0.5">Hotel Voucher</p>
            <p className="text-amber-400 text-[20px] font-bold font-mono">{selected.voucherNo}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-[9px]">Issued by</p>
            <p className="text-white text-[11px] font-bold">Global Travel & Visa Co.</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Guest Information</p>
              {[["Guest Name",selected.guestName],["Nationality",selected.nationality],["Booking Ref",selected.ref]].map(([l,v])=>(
                <div key={l} className="flex gap-2 py-1 border-b border-slate-100 last:border-0">
                  <span className="text-[9.5px] text-slate-400 w-24 flex-shrink-0">{l}</span>
                  <span className="text-[10px] font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Hotel Information</p>
              {[["Hotel",selected.hotel],["City",selected.hotelCity],["Room Type",selected.roomType],["Meal Plan",MEAL_PLAN_LABELS[selected.mealPlan]]].map(([l,v])=>(
                <div key={l} className="flex gap-2 py-1 border-b border-slate-100 last:border-0">
                  <span className="text-[9.5px] text-slate-400 w-24 flex-shrink-0">{l}</span>
                  <span className="text-[10px] font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
            {[["Check-in",selected.checkIn],["Check-out",selected.checkOut],["Nights",String(selected.nights)],["Rooms",String(selected.rooms)]].map(([l,v])=>(
              <div key={l} className="text-center">
                <p className="text-[9px] text-amber-600 font-bold uppercase">{l}</p>
                <p className="text-[15px] font-bold font-mono text-slate-800">{v}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between py-3 border-t-2 border-slate-200">
            <p className="text-[11px] font-bold text-slate-700">Total Amount: <span className="font-mono text-amber-600 text-[14px]">{fmtAED(selected.totalFare)}</span></p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-slate-200 text-slate-600 text-[10px] font-semibold rounded-xl hover:bg-slate-50">Download PDF</button>
              <button className="px-4 py-2 bg-amber-500 text-white text-[10px] font-bold rounded-xl hover:bg-amber-600">Send to Guest</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rate Sheet Tab ────────────────────────────────────────────────────────────
function RateSheetTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Supplier Rate Sheet ({RATE_SHEET.length} entries)</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add Rate</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Hotel","Supplier","Room Type","Meal Plan","Rate (AED/night)","Valid From","Valid To","Allotment","Status",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATE_SHEET.map((r, i) => {
              const sc = RATE_STATUS_CFG[r.status];
              return (
                <tr key={r.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-semibold text-slate-800 max-w-[140px] truncate">{r.hotel}</td>
                  <td className="px-3 py-2.5 text-slate-500 text-[10px]">{r.supplier}</td>
                  <td className="px-3 py-2.5 text-slate-700">{r.roomType}</td>
                  <td className="px-3 py-2.5"><span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{r.mealPlan} — {MEAL_PLAN_LABELS[r.mealPlan]}</span></td>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{r.rateAED.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-slate-500 text-[10px]">{r.validFrom}</td>
                  <td className="px-3 py-2.5 text-slate-500 text-[10px]">{r.validTo}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-700">{r.rooms}</td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                  <td className="px-3 py-2.5"><button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Check-in/Check-out Tracker Tab ────────────────────────────────────────────
function CheckInOutTab() {
  const arriving   = CHECK_RECORDS.filter(r => r.status==="arriving_today");
  const inHouse    = CHECK_RECORDS.filter(r => r.status==="in_house");
  const departing  = CHECK_RECORDS.filter(r => r.status==="departing_today");
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[["Arriving Today",arriving.length,"bg-blue-50 border-blue-200 text-blue-700"],["In House",inHouse.length,"bg-emerald-50 border-emerald-200 text-emerald-700"],["Departing Today",departing.length,"bg-amber-50 border-amber-200 text-amber-700"]].map(([l,v,cls]) => (
          <div key={l} className={`rounded-xl border p-4 text-center ${cls}`}>
            <p className="text-[26px] font-bold font-mono">{v}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <p className="text-[12px] font-bold text-slate-700 mb-3">All Records ({CHECK_RECORDS.length})</p>
      <div className="space-y-2">
        {CHECK_RECORDS.map(r => {
          const sc = CHECK_STATUS_CFG[r.status];
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={15} className="text-slate-500"/>
              </div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{r.guestName}</p>
                <p className="text-[10px] text-slate-500">{r.hotel} · {r.roomType} · {r.rooms} room(s)</p>
                <p className="text-[9.5px] text-slate-400 font-mono">{r.bookingRef}</p>
              </div>
              <div className="text-right text-[9.5px] text-slate-500">
                <p>In: <span className="font-semibold text-slate-700">{r.checkInDate}</span></p>
                <p>Out: <span className="font-semibold text-slate-700">{r.checkOutDate}</span></p>
                <p>{r.nights} nights</p>
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg ${sc.bg} ${sc.color}`}>{sc.label}</span>
              {r.status==="arriving_today" && <button className="px-3 py-1.5 bg-emerald-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-emerald-600">Check In</button>}
              {r.status==="departing_today" && <button className="px-3 py-1.5 bg-amber-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-amber-600">Check Out</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Cancellations Tab ─────────────────────────────────────────────────────────
function CancellationsTab() {
  const [search, setSearch] = useState("");
  const found = search ? HOTEL_BOOKINGS.find(b => b.ref.toLowerCase().includes(search.toLowerCase())) : null;
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Cancellation Flow</p>
      <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-2xl mb-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Find Booking</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Booking ref (e.g. HTL-2025-001)…"
              className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
          </div>
          <button className="px-4 py-2.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600">Find</button>
        </div>
        {found && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[13px] font-bold text-slate-800">{found.guestName}</p>
                <p className="text-[10px] text-slate-500">{found.hotel} · {found.checkIn} – {found.checkOut} · {found.nights} nights</p>
              </div>
              <p className="font-mono font-bold text-[14px] text-amber-600">{fmtAED(found.totalFare)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
              <p className="text-[10px] font-bold text-red-700 mb-1">⚠ Cancellation Policy</p>
              <p className="text-[9.5px] text-red-600">Free cancellation until 72h before check-in. After that, 1 night penalty applies.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-red-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-red-600">Confirm Cancellation</button>
              <button className="px-4 py-2 border border-slate-200 text-slate-600 text-[10.5px] font-semibold rounded-xl hover:bg-slate-50">Cancel (Keep Booking)</button>
            </div>
          </div>
        )}
      </div>
      <p className="text-[11px] font-bold text-slate-700 mb-3">Recent Cancellations ({CANCELLATIONS.length})</p>
      <div className="space-y-2">
        {CANCELLATIONS.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="size-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center"><XCircle size={14}/></div>
            <div className="flex-1">
              <p className="text-[11.5px] font-bold text-slate-800">{c.guestName}</p>
              <p className="text-[10px] text-slate-500">{c.hotel} · {c.bookingRef} · {c.reason}</p>
              <p className="text-[9.5px] text-slate-400">{c.cancelledAt}</p>
            </div>
            <div className="text-right text-[10px]">
              <p className="text-red-600 font-bold">Penalty: {fmtAED(c.penalty)}</p>
              <p className="text-emerald-600 font-bold">Refund: {fmtAED(c.refundAED)}</p>
            </div>
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${c.status==="processed"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>
              {c.status==="processed"?"Processed":"Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Group Booking Tab ─────────────────────────────────────────────────────────
function GroupTab() {
  const groups = HOTEL_BOOKINGS.filter(b => b.type==="group");
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Group Hotel Bookings ({groups.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Group</button>
      </div>
      <div className="space-y-3 mb-5">
        {groups.map(b => {
          const sc = STATUS_CFG[b.status];
          return (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center"><Users size={14}/></div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{b.groupName}</p>
                <p className="text-[10px] text-slate-500">{b.hotel} · {b.checkIn} – {b.checkOut} · {b.rooms} rooms · {b.roomType}</p>
              </div>
              <p className="font-mono font-bold text-slate-800">{fmtAED(b.totalFare)}</p>
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <button className="px-3 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">Rooming List</button>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-700 mb-3">New Group Booking Request</p>
        <div className="grid grid-cols-3 gap-3">
          {["Group/Event Name","Hotel","City/Destination","Check-in Date","Check-out Date","Number of Rooms","Room Type","Meal Plan","Special Requirements"].map(l => (
            <div key={l} className={l==="Special Requirements"?"col-span-3":""}>
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

// ── Corporate Rates Tab ───────────────────────────────────────────────────────
function CorporateTab() {
  const corps = HOTEL_BOOKINGS.filter(b => b.type==="corporate");
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Corporate Hotel Bookings ({corps.length})</p>
      <div className="space-y-2 mb-5">
        {corps.map(b => {
          const sc = STATUS_CFG[b.status];
          return (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="size-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><Building2 size={14}/></div>
              <div className="flex-1">
                <p className="text-[11.5px] font-bold text-slate-800">{b.guestName}</p>
                <p className="text-[10px] text-slate-500">{b.hotel} · {b.checkIn} – {b.checkOut} · {b.corporateRef}</p>
                <p className="text-[9px] font-mono text-slate-400">{b.ref}</p>
              </div>
              <p className="font-mono font-bold text-slate-800">{fmtAED(b.totalFare)}</p>
              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span>
              <button className="px-3 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">View</button>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-700 mb-3">Corporate Contracted Hotel Rates</p>
        <div className="space-y-2">
          {[{corp:"PetroAbu Energy",hotel:"Marriott Abu Dhabi",rate:1100,type:"Executive King",validity:"31 Dec 2025"},{corp:"Infosys UAE",hotel:"Hilton Frankfurt",rate:720,type:"Standard Double",validity:"31 Mar 2025"},{corp:"Emirates Group",hotel:"Four Seasons DIFC",rate:1800,type:"Deluxe City View",validity:"31 Dec 2025"}].map((r,i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex-1">
                <p className="text-[11px] font-bold text-slate-800">{r.corp}</p>
                <p className="text-[9.5px] text-slate-500">{r.hotel} · {r.type}</p>
              </div>
              <p className="font-mono font-bold text-slate-700">{fmtAED(r.rate)}<span className="text-[9px] text-slate-400 font-normal">/night</span></p>
              <p className="text-[9px] text-slate-400">Until {r.validity}</p>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">Active</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const total = HOTEL_INVOICES.reduce((s,i) => s+i.amount, 0);
  const paid  = HOTEL_INVOICES.filter(i=>i.status==="paid").reduce((s,i) => s+i.amount, 0);
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Invoice & Revenue Summary</p>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Revenue",fmtAED(total),""],["Collected",fmtAED(paid),"text-emerald-600"],["Outstanding",fmtAED(total-paid),"text-amber-600"],["Bookings",String(HOTEL_BOOKINGS.length),""]].map(([l,v,c]) => (
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
            {HOTEL_INVOICES.map((inv, i) => {
              const sc = INVOICE_STATUS_CFG[inv.status];
              return (
                <tr key={inv.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{inv.ref}</td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded capitalize ${TYPE_CFG[inv.type as keyof typeof TYPE_CFG]?.bg??""} ${TYPE_CFG[inv.type as keyof typeof TYPE_CFG]?.color??""}`}>{inv.type}</span></td>
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
export default function HotelsModule() {
  const [tab, setTab]                   = useState<ModTab>("search");
  const [selectedHotel, setSelectedHotel] = useState<typeof HOTELS[0]|null>(null);

  const checkedIn  = HOTEL_BOOKINGS.filter(b=>b.status==="checked_in").length;
  const confirmed  = HOTEL_BOOKINGS.filter(b=>b.status==="confirmed").length;

  function handleResults() { setTab("booking"); }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Hotel Management</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{HOTEL_BOOKINGS.length} bookings · {checkedIn} checked in · {confirmed} confirmed</p>
          </div>
          <div className="flex items-center gap-2">
            {CHECK_RECORDS.filter(r=>r.status==="arriving_today").length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-lg">
                <Clock size={11}/>{CHECK_RECORDS.filter(r=>r.status==="arriving_today").length} Arriving Today
              </span>
            )}
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
        {tab==="search"        && <HotelSearchTab onResults={handleResults}/>}
        {tab==="booking"       && <BookingTab selectedHotel={selectedHotel}/>}
        {tab==="vouchers"      && <VouchersTab/>}
        {tab==="rates"         && <RateSheetTab/>}
        {tab==="checkinout"    && <CheckInOutTab/>}
        {tab==="cancellations" && <CancellationsTab/>}
        {tab==="group"         && <GroupTab/>}
        {tab==="corporate"     && <CorporateTab/>}
        {tab==="reports"       && <ReportsTab/>}
      </div>
    </div>
  );
}
