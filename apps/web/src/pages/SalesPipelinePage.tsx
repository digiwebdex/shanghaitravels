import { FormEvent, useCallback, useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { crmApi, salesApi, type CrmOpportunity, type LostReason, type SalesStage } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { SalesModuleNav } from "@/components/sales/SalesModuleNav";
import { formatBdt, probabilityLabel } from "@/lib/crm";

export default function SalesPipelinePage() {
  const [stages, setStages] = useState<SalesStage[]>([]);
  const [reasons, setReasons] = useState<LostReason[]>([]);
  const [opps, setOpps] = useState<CrmOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [historyId, setHistoryId] = useState("");
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [lostOppId, setLostOppId] = useState("");
  const [lostReasonId, setLostReasonId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await salesApi.bootstrap().catch(() => null);
      const [st, lr, o] = await Promise.all([
        salesApi.listStages(),
        salesApi.listLostReasons(),
        crmApi.listOpportunities(),
      ]);
      setStages(st);
      setReasons(lr);
      setOpps(o);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load sales pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStage(oppId: string, stage: string, extra?: Record<string, unknown>) {
    try {
      await salesApi.setOpportunityStage(oppId, { stage, ...extra });
      setOk(`Moved to ${stage}`);
      setLostOppId("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Stage update failed");
    }
  }

  async function markLost(e: FormEvent) {
    e.preventDefault();
    if (!lostOppId || !lostReasonId) {
      setError("Select opportunity and lost reason");
      return;
    }
    const reason = reasons.find((r) => r.id === lostReasonId);
    await setStage(lostOppId, "lost", { lostReasonId, lostReason: reason?.label });
  }

  async function showHistory(id: string) {
    setHistoryId(id);
    try {
      setHistory((await salesApi.opportunityHistory(id)) as Record<string, unknown>[]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "History failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="sales" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={16} className="text-amber-600" /> Sales pipeline
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configurable stages, probability scoring, win/loss tracking, and stage history.
          </p>
        </div>
        <SalesModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Stages</h2>
              <div className="flex flex-wrap gap-2">
                {stages.map((s) => (
                  <div key={s.id} className="px-2.5 py-1.5 rounded-lg border border-slate-100 bg-slate-50 text-[10.5px]">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-slate-500 ml-1">{probabilityLabel(s.defaultProbabilityBps)}</span>
                  </div>
                ))}
              </div>
            </section>
            <Can perm="opportunity:manage">
              <form onSubmit={(e) => void markLost(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className={labelCls}>Mark lost — opportunity</label>
                  <select className={inputCls} value={lostOppId} onChange={(e) => setLostOppId(e.target.value)}>
                    <option value="">Select…</option>
                    {opps
                      .filter((o) => o.status === "open")
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.opportunityNo} — {o.title}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Lost reason</label>
                  <select className={inputCls} value={lostReasonId} onChange={(e) => setLostReasonId(e.target.value)}>
                    <option value="">Select…</option>
                    {reasons.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                    Record loss
                  </button>
                </div>
              </form>
            </Can>
            <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              {opps.map((o) => (
                <div key={o.id} className="border-b border-slate-50 pb-3 text-[11px]">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="font-bold text-slate-800">{o.opportunityNo}</span>
                    <span>{o.title}</span>
                    <span className="text-slate-500">{o.stage}</span>
                    <span>{probabilityLabel(o.probabilityBps)}</span>
                    <span className="font-semibold">{formatBdt(o.expectedRevenuePoisha)}</span>
                    <span className="text-slate-400">{o.status}</span>
                  </div>
                  <Can perm="opportunity:manage">
                    <div className="flex flex-wrap gap-1 mt-2">
                      {stages
                        .filter((s) => s.code !== o.stage && !s.isLost)
                        .slice(0, 6)
                        .map((s) => (
                          <button
                            key={s.code}
                            type="button"
                            className="px-2 py-0.5 rounded border border-slate-200 text-[10px]"
                            onClick={() => void setStage(o.id, s.code)}
                          >
                            → {s.name}
                          </button>
                        ))}
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-amber-200 text-[10px] text-amber-800"
                        onClick={() => void showHistory(o.id)}
                      >
                        History
                      </button>
                    </div>
                  </Can>
                </div>
              ))}
              {opps.length === 0 && <p className="text-[11px] text-slate-400">No opportunities — create them in CRM first.</p>}
            </section>
            {historyId && (
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="text-[12px] font-bold mb-2">Stage history</h2>
                <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto max-h-56">{JSON.stringify(history, null, 2)}</pre>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
