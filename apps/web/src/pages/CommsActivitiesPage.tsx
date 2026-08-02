import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { commsApi, crmApi, type CommActivity, type CrmLead } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CommsModuleNav } from "@/components/comms/CommsModuleNav";
import { RECURRENCE_RULES } from "@/lib/comms";

export default function CommsActivitiesPage() {
  const [rows, setRows] = useState<CommActivity[]>([]);
  const [calendar, setCalendar] = useState<CommActivity[]>([]);
  const [sla, setSla] = useState<{ open: number; overdue: number; escalated: number; done: number; compliancePct: number } | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [subject, setSubject] = useState("");
  const [leadId, setLeadId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [slaHours, setSlaHours] = useState("48");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, s, ld] = await Promise.all([
        commsApi.listActivities(),
        commsApi.calendar(),
        commsApi.sla(),
        crmApi.listLeads({ limit: 40 }),
      ]);
      setRows(a);
      setCalendar(c);
      setSla(s);
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
    try {
      await commsApi.createActivity({
        subject: subject.trim(),
        type: "follow_up",
        relatedType: "lead",
        relatedId: leadId,
        dueAt: dueAt || undefined,
        recurrenceRule: recurrence,
        slaHours: Number(slaHours) || 48,
      });
      setOk("Activity scheduled");
      setSubject("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={CalendarDays}
        title="Engagement activities"
        subtitle="Calendar, follow-ups, recurring tasks, team assignment, escalations, and SLA dashboard."
        breadcrumb={[{ label: "Communications", to: "/comms" }, { label: "Engagement activities" }]}
      />
      <CommsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        {sla && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              ["Open", sla.open],
              ["Overdue", sla.overdue],
              ["Escalated", sla.escalated],
              ["Done", sla.done],
              ["Compliance", `${sla.compliancePct}%`],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-white rounded-xl border border-[var(--border)] p-3 text-center">
                <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">{k}</div>
                <div className="text-[16px] font-bold text-[var(--primary)]">{v}</div>
              </div>
            ))}
          </div>
        )}
        <Can perm="comms:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Subject *</label>
              <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Lead</label>
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
            <div>
              <label className={labelCls}>Recurrence</label>
              <select className={inputCls} value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                {RECURRENCE_RULES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>SLA hours</label>
              <input className={inputCls} value={slaHours} onChange={(e) => setSlaHours(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                Schedule activity
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-[var(--border)] p-4">
              <h2 className="text-[12px] font-bold mb-2">Open / recent</h2>
              <ul className="space-y-2 text-[11px]">
                {rows.map((a) => (
                  <li key={a.id} className="border-b border-[var(--border)] pb-2 flex flex-wrap gap-2 items-center">
                    <span className="font-bold">{a.subject}</span>
                    <span className="text-[var(--muted-foreground)]">{a.status}</span>
                    {a.dueAt && <span>due {new Date(a.dueAt).toLocaleString("en-BD")}</span>}
                    {a.slaDueAt && <span className="text-rose-700">SLA {new Date(a.slaDueAt).toLocaleString("en-BD")}</span>}
                    {a.recurrenceRule && a.recurrenceRule !== "none" && <span>{a.recurrenceRule}</span>}
                    {a.status === "open" && (
                      <Can perm="comms:manage">
                        <button type="button" className="text-[10px] font-semibold text-emerald-700" onClick={() => void commsApi.completeActivity(a.id).then(() => load())}>
                          Complete
                        </button>
                        <button
                          type="button"
                          className="text-[10px] font-semibold text-amber-800"
                          onClick={() =>
                            void commsApi
                              .escalateActivity(a.id)
                              .then(() => {
                                setOk("Escalated");
                                return load();
                              })
                          }
                        >
                          Escalate
                        </button>
                      </Can>
                    )}
                  </li>
                ))}
                {rows.length === 0 && <li className="text-[var(--muted-foreground)]">No activities.</li>}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-[var(--border)] p-4">
              <h2 className="text-[12px] font-bold mb-2">Calendar (this month)</h2>
              <ul className="space-y-2 text-[11px]">
                {calendar.map((a) => (
                  <li key={a.id} className="border-b border-[var(--border)] pb-2">
                    <span className="font-semibold">{a.dueAt ? new Date(a.dueAt).toLocaleDateString("en-BD") : "—"}</span> — {a.subject}
                  </li>
                ))}
                {calendar.length === 0 && <li className="text-[var(--muted-foreground)]">Nothing scheduled.</li>}
              </ul>
            </section>
          </div>
        )}
    </PageShell>
  );
}
