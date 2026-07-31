import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { DestinationMaster, DestinationShowcaseSettings } from "@/lib/destinations";
import {
  DEFAULT_SHOWCASE_SETTINGS,
  destinationCountry,
  formatPackageCount,
  mergeShowcaseSettings,
} from "@/lib/destinations";

type Props = {
  destination: DestinationMaster;
  settings?: Partial<DestinationShowcaseSettings>;
  detailPath?: string;
  variant?: "site" | "light";
};

function useLazyFadeIn() {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "80px", threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

export function DestinationCardSkeleton({ variant = "site" }: { variant?: "site" | "light" }) {
  const shell =
    variant === "site"
      ? "rounded-2xl border border-white/10 bg-white/5"
      : "rounded-2xl border border-slate-200 bg-white";
  return (
    <div className={`${shell} overflow-hidden animate-pulse`} aria-hidden>
      <div className="flex min-h-[168px]">
        <div className="w-[42%] p-4 space-y-3">
          <div className="size-12 rounded-full bg-white/10" />
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
        <div className="w-[58%] bg-white/10" />
      </div>
      <div className="h-14 border-t border-white/5 bg-white/5" />
    </div>
  );
}

export function DestinationCard({
  destination: d,
  settings: settingsPartial,
  detailPath,
  variant = "site",
}: Props) {
  const settings = mergeShowcaseSettings(settingsPartial ?? DEFAULT_SHOWCASE_SETTINGS);
  const { ref, visible } = useLazyFadeIn();
  const country = destinationCountry(d);
  const code = d.countryCode?.toUpperCase() || "";
  const img = settings.showHeroImage ? d.heroImageUrl || d.coverImageUrl || "" : "";
  const to = detailPath ?? `/site/destinations/${d.slug}`;
  const cta = settings.ctaLabel || DEFAULT_SHOWCASE_SETTINGS.ctaLabel;

  const shell =
    variant === "site"
      ? "group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-white shadow-lg backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-orange-400/50 hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)] focus-within:ring-2 focus-within:ring-orange-400/60"
      : "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-orange-300 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] focus-within:ring-2 focus-within:ring-orange-400/50";

  const muted = variant === "site" ? "text-white/55" : "text-slate-500";
  const footBg = variant === "site" ? "border-white/10 bg-white/[0.03]" : "border-slate-100 bg-slate-50/80";

  return (
    <article
      ref={ref}
      className={`${shell} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} transition-[opacity,transform] duration-500`}
      aria-label={`${country} destination`}
    >
      <Link to={to} className="flex min-h-[168px] outline-none" aria-label={`Explore ${country}`}>
        <div className="relative z-[1] flex w-[42%] min-w-0 flex-col justify-center gap-2 p-4 md:p-5">
          {settings.showFlag && (
            <div
              className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-2xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-focus-within:scale-110"
              aria-hidden
            >
              {d.flagUrl ? (
                <img src={d.flagUrl} alt="" className="size-full object-cover" loading="lazy" />
              ) : (
                <span>{d.flagEmoji || "🌍"}</span>
              )}
            </div>
          )}
          <div>
            <h3 className="text-[15px] font-bold leading-tight tracking-tight">{country}</h3>
            {code && <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-widest ${muted}`}>{code}</p>}
            {settings.showRegion && d.region && (
              <p className={`mt-1 text-[11px] ${muted}`}>{d.region}</p>
            )}
          </div>
        </div>

        {settings.showHeroImage && (
          <div className="relative w-[58%] min-h-[168px] overflow-hidden">
            {img ? (
              <img
                src={img}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-focus-within:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/10 via-black/25 to-black/55 transition-opacity duration-300 group-hover:opacity-90" />
            <div className="pointer-events-none absolute inset-0 bg-white/0 backdrop-blur-0 transition-all duration-300 group-hover:bg-white/[0.06] group-hover:backdrop-blur-[2px]" />
          </div>
        )}
      </Link>

      <div className={`relative flex items-center justify-between gap-3 border-t px-4 py-3 ${footBg}`}>
        <div className="min-w-0">
          {settings.showPackageCount && (
            <p className={`text-[11px] font-semibold ${variant === "site" ? "text-orange-300" : "text-orange-600"}`}>
              {formatPackageCount(d.packageCount)}
            </p>
          )}
          {settings.showCta && (
            <Link
              to={to}
              className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold transition-colors duration-200 hover:text-orange-400 focus-visible:outline-none focus-visible:underline ${
                variant === "site" ? "text-white/80" : "text-slate-700"
              }`}
            >
              {cta}
            </Link>
          )}
        </div>
        <Link
          to={to}
          className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-orange-400 group-focus-within:translate-x-0.5"
          aria-label={`Open ${country}`}
        >
          <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
