import { useCallback, useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { crmApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { formatBdt } from "@/lib/crm";

export default function CrmReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sources, setSources] = useState<{ source: string; count: number }[]>([]);
  const [conversion, setConversion] = useState<Record<string, number> | null>(null);
  const [pipeline, setPipeline] = useState<{ stage: string; count: number; expectedRevenuePoisha: number }[]>([]);
  const [team, setTeam] = useState<Record<string, unknown>[]>([]);
  const [forecast, setForecast] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, c, p, t, f] = await Promise.all([
        crmApi.reportLeadSources(),
        crmApi.reportConversion(),
        crmApi.reportPipeline(),
        crmApi.reportTeam(),
        crmApi.reportForecast(),
      ]);
      setSources(s.rows || []);
      setConversion(c);
      setPipeline(p.rows || []);
      setTeam(t.rows || []);
      setForecast(f);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load CRM reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <DemoBadge moduleKey="crm" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 size={16} className="text-amber-600" /> CRM reports
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Lead sources, conversion, pipeline, team performance, revenue forecast.
          </p>
        </div>
        <CrmModuleNav />
        <ErrorBanner message={error} />
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Lead sources</h2>
              <ul className="space-y-1 text-[11px]">
                {sources.map((r) => (
                  <li key={r.source} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.source}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Conversion</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto">{JSON.stringify(conversion, null, 2)}</pre>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Sales pipeline</h2>
              <ul className="space-y-1 text-[11px]">
                {pipeline.map((r) => (
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
                Weighted {formatBdt(Number(forecast?.weightedRevenuePoisha) || 0)} · Unweighted{" "}
                {formatBdt(Number(forecast?.unweightedRevenuePoisha) || 0)} · Open {String(forecast?.openCount ?? 0)}
              </p>
              <h2 className="text-[12px] font-bold mb-2 mt-4">Team</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto max-h-48">{JSON.stringify(team, null, 2)}</pre>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
