import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { tourPackagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { TourPackageProduct } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { TourModuleNav } from "@/components/tours/TourModuleNav";
import {
  PACKAGE_CATEGORIES,
  PACKAGE_TYPES,
  PACKAGE_TYPE_LABELS,
  SEASONS,
  calcMarginPoisha,
  fromPoisha,
  parseItineraryDays,
  serializeItineraryDays,
  toPoisha,
} from "@/lib/tour";

type DayRow = { day: number; title: string; body: string };

const emptyDays = (): DayRow[] => [{ day: 1, title: "", body: "" }];

export default function TourPackagesPage() {
  const [rows, setRows] = useState<TourPackageProduct[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [packageType, setPackageType] = useState("group");
  const [category, setCategory] = useState("international");
  const [destination, setDestination] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [season, setSeason] = useState("all_year");
  const [durationDays, setDurationDays] = useState("");
  const [durationNights, setDurationNights] = useState("");
  const [days, setDays] = useState<DayRow[]>(emptyDays);
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [activities, setActivities] = useState("");
  const [hotelsNote, setHotelsNote] = useState("");
  const [transportNote, setTransportNote] = useState("");
  const [flightsNote, setFlightsNote] = useState("");
  const [visaRequirements, setVisaRequirements] = useState("");
  const [insuranceNote, setInsuranceNote] = useState("");
  const [occupancyNote, setOccupancyNote] = useState("");
  const [childPolicy, setChildPolicy] = useState("");
  const [seasonalPricingNote, setSeasonalPricingNote] = useState("");
  const [costBreakdown, setCostBreakdown] = useState("");
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
      const r = await tourPackagesApi.list({ q: q || undefined, limit: 200 });
      setRows(listOf<TourPackageProduct>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setCode("");
    setName("");
    setPackageType("group");
    setCategory("international");
    setDestination("");
    setCountry("");
    setCity("");
    setSeason("all_year");
    setDurationDays("");
    setDurationNights("");
    setDays(emptyDays());
    setInclusions("");
    setExclusions("");
    setActivities("");
    setHotelsNote("");
    setTransportNote("");
    setFlightsNote("");
    setVisaRequirements("");
    setInsuranceNote("");
    setOccupancyNote("");
    setChildPolicy("");
    setSeasonalPricingNote("");
    setCostBreakdown("");
    setSupplierCostBdt("");
    setSellingPriceBdt("");
    setNotes("");
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Code and name are required");
      return;
    }
    if (supplierCostBdt.trim() && toPoisha(supplierCostBdt) == null) {
      setError("Invalid supplier cost");
      return;
    }
    if (sellingPriceBdt.trim() && toPoisha(sellingPriceBdt) == null) {
      setError("Invalid selling price");
      return;
    }
    setError("");
    setOk("");
    try {
      await tourPackagesApi.create({
        code: code.trim(),
        name: name.trim(),
        packageType,
        category,
        destination: destination.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        season,
        durationDays: durationDays ? Number(durationDays) : undefined,
        durationNights: durationNights ? Number(durationNights) : undefined,
        itinerary: serializeItineraryDays(days) || undefined,
        inclusions: inclusions.trim() || undefined,
        exclusions: exclusions.trim() || undefined,
        activities: activities.trim() || undefined,
        hotelsNote: hotelsNote.trim() || undefined,
        transportNote: transportNote.trim() || undefined,
        flightsNote: flightsNote.trim() || undefined,
        visaRequirements: visaRequirements.trim() || undefined,
        insuranceNote: insuranceNote.trim() || undefined,
        occupancyNote: occupancyNote.trim() || undefined,
        childPolicy: childPolicy.trim() || undefined,
        seasonalPricingNote: seasonalPricingNote.trim() || undefined,
        costBreakdown: costBreakdown.trim() || undefined,
        supplierCostPoisha: toPoisha(supplierCostBdt),
        sellingPricePoisha: toPoisha(sellingPriceBdt),
        notes: notes.trim() || undefined,
      });
      setOk("Package product created");
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function toggleActive(p: TourPackageProduct) {
    try {
      await tourPackagesApi.update(p.id, { isActive: !p.isActive });
      setOk(p.isActive ? "Package deactivated" : "Package activated");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  function loadIntoForm(p: TourPackageProduct) {
    setCode(p.code);
    setName(p.name);
    setPackageType(p.packageType || "group");
    setCategory(p.category || "international");
    setDestination(p.destination || "");
    setCountry(p.country || "");
    setCity(p.city || "");
    setSeason(p.season || "all_year");
    setDurationDays(p.durationDays != null ? String(p.durationDays) : "");
    setDurationNights(p.durationNights != null ? String(p.durationNights) : "");
    setDays(parseItineraryDays(p.itinerary || ""));
    setInclusions(p.inclusions || "");
    setExclusions(p.exclusions || "");
    setActivities(p.activities || "");
    setHotelsNote(p.hotelsNote || "");
    setTransportNote(p.transportNote || "");
    setFlightsNote(p.flightsNote || "");
    setVisaRequirements(p.visaRequirements || "");
    setInsuranceNote(p.insuranceNote || "");
    setOccupancyNote(p.occupancyNote || "");
    setChildPolicy(p.childPolicy || "");
    setSeasonalPricingNote(p.seasonalPricingNote || "");
    setCostBreakdown(p.costBreakdown || "");
    setSupplierCostBdt(fromPoisha(p.supplierCostPoisha));
    setSellingPriceBdt(fromPoisha(p.sellingPricePoisha));
    setNotes(p.notes || "");
    setOk(`Loaded ${p.code} into builder (edit fields, then create as a new product or note changes separately)`);
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Package}
        title="Package master / builder"
        subtitle="Curated products: categories, destinations, day-by-day itinerary, inclusions, pricing."
        breadcrumb={[{ label: "Tours", to: "/tours" }, { label: "Package master / builder" }]}
      />
      <TourModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form
            onSubmit={(e) => void create(e)}
            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase">Add package product</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="pkg-code">
                  Code *
                </label>
                <input id="pkg-code" className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="pkg-name">
                  Name *
                </label>
                <input id="pkg-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-type">
                  Package type
                </label>
                <select id="pkg-type" className={inputCls} value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                  {PACKAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PACKAGE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-cat">
                  Category
                </label>
                <select id="pkg-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {PACKAGE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-season">
                  Season
                </label>
                <select id="pkg-season" className={inputCls} value={season} onChange={(e) => setSeason(e.target.value)}>
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-dest">
                  Destination
                </label>
                <input id="pkg-dest" className={inputCls} value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-country">
                  Country
                </label>
                <input id="pkg-country" className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-city">
                  City
                </label>
                <input id="pkg-city" className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-days">
                  Duration days
                </label>
                <input
                  id="pkg-days"
                  type="number"
                  min="1"
                  className={inputCls}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-nights">
                  Duration nights
                </label>
                <input
                  id="pkg-nights"
                  type="number"
                  min="0"
                  className={inputCls}
                  value={durationNights}
                  onChange={(e) => setDurationNights(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Day-by-day itinerary</p>
                <button
                  type="button"
                  className="text-[10px] font-semibold text-amber-700"
                  onClick={() => setDays((d) => [...d, { day: d.length + 1, title: "", body: "" }])}
                >
                  + Add day
                </button>
              </div>
              <div className="space-y-2">
                {days.map((d, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 border border-slate-100 rounded-lg p-2">
                    <div>
                      <label className={labelCls}>Day</label>
                      <input
                        className={inputCls}
                        type="number"
                        min="1"
                        value={d.day}
                        onChange={(e) =>
                          setDays((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) || 1 } : x)),
                          )
                        }
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className={labelCls}>Title</label>
                      <input
                        className={inputCls}
                        value={d.title}
                        onChange={(e) =>
                          setDays((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                        }
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className={labelCls}>Details</label>
                      <textarea
                        className={inputCls}
                        rows={2}
                        value={d.body}
                        onChange={(e) =>
                          setDays((prev) => prev.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  ["inclusions", inclusions, setInclusions, "Included services"],
                  ["exclusions", exclusions, setExclusions, "Excluded services"],
                  ["activities", activities, setActivities, "Activities"],
                  ["hotels", hotelsNote, setHotelsNote, "Hotels (supplier refs)"],
                  ["transport", transportNote, setTransportNote, "Transport"],
                  ["flights", flightsNote, setFlightsNote, "Flights (manual refs)"],
                  ["visa", visaRequirements, setVisaRequirements, "Visa requirements"],
                  ["insurance", insuranceNote, setInsuranceNote, "Insurance"],
                  ["occupancy", occupancyNote, setOccupancyNote, "Occupancy rules"],
                  ["child", childPolicy, setChildPolicy, "Child policies"],
                  ["seasonal", seasonalPricingNote, setSeasonalPricingNote, "Seasonal pricing"],
                  ["cost", costBreakdown, setCostBreakdown, "Cost breakdown"],
                ] as const
              ).map(([key, val, setVal, label]) => (
                <div key={key}>
                  <label className={labelCls} htmlFor={`pkg-${key}`}>
                    {label}
                  </label>
                  <textarea
                    id={`pkg-${key}`}
                    className={inputCls}
                    rows={2}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                  />
                </div>
              ))}
              <div>
                <label className={labelCls} htmlFor="pkg-sup">
                  Supplier cost (৳)
                </label>
                <input
                  id="pkg-sup"
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={supplierCostBdt}
                  onChange={(e) => setSupplierCostBdt(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="pkg-sell">
                  Selling price (৳)
                </label>
                <input
                  id="pkg-sell"
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputCls}
                  value={sellingPriceBdt}
                  onChange={(e) => setSellingPriceBdt(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 text-[11px] text-slate-600">
                Margin: {margin == null ? "—" : `৳${margin.toFixed(2)}`}
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="pkg-notes">
                  Notes
                </label>
                <textarea id="pkg-notes" className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
            >
              Save package product
            </button>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-[11px]"
              placeholder="Search code / name / destination…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search packages"
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
            <EmptyState title="No packages" hint="Add a curated package product above." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Code</th>
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Type</th>
                    <th className="px-4 py-2 font-bold">Category</th>
                    <th className="px-4 py-2 font-bold">Destination</th>
                    <th className="px-4 py-2 font-bold">Sell ৳</th>
                    <th className="px-4 py-2 font-bold">Active</th>
                    <th className="px-4 py-2 font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{p.code}</td>
                      <td className="px-4 py-2.5 text-slate-700">{p.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {PACKAGE_TYPE_LABELS[p.packageType as keyof typeof PACKAGE_TYPE_LABELS] || p.packageType}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{p.category}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.destination || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {p.sellingPricePoisha != null ? fromPoisha(p.sellingPricePoisha) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{p.isActive === false ? "no" : "yes"}</td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        <button
                          type="button"
                          className="text-[10px] font-semibold text-amber-700"
                          onClick={() => loadIntoForm(p)}
                        >
                          Load
                        </button>
                        <Can perm="settings:manage">
                          <button
                            type="button"
                            className="text-[10px] font-semibold text-slate-600"
                            onClick={() => void toggleActive(p)}
                          >
                            {p.isActive === false ? "Activate" : "Deactivate"}
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
