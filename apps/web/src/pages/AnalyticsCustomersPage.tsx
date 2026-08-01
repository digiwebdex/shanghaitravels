import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
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
    <PageShell wide>
      <PageHeader
        icon={Users}
        title="Customer analytics"
        subtitle="CLV, booking frequency, repeat rate, segmentation, corporate vs B2C, geography."
        breadcrumb={[{ label: "Analytics" }, { label: "Customers" }]}
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
          <KpiCard label="Avg CLV" value={formatBdt(data.lifetimeValue?.averageClvPoisha)} tone="accent" />
          <KpiCard label="Bookings / customer" value={data.bookingFrequency?.averageBookingsPerCustomer ?? "—"} />
          <KpiCard label="Repeat rate" value={pct(data.repeatCustomerRate?.ratePct)} tone="success" />
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
            <SurfaceHeader title="Lifetime value" />
            <div className="space-y-2 p-4 text-[12px] sm:p-5">
              <p>
                Avg CLV {formatBdt(data.lifetimeValue?.averageClvPoisha)} · sample {data.lifetimeValue?.sampleSize}
              </p>
              <p>{data.bookingFrequency?.averageBookingsPerCustomer} bookings / customer</p>
              <p>Repeat rate {pct(data.repeatCustomerRate?.ratePct)}</p>
            </div>
          </Surface>
          <Surface>
            <SurfaceHeader title="Segmentation" />
            <ul className="space-y-1 p-4 text-[12px] sm:p-5">
              {(data.segmentation || []).map((r: any) => (
                <li key={r.segment} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>{r.segment}</span>
                  <span className="font-semibold">{r.count}</span>
                </li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <SurfaceHeader title="Corporate vs B2C" />
            <pre className="overflow-auto p-4 text-[10px] sm:p-5">{JSON.stringify(data.corporateVsB2c, null, 2)}</pre>
          </Surface>
          <Surface>
            <SurfaceHeader title="Geographic distribution" />
            <ul className="max-h-56 space-y-1 overflow-auto p-4 text-[12px] sm:p-5">
              {(data.geographicDistribution || []).map((r: any) => (
                <li key={r.nationality} className="flex justify-between border-b border-[var(--border)] pb-1">
                  <span>{r.nationality}</span>
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
