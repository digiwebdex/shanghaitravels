import { useState } from "react";
import { Link } from "react-router";
import { Plane, Building2, Search, ArrowLeftRight, Star, Clock, Wifi, Coffee, Luggage, ChevronDown, Filter } from "lucide-react";

const FLIGHTS = [
  { airline: "Emirates",       code: "EK", from: "DXB 08:30", to: "LHR 13:15", stops: "Non-stop",    duration: "7h 45m", price: "AED 2,840", rating: 4.9, amenities: ["wifi", "meals", "entertainment"] },
  { airline: "Etihad",         code: "EY", from: "AUH 10:00", to: "LHR 14:30", stops: "Non-stop",    duration: "7h 30m", price: "AED 2,650", rating: 4.7, amenities: ["meals", "entertainment"] },
  { airline: "British Airways", code: "BA", from: "DXB 02:15", to: "LHR 07:40", stops: "Non-stop",    duration: "7h 25m", price: "AED 3,100", rating: 4.5, amenities: ["wifi", "meals"] },
  { airline: "Qatar Airways",  code: "QR", from: "DXB 01:00", to: "LHR 08:45", stops: "1 stop (DOH)", duration: "9h 45m", price: "AED 2,190", rating: 4.8, amenities: ["wifi", "meals", "entertainment"] },
];

const HOTELS = [
  { name: "The Ritz-Carlton, Dubai", stars: 5, rating: 4.9, reviews: 1420, area: "JBR Beach",       price: "AED 1,200", img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500&h=320&fit=crop&auto=format", amenities: ["Pool", "Spa", "Beach", "WiFi"] },
  { name: "Atlantis The Palm",       stars: 5, rating: 4.8, reviews: 3210, area: "Palm Jumeirah",   price: "AED 980",   img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&h=320&fit=crop&auto=format", amenities: ["Water Park", "Beach", "Spa"] },
  { name: "Burj Al Arab Jumeirah",   stars: 5, rating: 5.0, reviews: 892,  area: "Jumeirah Beach",  price: "AED 4,800", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&h=320&fit=crop&auto=format", amenities: ["Butler", "Beach", "Helipad"] },
];

export default function Flights() {
  const [tab, setTab] = useState<"Flights" | "Hotels">("Flights");
  const [tripType, setTripType] = useState("Return");

  return (
    <div>
      <section className="bg-primary py-20">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Search & Book</p>
            <h1 className="text-white text-4xl font-bold mb-3">{tab === "Flights" ? "Find the Best Flights" : "Find Your Perfect Hotel"}</h1>
            <p className="text-white/65">Compare 500+ airlines and 100,000+ hotels with best-price guarantee.</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-1 mb-0">
              {(["Flights", "Hotels"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${tab === t ? "bg-white text-primary" : "bg-white/15 text-white/80 hover:bg-white/25"}`}>
                  {t === "Flights" ? <Plane size={14} /> : <Building2 size={14} />} {t}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-b-2xl rounded-tr-2xl p-5 shadow-2xl">
              {tab === "Flights" ? (
                <>
                  <div className="flex gap-3 mb-4">
                    {["Return", "One Way", "Multi-City"].map(t => (
                      <button key={t} onClick={() => setTripType(t)} className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${tripType === t ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}>{t}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">From</label>
                      <input defaultValue="Dubai (DXB)" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary" />
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">To</label>
                      <input defaultValue="London (LHR)" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary" />
                      <button className="absolute left-1/2 -translate-x-1/2 top-7 size-7 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow z-10">
                        <ArrowLeftRight size={12} className="text-white" />
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Depart</label>
                      <input type="date" defaultValue="2025-03-15" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Class</label>
                      <div className="relative">
                        <select className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background appearance-none focus:outline-none">
                          <option>1 Adult · Economy</option><option>2 Adults · Economy</option><option>1 Adult · Business</option>
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                    <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-colors">
                      <Search size={15} /> Search
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Destination</label>
                    <input defaultValue="Dubai, UAE" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Check-In</label>
                    <input type="date" defaultValue="2025-03-15" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Check-Out</label>
                    <input type="date" defaultValue="2025-03-22" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                  </div>
                  <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-colors">
                    <Search size={15} /> Search Hotels
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          {tab === "Flights" ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-foreground font-bold text-lg">Dubai → London</h2>
                  <p className="text-sm text-muted-foreground">15 Mar · 1 Adult · Economy · {FLIGHTS.length} results</p>
                </div>
                <select className="text-sm border border-border rounded-lg px-3 py-2 bg-background"><option>Cheapest First</option><option>Fastest First</option></select>
              </div>
              <div className="space-y-3">
                {FLIGHTS.map((f, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row items-start md:items-center gap-5 hover:shadow-sm transition-all">
                    <div className="size-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">{f.code}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-foreground">{f.airline}</p>
                        <div className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" /><span className="text-xs font-semibold">{f.rating}</span></div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-foreground">{f.from}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-16 h-px bg-border relative"><Plane size={10} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" /></div>
                          <span className="text-xs">{f.stops}</span>
                          <div className="w-16 h-px bg-border" />
                        </div>
                        <span className="font-bold text-foreground">{f.to}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} /> {f.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {f.amenities.includes("wifi") && <Wifi size={13} className="text-muted-foreground" />}
                        {f.amenities.includes("meals") && <Coffee size={13} className="text-muted-foreground" />}
                        {f.amenities.includes("entertainment") && <Luggage size={13} className="text-muted-foreground" />}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">{f.price}</p>
                        <p className="text-[11px] text-muted-foreground">per person</p>
                      </div>
                      <Link to="/inquiry" className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-bold hover:bg-orange-600 transition-colors">Book</Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-foreground font-bold text-lg">Hotels in Dubai</h2>
                  <p className="text-sm text-muted-foreground">15–22 Mar · 1 Room · {HOTELS.length} results</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {HOTELS.map(h => (
                  <div key={h.name} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                    <div className="relative h-44 overflow-hidden">
                      <img src={h.img} alt={h.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 left-3 flex gap-0.5">{[...Array(h.stars)].map((_, i) => <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />)}</div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div><h4 className="font-bold text-foreground text-sm">{h.name}</h4><p className="text-xs text-muted-foreground">{h.area}</p></div>
                        <div className="bg-primary text-white px-1.5 py-0.5 rounded text-[11px] font-bold">{h.rating}</div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">{h.amenities.map(a => <span key={a} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">{a}</span>)}</div>
                      <div className="flex items-center justify-between">
                        <div><p className="text-[11px] text-muted-foreground">From</p><p className="font-bold text-foreground">{h.price} <span className="text-xs font-normal text-muted-foreground">/ night</span></p></div>
                        <Link to="/inquiry" className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-bold hover:bg-orange-600 transition-colors">Book Now</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
