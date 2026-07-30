import { useState } from "react";
import {
  Search, Plus, MapPin, Star, Clock,
  Car, Users, Route, Navigation,
} from "lucide-react";
import {
  PICKUPS, DRIVERS, VEHICLES, RENTALS, ROUTES, TRANSPORT_INVOICES,
  PickupStatus, DriverStatus, VehicleStatus, fmtAED,
} from "./data";

// ── Status config ─────────────────────────────────────────────────────────────
const PICKUP_STATUS: Record<PickupStatus, { label: string; bg: string; color: string }> = {
  scheduled:  { label:"Scheduled",   bg:"bg-slate-100",   color:"text-slate-600"   },
  dispatched: { label:"En Route",    bg:"bg-blue-100",    color:"text-blue-700"    },
  completed:  { label:"Completed",   bg:"bg-emerald-100", color:"text-emerald-700" },
  cancelled:  { label:"Cancelled",   bg:"bg-red-100",     color:"text-red-700"     },
  delayed:    { label:"Delayed",     bg:"bg-amber-100",   color:"text-amber-700"   },
};
const DRIVER_STATUS: Record<DriverStatus, { label: string; bg: string; color: string }> = {
  available:  { label:"Available",   bg:"bg-emerald-100", color:"text-emerald-700" },
  on_trip:    { label:"On Trip",     bg:"bg-blue-100",    color:"text-blue-700"    },
  off_duty:   { label:"Off Duty",    bg:"bg-slate-100",   color:"text-slate-500"   },
  leave:      { label:"On Leave",    bg:"bg-amber-100",   color:"text-amber-700"   },
};
const VEHICLE_STATUS: Record<VehicleStatus, { label: string; bg: string; color: string }> = {
  available:   { label:"Available",  bg:"bg-emerald-100", color:"text-emerald-700" },
  in_service:  { label:"In Service", bg:"bg-blue-100",    color:"text-blue-700"    },
  maintenance: { label:"Maintenance",bg:"bg-amber-100",   color:"text-amber-700"   },
  inactive:    { label:"Inactive",   bg:"bg-red-100",     color:"text-red-700"     },
};
const INVOICE_STATUS = {
  paid:    { label:"Paid",    bg:"bg-emerald-100", color:"text-emerald-700" },
  pending: { label:"Pending", bg:"bg-amber-100",   color:"text-amber-700"   },
  overdue: { label:"Overdue", bg:"bg-red-100",     color:"text-red-700"     },
};

type ModTab = "pickups"|"rental"|"drivers"|"fleet"|"gps"|"routes"|"reports";
const MOD_TABS: { key: ModTab; label: string }[] = [
  { key:"pickups", label:"Airport Pickups"  },
  { key:"rental",  label:"Car Rental"       },
  { key:"drivers", label:"Driver Roster"    },
  { key:"fleet",   label:"Fleet Management" },
  { key:"gps",     label:"GPS Tracking"     },
  { key:"routes",  label:"Route Management" },
  { key:"reports", label:"Invoice & Report" },
];

// ── Airport Pickups Tab ───────────────────────────────────────────────────────
function PickupsTab() {
  const [filter, setFilter] = useState<"all"|PickupStatus>("all");
  const shown = filter==="all" ? PICKUPS : PICKUPS.filter(p=>p.status===filter);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Airport Pickup Scheduler ({PICKUPS.length} trips)</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Pickup</button>
      </div>
      <div className="flex gap-2 mb-4">
        {(["all","scheduled","dispatched","delayed","completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${filter===f?"bg-amber-500 text-white border-amber-500":"bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}>
            {f==="all" ? "All" : PICKUP_STATUS[f]?.label ?? f}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {shown.map(p => {
          const sc = PICKUP_STATUS[p.status];
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
              <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                <Car size={15} className={sc.color}/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-bold text-slate-800">{p.passengerName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-[9.5px] text-slate-500">
                    <MapPin size={9}/> {p.terminal} · {p.flight}
                  </span>
                  <span className="flex items-center gap-1 text-[9.5px] text-slate-500">
                    <Clock size={9}/> Arr: {p.arrivalAt}
                  </span>
                  <span className="text-[9.5px] text-slate-400">→ {p.dropoff}</span>
                </div>
                {p.driverName && (
                  <p className="text-[9px] text-slate-400 mt-0.5">Driver: {p.driverName} · {p.vehiclePlate} · {p.vehicleType}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-[9.5px] text-slate-500 flex-shrink-0">
                <Users size={9}/> {p.pax} pax
              </div>
              <span className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${sc.bg} ${sc.color}`}>{sc.label}</span>
              {p.status==="scheduled" && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button className="px-2.5 py-1 bg-blue-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-blue-600">Assign Driver</button>
                  <button className="px-2.5 py-1 border border-slate-200 text-slate-600 text-[9.5px] font-semibold rounded-lg hover:bg-slate-50">Edit</button>
                </div>
              )}
              {p.status==="dispatched" && (
                <button className="px-2.5 py-1 bg-amber-500 text-white text-[9.5px] font-bold rounded-lg hover:bg-amber-600 flex-shrink-0">Track</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Car Rental Tab ────────────────────────────────────────────────────────────
function RentalTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Car Rental Bookings ({RENTALS.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Rental</button>
      </div>
      <div className="space-y-2 mb-5">
        {RENTALS.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="size-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><Car size={15}/></div>
            <div className="flex-1">
              <p className="text-[11.5px] font-bold text-slate-800">{r.customerName}</p>
              <p className="text-[10px] text-slate-500">{r.vehicleType} · {r.vehiclePlate} · {r.withDriver?"With Driver":"Self Drive"}</p>
              <p className="text-[9.5px] text-slate-400">From: {r.from} · To: {r.to} · {r.days} days</p>
            </div>
            <p className="font-mono font-bold text-slate-800">{fmtAED(r.totalFare)}</p>
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${r.status==="active"?"bg-emerald-100 text-emerald-700":r.status==="confirmed"?"bg-blue-100 text-blue-700":"bg-slate-100 text-slate-500"}`}>
              {r.status.charAt(0).toUpperCase()+r.status.slice(1)}
            </span>
            <button className="px-3 py-1.5 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50">View</button>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-bold text-slate-700 mb-3">New Rental Booking</p>
        <div className="grid grid-cols-3 gap-3">
          {["Customer Name","Nationality","Phone Number","Pick-up Location","Drop-off Location","Vehicle Type","Start Date","End Date","Driver Required?"].map(l => (
            <div key={l}>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">{l}</label>
              {l==="Vehicle Type"||l==="Driver Required?" ? (
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50">
                  {l==="Vehicle Type" ? <><option>Sedan</option><option>SUV</option><option>Van</option><option>Luxury</option></> : <><option>No</option><option>Yes</option></>}
                </select>
              ) : (
                <input placeholder={l} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400 bg-slate-50"/>
              )}
            </div>
          ))}
        </div>
        <button className="mt-4 px-5 py-2 bg-amber-500 text-white text-[10.5px] font-bold rounded-xl hover:bg-amber-600">Create Rental</button>
      </div>
    </div>
  );
}

// ── Driver Roster Tab ─────────────────────────────────────────────────────────
function DriversTab() {
  const [search, setSearch] = useState("");
  const shown = search ? DRIVERS.filter(d => d.name.toLowerCase().includes(search.toLowerCase())) : DRIVERS;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Driver Roster ({DRIVERS.length})</p>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search drivers…" className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:border-amber-400 bg-white w-44"/>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add Driver</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Driver","Phone","License","Vehicle","Trips Today","Total Trips","Rating","Languages","Status",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((d, i) => {
              const sc = DRIVER_STATUS[d.status];
              return (
                <tr key={d.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-800">{d.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{d.nationalId}</p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">{d.phone}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-[10px] font-mono">{d.licenseNo}</p>
                    <p className="text-[9px] text-slate-400">Exp: {d.licenseExpiry}</p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{d.currentVehicle ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-700">{d.tripsToday}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-700">{d.totalTrips}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-0.5">
                      <Star size={9} className="text-amber-400 fill-amber-400"/>
                      <span className="font-bold text-slate-700">{d.rating}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-0.5">
                      {d.languages.map(l => <span key={l} className="text-[8px] font-semibold px-1 py-0.5 bg-slate-100 text-slate-500 rounded">{l}</span>)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                  <td className="px-3 py-2.5">
                    <button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">Profile</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Fleet Management Tab ──────────────────────────────────────────────────────
function FleetTab() {
  const available   = VEHICLES.filter(v=>v.status==="available").length;
  const inService   = VEHICLES.filter(v=>v.status==="in_service").length;
  const maintenance = VEHICLES.filter(v=>v.status==="maintenance").length;
  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Vehicles",String(VEHICLES.length),"text-slate-700"],["Available",String(available),"text-emerald-600"],["In Service",String(inService),"text-blue-600"],["Maintenance",String(maintenance),"text-amber-600"]].map(([l,v,c]) => (
          <div key={l} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-[24px] font-bold font-mono ${c}`}>{v}</p>
            <p className="text-[9.5px] text-slate-400 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-bold text-slate-700">Fleet ({VEHICLES.length} vehicles)</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add Vehicle</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Plate","Vehicle","Type","Color","Capacity","Driver","Insurance Exp","Last Service","Mileage","Status",""].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VEHICLES.map((v, i) => {
              const sc = VEHICLE_STATUS[v.status];
              const driver = DRIVERS.find(d => d.id === v.driverId);
              return (
                <tr key={v.id} className={`border-b border-slate-100 hover:bg-amber-50/30 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{v.plate}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-800">{v.make} {v.model}</p>
                    <p className="text-[9px] text-slate-400">{v.year}</p>
                  </td>
                  <td className="px-3 py-2.5 capitalize text-slate-600">{v.type}</td>
                  <td className="px-3 py-2.5 text-slate-500">{v.color}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{v.capacity}</td>
                  <td className="px-3 py-2.5 text-slate-600">{driver?.name ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500">{v.insuranceExpiry}</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-500">{v.lastService}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-700">{v.mileage.toLocaleString()} km</td>
                  <td className="px-3 py-2.5"><span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                  <td className="px-3 py-2.5">
                    <button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── GPS Tracking Tab ──────────────────────────────────────────────────────────
function GPSTab() {
  const active = VEHICLES.filter(v => v.status==="in_service" && v.gpsLat);
  const [sel, setSel] = useState(active[0]?.id ?? "");

  // Simplified pseudo-map: positions normalized to a 600×380 canvas
  // Dubai area: lat 25.0–25.4, lng 55.1–55.5
  function toXY(lat: number, lng: number) {
    const x = ((lng - 55.1) / 0.4) * 560 + 20;
    const y = ((25.4 - lat) / 0.4) * 340 + 20;
    return { x: Math.max(20, Math.min(580, x)), y: Math.max(20, Math.min(360, y)) };
  }

  const VEHICLE_COLORS = ["#F59E0B","#3B82F6","#10B981","#8B5CF6","#EF4444","#EC4899"];

  return (
    <div className="grid grid-cols-[260px_1fr] gap-5">
      {/* Sidebar */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
          <p className="text-[9.5px] font-bold text-slate-500 uppercase">Live Vehicles ({active.length})</p>
        </div>
        {active.map((v, i) => {
          const driver = DRIVERS.find(d => d.id===v.driverId);
          const pickup = PICKUPS.find(p => p.vehiclePlate===v.plate && p.status==="dispatched");
          return (
            <button key={v.id} onClick={() => setSel(v.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors ${sel===v.id?"bg-amber-50":"hover:bg-slate-50"}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="size-2 rounded-full animate-pulse" style={{backgroundColor:VEHICLE_COLORS[i%VEHICLE_COLORS.length]}}/>
                <p className="text-[10px] font-bold font-mono text-slate-800">{v.plate}</p>
                <span className={`ml-auto text-[8.5px] font-bold px-1.5 py-0.5 rounded ${VEHICLE_STATUS[v.status].bg} ${VEHICLE_STATUS[v.status].color}`}>
                  {VEHICLE_STATUS[v.status].label}
                </span>
              </div>
              <p className="text-[9.5px] text-slate-700">{v.make} {v.model} <span className="text-slate-400">({v.color})</span></p>
              <p className="text-[9px] text-slate-400">{driver?.name ?? "Unassigned"}</p>
              {pickup && <p className="text-[8.5px] text-blue-600 font-bold mt-0.5">On pickup: {pickup.passengerName}</p>}
            </button>
          );
        })}
        {active.length===0 && <p className="p-4 text-[10px] text-slate-400 text-center">No vehicles in service</p>}
      </div>

      {/* Map canvas */}
      <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Road grid background */}
        <div className="absolute inset-0" style={{
          backgroundImage:"linear-gradient(to right,#f1f5f9 1px,transparent 1px),linear-gradient(to bottom,#f1f5f9 1px,transparent 1px)",
          backgroundSize:"48px 48px"
        }}/>
        {/* Major roads */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 380" preserveAspectRatio="none">
          <line x1="0" y1="190" x2="600" y2="190" stroke="#e2e8f0" strokeWidth="6"/>
          <line x1="300" y1="0"  x2="300" y2="380" stroke="#e2e8f0" strokeWidth="6"/>
          <line x1="0" y1="95"  x2="600" y2="95"  stroke="#e2e8f0" strokeWidth="3"/>
          <line x1="0" y1="285" x2="600" y2="285" stroke="#e2e8f0" strokeWidth="3"/>
          <line x1="150" y1="0" x2="150" y2="380" stroke="#e2e8f0" strokeWidth="3"/>
          <line x1="450" y1="0" x2="450" y2="380" stroke="#e2e8f0" strokeWidth="3"/>
          {/* Road labels */}
          <text x="10"  y="183" fill="#94a3b8" fontSize="9" fontFamily="monospace">Sheikh Zayed Rd</text>
          <text x="305" y="100" fill="#94a3b8" fontSize="9" fontFamily="monospace">Al Khail Rd</text>
        </svg>

        {/* Vehicle pins */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 380">
          {active.map((v, i) => {
            if (!v.gpsLat || !v.gpsLng) return null;
            const {x,y} = toXY(v.gpsLat, v.gpsLng);
            const color = VEHICLE_COLORS[i%VEHICLE_COLORS.length];
            const isSelected = sel===v.id;
            return (
              <g key={v.id} onClick={() => setSel(v.id)} style={{cursor:"pointer"}}>
                {isSelected && <circle cx={x} cy={y} r="18" fill={color} opacity="0.2"/>}
                <circle cx={x} cy={y} r={isSelected?10:7} fill={color} stroke="white" strokeWidth="2"/>
                <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {v.plate.slice(-3)}
                </text>
                {isSelected && (
                  <g>
                    <rect x={x+14} y={y-18} width="90" height="36" rx="4" fill="white" stroke={color} strokeWidth="1.5"/>
                    <text x={x+18} y={y-7}  fill="#1e293b" fontSize="8" fontWeight="bold">{v.make} {v.model}</text>
                    <text x={x+18} y={y+5}  fill="#64748b" fontSize="8">{v.plate}</text>
                    <text x={x+18} y={y+16} fill={color}   fontSize="8" fontWeight="bold">{VEHICLE_STATUS[v.status].label}</text>
                  </g>
                )}
              </g>
            );
          })}
          {/* DXB Airport marker */}
          <g>
            <rect x="460" y="30" width="70" height="20" rx="4" fill="#0D1117" opacity="0.7"/>
            <text x="495" y="44" textAnchor="middle" fill="#F59E0B" fontSize="9" fontFamily="monospace" fontWeight="bold">✈ DXB</text>
          </g>
        </svg>

        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 px-3 py-2">
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Map: Dubai, UAE</p>
          <div className="flex gap-2">
            {active.slice(0,4).map((v,i) => (
              <div key={v.id} className="flex items-center gap-1">
                <div className="size-2 rounded-full" style={{backgroundColor:VEHICLE_COLORS[i]}}/>
                <span className="text-[9px] text-slate-600 font-mono">{v.plate}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <button className="size-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 text-[14px] font-bold">+</button>
          <button className="size-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 text-[14px] font-bold">−</button>
        </div>
        <div className="absolute top-3 left-3 bg-white border border-slate-200 rounded-lg px-2 py-1 flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse"/>
          <span className="text-[9.5px] font-bold text-slate-600">Live GPS · {active.length} active</span>
        </div>
      </div>
    </div>
  );
}

// ── Route Management Tab ──────────────────────────────────────────────────────
function RoutesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-slate-700">Route Management ({ROUTES.length})</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> Add Route</button>
      </div>
      <div className="space-y-3">
        {ROUTES.map((r, i) => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="size-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0"><Route size={14}/></div>
            <div className="flex-1">
              <p className="text-[11.5px] font-bold text-slate-800">{r.name}</p>
              <div className="flex items-center gap-1 text-[9.5px] text-slate-500">
                <MapPin size={9}/> {r.origin}
                <span className="text-slate-300">——</span>
                <Navigation size={9}/>
                {r.stops && r.stops.map((s: string) => <span key={s}>{s} ——</span>)}
                <MapPin size={9}/> {r.destination}
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              <p>{r.distanceKm} km · ~{r.durationMin} min</p>
              <p className="text-[9px] text-slate-400 capitalize">{r.type.replace("_"," ")}</p>
            </div>
            <p className="font-mono font-bold text-slate-800 text-[11px]">{fmtAED(r.priceAED)}</p>
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${r.status==="active"?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-500"}`}>
              {r.status==="active"?"Active":"Inactive"}
            </span>
            <button className="text-[9.5px] text-amber-600 font-bold hover:text-amber-700">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const total = TRANSPORT_INVOICES.reduce((s,i) => s+i.amount, 0);
  const paid  = TRANSPORT_INVOICES.filter(i=>i.status==="paid").reduce((s,i) => s+i.amount, 0);
  const completed = PICKUPS.filter(p=>p.status==="completed").length;
  return (
    <div>
      <p className="text-[12px] font-bold text-slate-700 mb-4">Transport Revenue & Invoice Summary</p>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[["Total Revenue",fmtAED(total),"text-slate-800"],["Collected",fmtAED(paid),"text-emerald-600"],["Outstanding",fmtAED(total-paid),"text-amber-600"],["Trips Completed",String(completed),"text-blue-600"]].map(([l,v,c]) => (
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
              {["Invoice Ref","Service Type","Customer","Amount","Date","Status"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[9.5px] font-bold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRANSPORT_INVOICES.map((inv, i) => {
              const sc = INVOICE_STATUS[inv.status];
              return (
                <tr key={inv.id} className={`border-b border-slate-100 ${i%2?"bg-slate-50/30":""}`}>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{inv.ref}</td>
                  <td className="px-3 py-2.5 text-slate-600 capitalize">{inv.type.replace("_"," ")}</td>
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
export default function TransportModule() {
  const [tab, setTab] = useState<ModTab>("pickups");

  const enRoute   = PICKUPS.filter(p=>p.status==="dispatched").length;
  const scheduled = PICKUPS.filter(p=>p.status==="scheduled").length;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[17px] font-bold text-slate-800">Transport Management</h1>
            <p className="text-[10.5px] text-slate-400 mt-0.5">{VEHICLES.length} vehicles · {DRIVERS.filter(d=>d.status==="available").length} drivers available · {scheduled} pickups scheduled</p>
          </div>
          <div className="flex items-center gap-2">
            {enRoute > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-lg">
                <Navigation size={11}/> {enRoute} En Route
              </span>
            )}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10.5px] font-bold rounded-lg hover:bg-amber-600"><Plus size={11}/> New Trip</button>
          </div>
        </div>
        <div className="flex gap-0">
          {MOD_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 py-2.5 text-[10.5px] font-semibold border-b-2 whitespace-nowrap transition-all
                ${tab===t.key?"border-amber-500 text-amber-600":"border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
        {tab==="pickups" && <PickupsTab/>}
        {tab==="rental"  && <RentalTab/>}
        {tab==="drivers" && <DriversTab/>}
        {tab==="fleet"   && <FleetTab/>}
        {tab==="gps"     && <GPSTab/>}
        {tab==="routes"  && <RoutesTab/>}
        {tab==="reports" && <ReportsTab/>}
      </div>
    </div>
  );
}
