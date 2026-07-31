import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Plane, Building2, FileText, Map, Star, Shield, Award,
  Users, Globe, ArrowRight, CheckCircle2, Phone,
  TrendingUp, Clock, Heart, Quote, Zap, BadgeCheck, Headphones,
  GraduationCap, Stethoscope, Bus, Hotel, ScrollText,
} from "lucide-react";

const SERVICES = [
  { icon: FileText,     label: "Visa Services",      color: "#DBEAFE", tc: "#1E40AF", path: "/visa",     desc: "Tourist, business & student visas for 100+ countries" },
  { icon: Plane,        label: "Air Ticketing",       color: "#E0F2FE", tc: "#075985", path: "/flights",  desc: "Best fares on 500+ airlines, group & charter bookings" },
  { icon: Building2,    label: "Hotel Booking",       color: "#CCFBF1", tc: "#0F5952", path: "/flights",  desc: "4 & 5-star hotels, resorts and serviced apartments" },
  { icon: Map,          label: "Tour Packages",       color: "#DCFCE7", tc: "#14532D", path: "/tours",    desc: "Curated itineraries, guided & custom travel" },
  { icon: Star,         label: "Hajj & Umrah",        color: "#FEF3C7", tc: "#78350F", path: "/services", desc: "VIP & economy packages with full pilgrimage support" },
  { icon: Globe,        label: "Immigration",          color: "#EDE9FE", tc: "#5B21B6", path: "/services", desc: "Residency, work permits & immigration consultancy" },
  { icon: Stethoscope,  label: "Medical Tourism",      color: "#FFE4E6", tc: "#9F1239", path: "/services", desc: "Treatment coordination with top global hospitals" },
  { icon: Users,        label: "Corporate Travel",     color: "#EEF2FF", tc: "#3730A3", path: "/services", desc: "Managed travel for businesses, MICE & conferences" },
  { icon: Zap,          label: "AI Travel Planner",    color: "#CFFAFE", tc: "#164E63", path: "/services", desc: "Personalised itineraries powered by AI in seconds" },
];

const STATS = [
  { val: "15+",     label: "Years in Business" },
  { val: "50,000+", label: "Happy Travellers" },
  { val: "100+",    label: "Visa Destinations" },
  { val: "98.7%",   label: "Approval Rate" },
  { val: "24/7",    label: "Expert Support" },
];

const TOURS = [
  { id: "london-classic",       img: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=380&fit=crop&auto=format", title: "London City Classic",      dest: "London, UK",       duration: "7 Nights",  price: "AED 5,200", rating: 4.9, reviews: 214 },
  { id: "bali-escape",          img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=380&fit=crop&auto=format", title: "Bali Tropical Escape",     dest: "Bali, Indonesia",  duration: "10 Nights", price: "AED 4,800", rating: 4.8, reviews: 389 },
  { id: "istanbul-cappadocia",  img: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=380&fit=crop&auto=format", title: "Istanbul & Cappadocia",    dest: "Turkey",           duration: "8 Nights",  price: "AED 3,950", rating: 4.9, reviews: 176 },
];

const TESTIMONIALS = [
  { name: "Mohammed Al-Farsi", title: "Business Traveller", avatar: "M", rating: 5, text: "Shanghai Travels processed our group business visa to the UK in record time. The team was professional, responsive, and the experience was seamless. Highly recommend." },
  { name: "Priya Nair",        title: "Leisure Traveller",  avatar: "P", rating: 5, text: "Booked our family Bali package and the trip was perfectly organised — flights, hotel, transfers, tours. Everything was exactly as described. We'll definitely book again." },
  { name: "Carlos Mendez",     title: "Corporate Client",   avatar: "C", rating: 5, text: "We manage travel for 200+ employees and TravelOS has transformed our booking process. Real-time status, automated approvals, and incredible support." },
];

type HeroSvc = {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  url: string;
  sortOrder: number;
};

const DEFAULT_HERO_SVCS: HeroSvc[] = [
  { icon: "passport", title: "Visa Services", description: "Tourist, business, student and family visas — prepared carefully for destinations worldwide.", buttonText: "Apply Now", url: "/inquiry?service=visa", sortOrder: 10 },
  { icon: "kaaba", title: "Hajj & Umrah", description: "Complete pilgrimage packages with flights, hotels, transport and on-ground guidance.", buttonText: "View Packages", url: "/tours", sortOrder: 20 },
  { icon: "plane", title: "Air Ticket", description: "Domestic and international tickets for individuals, families and groups.", buttonText: "Book Now", url: "/inquiry?service=air_ticket", sortOrder: 30 },
  { icon: "globe", title: "Tour Packages", description: "Curated itineraries for families, honeymoons and groups — built around you.", buttonText: "Explore Tours", url: "/tours", sortOrder: 40 },
];

function heroIcon(key: string) {
  const cls = "text-accent";
  if (key === "passport") return <ScrollText size={22} className={cls} aria-hidden />;
  if (key === "plane") return <Plane size={22} className={cls} aria-hidden />;
  if (key === "hotel") return <Hotel size={22} className={cls} aria-hidden />;
  if (key === "bus") return <Bus size={22} className={cls} aria-hidden />;
  if (key === "kaaba") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <path d="M4 8.5 12 4l8 4.5v11L12 24 4 19.5v-11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M4 8.5 12 13l8-4.5M12 13v11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  return <Globe size={22} className={cls} aria-hidden />;
}

export default function Home() {
  const [heroSvcs, setHeroSvcs] = useState<HeroSvc[]>(DEFAULT_HERO_SVCS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api2/site/content?type=hero_service");
        if (!res.ok) return;
        const rows = (await res.json()) as Array<{
          title: string;
          summary?: string;
          body?: string;
          coverUrl?: string;
          meta?: { url?: string; icon?: string };
          sortOrder?: number;
          status?: string;
        }>;
        const mapped = rows
          .filter((r) => r.status === "published" || !r.status)
          .map((r) => ({
            icon: r.coverUrl || r.meta?.icon || "globe",
            title: r.title,
            description: r.summary || "",
            buttonText: r.body || "Learn more",
            url: r.meta?.url || "/inquiry",
            sortOrder: r.sortOrder || 0,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .slice(0, 6);
        if (!cancelled && mapped.length) setHeroSvcs(mapped);
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden -mt-16">
        <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&h=900&fit=crop&auto=format" alt="Travel destinations" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/82 via-primary/62 to-primary/45" />
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-8 pt-28 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium mb-6 backdrop-blur-sm">
            <BadgeCheck size={13} className="text-accent" /> Govt. Registered · Reg. No 0017053 · Dhaka, Bangladesh
          </div>
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-5 leading-[1.1] max-w-4xl mx-auto tracking-tight">
            Your World,<br /><span className="text-accent">Expertly Planned.</span>
          </h1>
          <p className="text-white/75 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Visa, air tickets, hotels, tours, Hajj & Umrah and more — for every country, handled by our specialists in Dhaka, Bangladesh.
          </p>

          {/* Premium Hero Services */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto text-left" aria-label="Featured travel services">
            {heroSvcs.map((svc) => (
              <li key={svc.title}>
                <Link
                  to={svc.url}
                  className="group flex h-full flex-col rounded-2xl border border-white/15 bg-white/10 p-4 md:p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/16 hover:border-white/30 hover:shadow-xl hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label={`${svc.title}: ${svc.buttonText}`}
                >
                  <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-accent/15 transition-colors group-hover:bg-accent/25" aria-hidden>
                    {heroIcon(svc.icon)}
                  </span>
                  <span className="text-[15px] font-bold text-white">{svc.title}</span>
                  <span className="mt-1.5 text-[12px] leading-relaxed text-white/70 flex-1">{svc.description}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-accent">
                    {svc.buttonText}
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              to="/inquiry"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Request a Free Consultation
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { icon: Shield,       label: "Govt. Registered" },
              { icon: Award,        label: "Reg. No 0017053" },
              { icon: CheckCircle2, label: "Visa · Air · Tours · Hajj" },
              { icon: Headphones,   label: "Dhaka, Bangladesh" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-white/80 text-sm">
                <b.icon size={15} className="text-accent" /> {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-primary">
        <div className="max-w-[1440px] mx-auto px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-white/10 md:divide-x">
            {STATS.map(s => (
              <div key={s.label} className="text-center px-4">
                <p className="text-3xl font-bold text-white mb-1">{s.val}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-20 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">What We Offer</p>
            <h2 className="text-foreground text-3xl font-bold mb-3">Complete Travel Solutions</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">From a single visa to a full corporate travel programme — all under one roof.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map(s => (
              <Link key={s.label} to={s.path} className="group bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all">
                <div className="size-10 rounded-lg mb-4 flex items-center justify-center" style={{ background: s.color }}>
                  <s.icon size={18} style={{ color: s.tc }} />
                </div>
                <h4 className="text-foreground font-bold mb-1.5">{s.label}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.desc}</p>
                <span className="text-xs font-semibold text-accent flex items-center gap-1 group-hover:gap-2 transition-all">Learn more <ArrowRight size={12} /></span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/services" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">
              View All 18 Services <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Why TravelOS?</p>
              <h2 className="text-3xl font-bold mb-5 leading-tight">The Trusted Name in UAE Travel Since 2010</h2>
              <p className="text-white/65 leading-relaxed mb-8">Shanghai Travels has been operating from Dubai for over 15 years, serving individuals, families, corporates, and government entities with reliable, efficient travel services. IATA certified and UAE-regulated.</p>
              <div className="space-y-4">
                {[
                  { title: "Fastest Visa Processing",   desc: "Same-day submission for most destinations. Average approval in 3–5 business days." },
                  { title: "Best Price Guarantee",      desc: "We price-match any certified competitor. Difference refunded within 24 hours." },
                  { title: "Dedicated Account Manager", desc: "Every client gets a named contact — no call centres, no bots." },
                  { title: "End-to-End Service",        desc: "We handle everything from application to boarding — just pack and go." },
                ].map(p => (
                  <div key={p.title} className="flex items-start gap-3">
                    <div className="size-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={11} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{p.title}</p>
                      <p className="text-xs text-white/55 mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <Link to="/about" className="px-5 py-2.5 rounded-lg bg-accent text-white font-bold text-sm hover:bg-orange-500 transition-colors">Our Story</Link>
                <Link to="/contact" className="px-5 py-2.5 rounded-lg border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors">Get in Touch</Link>
              </div>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=500&fit=crop&auto=format" alt="Travel consultant" className="rounded-2xl w-full h-[420px] object-cover" />
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl border border-border p-4 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 rounded-full bg-accent flex items-center justify-center"><TrendingUp size={16} className="text-white" /></div>
                  <div>
                    <p className="text-lg font-bold text-foreground">4.9 / 5.0</p>
                    <p className="text-[11px] text-muted-foreground">3,200+ verified reviews</p>
                  </div>
                </div>
                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Tours ── */}
      <section className="py-20 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">Top Picks</p>
              <h2 className="text-foreground text-3xl font-bold">Featured Tour Packages</h2>
            </div>
            <Link to="/tours" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent transition-colors">
              View all packages <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TOURS.map(tour => (
              <Link key={tour.id} to={`/tours/${tour.id}`} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all">
                <div className="relative overflow-hidden h-52">
                  <img src={tour.img} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-white">{tour.rating}</span>
                    <span className="text-xs text-white/70">({tour.reviews})</span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{tour.dest}</p>
                  <h4 className="text-foreground font-bold mb-3">{tour.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11} /> {tour.duration}</span>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">From</p>
                      <p className="font-bold text-foreground">{tour.price}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">Testimonials</p>
            <h2 className="text-foreground text-3xl font-bold mb-2">What Our Clients Say</h2>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}</div>
              <span><strong className="text-foreground">4.9</strong> · 3,200+ verified reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-card rounded-2xl border border-border p-6">
                <Quote size={24} className="text-accent/30 mb-4" />
                <p className="text-sm text-foreground leading-relaxed mb-5">{t.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">{[...Array(t.rating)].map((_, i) => <Star key={i} size={11} className="text-yellow-400 fill-yellow-400" />)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="bg-primary rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 size-72 rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 size-56 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Start Today</p>
              <h2 className="text-white text-3xl font-bold mb-4 max-w-xl mx-auto leading-tight">Begin Your Journey With a Free Consultation</h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">Speak to a travel expert in under 2 minutes. No commitment, no fees — just honest advice.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link to="/inquiry" className="px-8 py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-500 transition-colors shadow-lg">Apply Now — It's Free</Link>
                <a href="tel:+97141234567" className="px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Phone size={15} /> Call Us Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section className="border-t border-border py-10 bg-card">
        <div className="max-w-[1440px] mx-auto px-8">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-6">Accreditations &amp; Partners</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["IATA", "ATOL", "ATAS", "ISO 9001", "Emirates", "Etihad", "Qatar Airways", "Marriott", "Hilton"].map(p => (
              <div key={p} className="px-5 py-2.5 border border-border rounded-lg text-xs font-bold text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all cursor-default">{p}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
