import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plane } from "lucide-react";
import { cmsApi, type CmsTravelOffer } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { TRAVEL_TYPES, validateTravelInput } from "@/lib/cms";

export default function CmsTravelPage() {
  const [rows, setRows] = useState<CmsTravelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [serviceType, setServiceType] = useState("tour");
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [summary, setSummary] = useState("");
  const [priceBdt, setPriceBdt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listTravel());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load travel offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateTravelInput({ serviceType, title });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const priceFromPoisha = priceBdt ? Math.round(Number(priceBdt) * 100) : undefined;
      await cmsApi.createTravel({
        serviceType,
        title: title.trim(),
        destination: destination || undefined,
        summary,
        priceFromPoisha,
        status: "published",
      });
      setOk("Travel offer saved");
      setTitle("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="cms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Plane size={16} className="text-amber-600" /> Travel content
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Visa, air tickets, tours, Hajj & Umrah, hotels, transport offerings for the website.
          </p>
        </div>
        <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="cms:manage">
          <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Service</label>
              <select className={inputCls} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                {TRAVEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Destination</label>
              <input className={inputCls} value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Price from (BDT)</label>
              <input className={inputCls} value={priceBdt} onChange={(e) => setPriceBdt(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Summary</label>
              <textarea className={inputCls} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
                Publish offer
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <table className="w-full text-[11px] bg-white border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Destination</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-2">{r.serviceType}</td>
                  <td className="p-2 font-semibold">{r.title}</td>
                  <td className="p-2">{r.destination || "—"}</td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
