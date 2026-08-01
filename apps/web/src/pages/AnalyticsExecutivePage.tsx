import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { formatBdt } from "@/lib/crm";
import { pct, validateAnalyticsFilters } from "@/lib/analytics";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
} from "@/components/enterprise/Page";

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
    <PageShell wide>
      <PageHeader
        icon={LayoutDashboard}
        title="Executive analytics"
        subtitle="Pipeline, forecast, monthly trend, branch/team performance, booking conversion, lead sources."
        breadcrumb={[{ label: "Analytics" }, { label: "Executive" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <AnalyticsModuleNav />
      <AnalyticsFiltersBar value={filters} onChange={setFilters} onApply={() => setApplied({ ...filters })} />
      {data && (
        <StatStrip>
          <KpiCard label="Open pipeline" value={forecast?.openCount ?? 0} tone="accent" />
          <KpiCard label="Weighted forecast" value={formatBdt(forecast?.weightedRevenuePoisha)} />
          <KpiCard label="Lead conversion" value={pct(conv?.leadConversionRate)} tone="success" />
          <KpiCard label="Booking completion" value={pct(conv?.bookingCompletionRate)} />
        </StatStrip>
      )}
      <ErrorBanner message={error} />
      {loading ? (
        <Surface padded>
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        </Surface>
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Surface>
            <SurfaceHeader title="Sales pipeline" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.pipeline?.rows || []).map((r: any) => (
                <li key={r.stage} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>
                    {r.stage} · {r.count}
                  </span>
                  <span className="font-semibold">{formatBdt(r.expectedRevenuePoisha)}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <SurfaceHeader title="Revenue & conversion" />
            <div className="space-y-3 p-4 text-[12px] sm:p-5">
              <p>
                Open {forecast?.openCount ?? 0} · Weighted {formatBdt(forecast?.weightedRevenuePoisha)} · Unweighted{" "}
                {formatBdt(forecast?.unweightedRevenuePoisha)}
              </p>
              <p>
                Lead {pct(conv?.leadConversionRate)} · Booking completion {pct(conv?.bookingCompletionRate)}
              </p>
            </div>
          </Surface>
          <Surface>
            <SurfaceHeader title="Monthly sales trend" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.monthlySalesTrend?.bookings || []).map((r: any) => (
                <li key={r.month} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>{r.month}</span>
                  <span className="font-semibold">{r.count} bookings</span>
                </li>
              ))}
            </ul>
            <p className="px-4 pb-4 text-[12px] sm:px-5">
              Invoiced (period) {formatBdt(data.monthlySalesTrend?.invoicedPoisha)}
            </p>
          </Surface>
          <Surface>
            <SurfaceHeader title="Lead source effectiveness" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.leadSourceEffectiveness || []).map((r: any) => (
                <li key={r.source} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>{r.source}</span>
                  <span className="font-semibold">{r.count}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <SurfaceHeader title="Branch performance" />
            <pre className="max-h-48 overflow-auto p-4 text-[10px] sm:p-5">{JSON.stringify(data.branchPerformance, null, 2)}</pre>
          </Surface>
          <Surface>
            <SurfaceHeader title="Team performance" />
            <pre className="max-h-48 overflow-auto p-4 text-[10px] sm:p-5">{JSON.stringify(data.teamPerformance, null, 2)}</pre>
          </Surface>
        </div>
      ) : null}
    </PageShell>
  );
}
