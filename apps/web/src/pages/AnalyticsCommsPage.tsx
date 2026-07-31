import { useCallback, useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
import { pct, validateAnalyticsFilters } from "@/lib/analytics";

export default function AnalyticsCommsPage() {
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
      setData(await analyticsApi.comms(applied));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load communication analytics");
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
            <MessagesSquare size={16} className="text-amber-600" /> Communication analytics
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Response times, SLA compliance, email / WhatsApp / SMS metrics, activity completion.
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
              <h2 className="text-[12px] font-bold mb-2">Response & SLA</h2>
              <p className="text-[11px]">
                Avg response {data.responseTimes?.avgResponseHours ?? 0}h · SLA {pct(data.slaCompliance?.compliancePct)} ·
                Overdue {data.slaCompliance?.overdue ?? 0}
              </p>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Channel metrics</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto">
                {JSON.stringify(
                  { email: data.emailMetrics, whatsapp: data.whatsappMetrics, sms: data.smsMetrics },
                  null,
                  2,
                )}
              </pre>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4 md:col-span-2">
              <h2 className="text-[12px] font-bold mb-2">Activity completion</h2>
              <ul className="text-[11px] space-y-1">
                {(data.activityCompletion || []).map((r: any) => (
                  <li key={r.status} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.status}</span>
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
