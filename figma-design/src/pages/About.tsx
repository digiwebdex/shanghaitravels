import { Link } from "react-router";
import { Award, Users, Globe, Heart, CheckCircle2, ArrowRight, Star } from "lucide-react";

const TEAM = [
  { name: "Khalid Al-Mansouri", role: "CEO & Founder",            img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&auto=format" },
  { name: "Sara Ahmed",          role: "Head of Visa Services",    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&auto=format" },
  { name: "Rajan Pillai",        role: "Chief Operating Officer",  img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&auto=format" },
  { name: "Fatima Al-Zaabi",     role: "Head of Corporate Travel", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&auto=format" },
];

const TIMELINE = [
  { year: "2010", event: "Founded in Dubai as Shanghai Travels with a team of 5 specialists" },
  { year: "2013", event: "Achieved IATA certification and expanded to group tour packages" },
  { year: "2016", event: "Launched Hajj & Umrah division — now serving 2,000+ pilgrims yearly" },
  { year: "2019", event: "Opened corporate travel division, onboarded first Fortune 500 client" },
  { year: "2022", event: "Launched TravelOS — our proprietary ERP platform for seamless operations" },
  { year: "2024", event: "50,000+ cumulative clients, 100+ destinations, 4.9-star rating achieved" },
];

export default function About() {
  return (
    <div>
      <section className="relative py-28 bg-primary overflow-hidden">
        <div className="absolute inset-0"><img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=600&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-15" /></div>
        <div className="relative max-w-[1440px] mx-auto px-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">About Us</p>
          <h1 className="text-white text-4xl font-bold mb-4">15 Years of Travel Excellence</h1>
          <p className="text-white/65 max-w-xl mx-auto leading-relaxed">Shanghai Travels has been the UAE's trusted travel partner since 2010 — combining deep expertise, technology, and genuine care.</p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Our Story</p>
              <h2 className="text-foreground text-3xl font-bold mb-5 leading-tight">From a Dubai Office to Serving the World</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Founded in 2010 by travel veteran Khalid Al-Mansouri, Shanghai Travels began as a boutique visa consultancy in Dubai Media City. What started with 5 passionate travel experts has grown into a full-spectrum travel ERP company with 80+ staff across 3 UAE offices.</p>
              <p className="text-muted-foreground leading-relaxed mb-6">We serve over 50,000 satisfied clients — from individual travellers to multinational corporations — with the same unwavering commitment to accuracy, speed, and personal service that defined us from day one.</p>
              <div className="grid grid-cols-2 gap-4">
                {[{ val: "50,000+", label: "Happy Travellers" }, { val: "100+", label: "Countries Served" }, { val: "80+", label: "Travel Experts" }, { val: "4.9★", label: "Average Rating" }].map(s => (
                  <div key={s.label} className="bg-muted rounded-xl p-4">
                    <p className="text-2xl font-bold text-foreground mb-0.5">{s.val}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop&auto=format" alt="Team" className="rounded-xl object-cover w-full h-48" />
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop&auto=format" alt="Office" className="rounded-xl object-cover w-full h-48 mt-8" />
              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop&auto=format" alt="Consulting" className="rounded-xl object-cover w-full h-48 -mt-4" />
              <img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format" alt="Dubai" className="rounded-xl object-cover w-full h-48 mt-4" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/40">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">Values</p>
            <h2 className="text-foreground text-3xl font-bold">What Drives Us Every Day</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Heart,   color: "#FFE4E6", tc: "#9F1239", title: "Client First",  desc: "Every decision begins with: is this the best outcome for our client?" },
              { icon: Award,   color: "#DCFCE7", tc: "#14532D", title: "Excellence",    desc: "We pursue perfection in every application, booking, and interaction." },
              { icon: Globe,   color: "#DBEAFE", tc: "#1E40AF", title: "Integrity",     desc: "Transparent pricing, honest advice, and no hidden fees — ever." },
              { icon: Users,   color: "#EDE9FE", tc: "#5B21B6", title: "Community",     desc: "1% of profits fund travel scholarships for underprivileged youth." },
            ].map(v => (
              <div key={v.title} className="bg-card rounded-xl border border-border p-6">
                <div className="size-10 rounded-lg flex items-center justify-center mb-4" style={{ background: v.color }}>
                  <v.icon size={18} style={{ color: v.tc }} />
                </div>
                <h4 className="text-foreground font-bold mb-2">{v.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">Our Journey</p>
            <h2 className="text-foreground text-3xl font-bold">15 Years of Milestones</h2>
          </div>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            {TIMELINE.map((t) => (
              <div key={t.year} className="flex gap-6 mb-8 last:mb-0">
                <div className="size-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0 relative z-10 border-4 border-background">
                  <span className="text-[9px] font-bold text-white">{t.year}</span>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 flex-1 mt-1">
                  <p className="text-xs font-semibold text-accent mb-0.5">{t.year}</p>
                  <p className="text-sm text-muted-foreground">{t.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/40">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">The Team</p>
            <h2 className="text-foreground text-3xl font-bold">Meet Our Leadership</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map(m => (
              <div key={m.name} className="bg-card rounded-xl border border-border overflow-hidden text-center group">
                <div className="h-52 overflow-hidden">
                  <img src={m.img} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Certifications</p>
          <h2 className="text-white text-2xl font-bold mb-8">Regulated, Certified &amp; Trusted</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["IATA Accredited", "ATOL Protected", "ATAS Member", "ISO 9001:2015", "UAE DET Licensed", "IACCM Member"].map(c => (
              <div key={c} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-medium">
                <CheckCircle2 size={14} className="text-accent" /> {c}
              </div>
            ))}
          </div>
          <Link to="/inquiry" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-bold text-sm hover:bg-orange-500 transition-colors">
            Start Your Application <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
