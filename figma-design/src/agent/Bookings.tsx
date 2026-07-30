import { useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Plane, Building2, Truck, Coffee, CheckCircle2, Search, X, Plus, Minus, ArrowRight, Users, Calculator } from "lucide-react";
import { PASSENGERS, AGENT_PROFILE, TIER_CFG, BookingType, isPassportExpiringSoon, fmtAED } from "./data";

const TYPES = [
  { key: "visa"      as BookingType, label: "Visa",      icon: FileText,  desc: "Tourist, business, student & transit visas", sel: "border-blue-300 bg-blue-50 text-blue-700",     def: "border-slate-200 hover:border-slate-300 bg-slate-50/50" },
  { key: "ticket"    as BookingType, label: "Ticket",    icon: Plane,     desc: "Air tickets, group fares, charter flights",  sel: "border-purple-300 bg-purple-50 text-purple-700", def: "border-slate-200 hover:border-slate-300 bg-slate-50/50" },
  { key: "hotel"     as BookingType, label: "Hotel",     icon: Building2, desc: "4 & 5-star hotels, resorts, apartments",     sel: "border-teal-300 bg-teal-50 text-teal-700",      def: "border-slate-200 hover:border-slate-300 bg-slate-50/50" },
  { key: "transport" as BookingType, label: "Transport", icon: Truck,     desc: "Airport transfers, coaches, private cars",   sel: "border-orange-300 bg-orange-50 text-orange-700",def: "border-slate-200 hover:border-slate-300 bg-slate-50/50" },
  { key: "catering"  as BookingType, label: "Catering",  icon: Coffee,    desc: "Inflight meals, halal catering, events",     sel: "border-pink-300 bg-pink-50 text-pink-700",      def: "border-slate-200 hover:border-slate-300 bg-slate-50/50" },
];
const STEPS = ["Service Type","Passengers","Details","Pricing","Review"];
const COUNTRIES = ["United Kingdom","United States","France","Germany","Australia","Canada","Japan","Singapore","UAE","Thailand","Turkey","Egypt","India","Pakistan"];
const inp = "w-full px-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D] placeholder:text-slate-400";
const lbl = "block text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5";

export default function Bookings() {
  const navigate = useNavigate();
  const [step,      setStep]      = useState(0);
  const [btype,     setBtype]     = useState<BookingType | null>(null);
  const [paxSrc,    setPaxSrc]    = useState<string[]>([]);
  const [paxSearch, setPaxSearch] = useState("");
  const [manPax,    setManPax]    = useState(1);
  const [dest,      setDest]      = useState("");
  const [travelDate,setTravelDate]= useState("");
  const [returnDate,setReturnDate]= useState("");
  const [notes,     setNotes]     = useState("");
  const [cost,      setCost]      = useState(0);
  const [markup,    setMarkup]    = useState(0);
  const [commRate,  setCommRate]  = useState(TIER_CFG[AGENT_PROFILE.tier].rate);
  const [vatRate,   setVatRate]   = useState(5);
  const [clientRef, setClientRef] = useState("");
  const [done,      setDone]      = useState(false);

  const commAmt  = Math.round(cost * commRate / 100);
  const markupAmt= Math.round(cost * markup / 100);
  const vatAmt   = Math.round((cost + markupAmt) * vatRate / 100);
  const total    = cost + markupAmt + vatAmt;
  const netEarn  = commAmt + markupAmt;
  const paxCount = (btype === "transport" || btype === "catering") ? manPax : paxSrc.length;

  const canNext = [!!btype, paxCount > 0, !!dest && !!travelDate, cost > 0, true][step];

  const filtPax = PASSENGERS.filter(p =>
    p.name.toLowerCase().includes(paxSearch.toLowerCase()) ||
    p.passportNo.toLowerCase().includes(paxSearch.toLowerCase()) ||
    p.nationality.toLowerCase().includes(paxSearch.toLowerCase())
  );

  const togglePax = (id: string) => setPaxSrc(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const ref = `AGT-${38820 + Math.floor(Math.random()*80)}`;

  if (done) return (
    <div className="min-h-[600px] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md w-full shadow-sm">
        <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-slate-800 text-[20px] font-bold mb-2">Booking Submitted</h2>
        <p className="text-slate-400 text-[13px] mb-2">Reference number</p>
        <p className="text-[24px] font-bold font-mono text-[#14213D] mb-6">{ref}</p>
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-[12px] text-left mb-6">
          {[
            ["Service", `${btype?.charAt(0).toUpperCase()}${btype?.slice(1)} · ${dest}`],
            ["Passengers", String(paxCount)],
            ["Service Cost", fmtAED(cost)],
            ["Commission", `+${fmtAED(commAmt)}`],
          ].map(([k,v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-slate-400">{k}</span>
              <span className={`font-semibold ${k === "Commission" ? "text-emerald-600" : ""}`}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setDone(false); setStep(0); setBtype(null); setPaxSrc([]); setCost(0); }} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">New Booking</button>
          <button onClick={() => navigate("/agent/bookings")} className="flex-1 py-2.5 rounded-xl bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54]">View All Bookings</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-[1400px]">
      <h1 className="text-slate-800 text-[20px] font-bold mb-5">New Booking</h1>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-[#14213D] text-white" : "bg-slate-200 text-slate-500"}`}>
                {i < step ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span className={`text-[11px] font-semibold ${i === step ? "text-slate-800" : i < step ? "text-emerald-600" : "text-slate-400"}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? "bg-emerald-300" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          {/* Step 0: Type */}
          {step === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
              <p className="text-[14px] font-bold text-slate-800 mb-2">Select Service Type</p>
              {TYPES.map(t => (
                <button key={t.key} onClick={() => setBtype(t.key)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${btype === t.key ? t.sel : t.def}`}>
                  <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${btype === t.key ? "bg-white/40" : "bg-slate-100"}`}>
                    <t.icon size={18} className={btype === t.key ? "" : "text-slate-500"} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[13px]">{t.label}</p>
                    <p className={`text-[11px] mt-0.5 ${btype === t.key ? "opacity-70" : "text-slate-400"}`}>{t.desc}</p>
                  </div>
                  {btype === t.key && <CheckCircle2 size={18} className="flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Passengers */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-bold text-slate-800">Select Passengers</p>
                {(btype === "transport" || btype === "catering") && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="text-slate-400">Headcount:</span>
                    <button onClick={() => setManPax(n => Math.max(1,n-1))} className="size-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><Minus size={12} /></button>
                    <span className="font-bold text-slate-800 w-6 text-center">{manPax}</span>
                    <button onClick={() => setManPax(n => n+1)} className="size-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><Plus size={12} /></button>
                  </div>
                )}
              </div>
              {(btype === "visa" || btype === "ticket" || btype === "hotel") && (
                <>
                  {paxSrc.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {paxSrc.map(id => {
                        const p = PASSENGERS.find(x => x.id === id)!;
                        return (
                          <span key={id} className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-[#14213D] text-white text-[11px] font-semibold">
                            {p.name.split(" ")[0]}
                            <button onClick={() => togglePax(id)} className="size-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X size={9} /></button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={paxSearch} onChange={e => setPaxSearch(e.target.value)} placeholder="Search passengers…" className="w-full pl-8 pr-3 py-2.5 text-[12px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D] placeholder:text-slate-400" />
                  </div>
                  <div className="max-h-[340px] overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-2">
                    {filtPax.map(p => {
                      const sel = paxSrc.includes(p.id);
                      const exp = isPassportExpiringSoon(p.passportExpiry);
                      return (
                        <button key={p.id} onClick={() => togglePax(p.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${sel ? "bg-[#14213D] text-white" : "hover:bg-slate-50"}`}>
                          <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${sel ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                            {p.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold">{p.name}</p>
                            <p className={`text-[10px] ${sel ? "text-white/50" : "text-slate-400"}`}>{p.nationality} · {p.passportNo}</p>
                          </div>
                          {exp !== "ok" && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${exp === "expired" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>{exp === "expired" ? "Expired" : "Exp. soon"}</span>}
                          {sel && <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Users size={12} />
                    <span>{paxSrc.length} passenger{paxSrc.length !== 1 ? "s" : ""} selected</span>
                    {paxSrc.length > 0 && <button onClick={() => setPaxSrc([])} className="text-[#F97316] hover:underline ml-2">Clear all</button>}
                  </div>
                </>
              )}
              {(btype === "transport" || btype === "catering") && (
                <div className="p-4 bg-slate-50 rounded-xl text-[12px] text-slate-500 text-center">
                  <Users size={20} className="mx-auto mb-2 text-slate-400" />
                  Headcount-based booking — {manPax} passenger{manPax !== 1 ? "s" : ""} configured above.
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <p className="text-[14px] font-bold text-slate-800">Service Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Destination / Country</label>
                  <select value={dest} onChange={e => setDest(e.target.value)} className={inp + " appearance-none"}>
                    <option value="">Select destination…</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>{btype === "ticket" ? "Departure Date" : btype === "hotel" ? "Check-in Date" : "Service Date"}</label>
                  <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} className={inp} />
                </div>
                {(btype === "ticket" || btype === "hotel") && (
                  <div>
                    <label className={lbl}>{btype === "ticket" ? "Return Date" : "Check-out Date"}</label>
                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className={inp} />
                  </div>
                )}
                {btype === "visa" && (
                  <div>
                    <label className={lbl}>Visa Type</label>
                    <select className={inp + " appearance-none"}><option>Tourist Visa</option><option>Business Visa</option><option>Student Visa</option><option>Transit Visa</option></select>
                  </div>
                )}
                {btype === "ticket" && (
                  <><div><label className={lbl}>Origin (IATA)</label><input placeholder="DXB" className={inp} /></div>
                  <div><label className={lbl}>Class</label><select className={inp + " appearance-none"}><option>Economy</option><option>Business</option><option>First Class</option></select></div></>
                )}
                {btype === "hotel" && (
                  <><div><label className={lbl}>Hotel Grade</label><input placeholder="5-star preferred…" className={inp} /></div>
                  <div><label className={lbl}>Room Type</label><select className={inp + " appearance-none"}><option>Standard</option><option>Deluxe</option><option>Suite</option></select></div></>
                )}
                {btype === "transport" && (
                  <><div><label className={lbl}>Pickup Location</label><input placeholder="Dubai Airport T3" className={inp} /></div>
                  <div><label className={lbl}>Drop-off</label><input placeholder="Downtown Dubai" className={inp} /></div>
                  <div><label className={lbl}>Vehicle Type</label><select className={inp + " appearance-none"}><option>Sedan</option><option>SUV</option><option>Minibus (12)</option><option>Coach (50)</option></select></div></>
                )}
                {btype === "catering" && (
                  <><div><label className={lbl}>Meal Type</label><select className={inp + " appearance-none"}><option>Halal Standard</option><option>Halal Premium</option><option>Vegetarian</option></select></div>
                  <div><label className={lbl}>Flight Number</label><input placeholder="EK 001" className={inp} /></div></>
                )}
                <div className="col-span-2">
                  <label className={lbl}>Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Special requirements…" className={inp + " resize-none"} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-slate-400" />
                <p className="text-[14px] font-bold text-slate-800">Pricing & Commission</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Net Service Cost (AED)</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold">AED</span>
                    <input type="number" value={cost || ""} onChange={e => setCost(Number(e.target.value))} placeholder="0.00" className={inp + " pl-10 font-mono"} /></div>
                </div>
                <div>
                  <label className={lbl}>Markup %</label>
                  <div className="relative"><input type="number" value={markup || ""} onChange={e => setMarkup(Number(e.target.value))} placeholder="0" className={inp + " pr-8"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">%</span></div>
                </div>
                <div>
                  <label className={lbl}>Commission Rate</label>
                  <div className="relative"><input type="number" value={commRate} onChange={e => setCommRate(Number(e.target.value))} className={inp + " pr-8"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">%</span></div>
                  <p className="text-[9px] text-slate-400 mt-1">Your tier rate: {TIER_CFG[AGENT_PROFILE.tier].rate}%</p>
                </div>
                <div>
                  <label className={lbl}>VAT Rate</label>
                  <div className="relative"><input type="number" value={vatRate} onChange={e => setVatRate(Number(e.target.value))} className={inp + " pr-8"} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">%</span></div>
                </div>
                <div>
                  <label className={lbl}>Client Reference</label>
                  <input value={clientRef} onChange={e => setClientRef(e.target.value)} placeholder="CL-001" className={inp} />
                </div>
                <div>
                  <label className={lbl}>PO Number</label>
                  <input placeholder="PO-2025-XXX" className={inp} />
                </div>
              </div>
              {cost > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                  <p className="text-[11px] font-bold text-emerald-800 mb-3 flex items-center gap-1.5"><Calculator size={12} /> Live Calculation</p>
                  {[
                    ["Net Service Cost", fmtAED(cost), "text-slate-700"],
                    [`Markup (${markup}%)`, `+${fmtAED(markupAmt)}`, "text-slate-700"],
                    [`VAT (${vatRate}%)`, `+${fmtAED(vatAmt)}`, "text-slate-700"],
                    ["Client Invoice Total", fmtAED(total), "text-slate-800 font-bold"],
                    [`Commission (${commRate}%)`, `+${fmtAED(commAmt)}`, "text-emerald-700 font-bold"],
                    ["Your Net Earning", `+${fmtAED(netEarn)}`, "text-emerald-800 font-black"],
                  ].map(([k,v,cls]) => (
                    <div key={k} className={`flex justify-between text-[12px] ${k === "Your Net Earning" ? "pt-2 border-t border-emerald-200 mt-1" : ""}`}>
                      <span className="text-emerald-700">{k}</span>
                      <span className={`font-mono ${cls}`}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <p className="text-[14px] font-bold text-slate-800">Review & Submit</p>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                {[
                  ["Service Type", `${btype?.charAt(0).toUpperCase()}${btype?.slice(1)}`],
                  ["Destination", dest || "—"],
                  ["Travel Date", travelDate || "—"],
                  ["Return Date", returnDate || "—"],
                  ["Passengers", String(paxCount)],
                  ["Service Cost", fmtAED(cost)],
                  ["Client Total", fmtAED(total)],
                  ["Commission", fmtAED(commAmt)],
                  ["Net Earning", fmtAED(netEarn)],
                  ["Client Ref", clientRef || "—"],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-400">{k}</span>
                    <span className="font-semibold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
              {paxSrc.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Passengers ({paxSrc.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {paxSrc.map(id => { const p = PASSENGERS.find(x => x.id === id)!; return <span key={id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{p.name}</span>; })}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <input type="checkbox" className="accent-[#F97316] mt-0.5" defaultChecked />
                <p className="text-[11px] text-amber-700">I confirm all passenger details are correct. The booking cost of {fmtAED(cost)} will be deducted from my wallet.</p>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step === 0} className="px-5 py-2.5 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors">← Back</button>
            {step < STEPS.length - 1
              ? <button onClick={() => setStep(s => s+1)} disabled={!canNext} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54] disabled:opacity-40 transition-colors">Continue <ArrowRight size={13} /></button>
              : <button onClick={() => setDone(true)} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-[12px] font-bold hover:bg-emerald-600 transition-colors"><CheckCircle2 size={13} /> Submit Booking</button>
            }
          </div>
        </div>

        {/* Summary sidebar */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-4">
            <p className="text-[12px] font-bold text-slate-800 mb-4">Booking Summary</p>
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-semibold text-slate-700">{btype ? TYPES.find(t => t.key === btype)?.label : "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Destination</span><span className="font-semibold text-slate-700">{dest || "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Passengers</span><span className="font-semibold text-slate-700">{paxCount || "—"}</span></div>
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-400">Service Cost</span><span className="font-mono font-semibold text-slate-700">{cost ? fmtAED(cost) : "—"}</span></div>
                {cost > 0 && <>
                  <div className="flex justify-between"><span className="text-slate-400">Client Total</span><span className="font-mono font-semibold text-slate-700">{fmtAED(total)}</span></div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-100"><span className="text-emerald-600 font-semibold">Your Earning</span><span className="font-mono font-bold text-emerald-600">+{fmtAED(netEarn)}</span></div>
                </>}
              </div>
            </div>
            <div className="mt-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Wallet after booking</p>
              <p className={`text-[14px] font-bold font-mono ${AGENT_PROFILE.walletBalance - cost < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtAED(AGENT_PROFILE.walletBalance - (cost || 0))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
