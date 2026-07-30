import { useParams, Link } from "react-router";
import { Star, Clock, Users, MapPin, CheckCircle2, X, Calendar, Phone, ArrowRight, ArrowLeft, Share2, Heart } from "lucide-react";
import { TOUR_PACKAGES } from "./Tours";

export default function TourDetail() {
  const { id } = useParams();
  const tour = TOUR_PACKAGES.find(t => t.id === id) ?? TOUR_PACKAGES[0];

  return (
    <div className="bg-background">
      <div className="bg-card border-b border-border py-3">
        <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-between">
          <Link to="/tours" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Back to Packages
          </Link>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"><Share2 size={13} /> Share</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"><Heart size={13} /> Save</button>
          </div>
        </div>
      </div>

      <div className="relative h-[420px] overflow-hidden">
        <img src={tour.img} alt={tour.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-8 max-w-[1440px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent text-white">{tour.category}</span>
            {tour.tags.map(t => <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30">{t}</span>)}
          </div>
          <h1 className="text-white text-3xl font-bold mb-1">{tour.title}</h1>
          <p className="text-white/75 flex items-center gap-1.5 text-sm"><MapPin size={13} />{tour.dest}</p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Clock,    label: "Duration",    val: tour.duration },
                  { icon: Users,    label: "Group Size",  val: `${tour.minGroup}–${tour.maxGroup} pax` },
                  { icon: Star,     label: "Rating",      val: `${tour.rating} / 5.0` },
                  { icon: Calendar, label: "Availability",val: "Year-round" },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 bg-muted rounded-lg">
                    <s.icon size={16} className="text-primary mx-auto mb-1.5" />
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{s.label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-foreground font-bold mb-4">Trip Highlights</h3>
              <div className="grid grid-cols-2 gap-3">
                {tour.highlights.map(h => (
                  <div key={h} className="flex items-center gap-2 text-sm">
                    <div className="size-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={11} className="text-accent" /></div>
                    <span className="text-foreground">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-foreground font-bold mb-4">What's Included</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Included</p>
                  <ul className="space-y-2">
                    {tour.includes.map(inc => (
                      <li key={inc} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 size={13} className="text-green-500 flex-shrink-0" /> {inc}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Not Included</p>
                  <ul className="space-y-2">
                    {["Travel insurance", "Personal expenses", "Optional excursions", "Visa fees"].map(exc => (
                      <li key={exc} className="flex items-center gap-2 text-sm text-muted-foreground"><X size={13} className="text-red-400 flex-shrink-0" /> {exc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-foreground font-bold mb-5">Sample Itinerary</h3>
              <div className="space-y-4">
                {["Arrival & Check-In · Welcome dinner at a local restaurant", "Full-day city tour · Key landmarks, museums, local markets", "Optional excursion or leisure day · Spa, shopping, or guided tour", "Day trip to nearby attraction · Scenic views and cultural experience", "Departure day · Breakfast, airport transfer"].map((day, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                      {i < 4 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-semibold text-accent uppercase mb-0.5">Day {i + 1}</p>
                      <p className="text-sm text-foreground">{day.split("·")[0].trim()}</p>
                      {day.includes("·") && <p className="text-xs text-muted-foreground mt-0.5">{day.split("·")[1].trim()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-24">
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg">
                <div className="bg-primary p-5">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-white">{tour.price}</span>
                    <span className="text-white/60 text-sm">per person</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-yellow-400 fill-yellow-400" />)}
                    <span className="text-white/60 text-xs ml-1">{tour.rating} ({tour.reviews} reviews)</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Travel Date</label>
                    <input type="date" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Passengers</label>
                    <select className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background appearance-none focus:outline-none">
                      {[2, 3, 4, 5, 6].map(n => <option key={n}>{n} Adults</option>)}
                    </select>
                  </div>
                  <div className="border-t border-border pt-4 space-y-2">
                    {[{ k: "Package × 2", v: `${tour.price} × 2` }, { k: "Taxes & fees", v: "AED 480" }].map(r => (
                      <div key={r.k} className="flex justify-between text-sm"><span className="text-muted-foreground">{r.k}</span><span className="font-medium text-foreground">{r.v}</span></div>
                    ))}
                    <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
                      <span>Total</span>
                      <span className="text-lg">AED {(tour.priceNum * 2 + 480).toLocaleString()}</span>
                    </div>
                  </div>
                  <Link to="/inquiry" className="block w-full text-center py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-orange-600 transition-colors">Book This Package</Link>
                  <Link to="/payment" className="block w-full text-center py-3 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">Pay Online</Link>
                  <a href="tel:+97141234567" className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center justify-center gap-1">
                    <Phone size={11} /> Questions? +971 4 123 4567
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
