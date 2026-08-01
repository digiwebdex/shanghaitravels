import { useCallback, useEffect, useState } from "react";
import { MessagesSquare, RefreshCw } from "lucide-react";
import { analyticsApi, type AnalyticsFilters } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { AnalyticsModuleNav } from "@/components/analytics/AnalyticsModuleNav";
import { AnalyticsFiltersBar } from "@/components/analytics/AnalyticsFiltersBar";
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
    <PageShell wide>
      <PageHeader
        icon={MessagesSquare}
        title="Communication analytics"
        subtitle="Response times, SLA compliance, email / WhatsApp / SMS metrics, activity completion."
        breadcrumb={[{ label: "Analytics" }, { label: "Communications" }]}
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
          <KpiCard label="Avg response (h)" value={data.responseTimes?.avgResponseHours ?? 0} tone="accent" />
          <KpiCard label="SLA compliance" value={pct(data.slaCompliance?.compliancePct)} tone="success" />
          <KpiCard label="Overdue" value={data.slaCompliance?.overdue ?? 0} tone="warning" />
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
            <SurfaceHeader title="Response & SLA" />
            <p className="p-4 text-[12px] sm:p-5">
              Avg response {data.responseTimes?.avgResponseHours ?? 0}h · SLA {pct(data.slaCompliance?.compliancePct)} ·
              Overdue {data.slaCompliance?.overdue ?? 0}
            </p>
          </Surface>
          <Surface>
            <SurfaceHeader title="Channel metrics" />
            <pre className="overflow-auto p-4 text-[10px] sm:p-5">
              {JSON.stringify(
                { email: data.emailMetrics, whatsapp: data.whatsappMetrics, sms: data.smsMetrics },
                null,
                2,
              )}
            </pre>
          </Surface>
          <Surface className="md:col-span-2">
            <SurfaceHeader title="Activity completion" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.activityCompletion || []).map((r: any) => (
                <li key={r.status} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>{r.status}</span>
                  <span className="font-semibold">{r.count}</span>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      ) : null}
    </PageShell>
  );
}
