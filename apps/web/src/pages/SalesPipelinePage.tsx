import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import { crmApi, salesApi, type CrmOpportunity, type LostReason, type SalesStage } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { SalesModuleNav } from "@/components/sales/SalesModuleNav";
import { formatBdt, probabilityLabel } from "@/lib/crm";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";

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

  const stats = useMemo(() => {
    const open = opps.filter((o) => o.status === "open").length;
    const won = opps.filter((o) => o.stage === "won" || o.status === "won").length;
    const pipeline = opps.reduce((s, o) => s + (o.expectedRevenuePoisha || 0), 0);
    return { open, won, pipeline };
  }, [opps]);

  const columns: Column<CrmOpportunity>[] = [
    { key: "no", header: "No", render: (o) => <span className="font-bold">{o.opportunityNo}</span> },
    { key: "title", header: "Title", render: (o) => o.title },
    { key: "stage", header: "Stage", render: (o) => <Pill value={o.stage} tone={statusTone(o.stage)} /> },
    { key: "prob", header: "Probability", render: (o) => probabilityLabel(o.probabilityBps) },
    {
      key: "revenue",
      header: "Expected",
      className: "text-right tabular-nums",
      render: (o) => formatBdt(o.expectedRevenuePoisha),
    },
    { key: "status", header: "Status", render: (o) => <Pill value={o.status} tone={statusTone(o.status)} /> },
    {
      key: "actions",
      header: "Actions",
      render: (o) => (
        <Can perm="opportunity:manage">
          <div className="flex flex-wrap gap-1">
            {stages
              .filter((s) => s.code !== o.stage && !s.isLost)
              .slice(0, 5)
              .map((s) => (
                <button
                  key={s.code}
                  type="button"
                  className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px]"
                  onClick={() => void setStage(o.id, s.code)}
                >
                  → {s.name}
                </button>
              ))}
            <button
              type="button"
              className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]"
              onClick={() => void showHistory(o.id)}
            >
              History
            </button>
          </div>
        </Can>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={TrendingUp}
        title="Sales pipeline"
        subtitle="Configurable stages, probability scoring, win/loss tracking, and stage history."
        breadcrumb={[{ label: "Sales" }, { label: "Pipeline" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <SalesModuleNav />
      <StatStrip>
        <KpiCard label="Opportunities" value={opps.length} />
        <KpiCard label="Open" value={stats.open} tone="accent" />
        <KpiCard label="Won" value={stats.won} tone="success" />
        <KpiCard label="Pipeline value" value={formatBdt(stats.pipeline)} />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Surface>
        <SurfaceHeader title="Stages" />
        <div className="flex flex-wrap gap-2 p-4 sm:p-5">
          {stages.map((s) => (
            <div key={s.id} className="rounded-lg bg-[var(--navy-50)] px-2.5 py-1.5 text-[10.5px] ring-1 ring-[var(--ring-card)]">
              <span className="font-semibold">{s.name}</span>
              <span className="ml-1 text-[var(--muted-foreground)]">{probabilityLabel(s.defaultProbabilityBps)}</span>
            </div>
          ))}
          {stages.length === 0 && !loading && (
            <p className="text-[12px] text-[var(--muted-foreground)]">No stages configured.</p>
          )}
        </div>
      </Surface>

      <Can perm="opportunity:manage">
        <Surface>
          <SurfaceHeader title="Mark lost" />
          <form onSubmit={(e) => void markLost(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-3 sm:p-5">
            <div>
              <label className={labelCls}>Opportunity</label>
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
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Record loss
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${opps.length} opportunit${opps.length === 1 ? "y" : "ies"}`} />
        <DataTable
          rows={opps}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No opportunities"
          emptyHint="Create them in CRM first."
        />
      </Surface>

      {historyId && (
        <Surface>
          <SurfaceHeader title="Stage history" />
          <pre className="max-h-56 overflow-auto p-4 text-[10px] sm:p-5">{JSON.stringify(history, null, 2)}</pre>
        </Surface>
      )}
    </PageShell>
  );
}
