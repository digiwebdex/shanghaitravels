import { useCallback, useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { formatBdt } from "@/lib/crm";
import { validateAnalyticsFilters } from "@/lib/analytics";

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
    <div>
      <DemoBadge moduleKey="analytics" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Landmark size={16} className="text-amber-600" /> Finance-linked analytics
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Revenue by service, AR/AP outstanding, collections, profit contribution, branch financials.
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
              <h2 className="text-[12px] font-bold mb-2">Revenue by service</h2>
              <ul className="text-[11px] space-y-1">
                {(data.revenueByService || []).map((r: any) => (
                  <li key={r.serviceType} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>
                      {r.serviceType} · {r.bookings}
                    </span>
                    <span className="font-semibold">{formatBdt(r.revenuePoisha)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Outstanding & collections</h2>
              <p className="text-[11px]">
                AR {formatBdt(data.outstandingReceivables?.balancePoisha)} · AP{" "}
                {formatBdt(data.outstandingPayables?.balancePoisha)} · Collections{" "}
                {formatBdt(data.collections?.amountPoisha)}
              </p>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Profit contribution by service</h2>
              <ul className="text-[11px] space-y-1">
                {(data.profitContributionByService || []).map((r: any) => (
                  <li key={r.serviceType} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.serviceType}</span>
                    <span className="font-semibold">{formatBdt(r.contributionPoisha)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Branch financial performance</h2>
              <ul className="text-[11px] space-y-1">
                {(data.branchFinancialPerformance || []).map((r: any) => (
                  <li key={r.branchId} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.branchName}</span>
                    <span className="font-semibold">{formatBdt(r.revenuePoisha)}</span>
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
