import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  Plane, Menu, X, Phone, Mail, MapPin,
  Facebook, Instagram, Youtube, ArrowRight,
} from "lucide-react";
import { AuthEntryDesktop, AuthEntryMobile } from "./AuthEntryMenus";
import { AnnouncementBar } from "../home/v4/AnnouncementBar";

const HOTLINE = "+880 1333-356393";
const HOTLINE_ALT = "+880 1742-255003";
const EMAIL = "info@shanghaitravels.com.bd";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Visa Services", path: "/visa" },
  { label: "Air Tickets", path: "/flights" },
  { label: "Hajj & Umrah", path: "/services" },
  { label: "Tour Packages", path: "/tours" },
  { label: "Destinations", path: "/erp/#/site/destinations", external: true },
  { label: "Blog", path: "/blog" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
] as const;

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
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          solid ? "bg-white/96 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="size-9 rounded-xl bg-accent flex items-center justify-center shadow-sm">
              <Plane size={16} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold leading-none ${solid ? "text-primary" : "text-white"}`}>
                Shanghai Travels
              </p>
              <p className={`text-[10px] leading-none mt-0.5 ${solid ? "text-muted-foreground" : "text-white/60"}`}>
                Vatara, Dhaka · Reg. 0017053
              </p>
            </div>
          </Link>

          <nav className="hidden xl:flex items-center gap-0.5">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.path}
                  className={`px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                    solid ? "text-foreground hover:bg-muted" : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                    location.pathname === link.path
                      ? solid
                        ? "text-accent font-semibold"
                        : "text-white font-semibold"
                      : solid
                        ? "text-foreground hover:bg-muted"
                        : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={`tel:${HOTLINE.replace(/\s/g, "")}`}
              className={`hidden md:flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                solid ? "text-primary" : "text-white"
              }`}
            >
              <Phone size={13} className="text-accent shrink-0" />
              {HOTLINE}
            </a>
            <AuthEntryDesktop solid={solid} />
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className={`lg:hidden p-2 rounded-md ${solid ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`}
            onClick={() => setMenuOpen((m) => !m)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-border px-6 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.path}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.path}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted"
                >
                  {link.label}
                </Link>
              ),
            )}
            <a
              href={`tel:${HOTLINE.replace(/\s/g, "")}`}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-accent"
            >
              <Phone size={14} /> {HOTLINE}
            </a>
            <AuthEntryMobile onNavigated={() => setMenuOpen(false)} />
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-primary text-white">
        <div className="bg-accent">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white text-xl font-bold mb-1">Ready to start your journey?</h3>
              <p className="text-white/80 text-sm">Our travel experts are available 7 days a week in Vatara, Dhaka.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/inquiry"
                className="px-6 py-3 rounded-xl bg-white text-accent font-bold text-sm hover:bg-orange-50 transition-colors"
              >
                Request Consultation
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-9 rounded-xl bg-accent flex items-center justify-center">
                  <Plane size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Shanghai Travels</p>
                  <p className="text-[11px] text-white/50">Government Registered · Reg. 0017053</p>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-5 max-w-sm">
                Your trusted partner for visa processing, air tickets, hotels, tours, and Hajj & Umrah services from
                Dhaka, Bangladesh.
              </p>
              <div className="flex gap-2 mb-4">
                {[
                  { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                  { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                  { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {["Govt. Registered", "IATA Partner", "Hajj & Umrah"].map((c) => (
                  <span key={c} className="text-[10px] font-semibold px-2 py-1 rounded border border-white/20 text-white/60">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4">Services</p>
              <ul className="space-y-2">
                {[
                  { label: "Visa Processing", path: "/visa" },
                  { label: "Air Ticketing", path: "/flights" },
                  { label: "Hotel Booking", path: "/flights" },
                  { label: "Tour Packages", path: "/tours" },
                  { label: "Hajj & Umrah", path: "/services" },
                  { label: "Travel Insurance", path: "/services" },
                ].map((s) => (
                  <li key={s.label}>
                    <Link to={s.path} className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5">
                      <ArrowRight size={10} className="opacity-40" />
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4">Company</p>
              <ul className="space-y-2">
                {[
                  { label: "About Us", path: "/about" },
                  { label: "Blog", path: "/blog" },
                  { label: "Destinations", path: "/erp/#/site/destinations", external: true },
                  { label: "Inquiry", path: "/inquiry" },
                  { label: "Payment", path: "/payment" },
                ].map((s) => (
                  <li key={s.label}>
                    {"external" in s && s.external ? (
                      <a href={s.path} className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5">
                        <ArrowRight size={10} className="opacity-40" />
                        {s.label}
                      </a>
                    ) : (
                      <Link to={s.path} className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5">
                        <ArrowRight size={10} className="opacity-40" />
                        {s.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase mb-4">Contact</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-white/60">
                  <MapPin size={13} className="flex-shrink-0 mt-0.5 text-accent" />
                  <span>
                    House 12, Road 4, Block B, Niketan
                    <br />
                    Vatara, Dhaka 1212, Bangladesh
                  </span>
                </li>
                <li>
                  <a href={`tel:${HOTLINE.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                    <Phone size={13} className="text-accent" /> {HOTLINE}
                  </a>
                </li>
                <li>
                  <a href={`tel:${HOTLINE_ALT.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                    <Phone size={13} className="text-accent" /> {HOTLINE_ALT}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                    <Mail size={13} className="text-accent" /> {EMAIL}
                  </a>
                </li>
              </ul>
              <a
                href="#newsletter"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-orange-300 transition-colors"
              >
                Subscribe to offers <ArrowRight size={12} />
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Shanghai Travels · Reg. No. 0017053 · Vatara, Dhaka
            </p>
            <div className="flex items-center gap-4">
              {["Privacy Policy", "Terms of Service"].map((l) => (
                <a key={l} href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
