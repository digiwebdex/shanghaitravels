import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { siteDestinationsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { DestinationMaster, DestinationShowcaseSettings } from "@/lib/destinations";
import {
  DEFAULT_SHOWCASE_SETTINGS,
  DESTINATION_CATEGORIES,
  DESTINATION_CATEGORY_LABELS,
  DESTINATION_REGIONS,
  mergeShowcaseSettings,
} from "@/lib/destinations";
import { toPoisha } from "@/lib/tour";
import { DestinationShowcaseGrid } from "@/components/destinations/DestinationShowcaseGrid";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";

export default function SiteDestinationsBrowsePage() {
  const [rows, setRows] = useState<DestinationMaster[]>([]);
  const [settings, setSettings] = useState<DestinationShowcaseSettings>(DEFAULT_SHOWCASE_SETTINGS);
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [budgetBdt, setBudgetBdt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const budgetRaw = budgetBdt.trim() ? toPoisha(budgetBdt) : undefined;
      const budgetMaxPoisha = budgetRaw ?? undefined;
      const [browse, s] = await Promise.all([
        siteDestinationsApi.browse({
          region: region || undefined,
          country: country || undefined,
          category: category || undefined,
          budgetMaxPoisha,
          limit: 48,
        }),
        siteDestinationsApi.settings().catch(() => DEFAULT_SHOWCASE_SETTINGS),
      ]);
      setRows(listOf<DestinationMaster>(browse));
      setSettings(mergeShowcaseSettings(s));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load destinations");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [region, country, category, budgetBdt]);

  useEffect(() => {
    void load();
  }, [load]);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    void load();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <Link to="/site" className="font-bold text-[14px]">
          Shanghai Travels
        </Link>
        <Link to="/site/search" className="text-[11px] text-amber-300 font-semibold">
          Package search
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div>
          <p className="text-amber-300 text-[11px] uppercase tracking-widest">Explore</p>
          <h1 className="text-3xl font-bold mt-1">Browse all countries</h1>
          <p className="text-white/60 text-[13px] mt-2 max-w-2xl">
            Filter by region, country, service category, or budget. All destinations load from Destination Master — no hardcoded lists.
          </p>
        </div>

        <form onSubmit={onFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <div>
            <label className={labelCls}>Region</label>
            <select className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">All regions</option>
              {DESTINATION_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Thailand" />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All services</option>
              {DESTINATION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {DESTINATION_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Max budget (BDT)</label>
            <input className={inputCls} value={budgetBdt} onChange={(e) => setBudgetBdt(e.target.value)} placeholder="50000" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full px-4 py-2.5 rounded-lg bg-amber-500 text-slate-950 text-[12px] font-bold">
              Apply filters
            </button>
          </div>
        </form>

        {error && <p className="text-red-300 text-[12px]">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16">
            <FullPageSpinner label="Loading destinations…" />
          </div>
        ) : (
          <DestinationShowcaseGrid
            destinations={rows}
            settings={settings}
            variant="site"
            title="Destinations"
            browseHref="/site/destinations"
            browseLabel=""
            emptyTitle="No destinations match your filters."
            emptyHint="Try clearing filters or check back when new countries are published."
          />
        )}
      </main>
    </div>
  );
}
