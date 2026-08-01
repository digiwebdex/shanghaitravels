import { ArrowRight } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { Section, SectionHeading, ViewAll } from "./Section";
import type { DestinationRow, DestinationSettings } from "./api";
import { destinationImage, flagSrc, formatPkgCount } from "./format";
import { FOCUS } from "./tokens";

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-[158px] animate-pulse rounded-xl bg-muted" aria-hidden />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No published destinations yet. Add entries in Destination Master to fill this grid.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((d) => (
            <DestinationCard key={d.id} destination={d} settings={settings} />
          ))}
        </div>
      )}
    </Section>
  );
}

function DestinationCard({
  destination: d,
  settings,
}: {
  destination: DestinationRow;
  settings: DestinationSettings;
}) {
  const country = d.countryName || d.country || d.name;
  const img = settings.showHeroImage === false ? "" : destinationImage(d);
  const flag = settings.showFlag === false ? "" : flagSrc(d);
  const href = `/erp/#/site/destinations/${encodeURIComponent(d.slug)}`;
  // The CMS label sometimes ships with its own arrow; the card already draws one.
  const ctaLabel = (settings.ctaLabel || "Explore").replace(/[\s→>]+$/, "").trim() || "Explore";

  return (
    <article className="group relative h-[158px] overflow-hidden rounded-xl bg-muted shadow-[0_2px_12px_rgba(20,33,61,0.06)] ring-1 ring-[rgba(20,33,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(20,33,61,0.16)]">
      <CoverImage
        src={img}
        className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
        fallbackClassName="absolute inset-0 bg-gradient-to-br from-primary/70 to-primary"
      />

      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.7)_30%,rgba(255,255,255,0.24)_58%,rgba(255,255,255,0)_86%)]"
        aria-hidden
      />

      <a href={href} className={`relative flex h-full w-[64%] flex-col justify-center gap-1 p-4 ${FOCUS}`}>
        {flag ? (
          <img
            src={flag}
            alt=""
            loading="lazy"
            className="size-9 rounded-full object-cover shadow-[0_2px_8px_rgba(20,33,61,0.2)] ring-2 ring-white transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          d.flagEmoji && (
            <span
              className="grid size-9 place-items-center rounded-full bg-white text-lg shadow-[0_2px_8px_rgba(20,33,61,0.2)] ring-2 ring-white transition-transform duration-300 group-hover:scale-110"
              aria-hidden
            >
              {d.flagEmoji}
            </span>
          )
        )}

        <h3 className="mt-1.5 truncate text-[15px] font-bold text-primary">{country}</h3>

        {settings.showPackageCount !== false && (
          <p className="text-[11px] text-primary/60">{formatPkgCount(d.packageCount)}</p>
        )}

        {settings.showRegion === true && d.region && (
          <p className="truncate text-[10px] uppercase tracking-wider text-primary/40">{d.region}</p>
        )}

        {settings.showCta !== false && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-accent transition-all group-hover:gap-2">
            {ctaLabel}
            <ArrowRight size={11} aria-hidden />
          </span>
        )}
      </a>

      <span
        className="pointer-events-none absolute bottom-3 right-3 grid size-8 translate-x-1 place-items-center rounded-full bg-white/90 text-primary opacity-0 shadow-[0_4px_14px_rgba(20,33,61,0.2)] backdrop-blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
        aria-hidden
      >
        <ArrowRight size={15} />
      </span>
    </article>
  );
}
