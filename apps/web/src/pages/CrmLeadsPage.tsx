import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Eye, Pencil, RefreshCw, Trash2, Users, X } from "lucide-react";
import { crmApi, type CrmLead } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { PackagePicker } from "@/components/packages/PackagePicker";
import { LEAD_SOURCES, QUOTE_SERVICES, validateLead } from "@/lib/crm";
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
import { CrmJourneyBanner } from "@/components/workflow/CrmJourneyBanner";

/** Practical, editable lead statuses (the convert flow sets "converted"). */
const LEAD_STATUSES = ["new", "contacted", "interested", "follow_up", "quotation", "won", "lost", "converted"];
const LEAD_PRIORITIES = ["hot", "warm", "cold"];

export default function CrmLeadsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<string>("walkin");
  const [serviceInterest, setServiceInterest] = useState("visa");
  const [packageId, setPackageId] = useState("");
  const [convertLeadId, setConvertLeadId] = useState("");
  const [convertService, setConvertService] = useState("visa");

  // View / Edit drawer + Delete confirm
  const [drawer, setDrawer] = useState<{ mode: "view" | "edit"; lead: CrmLead } | null>(null);
  const [edit, setEdit] = useState<Partial<CrmLead>>({});
  const [deleting, setDeleting] = useState<CrmLead | null>(null);
  const [busy, setBusy] = useState(false);

  function openView(lead: CrmLead) {
    setDrawer({ mode: "view", lead });
  }
  function openEdit(lead: CrmLead) {
    setEdit({ ...lead });
    setDrawer({ mode: "edit", lead });
    setError("");
    setOk("");
  }

  async function saveEdit() {
    if (!drawer) return;
    if (!String(edit.name || "").trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await crmApi.updateLead(drawer.lead.id, {
        name: edit.name?.trim(),
        phone: edit.phone ?? undefined,
        email: edit.email ?? undefined,
        source: edit.source ?? undefined,
        serviceInterest: edit.serviceInterest ?? undefined,
        status: edit.status ?? undefined,
        priority: edit.priority ?? undefined,
        notes: edit.notes ?? undefined,
      });
      setOk(`Lead ${drawer.lead.leadNo || drawer.lead.name} updated`);
      setDrawer(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    try {
      await crmApi.deleteLead(deleting.id);
      setOk(`Lead ${deleting.leadNo || deleting.name} deleted`);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await crmApi.listLeads({ limit: 100 });
      setRows(r.data || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateLead({ name, source });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const lead = await crmApi.createLead({
        name: name.trim(),
        phone,
        source,
        serviceInterest,
        priority: "warm",
        packageId: packageId || undefined,
      });
      setOk(`Lead ${lead.leadNo || lead.name} created`);
      setName("");
      setPhone("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function convert() {
    if (!convertLeadId) {
      setError("Select a lead to convert");
      return;
    }
    try {
      const r = await crmApi.convert({ leadId: convertLeadId, serviceType: convertService });
      setOk(`Converted → ${r.application.referenceNo}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Convert failed");
    }
  }

  const stats = useMemo(() => {
    const open = rows.filter((l) => l.status !== "converted" && l.status !== "lost").length;
    const converted = rows.filter((l) => l.status === "converted").length;
    return { open, converted };
  }, [rows]);

  const columns: Column<CrmLead>[] = [
    { key: "no", header: "No", render: (l) => <span className="font-semibold">{l.leadNo || "—"}</span> },
    { key: "name", header: "Name", render: (l) => l.name },
    { key: "source", header: "Source", render: (l) => l.source || "—" },
    { key: "interest", header: "Interest", render: (l) => l.serviceInterest || "—" },
    { key: "status", header: "Status", render: (l) => <Pill value={l.status} tone={statusTone(l.status)} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            title="View"
            aria-label={`View ${l.leadNo || l.name}`}
            onClick={() => openView(l)}
            className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          >
            <Eye size={13} />
          </button>
          {can("lead:manage") && (
            <>
              <button
                type="button"
                title="Edit"
                aria-label={`Edit ${l.leadNo || l.name}`}
                onClick={() => openEdit(l)}
                className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                title="Delete"
                aria-label={`Delete ${l.leadNo || l.name}`}
                onClick={() => setDeleting(l)}
                className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:border-red-400 hover:text-red-500"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Users}
        title="CRM leads"
        subtitle="Web, walk-in, phone, WhatsApp, Facebook, and referral leads."
        breadcrumb={[{ label: "CRM" }, { label: "Leads" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CrmModuleNav />
      <CrmJourneyBanner stage="lead" />
      <StatStrip>
        <KpiCard label="Total leads" value={rows.length} />
        <KpiCard label="Open" value={stats.open} tone="accent" />
        <KpiCard label="Converted" value={stats.converted} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="lead:manage">
        <Surface>
          <SurfaceHeader title="Create lead" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4 sm:p-5">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Source</label>
              <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value)}>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Interest</label>
              <select className={inputCls} value={serviceInterest} onChange={(e) => setServiceInterest(e.target.value)}>
                {QUOTE_SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <PackagePicker value={packageId} onChange={(id) => setPackageId(id)} label="Package (optional)" />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Create lead
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Can perm="crm:convert">
        <Surface padded className="flex flex-wrap items-end gap-2">
          <div className="min-w-[180px]">
            <label className={labelCls}>Convert lead</label>
            <select className={inputCls} value={convertLeadId} onChange={(e) => setConvertLeadId(e.target.value)}>
              <option value="">Select…</option>
              {rows
                .filter((l) => l.status !== "converted")
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.leadNo || l.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Case type</label>
            <select className={inputCls} value={convertService} onChange={(e) => setConvertService(e.target.value)}>
              {QUOTE_SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={() => void convert()} className={btnGhost}>
            Convert to case
          </button>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader
          title={`${rows.length} lead${rows.length === 1 ? "" : "s"}`}
          action={
            <Link className="text-[11px] font-semibold text-[var(--accent)] hover:underline" to="/crm/opportunities">
              Opportunities →
            </Link>
          }
        />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No leads yet" />
      </Surface>

      {/* View / Edit drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/30" onClick={() => setDrawer(null)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l border-[var(--border)] bg-[var(--card)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">
                {drawer.mode === "view" ? "Lead details" : "Edit lead"}
                <span className="ml-2 text-[12px] font-normal text-[var(--muted-foreground)]">{drawer.lead.leadNo}</span>
              </h2>
              <button type="button" aria-label="Close" onClick={() => setDrawer(null)} className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                <X size={16} />
              </button>
            </div>

            {drawer.mode === "view" ? (
              <dl className="space-y-2.5 text-[12.5px]">
                {[
                  ["No", drawer.lead.leadNo],
                  ["Name", drawer.lead.name],
                  ["Phone", drawer.lead.phone],
                  ["Email", drawer.lead.email],
                  ["Source", drawer.lead.source],
                  ["Interest", drawer.lead.serviceInterest],
                  ["Priority", drawer.lead.priority],
                  ["Status", drawer.lead.status],
                  ["Notes", drawer.lead.notes],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex gap-3 border-b border-[var(--border)] pb-2">
                    <dt className="w-24 shrink-0 font-semibold text-[var(--muted-foreground)]">{k}</dt>
                    <dd className="min-w-0 break-words">{v || "—"}</dd>
                  </div>
                ))}
                {can("lead:manage") && (
                  <button type="button" className={`${btnPrimary} mt-2`} style={btnPrimaryStyle} onClick={() => openEdit(drawer.lead)}>
                    <Pencil size={13} /> Edit this lead
                  </button>
                )}
              </dl>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input className={inputCls} value={edit.name || ""} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input className={inputCls} value={edit.phone || ""} onChange={(e) => setEdit((s) => ({ ...s, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input className={inputCls} value={edit.email || ""} onChange={(e) => setEdit((s) => ({ ...s, email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Source</label>
                    <select className={inputCls} value={edit.source || ""} onChange={(e) => setEdit((s) => ({ ...s, source: e.target.value }))}>
                      {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Interest</label>
                    <select className={inputCls} value={edit.serviceInterest || ""} onChange={(e) => setEdit((s) => ({ ...s, serviceInterest: e.target.value }))}>
                      <option value="">—</option>
                      {QUOTE_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Priority</label>
                    <select className={inputCls} value={edit.priority || "warm"} onChange={(e) => setEdit((s) => ({ ...s, priority: e.target.value }))}>
                      {LEAD_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select className={inputCls} value={edit.status || ""} onChange={(e) => setEdit((s) => ({ ...s, status: e.target.value }))}>
                      {(LEAD_STATUSES.includes(String(edit.status)) ? LEAD_STATUSES : [String(edit.status), ...LEAD_STATUSES]).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea rows={3} className={inputCls} value={edit.notes || ""} onChange={(e) => setEdit((s) => ({ ...s, notes: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" className={btnPrimary} style={btnPrimaryStyle} disabled={busy} onClick={() => void saveEdit()}>
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                  <button type="button" className={btnGhost} onClick={() => setDrawer(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleting(null)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 text-[14px] font-bold text-red-600"><Trash2 size={15} /> Delete lead</h3>
            <p className="mt-2 text-[12.5px] text-[var(--foreground)]">
              Delete <strong>{deleting.leadNo || deleting.name}</strong>{deleting.name ? ` (${deleting.name})` : ""}? This can’t be undone from here.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
