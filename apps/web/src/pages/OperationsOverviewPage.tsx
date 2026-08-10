import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Bell,
  BookOpen,
  Brain,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  Files,
  Pencil,
  Route,
  Search,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { applicationsApi, financeApi, usersApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import type { AppDocument, Application, Invoice, Journey, StaffUser } from "@/lib/types";
import {
  ListToolbar,
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  searchInputClassName,
} from "@/components/enterprise/Page";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BookingSummaryHeader, type BookingDetail } from "@/components/bookings/BookingSummaryHeader";
import { downloadBlob } from "@/lib/statements";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { OcrOpsWidget } from "@/components/ocr/OcrOpsWidget";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { JourneyContinuity, NextStepBanner } from "@/components/workflow/MasterJourney";
import { bookingWorkspaceHref, serviceCaseHref, serviceLabel } from "@/lib/workflow";

const QUEUE_TABS = [
  { id: "queue", label: "Queue" },
  { id: "today", label: "Today's Tasks" },
  { id: "visa", label: "Visa" },
  { id: "ticket", label: "Ticket" },
  { id: "hotel", label: "Hotel" },
  { id: "transport", label: "Transport" },
  { id: "hajj", label: "Hajj" },
  { id: "documents", label: "Documents" },
  { id: "urgent", label: "Urgent Cases" },
  { id: "completed", label: "Completed" },
] as const;

const HUB_CARDS = [
  { label: "Document Intelligence", to: "/operations/document-intelligence", icon: Brain },
  { label: "Passports", to: "/passports", icon: BookOpen },
  { label: "Documents", to: "/operations/documents", icon: Files },
  { label: "Case Journey", to: "/case-journey", icon: Route },
  { label: "Workflow", to: "/operations/workflow", icon: Workflow },
  { label: "Calendar", to: "/operations/calendar", icon: CalendarDays },
  { label: "Notifications", to: "/operations/notifications", icon: Bell },
  { label: "New booking", to: "/bookings/new", icon: ClipboardList },
];

type Tone = "slate" | "green" | "amber" | "red" | "blue";
function priorityTone(p?: string | null): Tone {
  const v = (p || "").toLowerCase();
  if (v === "urgent") return "red";
  if (v === "high") return "amber";
  return "slate";
}
function bookingBadges(a: Application): { label: string; tone: Tone }[] {
  const out: { label: string; tone: Tone }[] = [];
  if (a.priority && a.priority.toLowerCase() !== "normal") out.push({ label: a.priority, tone: priorityTone(a.priority) });
  if (a.direction) out.push({ label: a.direction, tone: "slate" });
  return out;
}

export default function OperationsOverviewPage() {
  const { can } = useAuth();
  const workspace = workspaceById("operations")!;
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "queue";
  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === "queue") next.delete("tab");
    else next.set("tab", id);
    setParams(next, { replace: true });
  };

  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  // Selection (keyboard target) + booking 360 drawer.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  // Multi-select bulk export.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf<Application>(await applicationsApi.list({ limit: 100 })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  // Edit + Delete for a booking (reuse PATCH/DELETE /applications/:id).
  const [editing, setEditing] = useState<Application | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; priority: string; assignedTo: string }>({ title: "", priority: "medium", assignedTo: "" });
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");

  function openEdit(a: Application) {
    setEditForm({ title: a.title || "", priority: a.priority || "medium", assignedTo: a.assignedTo || "" });
    setEditing(a);
    setError("");
    setOk("");
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      await applicationsApi.update(editing.id, {
        title: editForm.title.trim() || undefined,
        priority: editForm.priority,
        assignedTo: editForm.assignedTo || null,
      });
      setOk(`Booking ${editing.referenceNo} updated`);
      setEditing(null);
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
      await applicationsApi.remove(deleting.id);
      setOk(`Booking ${deleting.referenceNo} deleted`);
      setDeleting(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  // Staff name lookup for the Assigned column (reused usersApi).
  useEffect(() => {
    let alive = true;
    usersApi.list()
      .then((u: StaffUser[]) => { if (alive) setStaffMap(Object.fromEntries(u.map((s) => [s.id, s.fullName]))); })
      .catch(() => { /* non-fatal */ });
    return () => { alive = false; };
  }, []);

  // Booking 360 bundle whenever the drawer opens (parallel, existing endpoints).
  useEffect(() => {
    if (!viewId) { setDetail(null); return; }
    let alive = true;
    setDetail(null);
    Promise.all([
      applicationsApi.get(viewId),
      applicationsApi.journey(viewId).catch(() => null as Journey | null),
      financeApi.listInvoices({ applicationId: viewId }).then((r) => listOf<Invoice>(r)).catch(() => [] as Invoice[]),
      applicationsApi.documents(viewId).catch(() => [] as AppDocument[]),
    ])
      .then(([app, journey, invoices, documents]) => { if (alive) setDetail({ app, journey, invoices, documents }); })
      .catch(() => { if (alive) setDetail(null); });
    return () => { alive = false; };
  }, [viewId]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    switch (tab) {
      case "visa": return rows.filter((r) => r.serviceType === "visa");
      case "ticket": return rows.filter((r) => r.serviceType === "air_ticket");
      case "hotel": return rows.filter((r) => r.serviceType === "hotel");
      case "transport": return rows.filter((r) => r.serviceType === "transport");
      case "hajj": return rows.filter((r) => r.serviceType === "hajj" || r.serviceType === "umrah");
      case "documents": return rows.filter((r) => r.status === "docs_required");
      case "urgent": return rows.filter((r) => r.priority === "urgent" || r.priority === "high");
      case "completed": return rows.filter((r) => r.status === "completed");
      case "today": return rows.filter((r) => (r.createdAt || "").startsWith(today) || r.status === "in_progress");
      default: return rows.filter((r) => !["completed", "cancelled", "rejected"].includes(r.status));
    }
  }, [rows, tab]);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return filtered;
    return filtered.filter((a) =>
      `${a.referenceNo} ${a.customer?.fullName || ""} ${a.title || ""} ${a.serviceType} ${a.status}`.toLowerCase().includes(s),
    );
  }, [filtered, q]);

  const selectedBooking = visible.find((r) => r.id === selectedKey) || null;
  const allSelected = visible.length > 0 && visible.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && visible.some((r) => selectedIds.has(r.id));

  function openView(a: Application) {
    setSelectedKey(a.id);
    setViewId(a.id);
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(visible.map((r) => r.id)));
  }
  function exportExcel(list: Application[]) {
    if (!list.length) return;
    const cols: [string, (a: Application) => string][] = [
      ["Reference", (a) => a.referenceNo], ["Service", (a) => serviceLabel(a.serviceType)],
      ["Customer", (a) => a.customer?.fullName || a.title || ""], ["Status", (a) => a.status],
      ["Stage", (a) => `${a.currentStage}/${a.totalStages}`], ["Priority", (a) => a.priority || ""],
      ["Direction", (a) => a.direction || ""], ["Assigned", (a) => (a.assignedTo ? staffMap[a.assignedTo] || a.assignedTo : "")],
      ["Created", (a) => (a.createdAt ? String(a.createdAt).slice(0, 10) : "")],
    ];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [cols.map((c) => c[0]), ...list.map((a) => cols.map((c) => c[1](a)))].map((r) => r.map(esc).join(",")).join("\r\n");
    downloadBlob(list.length === 1 ? `${list[0].referenceNo}.csv` : `bookings-${list.length}.csv`, csv, "text/csv;charset=utf-8");
  }

  // Enter → open booking 360 for the selected row.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedKey || viewId) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "Enter") {
        const a = visible.find((x) => x.id === selectedKey);
        if (a) { e.preventDefault(); openView(a); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey, viewId, visible]);

  const columns: Column<Application>[] = [
    {
      key: "select",
      className: "w-8",
      header: (
        <input type="checkbox" aria-label="Select all bookings" className="cursor-pointer" checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected; }} onChange={toggleAll} />
      ),
      render: (a) => (
        <input type="checkbox" aria-label={`Select ${a.referenceNo}`} className="cursor-pointer" checked={selectedIds.has(a.id)}
          onClick={(e) => e.stopPropagation()} onChange={() => toggleOne(a.id)} />
      ),
    },
    { key: "avatar", header: "", className: "w-10", render: (a) => <Avatar name={a.customer?.fullName || a.title} /> },
    {
      key: "ref",
      header: "Reference",
      className: "font-mono font-semibold",
      render: (a) => (
        <button type="button" onClick={() => openView(a)} className="text-[var(--accent)] hover:underline">{a.referenceNo}</button>
      ),
    },
    { key: "service", header: "Service", render: (a) => <Pill value={serviceLabel(a.serviceType)} tone="blue" /> },
    {
      key: "customer",
      header: "Customer",
      render: (a) => {
        const badges = bookingBadges(a);
        return (
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => openView(a)} className="text-left font-semibold text-[var(--primary)] hover:underline">
              {a.customer?.fullName || a.title || "—"}
            </button>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1">{badges.map((b) => <Pill key={b.label} value={b.label} tone={b.tone} />)}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "stage",
      header: "Stage",
      className: "tabular-nums",
      render: (a) => {
        const pct = a.totalStages ? Math.round((Math.min(a.currentStage, a.totalStages) / a.totalStages) * 100) : 0;
        return (
          <div className="w-24">
            <div className="mb-0.5 text-[10px] text-[var(--muted-foreground)]">{a.currentStage}/{a.totalStages}</div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
    { key: "assigned", header: "Assigned", render: (a) => (a.assignedTo ? staffMap[a.assignedTo] || "Assigned" : <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">Unassigned</span>) },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" className={`${btnGhost} px-2 py-1`} title="View (Booking 360)" aria-label={`View ${a.referenceNo}`} onClick={() => openView(a)}>
            <Eye size={13} />
          </button>
          {can("application:update") && (
            <button type="button" className={`${btnGhost} px-2 py-1`} title="Edit" aria-label={`Edit ${a.referenceNo}`} onClick={() => openEdit(a)}>
              <Pencil size={13} />
            </button>
          )}
          {can("application:delete") && (
            <button
              type="button"
              className={`${btnGhost} px-2 py-1 hover:!border-red-400 hover:!text-red-500`}
              title="Delete"
              aria-label={`Delete ${a.referenceNo}`}
              onClick={() => setDeleting(a)}
            >
              <Trash2 size={13} />
            </button>
          )}
          <Link to={bookingWorkspaceHref(a.id)} className={`${btnGhost} px-2 py-1`} title="Open workspace" aria-label="Workspace">
            <Briefcase size={13} />
          </Link>
          <Link to={serviceCaseHref(a.serviceType, a.id)} className="px-1 text-[11px] font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)]" title="Service desk">
            Desk →
          </Link>
        </div>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        title="Operations Workspace"
        subtitle="One queue for every booking — stay here instead of jumping between service modules."
        breadcrumb={[{ label: "Operations" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>Refresh</button>
        }
      />
      <JourneyContinuity active="operations" previousHint="Booking created · documents in OCR" nextHint="Invoice → collect → mark travel ready" />
      <WorkspaceTabsCompact workspace={workspace} />

      <NextStepBanner
        title="Work the queue, not the menus"
        body="Open Booking 360 for documents, OCR, finance and audit. Use the service desk only for deep visa/ticket/hotel processing."
        actions={[
          { label: "Unified booking", to: "/bookings/new", primary: true },
          { label: "Document Intelligence", to: "/operations/document-intelligence" },
          { label: "Urgent cases", to: "/operations?tab=urgent" },
        ]}
      />

      <div className="mb-4">
        <OcrOpsWidget />
      </div>

      {/* Queue strip (kept) */}
      <EntityTabs tabs={[...QUEUE_TABS]} active={tab} onChange={setTab} />

      {selectedIds.size > 0 && (
        <Surface>
          <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
            <span className="text-[12px] font-bold text-[var(--foreground)]">{selectedIds.size} selected</span>
            <span className="text-[11px] text-[var(--muted-foreground)]">Bulk actions:</span>
            <button type="button" className={btnGhost} onClick={() => exportExcel(visible.filter((r) => selectedIds.has(r.id)))}>
              <FileSpreadsheet size={12} /> Export
            </button>
            <button type="button" className={`${btnGhost} ml-auto`} onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        </Surface>
      )}

      <Surface className="mt-3">
        <SurfaceHeader
          title={`${visible.length} booking${visible.length === 1 ? "" : "s"} in this queue`}
          hint={selectedBooking ? `Selected: ${selectedBooking.referenceNo} — Enter to open Booking 360.` : "Click a row to select; double-click to open Booking 360."}
          action={
            <button type="button" className={btnGhost} disabled={!selectedBooking} title={selectedBooking ? `Export ${selectedBooking.referenceNo}` : "Select a booking row first"}
              onClick={() => selectedBooking && exportExcel([selectedBooking])}>
              <FileSpreadsheet size={12} /> Export
            </button>
          }
        />
        <ListToolbar>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference / customer / service / status…" className={searchInputClassName} />
          </div>
        </ListToolbar>
        {error && <p className="mb-2 px-4 text-[11px] text-[var(--error)]">{error}</p>}
        <DataTable
          rows={visible}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No cases in this queue"
          emptyHint="Switch tabs or start a booking from the unified wizard."
          selectedKey={selectedKey}
          onRowClick={(r) => setSelectedKey(r.id)}
          onRowDoubleClick={(r) => openView(r)}
          rowClassName={(r) => (["cancelled", "rejected"].includes(r.status) ? "opacity-60" : "")}
        />
      </Surface>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {HUB_CARDS.map((c) => (
          <Link key={c.to} to={c.to}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-md)]">
            <c.icon size={18} className="text-[var(--accent)]" />
            <p className="mt-3 text-[14px] font-bold text-[var(--primary)]">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Booking 360 drawer — reuses Sheet + BookingSummaryHeader, no navigation away. */}
      <Sheet open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Booking 360</SheetTitle>
          </SheetHeader>
          {viewId && (
            detail ? <BookingSummaryHeader detail={detail} staffMap={staffMap} />
              : <div className="p-8 text-center text-[12px] text-[var(--muted-foreground)]">Loading booking 360…</div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit booking */}
      {editing && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-bold">Edit booking <span className="ml-1 text-[12px] font-normal text-[var(--muted-foreground)]">{editing.referenceNo}</span></h3>
              <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"><X size={16} /></button>
            </div>
            {error && <p className="mb-2 text-[11.5px] text-red-600">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Title</label>
                <input className={inputCls} value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} placeholder="Optional label" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Priority</label>
                  <select className={inputCls} value={editForm.priority} onChange={(e) => setEditForm((s) => ({ ...s, priority: e.target.value }))}>
                    {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Assigned to</label>
                  <select className={inputCls} value={editForm.assignedTo} onChange={(e) => setEditForm((s) => ({ ...s, assignedTo: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {Object.entries(staffMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[10.5px] text-[var(--muted-foreground)]">Status advances through the workflow — advance stages in Booking 360, not here.</p>
              <div className="flex gap-2 pt-1">
                <button type="button" className={btnPrimary} style={btnPrimaryStyle} disabled={busy} onClick={() => void saveEdit()}>{busy ? "Saving…" : "Save changes"}</button>
                <button type="button" className={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete booking confirm */}
      {deleting && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleting(null)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 text-[14px] font-bold text-red-600"><Trash2 size={15} /> Delete booking</h3>
            <p className="mt-2 text-[12.5px]">Delete <strong>{deleting.referenceNo}</strong> ({deleting.serviceType.replace(/_/g, " ")})? It is soft-deleted and removed from the queue.</p>
            {error && <p className="mt-2 text-[11.5px] text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
              <button type="button" disabled={busy} onClick={() => void confirmDelete()} className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50">{busy ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

      {ok && (
        <div className="fixed bottom-5 left-1/2 z-[85] -translate-x-1/2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-[12px] font-semibold text-emerald-800 shadow" onClick={() => setOk("")}>
          {ok}
        </div>
      )}
    </PageShell>
  );
}
