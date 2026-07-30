import { useState } from "react";
import { Link } from "react-router";
import { Search, ChevronDown, Clock, CheckCircle2, AlertCircle, ArrowRight, Filter } from "lucide-react";

const VISA_DATA = [
  { country: "United Kingdom",  flag: "🇬🇧", type: "Tourist",  duration: "6 months",  processing: "15 days", fee: "AED 680",  approval: 94, requirements: ["Passport", "Bank Statement", "Hotel Booking", "Return Ticket"] },
  { country: "United States",   flag: "🇺🇸", type: "Tourist",  duration: "10 years",  processing: "21 days", fee: "AED 850",  approval: 88, requirements: ["Passport", "DS-160 Form", "Photo", "Financial Proof"] },
  { country: "Schengen",        flag: "🇪🇺", type: "Tourist",  duration: "90 days",   processing: "10 days", fee: "AED 540",  approval: 91, requirements: ["Passport", "Travel Insurance", "Accommodation", "Itinerary"] },
  { country: "Australia",       flag: "🇦🇺", type: "Tourist",  duration: "12 months", processing: "20 days", fee: "AED 720",  approval: 89, requirements: ["Passport", "Health Check", "Financial Docs", "Sponsor Letter"] },
  { country: "Canada",          flag: "🇨🇦", type: "Tourist",  duration: "10 years",  processing: "30 days", fee: "AED 640",  approval: 85, requirements: ["Passport", "Biometrics", "Financial Proof", "Purpose Letter"] },
  { country: "Japan",           flag: "🇯🇵", type: "Tourist",  duration: "90 days",   processing: "5 days",  fee: "AED 380",  approval: 97, requirements: ["Passport", "Itinerary", "Hotel Booking", "Bank Statement"] },
  { country: "Thailand",        flag: "🇹🇭", type: "Tourist",  duration: "60 days",   processing: "1 day",   fee: "AED 180",  approval: 99, requirements: ["Passport", "Photo", "Return Ticket", "AED 5,000 funds"] },
  { country: "Turkey",          flag: "🇹🇷", type: "E-Visa",   duration: "90 days",   processing: "1 day",   fee: "AED 140",  approval: 99, requirements: ["Passport", "Credit Card", "Email"] },
  { country: "India",           flag: "🇮🇳", type: "E-Visa",   duration: "90 days",   processing: "2 days",  fee: "AED 220",  approval: 97, requirements: ["Passport", "Photo", "Return Ticket", "Hotel Proof"] },
  { country: "Saudi Arabia",    flag: "🇸🇦", type: "Tourist",  duration: "90 days",   processing: "3 days",  fee: "AED 460",  approval: 96, requirements: ["Passport", "Photo", "Travel Insurance", "Online Form"] },
  { country: "Malaysia",        flag: "🇲🇾", type: "Free",     duration: "90 days",   processing: "Instant", fee: "Free",     approval: 100,requirements: ["Valid Passport"] },
  { country: "New Zealand",     flag: "🇳🇿", type: "NZeTA",    duration: "2 years",   processing: "3 days",  fee: "AED 65",   approval: 99, requirements: ["Passport", "Credit Card", "Email"] },
];

const VISA_TYPES = ["All Types", "Tourist", "Business", "Student", "E-Visa", "Free"];

export default function Visa() {
  const [search, setSearch] = useState("");
  const [visaType, setVisaType] = useState("All Types");
  const [selected, setSelected] = useState<typeof VISA_DATA[0] | null>(null);

  const filtered = VISA_DATA.filter(v =>
    v.country.toLowerCase().includes(search.toLowerCase()) &&
    (visaType === "All Types" || v.type === visaType)
  );

  return (
    <div>
      <section className="bg-primary py-24">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Visa Information</p>
          <h1 className="text-white text-4xl font-bold mb-4">Visa Requirements Explorer</h1>
          <p className="text-white/65 max-w-xl mx-auto mb-8">Check requirements, processing times, and fees for 100+ destinations — then apply in minutes.</p>
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary placeholder:text-muted-foreground" placeholder="Search destination country…" />
              </div>
              <div className="relative">
                <select value={visaType} onChange={e => setVisaType(e.target.value)} className="px-3 py-2.5 text-sm border border-border rounded-lg bg-background appearance-none focus:outline-none pr-8">
                  {VISA_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 border-b border-border py-5">
        <div className="max-w-[1440px] mx-auto px-8 flex flex-wrap items-center justify-center gap-8">
          {[{ val: "100+", label: "Destinations" }, { val: "98.7%", label: "Approval Rate" }, { val: "1 Day", label: "Min. Processing" }, { val: "24/7", label: "Visa Support" }].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-bold text-lg text-foreground">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground"><strong className="text-foreground">{filtered.length}</strong> destinations found</p>
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-muted-foreground" />
              <select className="text-xs border border-border rounded-md px-2 py-1 bg-background">
                <option>Processing Time</option><option>Fee (Low to High)</option><option>Approval Rate</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={`space-y-3 ${selected ? "lg:col-span-2" : "lg:col-span-3"}`}>
              {filtered.map(v => (
                <button key={v.country} onClick={() => setSelected(selected?.country === v.country ? null : v)} className={`w-full text-left bg-card rounded-xl border transition-all hover:shadow-sm p-4 ${selected?.country === v.country ? "border-primary ring-2 ring-primary/15" : "border-border"}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{v.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{v.country}</p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#DBEAFE] text-[#1E40AF] rounded">{v.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Up to {v.duration}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                      <div className="text-center"><p className="text-[10px] text-muted-foreground mb-0.5">Processing</p><p className="text-sm font-bold text-foreground">{v.processing}</p></div>
                      <div className="text-center"><p className="text-[10px] text-muted-foreground mb-0.5">Fee</p><p className="text-sm font-bold text-foreground">{v.fee}</p></div>
                      <div className="text-center"><p className="text-[10px] text-muted-foreground mb-0.5">Approval</p><p className="text-sm font-bold text-foreground">{v.approval}%</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to="/inquiry" onClick={e => e.stopPropagation()} className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-orange-600 transition-colors">Apply</Link>
                      <ArrowRight size={14} className={`text-muted-foreground transition-transform ${selected?.country === v.country ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border border-border overflow-hidden sticky top-24">
                  <div className="bg-primary p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">{selected.flag}</span>
                      <div>
                        <h3 className="text-white font-bold">{selected.country}</h3>
                        <p className="text-white/60 text-xs">{selected.type} Visa</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      {[{ label: "Duration", val: selected.duration }, { label: "Processing", val: selected.processing }, { label: "Fee", val: selected.fee }, { label: "Approval", val: `${selected.approval}%` }].map(d => (
                        <div key={d.label} className="bg-muted rounded-lg p-3">
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">{d.label}</p>
                          <p className="font-bold text-foreground mt-0.5 text-sm">{d.val}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Required Documents</p>
                      <ul className="space-y-1.5">
                        {selected.requirements.map(r => (
                          <li key={r} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">Processing times are estimates. Actual times may vary based on embassy workload.</p>
                    </div>
                    <Link to="/inquiry" className="block w-full text-center py-3 rounded-lg bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-colors">Apply for {selected.country} Visa</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-14 bg-muted/40 border-t border-border">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <h2 className="text-foreground text-2xl font-bold mb-2">Need Help With Your Visa Application?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Our visa specialists have a 98.7% approval rate. Let us handle the paperwork.</p>
          <Link to="/inquiry" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-orange-600 transition-colors">
            Start Visa Application <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
