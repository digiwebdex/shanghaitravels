import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { crmApi, type CrmActivity, type CrmLead } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { ACTIVITY_TYPES } from "@/lib/crm";

export default function CrmActivitiesPage() {
  const [rows, setRows] = useState<CrmActivity[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [type, setType] = useState("call");
  const [subject, setSubject] = useState("");
  const [leadId, setLeadId] = useState("");
  const [dueAt, setDueAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acts, ld] = await Promise.all([crmApi.listActivities(), crmApi.listLeads({ limit: 50 })]);
      setRows(acts);
      setLeads(ld.data || []);
      if (!leadId && ld.data?.[0]) setLeadId(ld.data[0].id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!leadId) {
      setError("Select a related lead");
      return;
    }
    try {
      await crmApi.createActivity({
        type,
        subject: subject.trim(),
        relatedType: "lead",
        relatedId: leadId,
        dueAt: dueAt || undefined,
      });
      setOk("Activity logged");
      setSubject("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={CalendarClock}
        title="Activities"
        subtitle="Calls, meetings, email, WhatsApp, tasks, follow-ups."
        breadcrumb={[{ label: "CRM", to: "/crm" }, { label: "Activities" }]}
      />
      <CrmModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="communication:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Subject *</label>
              <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Related lead</label>
              <select className={inputCls} value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due</label>
              <input type="datetime-local" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                Log activity
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
            {rows.map((a) => (
              <li key={a.id} className="text-[11px] flex flex-wrap gap-2 items-center border-b border-slate-50 pb-2">
                <span className="font-semibold text-amber-800">{a.type}</span>
                <span className="font-bold text-slate-800">{a.subject}</span>
                <span className="text-slate-500">{a.status}</span>
                {a.status === "open" && (
                  <Can perm="communication:manage">
                    <button
                      type="button"
                      className="text-[10px] font-semibold text-emerald-700"
                      onClick={() =>
                        void crmApi
                          .completeActivity(a.id)
                          .then(() => load())
                          .catch((e) => setError(e instanceof ApiError ? e.message : "Complete failed"))
                      }
                    >
                      Complete
                    </button>
                  </Can>
                )}
              </li>
            ))}
            {rows.length === 0 && <p className="text-[11px] text-slate-400">No activities.</p>}
          </ul>
        )}
    </PageShell>
  );
}
