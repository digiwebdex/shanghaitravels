import { FormEvent, useEffect, useMemo, useState } from "react";
import { applicationsApi, tourPackagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { TourDetail, TourPackageProduct } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  PACKAGE_CATEGORIES,
  PACKAGE_TYPES,
  PACKAGE_TYPE_LABELS,
  SEASONS,
  calcMarginPoisha,
  emptyTourForm,
  fromPoisha,
  toDateInput,
  toPoisha,
  tourPayload,
  validateTourForm,
  type TourForm,
} from "@/lib/tour";

export function TourDetailCard({
  appId,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  appId: string;
  detail?: TourDetail | null;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const [form, setForm] = useState<TourForm>(emptyTourForm);
  const [catalog, setCatalog] = useState<TourPackageProduct[]>([]);

  useEffect(() => {
    setForm({
      packageName: detail?.packageName || "",
      packageCode: detail?.packageCode || "",
      packageType: detail?.packageType || "group",
      category: detail?.category || "international",
      destination: detail?.destination || "",
      season: detail?.season || "all_year",
      startDate: toDateInput(detail?.startDate),
      endDate: toDateInput(detail?.endDate),
      pax: detail?.pax != null ? String(detail.pax) : "2",
      itinerary: detail?.itinerary || "",
      inclusions: detail?.inclusions || "",
      exclusions: detail?.exclusions || "",
      activities: detail?.activities || "",
      hotelsNote: detail?.hotelsNote || "",
      transportNote: detail?.transportNote || "",
      flightsNote: detail?.flightsNote || "",
      visaRequirements: detail?.visaRequirements || "",
      insuranceNote: detail?.insuranceNote || "",
      occupancyNote: detail?.occupancyNote || "",
      childPolicy: detail?.childPolicy || "",
      seasonalPricingNote: detail?.seasonalPricingNote || "",
      costBreakdown: detail?.costBreakdown || "",
      supplierCostBdt: fromPoisha(detail?.supplierCostPoisha),
      sellingPriceBdt: fromPoisha(detail?.sellingPricePoisha),
      confirmationNo: detail?.confirmationNo || "",
      notes: detail?.notes || "",
    });
  }, [detail]);

  useEffect(() => {
    void tourPackagesApi
      .list({ active: "true", limit: 200 })
      .then((r) => setCatalog(listOf<TourPackageProduct>(r)))
      .catch(() => setCatalog([]));
  }, []);

  const margin = useMemo(() => {
    const s = toPoisha(form.supplierCostBdt);
    const sell = toPoisha(form.sellingPriceBdt);
    const m = calcMarginPoisha(s, sell);
    return m == null ? null : m / 100;
  }, [form.supplierCostBdt, form.sellingPriceBdt]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateTourForm(form);
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await applicationsApi.putDetail(appId, "tour", tourPayload(form));
      setOk("Tour booking details saved");
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  const set = (k: keyof TourForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const disabled = !can("application:update");

  function pickProduct(id: string) {
    const p = catalog.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      packageName: p.name,
      packageCode: p.code,
      packageType: p.packageType || f.packageType,
      category: p.category || f.category,
      destination: p.destination || f.destination,
      season: p.season || f.season,
      itinerary: p.itinerary || f.itinerary,
      inclusions: p.inclusions || f.inclusions,
      exclusions: p.exclusions || f.exclusions,
      activities: p.activities || f.activities,
      hotelsNote: p.hotelsNote || f.hotelsNote,
      transportNote: p.transportNote || f.transportNote,
      flightsNote: p.flightsNote || f.flightsNote,
      visaRequirements: p.visaRequirements || f.visaRequirements,
      insuranceNote: p.insuranceNote || f.insuranceNote,
      occupancyNote: p.occupancyNote || f.occupancyNote,
      childPolicy: p.childPolicy || f.childPolicy,
      seasonalPricingNote: p.seasonalPricingNote || f.seasonalPricingNote,
      costBreakdown: p.costBreakdown || f.costBreakdown,
      supplierCostBdt: fromPoisha(p.supplierCostPoisha) || f.supplierCostBdt,
      sellingPriceBdt: fromPoisha(p.sellingPricePoisha) || f.sellingPriceBdt,
    }));
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-1">Tour booking details</h2>
      <p className="text-[10px] text-slate-400 mb-3">
        Curated package booking from supplier products — not an OTA marketplace.
      </p>
      <form onSubmit={(e) => void save(e)} className="space-y-2">
        {catalog.length > 0 && (
          <div>
            <label className={labelCls} htmlFor="tour-pick">
              Fill from package master
            </label>
            <select
              id="tour-pick"
              className={inputCls}
              defaultValue=""
              disabled={disabled}
              onChange={(e) => {
                if (e.target.value) pickProduct(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">— select product —</option>
              {catalog.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={labelCls} htmlFor="tour-name">
              Package name
            </label>
            <input id="tour-name" className={inputCls} value={form.packageName} onChange={(e) => set("packageName", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-code">
              Package code
            </label>
            <input id="tour-code" className={inputCls} value={form.packageCode} onChange={(e) => set("packageCode", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-type">
              Package type
            </label>
            <select id="tour-type" className={inputCls} value={form.packageType} onChange={(e) => set("packageType", e.target.value)} disabled={disabled}>
              {PACKAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PACKAGE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-cat">
              Category
            </label>
            <select id="tour-cat" className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)} disabled={disabled}>
              {PACKAGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-dest">
              Destination
            </label>
            <input id="tour-dest" className={inputCls} value={form.destination} onChange={(e) => set("destination", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-season">
              Season
            </label>
            <select id="tour-season" className={inputCls} value={form.season} onChange={(e) => set("season", e.target.value)} disabled={disabled}>
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-start">
              Start
            </label>
            <input id="tour-start" type="date" className={inputCls} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-end">
              End
            </label>
            <input id="tour-end" type="date" className={inputCls} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-pax">
              Pax
            </label>
            <input id="tour-pax" type="number" min="1" className={inputCls} value={form.pax} onChange={(e) => set("pax", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-conf">
              Confirmation / voucher no
            </label>
            <input id="tour-conf" className={inputCls} value={form.confirmationNo} onChange={(e) => set("confirmationNo", e.target.value)} disabled={disabled} />
          </div>
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase pt-2">Builder</p>
        <div className="grid grid-cols-1 gap-2">
          {(
            [
              ["itinerary", "Day-by-day itinerary", 4],
              ["inclusions", "Included services", 2],
              ["exclusions", "Excluded services", 2],
              ["activities", "Activities", 2],
              ["hotelsNote", "Hotels (supplier refs)", 2],
              ["transportNote", "Transport", 2],
              ["flightsNote", "Flights (manual refs)", 2],
              ["visaRequirements", "Visa requirements", 2],
              ["insuranceNote", "Insurance", 2],
            ] as const
          ).map(([key, label, rows]) => (
            <div key={key}>
              <label className={labelCls} htmlFor={`tour-${key}`}>
                {label}
              </label>
              <textarea
                id={`tour-${key}`}
                className={inputCls}
                rows={rows}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase pt-2">Pricing (BDT)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              ["occupancyNote", "Occupancy rules"],
              ["childPolicy", "Child policies"],
              ["seasonalPricingNote", "Seasonal pricing"],
              ["costBreakdown", "Cost breakdown"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="sm:col-span-2">
              <label className={labelCls} htmlFor={`tour-${key}`}>
                {label}
              </label>
              <textarea
                id={`tour-${key}`}
                className={inputCls}
                rows={2}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                disabled={disabled}
              />
            </div>
          ))}
          <div>
            <label className={labelCls} htmlFor="tour-cost">
              Supplier cost (৳)
            </label>
            <input
              id="tour-cost"
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.supplierCostBdt}
              onChange={(e) => set("supplierCostBdt", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tour-sell">
              Selling price (৳)
            </label>
            <input
              id="tour-sell"
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={form.sellingPriceBdt}
              onChange={(e) => set("sellingPriceBdt", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="sm:col-span-2 text-[11px] text-slate-600">
            Margin: {margin == null ? "—" : `৳${margin.toFixed(2)}`}
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="tour-notes">
              Notes
            </label>
            <textarea id="tour-notes" className={inputCls} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} disabled={disabled} />
          </div>
        </div>

        <Can perm="application:update">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            Save tour details
          </button>
        </Can>
      </form>
    </section>
  );
}
