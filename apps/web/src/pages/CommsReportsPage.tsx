import { useCallback, useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { commsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CommsModuleNav } from "@/components/comms/CommsModuleNav";

export default function CommsReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState<{ messages: { channel: string; count: number }[]; timeline: { channel: string; count: number }[] } | null>(null);
  const [response, setResponse] = useState<{ sampleSize: number; avgResponseHours: number } | null>(null);
  const [sla, setSla] = useState<Record<string, number> | null>(null);
  const [completion, setCompletion] = useState<{ status: string; count: number }[]>([]);
  const [productivity, setProductivity] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, r, s, c, p] = await Promise.all([
        commsApi.reportVolume(),
        commsApi.reportResponseTime(),
        commsApi.reportSlaCompliance(),
        commsApi.reportActivityCompletion(),
        commsApi.reportExecutiveProductivity(),
      ]);
      setVolume(v);
      setResponse(r);
      setSla(s);
      setCompletion(c.rows || []);
      setProductivity(p.rows || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <DemoBadge moduleKey="comms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 size={16} className="text-amber-600" /> Communication reports
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Volume, response time, SLA compliance, activity completion, executive productivity.
          </p>
        </div>
        <CommsModuleNav />
        <ErrorBanner message={error} />
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Communication volume</h2>
              <ul className="text-[11px] space-y-1">
                {(volume?.messages || []).map((r) => (
                  <li key={r.channel} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>messages · {r.channel}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
                {(volume?.timeline || []).map((r) => (
                  <li key={`t-${r.channel}`} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>timeline · {r.channel}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Response time</h2>
              <p className="text-[11px]">
                Avg {response?.avgResponseHours ?? 0} hours · sample {response?.sampleSize ?? 0}
              </p>
              <h2 className="text-[12px] font-bold mb-2 mt-4">SLA compliance</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto">{JSON.stringify(sla, null, 2)}</pre>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Activity completion</h2>
              <ul className="text-[11px] space-y-1">
                {completion.map((r) => (
                  <li key={r.status} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.status}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Executive productivity</h2>
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto max-h-56">{JSON.stringify(productivity, null, 2)}</pre>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
