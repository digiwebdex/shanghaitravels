import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Globe2, Plane, ScrollText, Sparkles } from "lucide-react";
import type { CmsBanner, CmsContent } from "./api";
import { CONTAINER, FOCUS } from "./tokens";

const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=2000&q=80&auto=format&fit=crop";

type Pill = {
  key: string;
  title: string;
  tagline: string;
  url: string;
  icon: typeof Plane;
  tint: string;
};

const DEFAULT_PILLS: Pill[] = [
  {
    key: "visa",
    title: "Visa Services",
    tagline: "Fast & Reliable",
    url: "/visa",
    icon: ScrollText,
    tint: "bg-[#E7F6EE] text-[#22A45D]",
  },
  {
    key: "air",
    title: "Air Tickets",
    tagline: "Best Fare Guarantee",
    url: "/flights",
    icon: Plane,
    tint: "bg-[#E6F0FD] text-[#2F80ED]",
  },
  {
    key: "hajj",
    title: "Hajj & Umrah",
    tagline: "Spiritual Journey",
    url: "/services",
    icon: Sparkles,
    tint: "bg-[#EDEEF4] text-[#14213D]",
  },
  {
    key: "tour",
    title: "Tour Packages",
    tagline: "Worldwide Tours",
    url: "/tours",
    icon: Globe2,
    tint: "bg-[#E4F5F3] text-[#14B8A6]",
  },
];

/** Hero quick-access pills come from CMS `hero_service` entries when published. */
function pillsFromCms(items: CmsContent[]): Pill[] {
  return items
    .filter((c) => c.status !== "draft")
    .slice(0, 4)
    .map((c, i) => ({
      key: c.id,
      title: c.title,
      tagline: c.summary || DEFAULT_PILLS[i]?.tagline || "",
      url: (c.meta?.url as string) || (c.meta?.href as string) || DEFAULT_PILLS[i]?.url || "/services",
      icon: DEFAULT_PILLS[i]?.icon ?? Globe2,
      tint: DEFAULT_PILLS[i]?.tint ?? DEFAULT_PILLS[3].tint,
    }));
}

type HeroPremiumProps = {
  banner?: CmsBanner | null;
  services?: CmsContent[];
};

export function HeroPremium({ banner, services = [] }: HeroPremiumProps) {
  const imageUrl = banner?.imageUrl || DEFAULT_HERO;
  const cmsPills = pillsFromCms(services);
  const pills = cmsPills.length === 4 ? cmsPills : DEFAULT_PILLS;

  const rawTitle = banner?.title?.trim();
  const [titleLead, titleAccent] = rawTitle
    ? splitHeadline(rawTitle)
    : ["Your World,", "Expertly Planned"];

  const subtitle = banner?.subtitle?.trim() || "Visa • Air Tickets • Tours • Hajj & Umrah";
  const ctaLabel = banner?.ctaLabel?.trim() || "Request Free Consultation";
  const ctaUrl = banner?.ctaUrl?.trim() || "/inquiry";

  return (
    <section className="relative isolate overflow-hidden bg-[#D9E7F2]">
      <img
        src={imageUrl}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.42)_36%,rgba(255,255,255,0.12)_62%,rgba(255,255,255,0.42)_100%)]"
        aria-hidden
      />
      {/* Keeps the navy headline readable regardless of which banner the CMS serves. */}
      <div
        className="absolute inset-0 bg-[radial-gradient(60%_58%_at_50%_38%,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.6)_45%,rgba(255,255,255,0)_100%)]"
        aria-hidden
      />

      <div
        className={`${CONTAINER} relative flex min-h-[520px] flex-col justify-between pb-6 pt-10 lg:h-[448px] lg:min-h-0 lg:pt-11`}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent md:text-[12px]">
            Your Journey, Our Expertise
          </p>

          <h1 className="mt-2.5 text-[34px] font-extrabold leading-[1.08] tracking-tight text-primary sm:text-[44px] lg:text-[52px]">
            {titleLead}
            {titleAccent && (
              <>
                <br />
                <span className="text-accent">{titleAccent}</span>
              </>
            )}
          </h1>

          <p className="mt-3.5 text-[15px] font-semibold text-primary/85 md:text-[18px]">{subtitle}</p>

          <p className="mt-2.5 text-[12px] text-primary/55 md:text-[13px]">
            Trusted by thousands of travellers. Government approved. Always by your side.
          </p>

          <Link
            to={ctaUrl}
            className={`mt-5 inline-flex items-center gap-3 rounded-full bg-accent py-1.5 pl-7 pr-1.5 text-[14px] font-bold text-white shadow-[0_10px_26px_rgba(249,115,22,0.38)] transition-all duration-300 hover:bg-orange-600 hover:shadow-[0_14px_32px_rgba(249,115,22,0.45)] ${FOCUS}`}
          >
            {ctaLabel}
            <span className="grid size-8 place-items-center rounded-full bg-white" aria-hidden>
              <ArrowRight size={15} className="text-accent" />
            </span>
          </Link>
        </motion.div>

        <motion.nav
          aria-label="Quick access travel services"
          className="mx-auto mt-8 w-full max-w-[1010px] lg:mt-0"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-7">
            {pills.map(({ key, title, tagline, url, icon: Icon, tint }) => (
              <li key={key}>
                <Link
                  to={url}
                  className={`group flex h-[64px] items-center gap-2.5 rounded-xl bg-white/95 px-3 shadow-[0_10px_28px_rgba(20,33,61,0.14)] ring-1 ring-black/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_36px_rgba(20,33,61,0.2)] sm:gap-3 sm:px-4 lg:h-[74px] ${FOCUS}`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg sm:size-10 ${tint}`}
                    aria-hidden
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-primary transition-colors group-hover:text-accent sm:text-[14px]">
                      {title}
                    </span>
                    <span className="block truncate text-[10.5px] text-muted-foreground sm:text-[11px]">
                      {tagline}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.nav>
      </div>
    </section>
  );
}

/** Splits a CMS headline so the trailing clause can carry the orange accent. */
function splitHeadline(title: string): [string, string] {
  const commaAt = title.indexOf(",");
  if (commaAt > 0 && commaAt < title.length - 1) {
    return [title.slice(0, commaAt + 1), title.slice(commaAt + 1).trim()];
  }
  const words = title.split(/\s+/);
  if (words.length < 3) return [title, ""];
  const split = Math.ceil(words.length / 2);
  return [words.slice(0, split).join(" "), words.slice(split).join(" ")];
}
