import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { sitePackagesApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { PackageGalleryItem, PackageMaster } from "@/lib/packages";
import { formatDuration, formatPrice, displayPricePoisha } from "@/lib/packages";
import { parseItineraryDays } from "@/lib/packages";
import { PackageCard } from "@/components/packages/PackageCard";
import { FullPageSpinner } from "@/components/FullPageSpinner";

type Detail = PackageMaster & {
  gallery?: PackageGalleryItem[];
  faqs?: { id: string; question: string; answer: string }[];
  related?: PackageMaster[];
};

export default function SitePackageDetailPage() {
  const { slug } = useParams();
  const [pkg, setPkg] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    void (async () => {
      setLoading(true);
      try {
        setPkg(await sitePackagesApi.getBySlug(slug));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Package not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <FullPageSpinner label="Loading package…" />
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <Link to="/site" className="text-amber-300 text-[12px]">
          ← Home
        </Link>
        <p className="mt-4 text-red-300">{error || "Not found"}</p>
      </div>
    );
  }

  const days = parseItineraryDays(pkg.itinerary || "");
  const gallery = pkg.gallery?.length ? pkg.gallery : pkg.coverImageUrl ? [{ id: "cover", packageId: pkg.id, url: pkg.coverImageUrl }] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <Link to="/site" className="font-bold text-[14px]">
          Shanghai Travels
        </Link>
        <Link
          to={`/site/packages/${pkg.slug}/book`}
          className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-[12px] font-bold"
        >
          Book Package
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section>
          <p className="text-amber-300 text-[11px] uppercase tracking-widest">{pkg.country}</p>
          <h1 className="text-3xl font-bold mt-1">{pkg.name}</h1>
          <p className="text-white/60 text-[13px] mt-2">
            {pkg.destination} · {formatDuration(pkg.durationDays, pkg.durationNights)}
          </p>
          <p className="text-2xl font-bold text-amber-300 mt-4">{formatPrice(displayPricePoisha(pkg))}</p>
        </section>

        {gallery.length > 0 && (
          <section aria-label="Gallery">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {gallery.map((g) => (
                <img key={g.id} src={g.url} alt="" className="rounded-xl h-40 w-full object-cover" loading="lazy" />
              ))}
            </div>
          </section>
        )}

        {pkg.summary && (
          <section>
            <h2 className="text-[14px] font-bold mb-2">Overview</h2>
            <p className="text-[13px] text-white/70 leading-relaxed">{pkg.summary}</p>
            {pkg.description && <p className="text-[13px] text-white/60 mt-3 leading-relaxed">{pkg.description}</p>}
          </section>
        )}

        {days.length > 0 && days[0].title && (
          <section>
            <h2 className="text-[14px] font-bold mb-3">Itinerary</h2>
            <ol className="space-y-3">
              {days.map((d) => (
                <li key={d.day} className="rounded-xl border border-white/10 p-4 bg-white/5">
                  <p className="text-[12px] font-bold text-amber-300">Day {d.day}: {d.title}</p>
                  <p className="text-[12px] text-white/65 mt-1 whitespace-pre-wrap">{d.body}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {pkg.inclusions && (
            <section>
              <h2 className="text-[14px] font-bold mb-2">Included</h2>
              <p className="text-[12px] text-white/65 whitespace-pre-wrap">{pkg.inclusions}</p>
            </section>
          )}
          {pkg.exclusions && (
            <section>
              <h2 className="text-[14px] font-bold mb-2">Excluded</h2>
              <p className="text-[12px] text-white/65 whitespace-pre-wrap">{pkg.exclusions}</p>
            </section>
          )}
        </div>

        {pkg.mapEmbedUrl && (
          <section>
            <h2 className="text-[14px] font-bold mb-2">Map</h2>
            <iframe title="Package map" src={pkg.mapEmbedUrl} className="w-full h-64 rounded-xl border-0 bg-slate-800" loading="lazy" />
          </section>
        )}

        {pkg.faqs && pkg.faqs.length > 0 && (
          <section>
            <h2 className="text-[14px] font-bold mb-3">FAQ</h2>
            <div className="space-y-2">
              {pkg.faqs.map((f) => (
                <details key={f.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
                  <summary className="text-[12px] font-semibold cursor-pointer">{f.question}</summary>
                  <p className="text-[12px] text-white/65 mt-2">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {pkg.related && pkg.related.length > 0 && (
          <section>
            <h2 className="text-[14px] font-bold mb-4">Related packages</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {pkg.related.map((r) => (
                <PackageCard
                  key={r.id}
                  pkg={r}
                  bookPath={`/site/packages/${r.slug}/book`}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
