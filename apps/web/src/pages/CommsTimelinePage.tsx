import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MessagesSquare, RefreshCw } from "lucide-react";
import { commsApi, crmApi, type CommTimelineItem, type CrmLead } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CommsModuleNav } from "@/components/comms/CommsModuleNav";
import { COMM_CHANNELS, validateCommLog } from "@/lib/comms";
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

  const stats = useMemo(() => {
    const channels = new Set(items.map((i) => i.channel)).size;
    const inbound = items.filter((i) => i.direction === "inbound").length;
    return { channels, inbound };
  }, [items]);

  const columns: Column<CommTimelineItem>[] = [
    {
      key: "channel",
      header: "Channel",
      render: (it) => <span className="font-bold uppercase text-[var(--accent)]">{it.channel}</span>,
    },
    { key: "kind", header: "Kind", render: (it) => it.kind },
    { key: "direction", header: "Direction", render: (it) => it.direction },
    { key: "status", header: "Status", render: (it) => <Pill value={it.status} tone={statusTone(it.status)} /> },
    {
      key: "when",
      header: "When",
      render: (it) => new Date(it.createdAt).toLocaleString("en-BD"),
    },
    {
      key: "summary",
      header: "Summary",
      className: "max-w-[280px]",
      render: (it) => (
        <div>
          <div className="font-semibold text-[var(--primary)]">{it.summary}</div>
          {it.body && <p className="mt-0.5 whitespace-pre-wrap text-[var(--muted-foreground)]">{it.body}</p>}
        </div>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={MessagesSquare}
        title="Communication timeline"
        subtitle="Unified hub for calls, email, WhatsApp, SMS, notes, meetings, and attachments."
        breadcrumb={[{ label: "Communications" }, { label: "Timeline" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void loadTimeline()} disabled={!relatedId}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CommsModuleNav />
      <StatStrip>
        <KpiCard label="Entries" value={items.length} />
        <KpiCard label="Channels used" value={stats.channels} tone="accent" />
        <KpiCard label="Inbound" value={stats.inbound} />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Surface padded>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
              <input
                className={inputCls}
                value={relatedId}
                onChange={(e) => setRelatedId(e.target.value)}
                placeholder="UUID"
              />
            )}
          </div>
        </div>
      </Surface>

      <Can perm="comms:manage">
        <Surface>
          <SurfaceHeader title="Log communication" />
          <form onSubmit={(e) => void log(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4 sm:p-5">
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
              <input
                className={inputCls}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="optional.pdf"
              />
            </div>
            <div className="sm:col-span-4">
              <label className={labelCls}>Notes / body</label>
              <textarea className={inputCls} rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Log communication
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title="Timeline" />
        <DataTable
          rows={items}
          columns={columns}
          rowKey={(r) => `${r.kind}-${r.id}`}
          loading={loading}
          emptyTitle="No timeline entries yet"
        />
      </Surface>
    </PageShell>
  );
}
