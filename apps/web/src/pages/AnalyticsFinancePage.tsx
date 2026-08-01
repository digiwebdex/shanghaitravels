import { useCallback, useEffect, useState } from "react";
import { Landmark, RefreshCw } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { formatBdt } from "@/lib/crm";
import { validateAnalyticsFilters } from "@/lib/analytics";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
} from "@/components/enterprise/Page";

export default function AnalyticsFinancePage() {
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
      setData(await analyticsApi.finance(applied));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load finance analytics");
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
        icon={Landmark}
        title="Finance-linked analytics"
        subtitle="Revenue by service, AR/AP outstanding, collections, profit contribution, branch financials."
        breadcrumb={[{ label: "Analytics" }, { label: "Finance" }]}
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
          <KpiCard label="AR outstanding" value={formatBdt(data.outstandingReceivables?.balancePoisha)} tone="danger" />
          <KpiCard label="AP outstanding" value={formatBdt(data.outstandingPayables?.balancePoisha)} tone="warning" />
          <KpiCard label="Collections" value={formatBdt(data.collections?.amountPoisha)} tone="success" />
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
            <SurfaceHeader title="Revenue by service" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.revenueByService || []).map((r: any) => (
                <li key={r.serviceType} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>
                    {r.serviceType} · {r.bookings}
                  </span>
                  <span className="font-semibold">{formatBdt(r.revenuePoisha)}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <SurfaceHeader title="Outstanding & collections" />
            <p className="p-4 text-[12px] sm:p-5">
              AR {formatBdt(data.outstandingReceivables?.balancePoisha)} · AP{" "}
              {formatBdt(data.outstandingPayables?.balancePoisha)} · Collections{" "}
              {formatBdt(data.collections?.amountPoisha)}
            </p>
          </Surface>
          <Surface>
            <SurfaceHeader title="Profit contribution by service" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.profitContributionByService || []).map((r: any) => (
                <li key={r.serviceType} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>{r.serviceType}</span>
                  <span className="font-semibold">{formatBdt(r.contributionPoisha)}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <SurfaceHeader title="Branch financial performance" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.branchFinancialPerformance || []).map((r: any) => (
                <li key={r.branchId} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>{r.branchName}</span>
                  <span className="font-semibold">{formatBdt(r.revenuePoisha)}</span>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      ) : null}
    </PageShell>
  );
}
