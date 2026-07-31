import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { siteApi } from "@/lib/services";
import { ApiError } from "@/lib/api";

export default function SiteSearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [error, setError] = useState("");
  const [pages, setPages] = useState<Record<string, unknown>[]>([]);
  const [packages, setPackages] = useState<Record<string, unknown>[]>([]);
  const [services, setServices] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    if (q.length < 2) return;
    void (async () => {
      try {
        const res = await siteApi.search(q);
        setPages(res.pages || []);
        setPackages(res.packages || []);
        setServices(res.services || []);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Search failed");
      }
    })();
  }, [q]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center">
        <Link to="/site" className="font-bold text-[14px]">
          Shanghai Travels
        </Link>
        <span className="text-[12px] text-white/70">Search</span>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Results for “{q}”</h1>
        {error && <p className="text-red-600 text-[12px]">{error}</p>}
        <section>
          <h2 className="text-[13px] font-bold text-slate-700 mb-2">Pages</h2>
          <ul className="space-y-2 text-[12px]">
            {pages.map((p) => (
              <li key={String(p.slug)}>
                <Link className="text-amber-700 underline font-semibold" to={`/site/p/${p.slug}`}>
                  {String(p.title)}
                </Link>
              </li>
            ))}
            {!pages.length && <li className="text-slate-400">No pages</li>}
          </ul>
        </section>
        <section>
          <h2 className="text-[13px] font-bold text-slate-700 mb-2">Packages</h2>
          <ul className="space-y-2 text-[12px]">
            {packages.map((p) => (
              <li key={`${p.serviceType}-${p.slug}`}>
                <Link
                  className="text-amber-700 underline font-semibold"
                  to={`/site/travel/${p.serviceType}/${p.slug}`}
                >
                  {String(p.title)}
                </Link>
                <span className="text-slate-400"> · {String(p.serviceType)}</span>
              </li>
            ))}
            {!packages.length && <li className="text-slate-400">No packages</li>}
          </ul>
        </section>
        <section>
          <h2 className="text-[13px] font-bold text-slate-700 mb-2">Services</h2>
          <ul className="space-y-2 text-[12px]">
            {services.map((s, i) => (
              <li key={`${s.slug}-${i}`}>
                {String(s.serviceType)} — {String(s.title)}
              </li>
            ))}
            {!services.length && <li className="text-slate-400">No services</li>}
          </ul>
        </section>
      </main>
    </div>
  );
}
