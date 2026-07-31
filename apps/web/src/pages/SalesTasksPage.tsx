import { FormEvent, useCallback, useEffect, useState } from "react";
import { ListTodo } from "lucide-react";
import { crmApi, salesApi, type CrmOpportunity, type SalesTask } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { SalesModuleNav } from "@/components/sales/SalesModuleNav";
import { SALES_TASK_TYPES } from "@/lib/sales";

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

  return (
    <div>
      <DemoBadge moduleKey="sales" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <ListTodo size={16} className="text-amber-600" /> Sales tasks
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Follow-ups, reminders, assignment, SLA tracking, and escalations.</p>
        </div>
        <SalesModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <div className="flex flex-wrap gap-1.5">
          {["", "open", "done", "escalated", "overdue"].map((f) => (
            <button
              key={f || "all"}
              type="button"
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border ${filter === f ? "bg-amber-50 border-amber-300" : "border-slate-200 bg-white"}`}
              onClick={() => setFilter(f)}
            >
              {f || "all"}
            </button>
          ))}
        </div>
        <Can perm="sales:task">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
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
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Schedule task
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            {rows.map((t) => (
              <li key={t.id} className="text-[11px] flex flex-wrap gap-2 items-center border-b border-slate-50 pb-2">
                <span className="font-bold">{t.title}</span>
                <span className="text-slate-500">{t.type}</span>
                <span>{t.status}</span>
                {t.dueAt && <span>due {new Date(t.dueAt).toLocaleString("en-BD")}</span>}
                {t.slaDueAt && <span className="text-rose-700">SLA {new Date(t.slaDueAt).toLocaleString("en-BD")}</span>}
                {t.opportunity && <span>{t.opportunity.opportunityNo}</span>}
                {t.status === "open" && (
                  <Can perm="sales:task">
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
                      className="text-[10px] font-semibold text-amber-800"
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
                  </Can>
                )}
              </li>
            ))}
            {rows.length === 0 && <p className="text-[11px] text-slate-400">No tasks.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}
