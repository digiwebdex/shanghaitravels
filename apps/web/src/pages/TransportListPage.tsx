import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAgentFilter } from "@/lib/useAgentFilter";
import { Briefcase, Car, Eye, FileSpreadsheet, Plus, RefreshCw, Search } from "lucide-react";
import { applicationsApi, customersApi, financeApi, usersApi } from "@/lib/services";
import { ScanDocumentPanel } from "@/components/ocr/ScanDocumentPanel";
import { listOf, ApiError } from "@/lib/api";
import type { AppDocument, Application, Customer, Invoice, Journey, StaffUser } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { TransportSummaryHeader, type TransportDetailBundle } from "@/components/transport/TransportSummaryHeader";
import { downloadBlob } from "@/lib/statements";
import {
  KpiCard,
  ListPageShell,
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
  searchInputClassName,
  selectClassName,
} from "@/components/enterprise/Page";
import { ErrorBanner } from "@/components/Feedback";
import { TransportModuleNav } from "@/components/transport/TransportModuleNav";

const fmtD = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");
const isToday = (s?: string | null) => !!s && new Date(s).toDateString() === new Date().toDateString();
const PENDING = new Set(["draft", "in_progress", "docs_required", "on_hold"]);
type Tone = "slate" | "green" | "amber" | "red" | "blue";
function priorityTone(p?: string | null): Tone {
  const v = (p || "").toLowerCase();
  if (v === "urgent") return "red";
  if (v === "high") return "amber";
  return "slate";
}

const STATUSES = [
  "draft",
  "in_progress",
  "docs_required",
  "on_hold",
  "submitted",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

export default function TransportListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"queue" | "reports">("queue");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<TransportDetailBundle | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { agentId } = useAgentFilter();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await applicationsApi.list({
        serviceType: "transport", limit: 100, q: q || undefined, status: status || undefined, agentId,
        expand: "transport,passport", // additive — transport detail + passenger passport
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load transport bookings");
    } finally {
      setLoading(false);
    }
  }, [q, status, agentId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let alive = true;
    usersApi.list().then((u: StaffUser[]) => { if (alive) setStaffMap(Object.fromEntries(u.map((s) => [s.id, s.fullName]))); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!viewId) { setBundle(null); return; }
    const app = rows.find((r) => r.id === viewId);
    if (!app) return;
    let alive = true;
    setBundle(null);
    Promise.all([
      applicationsApi.journey(viewId).catch(() => null as Journey | null),
      financeApi.listInvoices({ applicationId: viewId }).then((r) => listOf<Invoice>(r)).catch(() => [] as Invoice[]),
      applicationsApi.documents(viewId).catch(() => [] as AppDocument[]),
    ]).then(([journey, invoices, documents]) => { if (alive) setBundle({ app, journey, invoices, documents }); });
    return () => { alive = false; };
  }, [viewId, rows]);

  const vehicleTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.transport?.vehicleType).filter(Boolean) as string[])).sort(), [rows]);
  const visible = useMemo(() => rows.filter((r) =>
    (!priority || r.priority === priority) && (!vehicleType || r.transport?.vehicleType === vehicleType),
  ), [rows, priority, vehicleType]);

  const stats = useMemo(() => {
    const done = rows.filter((r) => r.status === "approved" || r.status === "completed").length;
    const active = rows.filter((r) => r.status === "in_progress" || r.status === "submitted").length;
    const hold = rows.filter((r) => r.status === "on_hold" || r.status === "docs_required").length;
    return { done, active, hold };
  }, [rows]);

  // Phase 5 reports (client-side).
  const reports = useMemo(() => {
    const pending = rows.filter((r) => PENDING.has(r.status)).length;
    const pickupToday = rows.filter((r) => isToday(r.transport?.scheduledAt)).length;
    const dropToday = pickupToday; // single scheduledAt per booking; same-day trips
    const completed = rows.filter((r) => r.status === "completed").length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const vehicleUtil = new Set(rows.filter((r) => r.transport?.vehicleNo).map((r) => r.transport!.vehicleNo)).size;
    const byDriver = new Map<string, number>();
    const byExec = new Map<string, { total: number; completed: number; cancelled: number }>();
    for (const r of rows) {
      const dn = r.transport?.driverName || "—";
      byDriver.set(dn, (byDriver.get(dn) || 0) + 1);
      const ex = r.assignedTo ? staffMap[r.assignedTo] || "Assigned" : "Unassigned";
      const e = byExec.get(ex) || { total: 0, completed: 0, cancelled: 0 };
      e.total++;
      if (r.status === "completed") e.completed++;
      if (r.status === "cancelled") e.cancelled++;
      byExec.set(ex, e);
    }
    return {
      pending, pickupToday, dropToday, completed, cancelled, vehicleUtil,
      driver: Array.from(byDriver.entries()).sort((a, b) => b[1] - a[1]),
      exec: Array.from(byExec.entries()).sort((a, b) => b[1].total - a[1].total),
    };
  }, [rows, staffMap]);

  const selectedTransport = visible.find((r) => r.id === selectedKey) || null;
  const allSelected = visible.length > 0 && visible.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && visible.some((r) => selectedIds.has(r.id));
  function openView(a: Application) { setSelectedKey(a.id); setViewId(a.id); }
  function toggleOne(id: string) { setSelectedIds((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  function toggleAll() { setSelectedIds(allSelected ? new Set() : new Set(visible.map((r) => r.id))); }
  function exportExcel(list: Application[]) {
    if (!list.length) return;
    const cols: [string, (a: Application) => string][] = [
      ["Reference", (a) => a.referenceNo], ["Customer", (a) => a.customer?.fullName || ""],
      ["Transport Type", (a) => a.transport?.serviceKind || ""], ["Vehicle", (a) => [a.transport?.vehicleType, a.transport?.vehicleNo].filter(Boolean).join(" ")],
      ["Route", (a) => a.transport?.routeName || [a.transport?.pickupLocation, a.transport?.dropLocation].filter(Boolean).join(" → ")],
      ["Pickup", (a) => a.transport?.pickupLocation || ""], ["Drop", (a) => a.transport?.dropLocation || ""],
      ["Travel Date", (a) => (a.transport?.scheduledAt ? new Date(a.transport.scheduledAt).toLocaleString("en-GB") : "")],
      ["Passengers", (a) => (a.transport?.passengers != null ? String(a.transport.passengers) : "")], ["Driver", (a) => a.transport?.driverName || ""],
      ["Status", (a) => a.status], ["Priority", (a) => a.priority || ""], ["Stage", (a) => `${a.currentStage}/${a.totalStages}`],
      ["Executive", (a) => (a.assignedTo ? staffMap[a.assignedTo] || a.assignedTo : "")],
    ];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [cols.map((c) => c[0]), ...list.map((a) => cols.map((c) => c[1](a)))].map((r) => r.map(esc).join(",")).join("\r\n");
    downloadBlob(list.length === 1 ? `${list[0].referenceNo}.csv` : `transport-${list.length}.csv`, csv, "text/csv;charset=utf-8");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedKey || viewId) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.key === "Enter") { const a = visible.find((x) => x.id === selectedKey); if (a) { e.preventDefault(); openView(a); } }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey, viewId, visible]);

  const columns: Column<Application>[] = [
    { key: "select", className: "w-8", header: (
      <input type="checkbox" aria-label="Select all" className="cursor-pointer" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected; }} onChange={toggleAll} />
    ), render: (a) => (
      <input type="checkbox" aria-label={`Select ${a.referenceNo}`} className="cursor-pointer" checked={selectedIds.has(a.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleOne(a.id)} />
    ) },
    { key: "avatar", header: "", className: "w-10", render: (a) => <Avatar name={a.customer?.fullName} /> },
    { key: "ref", header: "Reference", className: "font-mono font-semibold", render: (a) => (
      <button type="button" onClick={() => openView(a)} className="text-[var(--accent)] hover:underline">{a.referenceNo}</button>
    ) },
    { key: "customer", header: "Customer", render: (a) => (
      <button type="button" onClick={() => openView(a)} className="text-left font-semibold text-[var(--primary)] hover:underline">{a.customer?.fullName || "—"}</button>
    ) },
    { key: "type", header: "Transport Type", render: (a) => (a.transport?.serviceKind ? <Pill value={a.transport.serviceKind} tone="blue" /> : "—") },
    { key: "vehicle", header: "Vehicle", render: (a) => [a.transport?.vehicleType, a.transport?.vehicleNo].filter(Boolean).join(" · ") || "—" },
    { key: "route", header: "Route", render: (a) => a.transport?.routeName || [a.transport?.pickupLocation, a.transport?.dropLocation].filter(Boolean).join(" → ") || "—" },
    { key: "pickup", header: "Pickup", render: (a) => a.transport?.pickupLocation || "—" },
    { key: "drop", header: "Drop", render: (a) => a.transport?.dropLocation || "—" },
    { key: "travel", header: "Travel Date", className: "tabular-nums text-[11px]", render: (a) => fmtD(a.transport?.scheduledAt) },
    { key: "pax", header: "Pax", className: "tabular-nums text-center", render: (a) => (a.transport?.passengers != null ? a.transport.passengers : "—") },
    { key: "exec", header: "Executive", render: (a) => (a.assignedTo ? staffMap[a.assignedTo] || "Assigned" : <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">Unassigned</span>) },
    { key: "priority", header: "Priority", render: (a) => <Pill value={a.priority || "normal"} tone={priorityTone(a.priority)} /> },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
    { key: "stage", header: "Progress", className: "tabular-nums", render: (a) => {
      const pct = a.totalStages ? Math.round((Math.min(a.currentStage, a.totalStages) / a.totalStages) * 100) : 0;
      return (<div className="w-20"><div className="mb-0.5 text-[10px] text-[var(--muted-foreground)]">{a.currentStage}/{a.totalStages}</div><div className="h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div></div>);
    } },
    { key: "actions", header: "Actions", className: "text-right", render: (a) => (
      <div className="flex items-center justify-end gap-1">
        <button type="button" className={`${btnGhost} px-2 py-1`} title="Transport 360" aria-label="View" onClick={() => openView(a)}><Eye size={13} /></button>
        <Link to={`/transport/${a.id}`} className={`${btnGhost} px-2 py-1`} title="Open workspace" aria-label="Workspace"><Briefcase size={13} /></Link>
      </div>
    ) },
  ];

  return (
    <ListPageShell
      lookupFilters
      wide
      icon={Car}
      title="Transport"
      subtitle="Supplier-purchased transfers (no fleet)."
      breadcrumb={[{ label: "Bookings", to: "/transport" }, { label: "Transport" }]}
      moduleNav={<TransportModuleNav />}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}><RefreshCw size={12} /> Refresh</button>
          <Can perm="application:create">
            <Link to="/transport/new" className={btnPrimary} style={btnPrimaryStyle}><Plus size={13} /> New Transport Booking</Link>
          </Can>
        </>
      }
      stats={
        <StatStrip>
          <KpiCard label="Total bookings" value={total} />
          <KpiCard label="In progress" value={stats.active} tone="accent" />
          <KpiCard label="Needs action" value={stats.hold} tone="warning" />
          <KpiCard label="Completed" value={stats.done} tone="success" />
        </StatStrip>
      }
      toolbar={
        <ListToolbar>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load()} placeholder="Search ref / customer…" className={searchInputClassName} aria-label="Search transport bookings" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClassName} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClassName} aria-label="Filter by priority">
            <option value="">All priority</option>
            {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={selectClassName} aria-label="Filter by vehicle type">
            <option value="">All vehicles</option>
            {vehicleTypes.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </ListToolbar>
      }
      error={error}
    >
      <div className="mb-3"><EntityTabs tabs={[{ id: "queue", label: "Queue" }, { id: "reports", label: "Reports" }]} active={mode} onChange={(m) => setMode(m as "queue" | "reports")} /></div>

      {mode === "reports" ? (
        <div className="space-y-3">
          <StatStrip>
            <KpiCard label="Pending trips" value={reports.pending} tone="warning" />
            <KpiCard label="Today's pickup" value={reports.pickupToday} tone="accent" />
            <KpiCard label="Today's drop" value={reports.dropToday} tone="accent" />
            <KpiCard label="Completed" value={reports.completed} tone="success" />
            <KpiCard label="Cancelled" value={reports.cancelled} tone="danger" />
            <KpiCard label="Vehicle utilization" value={reports.vehicleUtil} />
          </StatStrip>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Surface>
              <SurfaceHeader title="Driver performance" hint="Trips per driver." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Driver</th><th className="px-3 py-1.5 text-right">Trips</th></tr></thead>
                  <tbody>{reports.driver.map(([name, n]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{n}</td></tr>))}</tbody>
                </table>
              </div>
            </Surface>
            <Surface>
              <SurfaceHeader title="Executive performance" hint="Bookings handled per executive." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Executive</th><th className="px-3 py-1.5 text-right">Total</th><th className="px-3 py-1.5 text-right">Completed</th><th className="px-3 py-1.5 text-right">Cancelled</th></tr></thead>
                  <tbody>{reports.exec.map(([name, e]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{e.total}</td><td className="px-3 py-1.5 text-right tabular-nums text-emerald-600">{e.completed}</td><td className="px-3 py-1.5 text-right tabular-nums text-red-600">{e.cancelled}</td></tr>))}</tbody>
                </table>
              </div>
            </Surface>
          </div>
        </div>
      ) : (
        <>
          {selectedIds.size > 0 && (
            <Surface>
              <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
                <span className="text-[12px] font-bold text-[var(--foreground)]">{selectedIds.size} selected</span>
                <button type="button" className={btnGhost} onClick={() => exportExcel(visible.filter((r) => selectedIds.has(r.id)))}><FileSpreadsheet size={12} /> Export</button>
                <button type="button" className={`${btnGhost} ml-auto`} onClick={() => setSelectedIds(new Set())}>Clear</button>
              </div>
            </Surface>
          )}
          <Surface>
            <SurfaceHeader
              title={`${visible.length} transport booking${visible.length === 1 ? "" : "s"}`}
              hint={selectedTransport ? `Selected: ${selectedTransport.referenceNo} — Enter to open Transport 360.` : "Click a row to select; double-click to open Transport 360."}
              action={<button type="button" className={btnGhost} disabled={!selectedTransport} title={selectedTransport ? `Export ${selectedTransport.referenceNo}` : "Select a row first"} onClick={() => selectedTransport && exportExcel([selectedTransport])}><FileSpreadsheet size={12} /> Export</button>}
            />
            <DataTable
              rows={visible}
              columns={columns}
              rowKey={(r) => r.id}
              loading={loading}
              emptyTitle="No transport bookings yet"
              emptyHint="Create a booking or adjust filters."
              selectedKey={selectedKey}
              onRowClick={(r) => setSelectedKey(r.id)}
              onRowDoubleClick={(r) => openView(r)}
              rowClassName={(r) => (["cancelled", "rejected"].includes(r.status) ? "opacity-60" : "")}
            />
          </Surface>
        </>
      )}

      <Sheet open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
          <SheetHeader className="sr-only"><SheetTitle>Transport 360</SheetTitle></SheetHeader>
          {viewId && (bundle ? <TransportSummaryHeader bundle={bundle} staffMap={staffMap} /> : <div className="p-8 text-center text-[12px] text-[var(--muted-foreground)]">Loading Transport 360…</div>)}
        </SheetContent>
      </Sheet>
    </ListPageShell>
  );
}

export function NewTransportCasePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void customersApi
      .list({ limit: 200 })
      .then((r) => setCustomers(listOf<Customer>(r)))
      .catch(() => setCustomers([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Select a customer");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cust = customers.find((c) => c.id === customerId);
      const app = await applicationsApi.create({
        serviceType: "transport",
        customerId,
        priority,
        title: title.trim() || `Transport — ${cust?.fullName || "customer"}`,
        direction: "outbound",
      });
      navigate(`/transport/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Car}
        title="New Transport Booking"
        subtitle="Creates an application and applies the active transport workflow template."
        breadcrumb={[
          { label: "Bookings", to: "/transport" },
          { label: "Transport", to: "/transport" },
          { label: "New" },
        ]}
      />
      <TransportModuleNav />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div>
            <label className={labelCls} htmlFor="tp-customer">
              Customer *
            </label>
            <select
              id="tp-customer"
              className={inputCls}
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">— select —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.code})
                </option>
              ))}
            </select>
            <Link to="/customers" className="mt-1 inline-block text-[11px] font-semibold text-[var(--accent)]">
              Create customer first →
            </Link>
            <div className="mt-2">
              <ScanDocumentPanel
                customerId={customerId || undefined}
                defaultDocType="passport"
                title="Scan passport for passenger"
                savePassportOnConfirm={!!customerId}
                onAutofill={() => {
                  /* Passport saved via panel when customer selected; case form has no traveler fields. */
                }}
              />
              {!customerId && (
                <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                  Select a customer first to save the scanned passport.
                </p>
              )}
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="tp-priority">
              Priority
            </label>
            <select id="tp-priority" className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="tp-title">
              Title
            </label>
            <input
              id="tp-title"
              className={inputCls}
              placeholder="Auto if blank"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className={btnPrimary} style={btnPrimaryStyle}>
              {loading ? "Creating…" : "Create booking"}
            </button>
            <button type="button" onClick={() => navigate("/transport")} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
