import { useCallback, useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
} from "@/components/enterprise/Page";
import { salesApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { SalesModuleNav } from "@/components/sales/SalesModuleNav";
import { formatBdt } from "@/lib/crm";

export default function SalesReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quoteStatus, setQuoteStatus] = useState<{ status: string; count: number; totalPoisha: number }[]>([]);
  const [winLoss, setWinLoss] = useState<{ won: number; lost: number; open: number; winRate: number } | null>(null);
  const [funnel, setFunnel] = useState<{ stage: string; name: string; count: number; expectedRevenuePoisha: number }[]>([]);
  const [byExec, setByExec] = useState<Record<string, unknown>[]>([]);
  const [convTime, setConvTime] = useState<{ sampleSize: number; avgDays: number } | null>(null);
  const [forecast, setForecast] = useState<{
    sampleSize: number;
    forecastedPoisha: number;
    actualPoisha: number;
    accuracyPct: number | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [qs, wl, fn, be, ct, fa] = await Promise.all([
        salesApi.reportQuoteStatus(),
        salesApi.reportWinLoss(),
        salesApi.reportFunnel(),
        salesApi.reportByExecutive(),
        salesApi.reportConversionTime(),
        salesApi.reportForecastAccuracy(),
      ]);
      setQuoteStatus(qs.rows || []);
      setWinLoss(wl);
      setFunnel(fn.rows || []);
      setByExec(be.rows || []);
      setConvTime(ct);
      setForecast(fa);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load sales reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageShell wide>
      <PageHeader
        icon={BarChart2}
        title="Sales reports"
        subtitle="Quotation status, win/loss, funnel, executives, conversion time, forecast accuracy."
        breadcrumb={[{ label: "Sales", to: "/sales" }, { label: "Sales reports" }]}
      />
      <SalesModuleNav />
        <ErrorBanner message={error} />
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Quotation status</h2>
              <ul className="space-y-1 text-[11px]">
                {quoteStatus.map((r) => (
                  <li key={r.status} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>
                      {r.status} · {r.count}
                    </span>
                    <span className="font-semibold">{formatBdt(r.totalPoisha)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Win / loss</h2>
              <p className="text-[11px]">
                Won {winLoss?.won ?? 0} · Lost {winLoss?.lost ?? 0} · Open {winLoss?.open ?? 0} · Win rate{" "}
                {winLoss?.winRate ?? 0}%
              </p>
              <h2 className="text-[12px] font-bold mb-2 mt-4">Conversion time</h2>
              <p className="text-[11px]">
                Avg {convTime?.avgDays ?? 0} days · sample {convTime?.sampleSize ?? 0}
              </p>
              <h2 className="text-[12px] font-bold mb-2 mt-4">Forecast accuracy</h2>
              <p className="text-[11px]">
                Forecast {formatBdt(forecast?.forecastedPoisha)} · Actual {formatBdt(forecast?.actualPoisha)} · Accuracy{" "}
                {forecast?.accuracyPct == null ? "—" : `${forecast.accuracyPct}%`}
              </p>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Sales funnel</h2>
              <ul className="space-y-1 text-[11px]">
                {funnel.map((r) => (
                  <li key={r.stage} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>
                      {r.name} · {r.count}
                    </span>
                    <span className="font-semibold">{formatBdt(r.expectedRevenuePoisha)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Sales by executive</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto max-h-56">{JSON.stringify(byExec, null, 2)}</pre>
            </section>
          </div>
        )}
    </PageShell>
  );
}
