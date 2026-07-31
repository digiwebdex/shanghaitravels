import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { siteDestinationsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { DestinationGalleryItem, DestinationMaster } from "@/lib/destinations";
import { destinationCountry, formatPackageCount } from "@/lib/destinations";
import type { PackageMaster } from "@/lib/packages";
import { DestinationCard } from "@/components/destinations/DestinationCard";
import { PackageCard } from "@/components/packages/PackageCard";
import { FullPageSpinner } from "@/components/FullPageSpinner";

type Detail = DestinationMaster & {
  gallery?: DestinationGalleryItem[];
  packages?: PackageMaster[];
  related?: DestinationMaster[];
};

export default function SiteDestinationDetailPage() {
  const { slug } = useParams();
  const [dest, setDest] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      setLoading(true);
      try {
        setDest(await siteDestinationsApi.getBySlug(slug));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Destination not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <FullPageSpinner label="Loading destination…" />
      </div>
    );
  }

  if (error || !dest) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <Link to="/site/destinations" className="text-amber-300 text-[12px]">
          ← Browse destinations
        </Link>
        <p className="mt-4 text-red-300">{error || "Not found"}</p>
      </div>
    );
  }

  const country = destinationCountry(dest);
  const hero = dest.heroImageUrl || dest.coverImageUrl || "";
  const gallery =
    dest.gallery?.length ? dest.gallery : hero ? [{ id: "hero", destinationId: dest.id, url: hero }] : [];
  const packages = dest.packages || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        <Link to="/site" className="font-bold text-[14px]">
          Shanghai Travels
        </Link>
        <div className="flex gap-3">
          <Link to="/site/enquire" className="px-4 py-2 rounded-lg border border-white/20 text-[12px] font-semibold hover:bg-white/10">
            Enquire
          </Link>
          <Link to="/site/search" className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-[12px] font-bold">
            Explore packages
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="relative overflow-hidden rounded-2xl border border-white/10">
          {hero && (
            <img src={hero} alt="" className="absolute inset-0 size-full object-cover opacity-40" loading="lazy" />
          )}
          <div className="relative p-8 md:p-12 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              {dest.flagUrl ? (
                <img src={dest.flagUrl} alt="" className="size-12 rounded-full object-cover border border-white/20" />
              ) : (
                <span className="text-3xl" aria-hidden>
                  {dest.flagEmoji || "🌍"}
                </span>
              )}
              <div>
                <p className="text-amber-300 text-[11px] uppercase tracking-widest">{dest.region || "Destination"}</p>
                <h1 className="text-3xl md:text-4xl font-bold">{country}</h1>
                {dest.countryCode && (
                  <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mt-1">{dest.countryCode}</p>
                )}
              </div>
            </div>
            {dest.summary && <p className="text-white/75 text-[14px] max-w-2xl leading-relaxed">{dest.summary}</p>}
            <p className="mt-4 text-orange-300 text-[12px] font-semibold">{formatPackageCount(dest.packageCount)}</p>
          </div>
        </section>

        {dest.description && (
          <section>
            <h2 className="text-[16px] font-bold mb-3">About {country}</h2>
            <div className="text-white/70 text-[13px] leading-relaxed whitespace-pre-wrap">{dest.description}</div>
          </section>
        )}

        {gallery.length > 0 && (
          <section>
            <h2 className="text-[16px] font-bold mb-3">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gallery.map((g) => (
                <img
                  key={g.id}
                  src={g.url}
                  alt={g.caption || country}
                  className="aspect-[4/3] w-full rounded-xl object-cover border border-white/10"
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        )}

        {dest.mapEmbedUrl && (
          <section>
            <h2 className="text-[16px] font-bold mb-3">Map</h2>
            <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/30">
              <iframe
                title={`Map of ${country}`}
                src={dest.mapEmbedUrl}
                className="size-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-[16px] font-bold">Packages in {country}</h2>
            <Link to={`/site/search?destination=${encodeURIComponent(country)}`} className="text-[11px] text-amber-300 font-semibold">
              Search all →
            </Link>
          </div>
          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((p) => (
                <PackageCard key={p.id} pkg={p} bookPath={`/site/packages/${p.slug}/book`} />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-white/50">No published packages linked to this destination yet.</p>
          )}
        </section>

        {dest.related && dest.related.length > 0 && (
          <section>
            <h2 className="text-[16px] font-bold mb-4">Related destinations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {dest.related.map((r) => (
                <DestinationCard key={r.id} destination={r} detailPath={`/site/destinations/${r.slug}`} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
