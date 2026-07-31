import { useCallback, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { formatBdt } from "@/lib/crm";
import { pct, validateAnalyticsFilters } from "@/lib/analytics";

export default function AnalyticsSalesPage() {
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
      setData(await analyticsApi.sales(applied));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load sales analytics");
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
            <TrendingUp size={16} className="text-amber-600" /> Sales analytics
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Win/loss, stage conversion, cycle duration, forecast accuracy, productivity, quote acceptance.
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
              <h2 className="text-[12px] font-bold mb-2">Win / loss</h2>
              <p className="text-[11px]">
                Won {data.winLoss?.won} · Lost {data.winLoss?.lost} · Open {data.winLoss?.open} · Win rate{" "}
                {pct(data.winLoss?.winRate)}
              </p>
              <ul className="text-[11px] mt-2 space-y-1">
                {(data.winLoss?.lostReasons || []).map((r: any) => (
                  <li key={r.reason} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.reason}</span>
                    <span>{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Stage conversion</h2>
              <ul className="text-[11px] space-y-1">
                {(data.stageConversion || []).map((r: any) => (
                  <li key={r.stage} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.stage}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Cycle & forecast</h2>
              <p className="text-[11px]">
                Avg cycle {data.salesCycleDuration?.avgDays ?? 0} days · Forecast accuracy{" "}
                {pct(data.forecastAccuracy?.accuracyPct)} · Actual {formatBdt(data.forecastAccuracy?.actualPoisha)}
              </p>
              <h2 className="text-[12px] font-bold mb-2 mt-3">Quotation acceptance</h2>
              <p className="text-[11px]">{pct(data.quotationAcceptance?.acceptanceRatePct)}</p>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Executive productivity</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto max-h-56">{JSON.stringify(data.executiveProductivity, null, 2)}</pre>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
