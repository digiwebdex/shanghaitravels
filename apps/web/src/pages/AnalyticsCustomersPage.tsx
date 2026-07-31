import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { formatBdt } from "@/lib/crm";
import { pct, validateAnalyticsFilters } from "@/lib/analytics";

export default function AnalyticsCustomersPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [applied, setApplied] = useState<AnalyticsFilters>({});
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const bad = validateAnalyticsFilters(applied);
    if (bad) {
      setError(bad);
      return;
    }
    setLoading(true);
    try {
      setData(await analyticsApi.customer(applied));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load customer analytics");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <DemoBadge moduleKey="analytics" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Users size={16} className="text-amber-600" /> Customer analytics
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            CLV, booking frequency, repeat rate, segmentation, corporate vs B2C, geography.
          </p>
        </div>
        <AnalyticsModuleNav />
        <AnalyticsFiltersBar value={filters} onChange={setFilters} onApply={() => setApplied({ ...filters })} />
        <ErrorBanner message={error} />
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Lifetime value</h2>
              <p className="text-[11px]">
                Avg CLV {formatBdt(data.lifetimeValue?.averageClvPoisha)} · sample {data.lifetimeValue?.sampleSize}
              </p>
              <h2 className="text-[12px] font-bold mb-2 mt-3">Booking frequency</h2>
              <p className="text-[11px]">{data.bookingFrequency?.averageBookingsPerCustomer} bookings / customer</p>
              <h2 className="text-[12px] font-bold mb-2 mt-3">Repeat rate</h2>
              <p className="text-[11px]">{pct(data.repeatCustomerRate?.ratePct)}</p>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Segmentation</h2>
              <ul className="text-[11px] space-y-1">
                {(data.segmentation || []).map((r: any) => (
                  <li key={r.segment} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.segment}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Corporate vs B2C</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto">{JSON.stringify(data.corporateVsB2c, null, 2)}</pre>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Geographic distribution</h2>
              <ul className="text-[11px] space-y-1 max-h-56 overflow-auto">
                {(data.geographicDistribution || []).map((r: any) => (
                  <li key={r.nationality} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.nationality}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
