import { FormEvent, useCallback, useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { tourDestinationsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { TourDestination } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { TourModuleNav } from "@/components/tours/TourModuleNav";
import { SEASONS } from "@/lib/tour";

export default function TourDestinationsPage() {
  const [rows, setRows] = useState<TourDestination[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [season, setSeason] = useState("all_year");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await tourDestinationsApi.list({ q: q || undefined, limit: 200 });
      setRows(listOf<TourDestination>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setOk("");
    try {
      await tourDestinationsApi.create({
        name: name.trim(),
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        region: region.trim() || undefined,
        season,
        notes: notes.trim() || undefined,
      });
      setOk("Destination added");
      setName("");
      setCountry("");
      setCity("");
      setRegion("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="tours" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Globe2 size={16} className="text-amber-600" /> Destinations
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Countries, cities, and season tags for package products. Countries also available via reference API.
          </p>
        </div>
        <TourModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form
            onSubmit={(e) => void create(e)}
            className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            <div className="sm:col-span-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Add destination</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="td-name">
                Name *
              </label>
              <input id="td-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls} htmlFor="td-country">
                Country
              </label>
              <input id="td-country" className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="td-city">
                City
              </label>
              <input id="td-city" className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="td-region">
                Region
              </label>
              <input id="td-region" className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="td-season">
                Season
              </label>
              <select id="td-season" className={inputCls} value={season} onChange={(e) => setSeason(e.target.value)}>
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="td-notes">
                Notes
              </label>
              <input id="td-notes" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
              >
                Add destination
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-[11px]"
              placeholder="Search destinations…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search destinations"
            />
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No destinations" hint="Add countries / cities used by package products." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Country</th>
                    <th className="px-4 py-2 font-bold">City</th>
                    <th className="px-4 py-2 font-bold">Season</th>
                    <th className="px-4 py-2 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{d.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.country || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.city || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.season || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
