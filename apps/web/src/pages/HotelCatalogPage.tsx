import { FormEvent, useCallback, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { hotelsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { HotelProperty } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { HotelModuleNav } from "@/components/hotels/HotelModuleNav";
import { ROOM_TYPES } from "@/lib/hotel";

export default function HotelCatalogPage() {
  const [rows, setRows] = useState<HotelProperty[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [stars, setStars] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await hotelsApi.list({ q: q || undefined, limit: 200 });
      setRows(listOf<HotelProperty>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load hotel master");
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
      await hotelsApi.create({
        name: name.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        stars: stars ? Number(stars) : undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOk("Hotel added to master");
      setName("");
      setCity("");
      setCountry("");
      setStars("");
      setPhone("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function toggleActive(h: HotelProperty) {
    try {
      await hotelsApi.update(h.id, { isActive: !h.isActive });
      setOk(h.isActive ? "Hotel deactivated" : "Hotel activated");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Building2}
        title="Hotel master"
        subtitle={`Staff-maintained property catalog for booking pickers. Room types: ${ROOM_TYPES.join(", ")}.`}
        breadcrumb={[{ label: "Hotels", to: "/hotels" }, { label: "Hotel master" }]}
      />
      <HotelModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form
            onSubmit={(e) => void create(e)}
            className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            <div className="sm:col-span-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Add property</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="cat-name">
                Name *
              </label>
              <input id="cat-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls} htmlFor="cat-city">
                City
              </label>
              <input id="cat-city" className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cat-country">
                Country
              </label>
              <input id="cat-country" className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cat-stars">
                Stars
              </label>
              <input
                id="cat-stars"
                className={inputCls}
                type="number"
                min="1"
                max="5"
                value={stars}
                onChange={(e) => setStars(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="cat-phone">
                Phone
              </label>
              <input id="cat-phone" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="cat-notes">
                Notes
              </label>
              <input id="cat-notes" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              >
                Add hotel
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-[11px]"
              placeholder="Search name / city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search hotel master"
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
            <EmptyState title="No hotels in master" hint="Add a property or seed reference data." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">City</th>
                    <th className="px-4 py-2 font-bold">Country</th>
                    <th className="px-4 py-2 font-bold">Stars</th>
                    <th className="px-4 py-2 font-bold">Active</th>
                    <th className="px-4 py-2 font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((h) => (
                    <tr key={h.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{h.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{h.city || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{h.country || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{h.stars ?? "—"}</td>
                      <td className="px-4 py-2.5">{h.isActive === false ? "no" : "yes"}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Can perm="settings:manage">
                          <button
                            type="button"
                            className="text-[10.5px] font-semibold text-amber-700 hover:underline"
                            onClick={() => void toggleActive(h)}
                          >
                            {h.isActive === false ? "Activate" : "Deactivate"}
                          </button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </PageShell>
  );
}
