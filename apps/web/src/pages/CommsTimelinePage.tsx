import { FormEvent, useCallback, useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { commsApi, crmApi, type CommTimelineItem, type CrmLead } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CommsModuleNav } from "@/components/comms/CommsModuleNav";
import { COMM_CHANNELS, validateCommLog } from "@/lib/comms";

export default function CommsTimelinePage() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [relatedType, setRelatedType] = useState("lead");
  const [relatedId, setRelatedId] = useState("");
  const [items, setItems] = useState<CommTimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [channel, setChannel] = useState("call");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");

  const loadLeads = useCallback(async () => {
    try {
      const r = await crmApi.listLeads({ limit: 50 });
      setLeads(r.data || []);
      if (!relatedId && r.data?.[0]) setRelatedId(r.data[0].id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load leads");
    }
  }, [relatedId]);

  useEffect(() => {
    void loadLeads();
    void commsApi.bootstrap().catch(() => null);
  }, [loadLeads]);

  const loadTimeline = useCallback(async () => {
    if (!relatedId) return;
    setLoading(true);
    try {
      const r = await commsApi.timeline(relatedType, relatedId);
      setItems(r.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Timeline failed");
    } finally {
      setLoading(false);
    }
  }, [relatedId, relatedType]);

  useEffect(() => {
    if (relatedId) void loadTimeline();
  }, [relatedId, loadTimeline]);

  async function log(e: FormEvent) {
    e.preventDefault();
    const bad = validateCommLog({ relatedType, relatedId, summary, channel });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await commsApi.log({
        relatedType,
        relatedId,
        channel,
        summary: summary.trim(),
        body: body || undefined,
        partyKind: relatedType === "lead" ? "prospect" : "customer",
        attachments: fileName
          ? [{ fileName, mimeType: "application/octet-stream", sizeBytes: 0, storageKey: `local/${fileName}` }]
          : [],
      });
      setOk("Logged on timeline");
      setSummary("");
      setBody("");
      setFileName("");
      await loadTimeline();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Log failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="comms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <MessagesSquare size={16} className="text-amber-600" /> Communication timeline
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Unified hub for calls, email, WhatsApp, SMS, notes, meetings, and attachments.
          </p>
        </div>
        <CommsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white rounded-xl border border-slate-200 p-4">
          <div>
            <label className={labelCls}>Related type</label>
            <select className={inputCls} value={relatedType} onChange={(e) => setRelatedType(e.target.value)}>
              <option value="lead">lead</option>
              <option value="customer">customer</option>
              <option value="opportunity">opportunity</option>
              <option value="application">application</option>
              <option value="organization">organization</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Related record</label>
            {relatedType === "lead" ? (
              <select className={inputCls} value={relatedId} onChange={(e) => setRelatedId(e.target.value)}>
                <option value="">Select lead…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            ) : (
              <input className={inputCls} value={relatedId} onChange={(e) => setRelatedId(e.target.value)} placeholder="UUID" />
            )}
          </div>
        </div>
        <Can perm="comms:manage">
          <form onSubmit={(e) => void log(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>Channel</label>
              <select className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
                {COMM_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Summary *</label>
              <input className={inputCls} value={summary} onChange={(e) => setSummary(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Attachment name</label>
              <input className={inputCls} value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="optional.pdf" />
            </div>
            <div className="sm:col-span-4">
              <label className={labelCls}>Notes / body</label>
              <textarea className={inputCls} rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Log communication
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
            {items.map((it) => (
              <li key={`${it.kind}-${it.id}`} className="text-[11px] border-b border-slate-50 pb-2">
                <div className="flex flex-wrap gap-2">
                  <span className="font-bold uppercase text-amber-800">{it.channel}</span>
                  <span className="text-slate-500">{it.kind}</span>
                  <span>{it.direction}</span>
                  <span className="text-slate-400">{it.status}</span>
                  <span className="text-slate-400">{new Date(it.createdAt).toLocaleString("en-BD")}</span>
                </div>
                <div className="font-semibold text-slate-800 mt-0.5">{it.summary}</div>
                {it.body && <p className="text-slate-600 mt-0.5 whitespace-pre-wrap">{it.body}</p>}
              </li>
            ))}
            {items.length === 0 && <p className="text-[11px] text-slate-400">No timeline entries yet.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}
