import { ArrowRight } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { Section, SectionHeading, ViewAll } from "./Section";
import type { DestinationRow, DestinationSettings } from "./api";
import { destinationFallbackImage, destinationImage, flagSrc, formatPkgCount } from "./format";
import { EASE, FOCUS } from "./tokens";

type PopularDestinationsProps = {
  destinations: DestinationRow[];
  settings: DestinationSettings;
  loading?: boolean;
  totalCountries?: number;
};

export function PopularDestinations({
  destinations,
  settings,
  loading,
  totalCountries,
}: PopularDestinationsProps) {
  if (settings.enabled === false) return null;

  const max = Math.max(1, settings.maxCards ?? 8);
  const visible = destinations
    .slice()
    .sort((a, b) => (a.displayOrder ?? a.sortOrder ?? 9999) - (b.displayOrder ?? b.sortOrder ?? 9999))
    .slice(0, max);

  const count = totalCountries ?? destinations.length;

  return (
    <Section id="popular-destinations">
      <SectionHeading
        title="Popular Destinations"
        action={
          <ViewAll href="/erp/#/site/destinations">
            {count > 0 ? `Browse all ${count} countries` : "Browse all countries"}
          </ViewAll>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="st-shimmer h-[158px] rounded-xl" aria-hidden />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No published destinations yet. Add entries in Destination Master to fill this grid.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((d, i) => (
            <DestinationCard key={d.id} destination={d} settings={settings} index={i} />
          ))}
        </div>
      )}
    </Section>
  );
}

function DestinationCard({
  destination: d,
  settings,
  index,
}: {
  destination: DestinationRow;
  settings: DestinationSettings;
  index: number;
}) {
  const country = d.countryName || d.country || d.name;
  const showImage = settings.showHeroImage !== false;
  const img = showImage ? destinationImage(d) : "";
  const fallbackImg = showImage ? destinationFallbackImage(d, index) : "";
  const flag = settings.showFlag === false ? "" : flagSrc(d);
  const href = `/erp/#/site/destinations/${encodeURIComponent(d.slug)}`;
  // The CMS label sometimes ships with its own arrow; the card already draws one.
  const ctaLabel = (settings.ctaLabel || "Explore").replace(/[\s→>]+$/, "").trim() || "Explore";

  return (
    <article
      className={`group relative h-[158px] overflow-hidden rounded-xl bg-[#E8EDF5] shadow-[0_1px_2px_rgba(20,33,61,0.05),0_6px_20px_rgba(20,33,61,0.06)] ring-1 ring-[rgba(20,33,61,0.07)] transition-all duration-500 ${EASE} hover:-translate-y-1.5 hover:shadow-[0_2px_4px_rgba(20,33,61,0.06),0_20px_44px_rgba(20,33,61,0.18)]`}
    >
      <CoverImage
        src={img}
        fallbackSrc={fallbackImg}
        className={`absolute inset-0 size-full object-cover transition-transform duration-[900ms] ${EASE} group-hover:scale-[1.1]`}
        fallbackClassName="absolute inset-0 bg-gradient-to-br from-primary/70 to-primary"
      />

      {/* Reading panel over the left column, feathering out so the landmark
          still carries the right of the card. Recedes slightly on hover. */}
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.9)_30%,rgba(255,255,255,0.5)_60%,rgba(255,255,255,0)_88%)] transition-opacity duration-500 group-hover:opacity-90"
        aria-hidden
      />

      <a
        href={href}
        className={`relative flex h-full w-[64%] flex-col justify-center gap-1 py-4 pl-[18px] pr-4 ${FOCUS}`}
      >
        {flag ? (
          <img
            src={flag}
            alt=""
            loading="lazy"
            className={`size-9 rounded-full object-cover shadow-[0_2px_10px_rgba(20,33,61,0.24)] ring-2 ring-white transition-transform duration-500 ${EASE} group-hover:scale-110`}
          />
        ) : (
          d.flagEmoji && (
            <span
              className={`grid size-9 place-items-center rounded-full bg-white text-lg shadow-[0_2px_10px_rgba(20,33,61,0.24)] ring-2 ring-white transition-transform duration-500 ${EASE} group-hover:scale-110`}
              aria-hidden
            >
              {d.flagEmoji}
            </span>
          )
        )}

        <h3 className="mt-2 truncate text-[15px] font-bold tracking-[-0.015em] text-primary">{country}</h3>

        {settings.showPackageCount !== false && (
          <p className="text-[11px] font-medium text-primary/60">{formatPkgCount(d.packageCount)}</p>
        )}

        {settings.showRegion === true && d.region && (
          <p className="truncate text-[10px] uppercase tracking-[0.12em] text-primary/40">{d.region}</p>
        )}

        {settings.showCta !== false && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.01em] text-accent transition-all duration-300 group-hover:gap-2">
            {ctaLabel}
            <ArrowRight size={11} aria-hidden />
          </span>
        )}
      </a>

      <span
        className={`pointer-events-none absolute bottom-3 right-3 grid size-8 translate-x-2 place-items-center rounded-full bg-white/90 text-primary opacity-0 shadow-[0_4px_16px_rgba(20,33,61,0.24)] ring-1 ring-white/60 backdrop-blur-md transition-all duration-500 ${EASE} group-hover:translate-x-0 group-hover:opacity-100`}
        aria-hidden
      >
        <ArrowRight size={15} />
      </span>
    </article>
  );
}
