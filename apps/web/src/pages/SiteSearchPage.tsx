import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { siteApi, sitePackagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { toPoisha } from "@/lib/packages";
import { PackageCard } from "@/components/packages/PackageCard";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { PACKAGE_TYPES, PACKAGE_TYPE_LABELS } from "@/lib/tour";

export default function SiteSearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [error, setError] = useState("");
  const [pages, setPages] = useState<Record<string, unknown>[]>([]);
  const [legacyPackages, setLegacyPackages] = useState<Record<string, unknown>[]>([]);
  const [packages, setPackages] = useState<PackageMaster[]>([]);
  const [services, setServices] = useState<Record<string, unknown>[]>([]);

  const [destination, setDestination] = useState(params.get("destination") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [durationMin, setDurationMin] = useState(params.get("durationMin") || "");
  const [durationMax, setDurationMax] = useState(params.get("durationMax") || "");
  const [budgetBdt, setBudgetBdt] = useState(params.get("budgetBdt") || "");
  const [travelMonth, setTravelMonth] = useState(params.get("travelMonth") || "");
  const [packageType, setPackageType] = useState(params.get("packageType") || "");

  useEffect(() => {
    if (q.length < 2 && !destination && !category && !packageType) return;
    void (async () => {
      try {
        if (q.length >= 2) {
          const res = await siteApi.search(q);
          setPages(res.pages || []);
          setLegacyPackages(res.packages || []);
          setServices(res.services || []);
        }
        const budgetMaxPoisha = budgetBdt.trim() ? toPoisha(budgetBdt) : undefined;
        const searchRes = await sitePackagesApi.search({
          q: q || undefined,
          destination: destination || undefined,
          category: category || undefined,
          durationMin: durationMin ? Number(durationMin) : undefined,
          durationMax: durationMax ? Number(durationMax) : undefined,
          budgetMaxPoisha: budgetMaxPoisha ?? undefined,
          travelMonth: travelMonth || undefined,
          packageType: packageType || undefined,
          limit: 24,
        });
        setPackages(listOf<PackageMaster>(searchRes));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Search failed");
      }
    })();
  }, [q, destination, category, durationMin, durationMax, budgetBdt, travelMonth, packageType]);

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    if (destination) next.set("destination", destination);
    else next.delete("destination");
    if (category) next.set("category", category);
    else next.delete("category");
    if (durationMin) next.set("durationMin", durationMin);
    else next.delete("durationMin");
    if (durationMax) next.set("durationMax", durationMax);
    else next.delete("durationMax");
    if (budgetBdt) next.set("budgetBdt", budgetBdt);
    else next.delete("budgetBdt");
    if (travelMonth) next.set("travelMonth", travelMonth);
    else next.delete("travelMonth");
    if (packageType) next.set("packageType", packageType);
    else next.delete("packageType");
    setParams(next);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white px-4 py-3 flex justify-between items-center">
        <Link to="/site" className="font-bold text-[14px]">
          Shanghai Travels
        </Link>
        <span className="text-[12px] text-white/70">Search</span>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Package search</h1>
        {q && <p className="text-[13px] text-slate-600">Query: “{q}”</p>}
        {error && <p className="text-red-600 text-[12px]">{error}</p>}

        <form onSubmit={applyFilters} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Destination</label>
            <input className={inputCls} value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Min days</label>
            <input type="number" min="1" className={inputCls} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Max days</label>
            <input type="number" min="1" className={inputCls} value={durationMax} onChange={(e) => setDurationMax(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Max budget (BDT)</label>
            <input className={inputCls} value={budgetBdt} onChange={(e) => setBudgetBdt(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Travel month</label>
            <input type="month" className={inputCls} value={travelMonth} onChange={(e) => setTravelMonth(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Package type</label>
            <select className={inputCls} value={packageType} onChange={(e) => setPackageType(e.target.value)}>
              <option value="">Any</option>
              {PACKAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PACKAGE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-2 rounded-lg bg-amber-600 text-white text-[12px] font-bold">
              Apply filters
            </button>
          </div>
        </form>

        <section>
          <h2 className="text-[13px] font-bold text-slate-700 mb-3">Packages</h2>
          {packages.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {packages.map((p) => (
                <PackageCard key={p.id} pkg={p} variant="portal" bookPath={`/site/packages/${p.slug}/book`} />
              ))}
            </div>
          ) : (
            <ul className="space-y-2 text-[12px]">
              {legacyPackages.map((p) => (
                <li key={`${p.serviceType}-${p.slug}`}>
                  <Link className="text-amber-700 underline font-semibold" to={`/site/travel/${p.serviceType}/${p.slug}`}>
                    {String(p.title)}
                  </Link>
                </li>
              ))}
              {!legacyPackages.length && <li className="text-slate-400">No packages match your filters.</li>}
            </ul>
          )}
        </section>

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
