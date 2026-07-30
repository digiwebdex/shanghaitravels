import { useState } from "react";
import { Link } from "react-router";
import { Search, Star, Clock, Users, ChevronDown, MapPin, ArrowRight } from "lucide-react";

export const TOUR_PACKAGES = [
  { id: "london-classic",      img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=380&fit=crop&auto=format", title: "London City Classic",       dest: "London, UK",        duration: "7 Nights",  minGroup: 2, maxGroup: 15, price: "AED 5,200", priceNum: 5200, rating: 4.9, reviews: 214, category: "Cultural", tags: ["Hotel", "Flights", "Tours"],        highlights: ["Tower of London", "Buckingham Palace", "Thames Cruise", "West End Show"],    includes: ["Return flights", "4-star hotel", "Daily breakfast", "Airport transfers", "City tour"] },
  { id: "bali-escape",         img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=380&fit=crop&auto=format", title: "Bali Tropical Escape",      dest: "Bali, Indonesia",   duration: "10 Nights", minGroup: 2, maxGroup: 10, price: "AED 4,800", priceNum: 4800, rating: 4.8, reviews: 389, category: "Beach",    tags: ["Villa", "Spa", "Flights"],             highlights: ["Ubud Rice Terraces", "Tanah Lot Temple", "Seminyak Beach", "Spa Day"],       includes: ["Return flights", "Private villa", "Daily breakfast", "Private driver", "Temple tour"] },
  { id: "istanbul-cappadocia", img: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=380&fit=crop&auto=format", title: "Istanbul & Cappadocia",     dest: "Turkey",            duration: "8 Nights",  minGroup: 2, maxGroup: 20, price: "AED 3,950", priceNum: 3950, rating: 4.9, reviews: 176, category: "Cultural", tags: ["Hotel", "Tour", "Flights"],             highlights: ["Hot Air Balloon", "Hagia Sophia", "Grand Bazaar", "Bosphorus Cruise"],       includes: ["Return flights", "Cave hotel", "Balloon ride", "Daily breakfast", "Guide"] },
  { id: "maldives-luxury",     img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=380&fit=crop&auto=format", title: "Maldives Overwater Escape", dest: "Maldives",          duration: "6 Nights",  minGroup: 2, maxGroup: 4,  price: "AED 9,800", priceNum: 9800, rating: 5.0, reviews: 98,  category: "Beach",    tags: ["Overwater Bungalow", "All-Inclusive"], highlights: ["Overwater villa", "Snorkelling", "Sunset cruise", "Couples spa"],            includes: ["Return flights", "Overwater bungalow", "All meals", "Speedboat", "Water sports"] },
  { id: "paris-romance",       img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=380&fit=crop&auto=format", title: "Paris Romance Weekend",     dest: "Paris, France",     duration: "5 Nights",  minGroup: 2, maxGroup: 2,  price: "AED 4,200", priceNum: 4200, rating: 4.8, reviews: 301, category: "Romance",  tags: ["Hotel", "Flights", "Dinner"],           highlights: ["Eiffel Tower dinner", "Louvre Museum", "Seine cruise", "Champagne breakfast"], includes: ["Return flights", "Boutique hotel", "Breakfast daily", "Seine cruise", "Guide"] },
  { id: "kenya-safari",        img: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&h=380&fit=crop&auto=format", title: "Kenya Safari Adventure",    dest: "Nairobi, Kenya",    duration: "9 Nights",  minGroup: 4, maxGroup: 12, price: "AED 7,800", priceNum: 7800, rating: 4.9, reviews: 142, category: "Adventure",tags: ["Safari", "Lodge", "Wildlife"],          highlights: ["Maasai Mara Game Drive", "Amboseli Park", "Sundowner", "Maasai Village"],    includes: ["Return flights", "Safari lodge", "All meals", "Game drives", "Guide"] },
];

const CATEGORIES = ["All", "Cultural", "Beach", "Romance", "Adventure"];

export default function Tours() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Popular");

  let results = TOUR_PACKAGES.filter(t =>
    (t.title.toLowerCase().includes(search.toLowerCase()) || t.dest.toLowerCase().includes(search.toLowerCase())) &&
    (category === "All" || t.category === category)
  );
  if (sortBy === "Price: Low")  results = [...results].sort((a, b) => a.priceNum - b.priceNum);
  if (sortBy === "Price: High") results = [...results].sort((a, b) => b.priceNum - a.priceNum);
  if (sortBy === "Rating")      results = [...results].sort((a, b) => b.rating - a.rating);

  return (
    <div>
      <section className="relative py-28 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&h=500&fit=crop&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/78" />
        <div className="relative max-w-[1440px] mx-auto px-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Tour Packages</p>
          <h1 className="text-white text-4xl font-bold mb-4">Curated Travel Experiences</h1>
          <p className="text-white/65 max-w-xl mx-auto mb-8">From cultural city breaks to luxury beach escapes — handcrafted itineraries for every type of traveller.</p>
          <div className="max-w-xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-3 text-sm border border-border rounded-xl bg-white focus:outline-none placeholder:text-muted-foreground" placeholder="Search destinations or packages…" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card border-b border-border py-4 sticky top-16 z-30">
        <div className="max-w-[1440px] mx-auto px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${category === c ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{c}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{results.length} packages</span>
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="pl-3 pr-8 py-1.5 text-xs border border-border rounded-lg bg-background appearance-none focus:outline-none">
                <option>Popular</option><option>Rating</option><option>Price: Low</option><option>Price: High</option>
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(tour => (
              <Link key={tour.id} to={`/tours/${tour.id}`} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                <div className="relative overflow-hidden h-52">
                  <img src={tour.img} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {tour.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] font-semibold px-2 py-0.5 bg-white/90 text-foreground rounded-full">{t}</span>)}
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-white">{tour.rating}</span>
                    <span className="text-xs text-white/70">({tour.reviews})</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{tour.category}</div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin size={10} />{tour.dest}</p>
                  <h3 className="text-foreground font-bold mb-3">{tour.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Clock size={11} /> {tour.duration}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {tour.minGroup}–{tour.maxGroup} pax</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground">From</p>
                      <p className="text-lg font-bold text-foreground">{tour.price}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-accent group-hover:gap-2 transition-all">View Details <ArrowRight size={13} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/40 border-t border-border">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <h2 className="text-foreground text-2xl font-bold mb-2">Can't Find What You're Looking For?</h2>
          <p className="text-muted-foreground mb-6">We design fully custom itineraries tailored to your preferences, group size, and budget.</p>
          <Link to="/inquiry" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-bold hover:bg-orange-600 transition-colors">Request Custom Tour <ArrowRight size={14} /></Link>
        </div>
      </section>
    </div>
  );
}
