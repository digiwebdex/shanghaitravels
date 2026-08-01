import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { hajjPackagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { HajjUmrahPackageProduct } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { HajjModuleNav } from "@/components/hajj/HajjModuleNav";
import {
  HAJJ_KINDS,
  PACKAGE_CATEGORIES,
  ROOM_TYPES,
  calcMarginPoisha,
  fromPoisha,
  toPoisha,
} from "@/lib/hajj";

export default function HajjPackagesPage() {
  const [rows, setRows] = useState<HajjUmrahPackageProduct[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("hajj");
  const [category, setCategory] = useState("standard");
  const [season, setSeason] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [durationDays, setDurationDays] = useState("");
  const [departureCity, setDepartureCity] = useState("Dhaka");
  const [hotelMakkah, setHotelMakkah] = useState("");
  const [hotelMadinah, setHotelMadinah] = useState("");
  const [roomType, setRoomType] = useState("quad");
  const [occupancyNote, setOccupancyNote] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [capacity, setCapacity] = useState("");
  const [supplierCostBdt, setSupplierCostBdt] = useState("");
  const [sellingPriceBdt, setSellingPriceBdt] = useState("");
  const [notes, setNotes] = useState("");

  const margin = useMemo(() => {
    const m = calcMarginPoisha(toPoisha(supplierCostBdt), toPoisha(sellingPriceBdt));
    return m == null ? null : m / 100;
  }, [supplierCostBdt, sellingPriceBdt]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf<HajjUmrahPackageProduct>(await hajjPackagesApi.list({ q: q || undefined, limit: 200 })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Code and name are required");
      return;
    }
    setError("");
    setOk("");
    try {
      await hajjPackagesApi.create({
        code: code.trim(),
        name: name.trim(),
        kind,
        category,
        season: season.trim() || undefined,
        year: year.trim() || undefined,
        durationDays: durationDays ? Number(durationDays) : undefined,
        departureCity: departureCity.trim() || undefined,
        hotelMakkah: hotelMakkah.trim() || undefined,
        hotelMadinah: hotelMadinah.trim() || undefined,
        roomType,
        occupancyNote: occupancyNote.trim() || undefined,
        inclusions: inclusions.trim() || undefined,
        exclusions: exclusions.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        supplierCostPoisha: toPoisha(supplierCostBdt),
        sellingPricePoisha: toPoisha(sellingPriceBdt),
        notes: notes.trim() || undefined,
      });
      setOk("Package template created");
      setCode("");
      setName("");
      setInclusions("");
      setExclusions("");
      setSupplierCostBdt("");
      setSellingPriceBdt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Package}
        title="Hajj / Umrah packages"
        subtitle="Package templates with pricing, occupancy, inclusions — operator products, not an OTA catalog."
        breadcrumb={[{ label: "Hajj & Umrah", to: "/hajj" }, { label: "Hajj / Umrah packages" }]}
      />
      <HajjModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Add package template</p>
            </div>
            <div>
              <label className={labelCls}>Code *</label>
              <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Kind</label>
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                {HAJJ_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {PACKAGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Season</label>
              <input className={inputCls} value={season} onChange={(e) => setSeason(e.target.value)} placeholder="Hajj 2026" />
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <input className={inputCls} value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Duration days</label>
              <input type="number" min="1" className={inputCls} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Departure city</label>
              <input className={inputCls} value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Room type</label>
              <select className={inputCls} value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                {ROOM_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Capacity</label>
              <input type="number" min="1" className={inputCls} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hotel Makkah</label>
              <input className={inputCls} value={hotelMakkah} onChange={(e) => setHotelMakkah(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hotel Madinah</label>
              <input className={inputCls} value={hotelMadinah} onChange={(e) => setHotelMadinah(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Occupancy</label>
              <textarea className={inputCls} rows={2} value={occupancyNote} onChange={(e) => setOccupancyNote(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Inclusions</label>
              <textarea className={inputCls} rows={2} value={inclusions} onChange={(e) => setInclusions(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Exclusions</label>
              <textarea className={inputCls} rows={2} value={exclusions} onChange={(e) => setExclusions(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Supplier cost (৳)</label>
              <input type="number" min="0" step="0.01" className={inputCls} value={supplierCostBdt} onChange={(e) => setSupplierCostBdt(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Selling price (৳)</label>
              <input type="number" min="0" step="0.01" className={inputCls} value={sellingPriceBdt} onChange={(e) => setSellingPriceBdt(e.target.value)} />
            </div>
            <div className="flex items-end text-[11px] text-slate-600 pb-2">
              Margin: {margin == null ? "—" : `৳${margin.toFixed(2)}`}
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Notes</label>
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                Save package
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-[11px]"
              placeholder="Search packages…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search packages"
            />
            <button type="button" onClick={() => void load()} className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold">
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No packages" hint="Add a Hajj or Umrah package template." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Code</th>
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Kind</th>
                    <th className="px-4 py-2 font-bold">Category</th>
                    <th className="px-4 py-2 font-bold">Season</th>
                    <th className="px-4 py-2 font-bold">Sell ৳</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{p.code}</td>
                      <td className="px-4 py-2.5 text-slate-700">{p.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.kind}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.category}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.season || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {p.sellingPricePoisha != null ? fromPoisha(p.sellingPricePoisha) : "—"}
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
