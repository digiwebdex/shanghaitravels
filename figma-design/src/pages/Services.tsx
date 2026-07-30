import { Link } from "react-router";
import { FileText, Plane, Building2, Map, Star, Globe, Heart, GraduationCap, Shield, Users, Bot, Briefcase, Package, Landmark, Stethoscope, ArrowRight } from "lucide-react";

const ALL_SERVICES = [
  { icon: FileText,     label: "Visa Processing",      color: "#DBEAFE", tc: "#1E40AF", path: "/visa",    desc: "Tourist, business, student, transit, and residency visas for 100+ countries.", features: ["Same-day submission", "Online tracking", "Document checklist", "Embassy liaison"] },
  { icon: Plane,        label: "Air Ticketing",         color: "#E0F2FE", tc: "#075985", path: "/flights", desc: "Best fares on 500+ airlines worldwide. Group bookings, charter flights, corporate accounts.", features: ["500+ airlines", "Best fare guarantee", "Group bookings", "24h cancellation"] },
  { icon: Building2,    label: "Hotel Booking",         color: "#CCFBF1", tc: "#0F5952", path: "/flights", desc: "Curated 4 & 5-star hotels, boutique properties, serviced apartments, and resorts.", features: ["100,000+ properties", "Best rate guarantee", "Free cancellation", "VIP upgrades"] },
  { icon: Map,          label: "Tour Packages",         color: "#DCFCE7", tc: "#14532D", path: "/tours",   desc: "Pre-designed and fully customisable tour itineraries — guided, self-guided, and private.", features: ["50+ destinations", "Custom itineraries", "Licensed guides", "All-inclusive"] },
  { icon: Star,         label: "Hajj & Umrah",          color: "#FEF3C7", tc: "#78350F", path: "/services",desc: "VIP and economy packages for Hajj and Umrah. Full support from application to return.", features: ["All categories", "Saudi visa included", "Hotel near Haram", "Group & private"] },
  { icon: GraduationCap,label: "Student Consultancy",   color: "#EDE9FE", tc: "#5B21B6", path: "/services",desc: "University applications, student visa processing, and pre-departure counselling.", features: ["University shortlisting", "SOP writing", "Visa application", "Pre-departure"] },
  { icon: Stethoscope,  label: "Medical Tourism",        color: "#FFE4E6", tc: "#9F1239", path: "/services",desc: "Top hospitals in India, Thailand, Germany, Turkey. Travel, accommodation & treatment.", features: ["Hospital partnerships", "Treatment packages", "Medical visa", "Translator"] },
  { icon: Globe,        label: "Immigration",             color: "#DBEAFE", tc: "#1E40AF", path: "/services",desc: "Residency applications, work permits, immigration consultancy for UAE, Canada, Australia, UK.", features: ["Residency permits", "Work visas", "PR applications", "Compliance"] },
  { icon: Shield,       label: "Travel Insurance",       color: "#F1F5F9", tc: "#334155", path: "/services",desc: "Comprehensive cover for medical emergencies, trip cancellation, baggage loss, and more.", features: ["Medical coverage", "Trip cancellation", "Baggage protection", "24/7 line"] },
  { icon: Briefcase,    label: "Corporate Travel",       color: "#EEF2FF", tc: "#3730A3", path: "/services",desc: "Managed travel programmes — approval workflows, expense reporting, dedicated account management.", features: ["Policy management", "Approval workflows", "Expense reports", "Dedicated manager"] },
  { icon: Package,      label: "Supplier Management",    color: "#FFEDD5", tc: "#9A3412", path: "/services",desc: "B2B supplier portal for hotels, airlines, and ground operators. Rate management & settlement.", features: ["Rate management", "Allocation system", "Auto-settlement", "API integration"] },
  { icon: Bot,          label: "AI Travel Planner",      color: "#CFFAFE", tc: "#164E63", path: "/services",desc: "AI assistant builds personalised itineraries in seconds based on budget, interests, and timeline.", features: ["Instant itinerary", "Budget optimisation", "Interest matching", "Booking integration"] },
];

export default function Services() {
  return (
    <div>
      <section className="bg-primary py-24">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">What We Offer</p>
          <h1 className="text-white text-4xl font-bold mb-4">All Travel Services, One Platform</h1>
          <p className="text-white/65 max-w-xl mx-auto">TravelOS brings 18 travel and immigration services under one roof, powered by expert teams and smart technology.</p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALL_SERVICES.map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-md transition-all">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="size-11 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
                      <s.icon size={20} style={{ color: s.tc }} />
                    </div>
                  </div>
                  <h3 className="text-foreground font-bold mb-2">{s.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
                  <ul className="space-y-1.5 mb-5">
                    {s.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="size-1.5 rounded-full flex-shrink-0" style={{ background: s.tc }} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-6 pb-5 flex gap-2">
                  <Link to={s.path} className="flex-1 text-center py-2 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">Learn More</Link>
                  <Link to="/inquiry" className="flex-1 text-center py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-orange-600 transition-colors">Apply Now</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/40 border-t border-border">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <h2 className="text-foreground text-2xl font-bold mb-3">Not Sure Which Service You Need?</h2>
          <p className="text-muted-foreground mb-6">Talk to one of our experts — free, no obligation, just honest guidance.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/inquiry" className="px-6 py-3 rounded-lg bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-colors">Free Consultation</Link>
            <Link to="/contact" className="px-6 py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
