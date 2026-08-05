import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Zap } from "lucide-react";
import { automationApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost, btnPrimary, btnPrimaryStyle } from "@/components/enterprise/Page";
import { type Column, DataTable, Pill } from "@/components/enterprise/DataTable";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

type Status = Awaited<ReturnType<typeof automationApi.status>>;
type JobRow = { key: string; cron: string; lastRun?: string; runs: number; failures: number };
const fmt = (s?: string) => (s ? new Date(s).toLocaleString() : "never");

export default function AutomationDashboardPage() {
  const [data, setData] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await automationApi.status());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load automation status");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function toggle() {
    if (!data) return;
    try {
      await automationApi.saveSettings({ enabled: !data.config.enabled, channelPriority: data.config.channelPriority });
      setOk(`Automation ${data.config.enabled ? "disabled" : "enabled"}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save");
    }
  }
  async function run(job: string) {
    setOk("");
    setError("");
    try {
      const r = (await automationApi.run(job)) as Record<string, unknown>;
      setOk(`Ran ${job}: ${JSON.stringify(r)}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Run failed");
    }
  }

  const jobRows: JobRow[] = data ? Object.entries(data.jobs).map(([key, j]) => ({ key, cron: j.cron, lastRun: j.lastRun, runs: j.runs, failures: j.failures })) : [];
  const jobCols: Column<JobRow>[] = [
    { key: "job", header: "Job", render: (r) => <span className="font-semibold text-[var(--foreground)]">{r.key}</span> },
    { key: "cron", header: "Schedule", render: (r) => <span className="font-mono text-[11px]">{r.cron}</span> },
    { key: "last", header: "Last Run", render: (r) => fmt(r.lastRun) },
    { key: "runs", header: "Runs", className: "text-right tabular-nums", render: (r) => r.runs },
    { key: "fail", header: "Failures", className: "text-right tabular-nums", render: (r) => r.failures },
    {
      key: "act",
      header: "Run now",
      render: (r) => (
        <button type="button" className="text-[11px] font-semibold text-[var(--accent)] hover:underline" onClick={() => void run(r.key === "retrySweep" ? "retries" : "reminders")}>
          Run
        </button>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Zap}
        title="Automation"
        subtitle="Scheduled reminders, event notifications and retry engine — reuses the Communication service (simulation until credentials)."
        breadcrumb={[{ label: "Administration" }, { label: "Automation" }]}
        actions={
          <div className="flex items-center gap-2">
            {data && (
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => void toggle()}>
                {data.config.enabled ? "Disable" : "Enable"} automation
              </button>
            )}
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {loading || !data ? (
        <div className="flex justify-center py-16">
          <InlineSpinner />
        </div>
      ) : (
        <>
          <Surface padded>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">Status</span>
                <Pill value={data.config.enabled ? "enabled" : "disabled"} tone={data.config.enabled ? "green" : "slate"} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">Channel priority</span>
                <span className="text-[12px] font-semibold text-[var(--foreground)]">{data.config.channelPriority.join(" → ")}</span>
              </div>
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Scheduled jobs" hint="@nestjs/schedule cron jobs" />
            <DataTable rows={jobRows} columns={jobCols} rowKey={(r) => r.key} emptyTitle="No jobs" />
          </Surface>

          <Surface padded>
            <h3 className="mb-3 text-[12px] font-bold text-[var(--primary)]">Recent automation events</h3>
            {data.recent.length === 0 ? (
              <p className="text-[12px] text-[var(--muted-foreground)]">No automation events yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-[11.5px]">
                    <span className="font-mono">{r.action}</span>
                    <span className="text-[10.5px] text-[var(--muted-foreground)]">{fmt(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </>
      )}
    </PageShell>
  );
}
