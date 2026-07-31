import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "./Section";
import type { DestinationRow, DestinationSettings } from "./api";
import { formatPkgCount } from "./format";

type PopularDestinationsProps = {
  destinations: DestinationRow[];
  settings: DestinationSettings;
  loading?: boolean;
};

export function PopularDestinations({ destinations, settings, loading }: PopularDestinationsProps) {
  if (settings.enabled === false) return null;

  const max = Math.max(1, settings.maxCards ?? 8);
  const visible = destinations
    .slice()
    .sort((a, b) => (a.displayOrder ?? a.sortOrder ?? 9999) - (b.displayOrder ?? b.sortOrder ?? 9999))
    .slice(0, max);

  return (
    <Section className="py-16 md:py-24 bg-muted/40">
      <SectionHeader
        eyebrow="Explore"
        title="Popular Destinations"
        subtitle="Where we can take you — live from Destination Master."
        action={
          <a
            href="/erp/#/site/destinations"
            className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent transition-colors"
          >
            Browse all countries <ArrowRight size={14} />
          </a>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-border bg-card animate-pulse" aria-hidden />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10 border border-dashed border-border rounded-2xl">
          No published destinations yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {visible.map((d) => {
            const country = d.countryName || d.country || d.name;
            const img = settings.showHeroImage !== false ? d.heroImageUrl || d.coverImageUrl : "";
            const href = `/erp/#/site/destinations/${encodeURIComponent(d.slug)}`;

            return (
              <article
                key={d.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(20,33,61,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-lg"
              >
                <a href={href} className="flex min-h-[168px] outline-none" aria-label={`Explore ${country}`}>
                  <div className="w-[42%] p-4 flex flex-col justify-center gap-2">
                    {settings.showFlag !== false && (
                      <div className="size-12 rounded-full border border-border bg-muted flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 overflow-hidden">
                        {d.flagUrl ? (
                          <img src={d.flagUrl} alt="" className="size-full object-cover" loading="lazy" />
                        ) : (
                          d.flagEmoji || "🌍"
                        )}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-[15px]">{country}</h3>
                      {d.countryCode && (
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">
                          {d.countryCode}
                        </p>
                      )}
                      {settings.showRegion !== false && d.region && (
                        <p className="text-[11px] text-muted-foreground mt-1">{d.region}</p>
                      )}
                    </div>
                  </div>
                  {settings.showHeroImage !== false && (
                    <div className="relative w-[58%] overflow-hidden min-h-[168px]">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-black/25 to-black/50" />
                    </div>
                  )}
                </a>
                <div className="relative flex items-center border-t border-border px-4 py-3 bg-muted/30">
                  <div>
                    {settings.showPackageCount !== false && (
                      <p className="text-[11px] font-semibold text-accent">{formatPkgCount(d.packageCount)}</p>
                    )}
                    {settings.showCta !== false && (
                      <a href={href} className="text-[11px] font-bold text-foreground/80 hover:text-accent mt-0.5 inline-block">
                        {settings.ctaLabel || "Explore Destination →"}
                      </a>
                    )}
                  </div>
                  <a
                    href={href}
                    className="absolute bottom-3 right-3 size-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-label={`Open ${country}`}
                  >
                    <ArrowRight size={18} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
}
