import { Link } from "react-router";
import { BadgeCheck, ChevronDown, Facebook, Globe, Instagram, Linkedin, Youtube } from "lucide-react";
import { CONTAINER, REG_NO } from "./tokens";

const TOP_LINKS = [
  { label: "About Us", to: "/about" },
  { label: "Careers", to: "/about" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
] as const;

const SOCIALS = [
  { Icon: Facebook, href: "https://facebook.com/shanghaitravelsbd", label: "Facebook", tint: "hover:bg-[#1877F2]" },
  { Icon: Instagram, href: "https://instagram.com", label: "Instagram", tint: "hover:bg-[#E1306C]" },
  { Icon: Youtube, href: "https://youtube.com", label: "YouTube", tint: "hover:bg-[#FF0000]" },
  { Icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn", tint: "hover:bg-[#0A66C2]" },
] as const;

export function AnnouncementBar() {
  return (
    <div className="bg-primary text-white">
      <div
        className={`${CONTAINER} flex h-auto flex-col items-center justify-between gap-1 py-1.5 text-[11px] sm:h-[34px] sm:flex-row sm:py-0`}
      >
        <p className="inline-flex items-center gap-1.5 font-semibold">
          <BadgeCheck size={13} className="shrink-0 text-accent" aria-hidden />
          Government Approved Travel Agency · Reg. No. {REG_NO}
        </p>

        <div className="flex items-center gap-3">
          <nav aria-label="Secondary" className="hidden items-center md:flex">
            {TOP_LINKS.map((link, i) => (
              <span key={link.label} className="flex items-center">
                {i > 0 && <span className="mx-2.5 h-3 w-px bg-white/20" aria-hidden />}
                <Link to={link.to} className="text-white/70 transition-colors hover:text-white">
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>

          <span className="hidden h-3 w-px bg-white/20 md:block" aria-hidden />

          <ul className="flex items-center gap-1.5">
            {SOCIALS.map(({ Icon, href, label, tint }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`grid size-[22px] place-items-center rounded-full bg-white/10 text-white/80 transition-colors hover:text-white ${tint}`}
                >
                  <Icon size={11} aria-hidden />
                </a>
              </li>
            ))}
          </ul>

          <span className="hidden h-3 w-px bg-white/20 sm:block" aria-hidden />

          <span className="hidden items-center gap-1 text-white/70 sm:inline-flex">
            <Globe size={12} aria-hidden />
            English
            <ChevronDown size={11} aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}
