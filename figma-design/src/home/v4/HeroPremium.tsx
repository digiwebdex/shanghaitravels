import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Globe2, Plane, ScrollText, Sparkles } from "lucide-react";
import type { CmsBanner, CmsContent } from "./api";
import { HERO_PHOTO } from "./photos";
import { CONTAINER, EASE, FOCUS, PHOTO_GRADE } from "./tokens";

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
  const reduceMotion = useReducedMotion();
  const imageUrl = banner?.imageUrl || HERO_PHOTO;
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
      {/* Slow drift across the frame; the scale headroom hides the edges. */}
      <motion.img
        src={imageUrl}
        alt=""
        fetchPriority="high"
        className={`absolute inset-0 size-full object-cover object-center ${PHOTO_GRADE}`}
        initial={reduceMotion ? undefined : { scale: 1.12 }}
        animate={reduceMotion ? undefined : { scale: 1 }}
        transition={{ duration: 18, ease: "linear" }}
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.34)_36%,rgba(255,255,255,0.16)_62%,rgba(255,255,255,0.4)_100%)]"
        aria-hidden
      />
      {/* Pool of light behind the headline. Tuned to land near 80% white at the
          type — enough for navy to clear WCAG AA, light enough that the photo
          still reads as a photograph rather than a wash. */}
      <div
        className="absolute inset-0 bg-[radial-gradient(60%_58%_at_50%_38%,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.42)_45%,rgba(255,255,255,0)_100%)]"
        aria-hidden
      />
      {/* Cinematic vignette: darkens the corners so the frame reads as composed. */}
      <div
        className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_45%,rgba(20,33,61,0)_45%,rgba(20,33,61,0.16)_100%)]"
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
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent md:text-[12px]">
            Your Journey, Our Expertise
          </p>

          <h1 className="mt-3 text-[34px] font-extrabold leading-[1.06] tracking-[-0.025em] text-primary sm:text-[44px] lg:text-[52px]">
            {titleLead}
            {titleAccent && (
              <>
                <br />
                <span className="text-accent">{titleAccent}</span>
              </>
            )}
          </h1>

          <p className="mt-4 text-[15px] font-semibold leading-[1.5] tracking-[-0.005em] text-primary/85 md:text-[18px]">
            {subtitle}
          </p>

          <p className="mt-2.5 text-[12px] font-medium leading-[1.6] text-primary/70 md:text-[13px]">
            Trusted by thousands of travellers. Government approved. Always by your side.
          </p>

          <Link
            to={ctaUrl}
            className={`group mt-6 inline-flex items-center gap-3 rounded-full bg-accent py-1.5 pl-7 pr-1.5 text-[14px] font-bold tracking-[0.01em] text-white shadow-[0_10px_26px_rgba(249,115,22,0.38)] transition-all duration-500 ${EASE} hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_18px_38px_rgba(249,115,22,0.48)] ${FOCUS}`}
          >
            {ctaLabel}
            <span
              className={`grid size-8 place-items-center rounded-full bg-white transition-transform duration-500 ${EASE} group-hover:translate-x-0.5`}
              aria-hidden
            >
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
                  className={`group flex h-[64px] items-center gap-2.5 rounded-xl bg-white/95 px-3 shadow-[0_2px_6px_rgba(20,33,61,0.06),0_12px_30px_rgba(20,33,61,0.14)] ring-1 ring-black/[0.04] backdrop-blur-sm transition-all duration-500 ${EASE} hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_4px_10px_rgba(20,33,61,0.08),0_22px_44px_rgba(20,33,61,0.2)] hover:ring-accent/25 sm:gap-3 sm:px-4 lg:h-[74px] ${FOCUS}`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg transition-transform duration-500 ${EASE} group-hover:scale-110 sm:size-10 ${tint}`}
                    aria-hidden
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold tracking-[-0.01em] text-primary transition-colors duration-300 group-hover:text-accent sm:text-[14px]">
                      {title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] leading-[1.4] text-muted-foreground sm:text-[11px]">
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
