import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ListTodo, RefreshCw } from "lucide-react";
import { crmApi, salesApi, type CrmOpportunity, type SalesTask } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { SalesModuleNav } from "@/components/sales/SalesModuleNav";
import { SALES_TASK_TYPES } from "@/lib/sales";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  ListToolbar,
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
  selectClassName,
} from "@/components/enterprise/Page";

export default function SalesTasksPage() {
  const [rows, setRows] = useState<SalesTask[]>([]);
  const [opps, setOpps] = useState<CrmOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("follow_up");
  const [opportunityId, setOpportunityId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [slaHours, setSlaHours] = useState("48");
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q: Record<string, string> = {};
      if (filter === "overdue") q.overdue = "true";
      else if (filter) q.status = filter;
      const [tasks, o] = await Promise.all([salesApi.listTasks(q), crmApi.listOpportunities()]);
      setRows(tasks);
      setOpps(o);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await salesApi.createTask({
        title: title.trim(),
        type,
        opportunityId: opportunityId || undefined,
        dueAt: dueAt || undefined,
        slaHours: Number(slaHours) || 48,
      });
      setOk("Sales task created");
      setTitle("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const stats = useMemo(() => {
    const open = rows.filter((t) => t.status === "open").length;
    const escalated = rows.filter((t) => t.status === "escalated").length;
    const done = rows.filter((t) => t.status === "done").length;
    return { open, escalated, done };
  }, [rows]);

  const columns: Column<SalesTask>[] = [
    { key: "title", header: "Title", render: (t) => <span className="font-bold">{t.title}</span> },
    { key: "type", header: "Type", render: (t) => t.type },
    { key: "status", header: "Status", render: (t) => <Pill value={t.status} tone={statusTone(t.status)} /> },
    {
      key: "due",
      header: "Due",
      render: (t) => (t.dueAt ? new Date(t.dueAt).toLocaleString("en-BD") : "—"),
    },
    {
      key: "sla",
      header: "SLA",
      render: (t) =>
        t.slaDueAt ? (
          <span className="text-rose-700">{new Date(t.slaDueAt).toLocaleString("en-BD")}</span>
        ) : (
          "—"
        ),
    },
    { key: "opp", header: "Opportunity", render: (t) => t.opportunity?.opportunityNo || "—" },
    {
      key: "actions",
      header: "",
      render: (t) =>
        t.status === "open" ? (
          <Can perm="sales:task">
            <div className="flex gap-2">
              <button
                type="button"
                className="text-[10px] font-semibold text-emerald-700"
                onClick={() =>
                  void salesApi
                    .completeTask(t.id)
                    .then(() => load())
                    .catch((e) => setError(e instanceof ApiError ? e.message : "Complete failed"))
                }
              >
                Complete
              </button>
              <button
                type="button"
                className="text-[10px] font-semibold text-[var(--accent)]"
                onClick={() =>
                  void salesApi
                    .escalateTask(t.id)
                    .then(() => {
                      setOk("Escalated");
                      return load();
                    })
                    .catch((e) => setError(e instanceof ApiError ? e.message : "Escalate failed"))
                }
              >
                Escalate
              </button>
            </div>
          </Can>
        ) : null,
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={ListTodo}
        title="Sales tasks"
        subtitle="Follow-ups, reminders, assignment, SLA tracking, and escalations."
        breadcrumb={[{ label: "Sales" }, { label: "Tasks" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <SalesModuleNav />
      <StatStrip>
        <KpiCard label="Shown" value={rows.length} />
        <KpiCard label="Open" value={stats.open} tone="accent" />
        <KpiCard label="Escalated" value={stats.escalated} tone="warning" />
        <KpiCard label="Done" value={stats.done} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="sales:task">
        <Surface>
          <SurfaceHeader title="Schedule task" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4 sm:p-5">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title *</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {SALES_TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Opportunity</label>
              <select className={inputCls} value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
                <option value="">Optional…</option>
                {opps.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.opportunityNo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due</label>
              <input type="datetime-local" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>SLA hours</label>
              <input className={inputCls} value={slaHours} onChange={(e) => setSlaHours(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Schedule task
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <ListToolbar>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={selectClassName}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="done">Done</option>
            <option value="escalated">Escalated</option>
            <option value="overdue">Overdue</option>
          </select>
        </ListToolbar>
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No tasks" />
      </Surface>
    </PageShell>
  );
}
