import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { AuthEntryDesktop, AuthEntryMobile } from "../../components/AuthEntryMenus";
import { AnnouncementBar } from "./AnnouncementBar";
import { Logo } from "./Logo";
import { CONTAINER, FOCUS, HOTLINE } from "./tokens";

type NavChild = { label: string; path: string; external?: boolean };
type NavItem = { label: string; path: string; external?: boolean; children?: NavChild[] };

const NAV: NavItem[] = [
  { label: "Home", path: "/" },
  {
    label: "Visa Services",
    path: "/visa",
    children: [
      { label: "Tourist Visa", path: "/visa" },
      { label: "Business Visa", path: "/visa" },
      { label: "Student Visa", path: "/visa" },
      { label: "Work Permit", path: "/visa" },
    ],
  },
  {
    label: "Air Tickets",
    path: "/flights",
    children: [
      { label: "International Flights", path: "/flights" },
      { label: "Domestic Flights", path: "/flights" },
      { label: "Group Booking", path: "/inquiry" },
    ],
  },
  {
    label: "Hajj & Umrah",
    path: "/services",
    children: [
      { label: "Hajj Packages", path: "/tours" },
      { label: "Umrah Packages", path: "/tours" },
      { label: "Pilgrimage Guidance", path: "/services" },
    ],
  },
  {
    label: "Tour Packages",
    path: "/tours",
    children: [
      { label: "All Packages", path: "/tours" },
      { label: "Family & Group Tours", path: "/tours" },
      { label: "Honeymoon Tours", path: "/tours" },
    ],
  },
  {
    label: "Destinations",
    path: "/erp/#/site/destinations",
    external: true,
    children: [
      { label: "Browse All Countries", path: "/erp/#/site/destinations", external: true },
      { label: "Search Packages", path: "/erp/#/site/search", external: true },
    ],
  },
  {
    label: "More",
    path: "/about",
    children: [
      { label: "About Us", path: "/about" },
      { label: "Travel Blog", path: "/blog" },
      { label: "Payment", path: "/payment" },
      { label: "Contact Us", path: "/contact" },
    ],
  },
];

const LINK_BASE =
  "inline-flex items-center gap-1 rounded-md px-2.5 py-2 text-[13px] font-semibold transition-colors";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const cls = `${LINK_BASE} ${active ? "text-accent" : "text-primary/85 hover:text-accent"} ${FOCUS}`;
  const label = (
    <>
      {item.label}
      {item.children && <ChevronDown size={12} className="opacity-60 transition-transform group-hover:rotate-180" aria-hidden />}
    </>
  );

  return (
    <li className="group relative">
      {item.external ? (
        <a href={item.path} className={cls}>
          {label}
        </a>
      ) : (
        <Link to={item.path} className={cls}>
          {label}
        </Link>
      )}
      {active && <span className="absolute inset-x-2.5 -bottom-0.5 h-[2px] rounded-full bg-accent" aria-hidden />}

      {item.children && (
        <div className="invisible absolute left-0 top-full z-50 w-56 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <ul className="overflow-hidden rounded-xl bg-white p-1.5 shadow-[0_18px_40px_rgba(20,33,61,0.16)] ring-1 ring-[rgba(20,33,61,0.08)]">
            {item.children.map((child) => (
              <li key={child.label}>
                {child.external ? (
                  <a
                    href={child.path}
                    className="block rounded-lg px-3 py-2 text-[12.5px] font-medium text-primary/80 transition-colors hover:bg-muted hover:text-accent"
                  >
                    {child.label}
                  </a>
                ) : (
                  <Link
                    to={child.path}
                    className="block rounded-lg px-3 py-2 text-[12.5px] font-medium text-primary/80 transition-colors hover:bg-muted hover:text-accent"
                  >
                    {child.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_6px_20px_rgba(20,33,61,0.08)]" : "border-b border-[rgba(20,33,61,0.07)]"
        }`}
      >
        <div className={`${CONTAINER} flex h-[68px] items-center justify-between gap-4 lg:h-[80px]`}>
          <Link to="/" className={`shrink-0 ${FOCUS} rounded-md`} aria-label="Shanghai Travels — home">
            <Logo className="h-10 lg:h-12" />
          </Link>

          <nav aria-label="Primary" className="hidden xl:block">
            <ul className="flex items-center gap-0.5">
              {NAV.map((item) => (
                <NavLink key={item.label} item={item} active={location.pathname === item.path} />
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${HOTLINE.replace(/[^\d+]/g, "")}`}
              className={`hidden items-center gap-2.5 rounded-full bg-muted py-1.5 pl-1.5 pr-4 transition-colors hover:bg-[#E7EBF3] md:inline-flex ${FOCUS}`}
            >
              <span className="grid size-8 place-items-center rounded-full bg-accent text-white" aria-hidden>
                <Phone size={14} />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] font-medium text-muted-foreground">Hotline</span>
                <span className="block text-[13px] font-bold text-primary">{HOTLINE}</span>
              </span>
            </a>

            <AuthEntryDesktop solid />

            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className={`rounded-md p-2 text-primary transition-colors hover:bg-muted xl:hidden ${FOCUS}`}
              onClick={() => setMenuOpen((m) => !m)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="max-h-[72vh] overflow-y-auto border-t border-[rgba(20,33,61,0.07)] bg-white px-5 py-4 xl:hidden">
            <ul className="space-y-0.5">
              {NAV.map((item) => (
                <li key={item.label}>
                  {item.external ? (
                    <a
                      href={item.path}
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-muted"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-primary hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <a
              href={`tel:${HOTLINE.replace(/[^\d+]/g, "")}`}
              className="mt-1 flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-accent"
            >
              <Phone size={14} aria-hidden /> {HOTLINE}
            </a>
            <AuthEntryMobile onNavigated={() => setMenuOpen(false)} />
          </div>
        )}
      </header>
    </>
  );
}
