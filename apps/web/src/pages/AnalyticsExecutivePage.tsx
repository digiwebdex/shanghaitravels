import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { formatBdt } from "@/lib/crm";
import { pct, validateAnalyticsFilters } from "@/lib/analytics";

export default function AnalyticsExecutivePage() {
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
    setError("");
    try {
      await analyticsApi.bootstrap().catch(() => null);
      setData(await analyticsApi.executive(applied));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load executive analytics");
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const conv = data?.bookingConversion;
  const forecast = data?.revenueForecast;

  return (
    <div>
      <DemoBadge moduleKey="analytics" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard size={16} className="text-amber-600" /> Executive analytics
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pipeline, forecast, monthly trend, branch/team performance, booking conversion, lead sources.
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
              <h2 className="text-[12px] font-bold mb-2">Sales pipeline</h2>
              <ul className="text-[11px] space-y-1">
                {(data.pipeline?.rows || []).map((r: any) => (
                  <li key={r.stage} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>
                      {r.stage} · {r.count}
                    </span>
                    <span className="font-semibold">{formatBdt(r.expectedRevenuePoisha)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Revenue forecast</h2>
              <p className="text-[11px]">
                Open {forecast?.openCount ?? 0} · Weighted {formatBdt(forecast?.weightedRevenuePoisha)} · Unweighted{" "}
                {formatBdt(forecast?.unweightedRevenuePoisha)}
              </p>
              <h2 className="text-[12px] font-bold mb-2 mt-4">Booking conversion</h2>
              <p className="text-[11px]">
                Lead {pct(conv?.leadConversionRate)} · Booking completion {pct(conv?.bookingCompletionRate)}
              </p>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Monthly sales trend</h2>
              <ul className="text-[11px] space-y-1">
                {(data.monthlySalesTrend?.bookings || []).map((r: any) => (
                  <li key={r.month} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.month}</span>
                    <span className="font-semibold">{r.count} bookings</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] mt-2">Invoiced (period) {formatBdt(data.monthlySalesTrend?.invoicedPoisha)}</p>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Lead source effectiveness</h2>
              <ul className="text-[11px] space-y-1">
                {(data.leadSourceEffectiveness || []).map((r: any) => (
                  <li key={r.source} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.source}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Branch performance</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto max-h-48">{JSON.stringify(data.branchPerformance, null, 2)}</pre>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Team performance</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto max-h-48">{JSON.stringify(data.teamPerformance, null, 2)}</pre>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
