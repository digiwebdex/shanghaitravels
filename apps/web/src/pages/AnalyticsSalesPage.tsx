import { useCallback, useEffect, useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
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
    <PageShell wide>
      <PageHeader
        icon={TrendingUp}
        title="Sales analytics"
        subtitle="Win/loss, stage conversion, cycle duration, forecast accuracy, productivity, quote acceptance."
        breadcrumb={[{ label: "Analytics" }, { label: "Sales" }]}
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
          <KpiCard label="Won" value={data.winLoss?.won ?? 0} tone="success" />
          <KpiCard label="Lost" value={data.winLoss?.lost ?? 0} tone="danger" />
          <KpiCard label="Open" value={data.winLoss?.open ?? 0} tone="accent" />
          <KpiCard label="Win rate" value={pct(data.winLoss?.winRate)} />
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
            <SurfaceHeader title="Win / loss" />
            <div className="space-y-2 p-4 text-[12px] sm:p-5">
              <p>
                Won {data.winLoss?.won} · Lost {data.winLoss?.lost} · Open {data.winLoss?.open} · Win rate{" "}
                {pct(data.winLoss?.winRate)}
              </p>
              <ul className="space-y-1">
                {(data.winLoss?.lostReasons || []).map((r: any) => (
                  <li key={r.reason} className="flex justify-between border-b border-[var(--border)] pb-1">
                    <span>{r.reason}</span>
                    <span>{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Surface>
          <Surface>
            <SurfaceHeader title="Stage conversion" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.stageConversion || []).map((r: any) => (
                <li key={r.stage} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>{r.stage}</span>
                  <span className="font-semibold">{r.count}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <SurfaceHeader title="Cycle & forecast" />
            <div className="space-y-2 p-4 text-[12px] sm:p-5">
              <p>
                Avg cycle {data.salesCycleDuration?.avgDays ?? 0} days · Forecast accuracy{" "}
                {pct(data.forecastAccuracy?.accuracyPct)} · Actual {formatBdt(data.forecastAccuracy?.actualPoisha)}
              </p>
              <p>Quotation acceptance {pct(data.quotationAcceptance?.acceptanceRatePct)}</p>
            </div>
          </Surface>
          <Surface>
            <SurfaceHeader title="Executive productivity" />
            <pre className="max-h-56 overflow-auto p-4 text-[10px] sm:p-5">
              {JSON.stringify(data.executiveProductivity, null, 2)}
            </pre>
          </Surface>
        </div>
      ) : null}
    </PageShell>
  );
}
