import { Link } from "react-router";
import { ArrowRight, Bus, Globe2, Hotel, Plane, ScrollText } from "lucide-react";
import type { HeroServiceItem } from "@/lib/heroServices";

function KaabaIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5 12 4l8 4.5v11L12 24 4 19.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M4 8.5 12 13l8-4.5M12 13v11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 10.2 15 6.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function iconFor(key: string) {
  switch (key) {
    case "passport":
      return <ScrollText size={22} aria-hidden />;
    case "kaaba":
      return <KaabaIcon />;
    case "plane":
      return <Plane size={22} aria-hidden />;
    case "hotel":
      return <Hotel size={22} aria-hidden />;
    case "bus":
      return <Bus size={22} aria-hidden />;
    case "globe":
    default:
      return <Globe2 size={22} aria-hidden />;
  }
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url) || url.startsWith("/erp") || url.startsWith("/#");
}

export function HeroServicesGrid({
  items,
  variant = "dark",
}: {
  items: HeroServiceItem[];
  variant?: "dark" | "light";
}) {
  const enabled = items.filter((i) => i.enabled).sort((a, b) => a.sortOrder - b.sortOrder);
  if (!enabled.length) return null;

  const dark = variant === "dark";

  return (
    <ul
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 w-full"
      aria-label="Featured travel services"
    >
      {enabled.map((item) => {
        const className =
          "group relative flex flex-col text-left rounded-2xl border p-4 md:p-5 transition-all duration-300 " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
          (dark
            ? "bg-white/10 border-white/15 hover:bg-white/16 hover:border-white/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 focus-visible:ring-amber-300 focus-visible:ring-offset-slate-950"
            : "bg-white border-slate-200 hover:border-amber-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80 focus-visible:ring-amber-500 focus-visible:ring-offset-white");

        const body = (
          <>
            <span
              className={
                "mb-3 inline-flex size-11 items-center justify-center rounded-xl transition-colors duration-300 " +
                (dark
                  ? "bg-amber-400/15 text-amber-300 group-hover:bg-amber-400/25"
                  : "bg-amber-50 text-amber-700 group-hover:bg-amber-100")
              }
              aria-hidden
            >
              {iconFor(item.icon)}
            </span>
            <span className={"text-[15px] font-bold leading-snug " + (dark ? "text-white" : "text-slate-900")}>
              {item.title}
            </span>
            <span
              className={
                "mt-1.5 text-[12px] leading-relaxed flex-1 " + (dark ? "text-white/70" : "text-slate-600")
              }
            >
              {item.description}
            </span>
            <span
              className={
                "mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold transition-all duration-300 " +
                (dark ? "text-amber-300" : "text-amber-700")
              }
            >
              {item.buttonText}
              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </>
        );

        if (isExternal(item.url) || item.url.startsWith("/inquiry") || item.url.startsWith("/visa") || item.url.startsWith("/tours") || item.url.startsWith("/flights") || item.url.startsWith("/contact") || item.url.startsWith("/services")) {
          // Marketing site absolute paths use <a>; CMS viewer hash paths use Link
          if (item.url.startsWith("/site") || item.url.startsWith("#")) {
            return (
              <li key={item.id || item.slug || item.title}>
                <Link to={item.url.replace(/^#/, "")} className={className} aria-label={`${item.title}: ${item.buttonText}`}>
                  {body}
                </Link>
              </li>
            );
          }
          return (
            <li key={item.id || item.slug || item.title}>
              <a href={item.url} className={className} aria-label={`${item.title}: ${item.buttonText}`}>
                {body}
              </a>
            </li>
          );
        }

        return (
          <li key={item.id || item.slug || item.title}>
            <Link to={item.url} className={className} aria-label={`${item.title}: ${item.buttonText}`}>
              {body}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
