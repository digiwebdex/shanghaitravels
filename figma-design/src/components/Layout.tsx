import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Plane, Menu, X, ChevronDown, Phone, Mail, MapPin,
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  Shield, Award, Star, ArrowRight,
} from "lucide-react";
import { AuthEntryDesktop, AuthEntryMobile } from "./AuthEntryMenus";

const NAV_LINKS = [
  { label: "Home",         path: "/" },
  {
    label: "Services", path: "/services",
    children: [
      { label: "Visa Services",    path: "/visa" },
      { label: "Flights & Hotels", path: "/flights" },
      { label: "Tour Packages",    path: "/tours" },
      { label: "All Services",     path: "/services" },
    ],
  },
  { label: "Visa Info",     path: "/visa" },
  { label: "Tour Packages", path: "/tours" },
  { label: "Blog & FAQ",    path: "/blog" },
  { label: "About",         path: "/about" },
  { label: "Contact",       path: "/contact" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const solid = !isHome || scrolled || menuOpen;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Info bar */}
      <div className="bg-primary text-white/70 text-xs hidden md:block">
        <div className="max-w-[1440px] mx-auto px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="tel:+97141234567" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone size={11} /> +971 4 123 4567
            </a>
            <a href="mailto:info@shanghaitravels.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail size={11} /> info@shanghaitravels.com
            </a>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1"><Shield size={11} className="text-accent" /> IATA Certified</span>
            <span className="flex items-center gap-1"><Award size={11} className="text-accent" /> 15+ Years</span>
            <span className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" /> 4.9 · 3,200+ Reviews</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${solid ? "bg-white/96 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="size-8 rounded-lg bg-accent flex items-center justify-center">
              <Plane size={15} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold leading-none ${solid ? "text-primary" : "text-white"}`}>TravelOS</p>
              <p className={`text-[10px] leading-none mt-0.5 ${solid ? "text-muted-foreground" : "text-white/60"}`}>Shanghai Travels</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(link => (
              <div key={link.label} className="relative group">
                {link.children ? (
                  <button className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${solid ? "text-foreground hover:bg-muted" : "text-white/85 hover:text-white hover:bg-white/10"}`}>
                    {link.label} <ChevronDown size={13} className="group-hover:rotate-180 transition-transform duration-200" />
                  </button>
                ) : (
                  <Link to={link.path} className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === link.path ? (solid ? "text-accent font-semibold" : "text-white font-semibold") : solid ? "text-foreground hover:bg-muted" : "text-white/85 hover:text-white hover:bg-white/10"}`}>
                    {link.label}
                  </Link>
                )}
                {link.children && (
                  <div className="absolute top-full left-0 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                    <div className="bg-white border border-border rounded-xl shadow-xl py-2 min-w-[180px]">
                      {link.children.map(c => (
                        <Link key={c.path + c.label} to={c.path} className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors">{c.label}</Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <AuthEntryDesktop solid={solid} />

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className={`lg:hidden p-2 rounded-md ${solid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`}
            onClick={() => setMenuOpen(m => !m)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-white dark:bg-card border-t border-border px-6 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link key={link.label} to={link.path} className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted">{link.label}</Link>
            ))}
            <AuthEntryMobile onNavigated={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      {/* Footer */}
      <footer className="bg-primary text-white">
        <div className="bg-accent">
          <div className="max-w-[1440px] mx-auto px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Ready to start your journey?</h3>
              <p className="text-white/80 text-sm">Our travel experts are available 7 days a week.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/inquiry" className="px-6 py-3 rounded-lg bg-white text-accent font-bold text-sm hover:bg-orange-50 transition-colors">Apply Now</Link>
              <Link to="/contact" className="px-6 py-3 rounded-lg border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors">Talk to an Expert</Link>
            </div>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-9 rounded-lg bg-accent flex items-center justify-center"><Plane size={16} className="text-white" /></div>
                <div>
                  <p className="font-bold text-white">TravelOS</p>
                  <p className="text-[11px] text-white/50">Shanghai Travels LLC</p>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-5 max-w-xs">Your trusted partner for visa, flights, hotels, tours, and Hajj & Umrah services. Licensed and trusted by 50,000+ travellers since 2010.</p>
              <div className="flex gap-2 mb-4">
                {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"><Icon size={14} /></a>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {["IATA Certified", "ATOL Protected", "ISO 9001"].map(c => (
                  <span key={c} className="text-[10px] font-semibold px-2 py-1 rounded border border-white/20 text-white/60">{c}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4">Services</p>
              <ul className="space-y-2">
                {["Visa Processing", "Air Ticketing", "Hotel Booking", "Tour Packages", "Hajj & Umrah", "Immigration"].map(s => (
                  <li key={s}><Link to="/services" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"><ArrowRight size={10} className="opacity-40" />{s}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4">More</p>
              <ul className="space-y-2">
                {["Student Consultancy", "Medical Tourism", "Corporate Travel", "Travel Insurance", "AI Planner", "Reports"].map(s => (
                  <li key={s}><Link to="/services" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"><ArrowRight size={10} className="opacity-40" />{s}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4">Contact</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-white/60"><MapPin size={13} className="flex-shrink-0 mt-0.5 text-accent" /><span>Dubai Media City, Al Sufouh 2, Dubai, UAE</span></li>
                <li><a href="tel:+97141234567" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"><Phone size={13} className="text-accent" /> +971 4 123 4567</a></li>
                <li><a href="mailto:info@shanghaitravels.com" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"><Mail size={13} className="text-accent" /> info@shanghaitravels.com</a></li>
              </ul>
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-[11px] text-white/40 mb-1">Working Hours</p>
                <p className="text-xs text-white/70">Mon–Sat: 8:00 AM – 8:00 PM</p>
                <p className="text-xs text-white/70">Sun: 10:00 AM – 4:00 PM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/40">© 2025 Shanghai Travels LLC · Trade Licence: DED-1234567</p>
            <div className="flex items-center gap-4">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "Sitemap"].map(l => (
                <a key={l} href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
