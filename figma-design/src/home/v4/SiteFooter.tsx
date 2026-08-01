import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import { submitForm } from "./api";
import { Logo } from "./Logo";
import { CONTAINER, EMAIL, FOCUS, HOTLINE, REG_NO } from "./tokens";

type FooterLink = { label: string; path: string; external?: boolean };

const QUICK_LINKS: FooterLink[] = [
  { label: "About Us", path: "/about" },
  { label: "Our Team", path: "/about" },
  { label: "Careers", path: "/about" },
  { label: "Privacy Policy", path: "/about" },
  { label: "Terms & Conditions", path: "/about" },
];

const SERVICE_LINKS: FooterLink[] = [
  { label: "Visa Services", path: "/visa" },
  { label: "Air Tickets", path: "/flights" },
  { label: "Hajj & Umrah", path: "/services" },
  { label: "Tour Packages", path: "/tours" },
  { label: "Hotel Booking", path: "/flights" },
  { label: "Travel Insurance", path: "/services" },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: "FAQ", path: "/contact" },
  { label: "Payment Guide", path: "/payment" },
  { label: "Booking Guide", path: "/inquiry" },
  { label: "Visa Guide", path: "/visa" },
  { label: "Contact Us", path: "/contact" },
];

const SOCIALS = [
  { Icon: Facebook, href: "https://facebook.com/shanghaitravelsbd", label: "Facebook" },
  { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  { Icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
] as const;

function ColumnHeading({ children }: { children: string }) {
  return (
    <div className="mb-3.5">
      <p className="text-[13px] font-bold text-white">{children}</p>
      <span className="mt-1.5 block h-[2px] w-6 rounded-full bg-accent" aria-hidden />
    </div>
  );
}

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <ColumnHeading>{title}</ColumnHeading>
      <ul className="space-y-1.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.path}
                className={`text-[12px] text-white/60 transition-colors hover:text-white ${FOCUS}`}
              >
                {link.label}
              </a>
            ) : (
              <Link
                to={link.path}
                className={`text-[12px] text-white/60 transition-colors hover:text-white ${FOCUS}`}
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "sending") return;
    setState("sending");
    try {
      await submitForm({ formType: "newsletter", email: email.trim(), source: "footer" });
      setState("done");
      setEmail("");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <ColumnHeading>Newsletter</ColumnHeading>
      <p className="text-[11px] leading-relaxed text-white/55">
        Subscribe to get our latest offers and travel updates.
      </p>
      <form onSubmit={onSubmit} className="mt-3">
        <label htmlFor="footer-newsletter" className="sr-only">
          Email address
        </label>
        <input
          id="footer-newsletter"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="h-9 w-full rounded-md bg-white px-3 text-[12px] text-primary outline-none placeholder:text-primary/35 focus-visible:ring-2 focus-visible:ring-accent"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className={`mt-2.5 h-8 rounded-md bg-accent px-5 text-[11px] font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60 ${FOCUS}`}
        >
          {state === "sending" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      <p aria-live="polite" className="mt-2 text-[11px] text-white/55">
        {state === "done" && "Thank you — you are on the list."}
        {state === "error" && "Could not subscribe. Please try again."}
      </p>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-9 bg-primary text-white md:mt-10">
      <div className={`${CONTAINER} py-10`}>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-[1.55fr_1fr_1fr_1fr_1.4fr_1.25fr] lg:gap-6">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Logo className="h-11" onDark />
            <p className="mt-3.5 max-w-[280px] text-[11.5px] leading-relaxed text-white/55">
              Your trusted travel partner for visa, air tickets, tours and Hajj &amp; Umrah packages worldwide.
            </p>
            <ul className="mt-4 flex gap-2">
              {SOCIALS.map(({ Icon, href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`grid size-8 place-items-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-accent hover:text-white ${FOCUS}`}
                  >
                    <Icon size={14} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <LinkColumn title="Quick Links" links={QUICK_LINKS} />
          <LinkColumn title="Our Services" links={SERVICE_LINKS} />
          <LinkColumn title="Support" links={SUPPORT_LINKS} />

          <div>
            <ColumnHeading>Contact Us</ColumnHeading>
            <ul className="space-y-2.5 text-[12px] text-white/60">
              <li className="flex gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                <span>
                  House 27, DR-SL Road 2, Block C,
                  <br />
                  Banani, Dhaka-1213
                </span>
              </li>
              <li>
                <a
                  href={`tel:${HOTLINE.replace(/[^\d+]/g, "")}`}
                  className={`flex items-center gap-2 transition-colors hover:text-white ${FOCUS}`}
                >
                  <Phone size={13} className="shrink-0 text-accent" aria-hidden />
                  {HOTLINE}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className={`flex items-center gap-2 break-all transition-colors hover:text-white ${FOCUS}`}
                >
                  <Mail size={13} className="shrink-0 text-accent" aria-hidden />
                  {EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={13} className="shrink-0 text-accent" aria-hidden />
                Sun – Thu: 9:00 AM – 8:00 PM
              </li>
            </ul>
          </div>

          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0F1A31]">
        <div
          className={`${CONTAINER} flex flex-col items-center justify-between gap-2 py-3.5 text-[11px] text-white/45 sm:flex-row`}
        >
          <p>© {new Date().getFullYear()} Shanghai Travels. All Rights Reserved.</p>
          <p className="flex items-center gap-2.5">
            Government Approved
            <span className="h-3 w-px bg-white/20" aria-hidden />
            Reg. No {REG_NO}
          </p>
        </div>
      </div>
    </footer>
  );
}
