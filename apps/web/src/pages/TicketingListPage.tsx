import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAgentFilter } from "@/lib/useAgentFilter";
import { Briefcase, Eye, FileSpreadsheet, Plane, Plus, RefreshCw, Search } from "lucide-react";
import { applicationsApi, customersApi, financeApi, usersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { AppDocument, Application, Customer, Invoice, Journey, StaffUser } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { TicketSummaryHeader, type TicketDetailBundle } from "@/components/ticketing/TicketSummaryHeader";
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

import { ScanDocumentPanel, ocrFullName } from "@/components/ocr/ScanDocumentPanel";

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

export default function TicketingListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [airline, setAirline] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"queue" | "reports">("queue");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<TicketDetailBundle | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { agentId } = useAgentFilter();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await applicationsApi.list({
        serviceType: "air_ticket", limit: 100, q: q || undefined, status: status || undefined, agentId,
        expand: "ticket,passport", // additive — airTicket detail + passenger passport
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load air ticket cases");
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

  const airlines = useMemo(() => Array.from(new Set(rows.map((r) => r.airTicket?.airline).filter(Boolean) as string[])).sort(), [rows]);
  const visible = useMemo(() => rows.filter((r) =>
    (!priority || r.priority === priority) && (!airline || r.airTicket?.airline === airline),
  ), [rows, priority, airline]);

  const stats = useMemo(() => {
    const done = rows.filter((r) => r.status === "approved" || r.status === "completed").length;
    const active = rows.filter((r) => r.status === "in_progress" || r.status === "submitted").length;
    const hold = rows.filter((r) => r.status === "on_hold" || r.status === "docs_required").length;
    return { done, active, hold };
  }, [rows]);

  // Phase 5 reports (client-side).
  const reports = useMemo(() => {
    const pending = rows.filter((r) => PENDING.has(r.status)).length;
    const issuedToday = rows.filter((r) => (r.airTicket?.ticketNo || r.airTicket?.pnr) && isToday(r.createdAt)).length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const refunded = rows.filter((r) => r.status === "cancelled" && (r.title || "").toLowerCase().includes("refund")).length;
    const travelToday = rows.filter((r) => isToday(r.airTicket?.departAt)).length;
    const revenue = 0; // shown via finance module; placeholder KPI kept out of client sum
    const byAirline = new Map<string, number>();
    const byExec = new Map<string, { total: number; issued: number; cancelled: number }>();
    for (const r of rows) {
      const al = r.airTicket?.airline || "—";
      byAirline.set(al, (byAirline.get(al) || 0) + 1);
      const ex = r.assignedTo ? staffMap[r.assignedTo] || "Assigned" : "Unassigned";
      const e = byExec.get(ex) || { total: 0, issued: 0, cancelled: 0 };
      e.total++;
      if (r.airTicket?.ticketNo) e.issued++;
      if (r.status === "cancelled") e.cancelled++;
      byExec.set(ex, e);
    }
    return {
      pending, issuedToday, cancelled, refunded, travelToday, revenue,
      airline: Array.from(byAirline.entries()).sort((a, b) => b[1] - a[1]),
      exec: Array.from(byExec.entries()).sort((a, b) => b[1].total - a[1].total),
    };
  }, [rows, staffMap]);

  const selectedTicket = visible.find((r) => r.id === selectedKey) || null;
  const allSelected = visible.length > 0 && visible.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && visible.some((r) => selectedIds.has(r.id));
  function openView(a: Application) { setSelectedKey(a.id); setViewId(a.id); }
  function toggleOne(id: string) { setSelectedIds((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  function toggleAll() { setSelectedIds(allSelected ? new Set() : new Set(visible.map((r) => r.id))); }
  function exportExcel(list: Application[]) {
    if (!list.length) return;
    const cols: [string, (a: Application) => string][] = [
      ["Reference", (a) => a.referenceNo], ["Customer", (a) => a.customer?.fullName || ""],
      ["Passenger", (a) => a.airTicket?.passengerName || a.customer?.fullName || ""], ["Airline", (a) => a.airTicket?.airline || ""],
      ["PNR", (a) => a.airTicket?.pnr || ""], ["Route", (a) => [a.airTicket?.origin, a.airTicket?.destination].filter(Boolean).join(" → ")],
      ["Journey", (a) => fmtD(a.airTicket?.departAt)], ["Status", (a) => a.status], ["Priority", (a) => a.priority || ""],
      ["Stage", (a) => `${a.currentStage}/${a.totalStages}`], ["Executive", (a) => (a.assignedTo ? staffMap[a.assignedTo] || a.assignedTo : "")],
    ];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [cols.map((c) => c[0]), ...list.map((a) => cols.map((c) => c[1](a)))].map((r) => r.map(esc).join(",")).join("\r\n");
    downloadBlob(list.length === 1 ? `${list[0].referenceNo}.csv` : `tickets-${list.length}.csv`, csv, "text/csv;charset=utf-8");
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
    { key: "avatar", header: "", className: "w-10", render: (a) => <Avatar name={a.airTicket?.passengerName || a.customer?.fullName} /> },
    { key: "ref", header: "Reference", className: "font-mono font-semibold", render: (a) => (
      <button type="button" onClick={() => openView(a)} className="text-[var(--accent)] hover:underline">{a.referenceNo}</button>
    ) },
    { key: "customer", header: "Customer", render: (a) => (
      <button type="button" onClick={() => openView(a)} className="text-left font-semibold text-[var(--primary)] hover:underline">{a.customer?.fullName || "—"}</button>
    ) },
    { key: "passenger", header: "Passenger", render: (a) => a.airTicket?.passengerName || "—" },
    { key: "airline", header: "Airline", render: (a) => (a.airTicket?.airline ? <Pill value={a.airTicket.airline} tone="blue" /> : "—") },
    { key: "pnr", header: "PNR", className: "font-mono text-[11px]", render: (a) => a.airTicket?.pnr || "—" },
    { key: "route", header: "Route", render: (a) => [a.airTicket?.origin, a.airTicket?.destination].filter(Boolean).join(" → ") || "—" },
    { key: "journey", header: "Journey", className: "tabular-nums text-[11px]", render: (a) => fmtD(a.airTicket?.departAt) },
    { key: "exec", header: "Executive", render: (a) => (a.assignedTo ? staffMap[a.assignedTo] || "Assigned" : <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">Unassigned</span>) },
    { key: "stage", header: "Stage", className: "tabular-nums", render: (a) => {
      const pct = a.totalStages ? Math.round((Math.min(a.currentStage, a.totalStages) / a.totalStages) * 100) : 0;
      return (<div className="w-20"><div className="mb-0.5 text-[10px] text-[var(--muted-foreground)]">{a.currentStage}/{a.totalStages}</div><div className="h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div></div>);
    } },
    { key: "priority", header: "Priority", render: (a) => <Pill value={a.priority || "normal"} tone={priorityTone(a.priority)} /> },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
    { key: "actions", header: "Actions", className: "text-right", render: (a) => (
      <div className="flex items-center justify-end gap-1">
        <button type="button" className={`${btnGhost} px-2 py-1`} title="Ticket 360" aria-label="View" onClick={() => openView(a)}><Eye size={13} /></button>
        <Link to={`/ticketing/${a.id}`} className={`${btnGhost} px-2 py-1`} title="Open workspace" aria-label="Workspace"><Briefcase size={13} /></Link>
      </div>
    ) },
  ];

  return (
    <ListPageShell
      lookupFilters
      wide
      icon={Plane}
      title="Air Ticketing"
      subtitle="Manual PNR / ticket records (no GDS)."
      breadcrumb={[{ label: "Bookings", to: "/ticketing" }, { label: "Air Ticketing" }]}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}><RefreshCw size={12} /> Refresh</button>
          <Can perm="application:create">
            <Link to="/ticketing/new" className={btnPrimary} style={btnPrimaryStyle}><Plus size={13} /> New Air Ticket Case</Link>
          </Can>
        </>
      }
      stats={
        <StatStrip>
          <KpiCard label="Total cases" value={total} />
          <KpiCard label="In progress" value={stats.active} tone="accent" />
          <KpiCard label="Needs action" value={stats.hold} tone="warning" />
          <KpiCard label="Completed" value={stats.done} tone="success" />
        </StatStrip>
      }
      toolbar={
        <ListToolbar>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load()} placeholder="Search ref / customer…" className={searchInputClassName} aria-label="Search air ticket cases" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClassName} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClassName} aria-label="Filter by priority">
            <option value="">All priority</option>
            {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={airline} onChange={(e) => setAirline(e.target.value)} className={selectClassName} aria-label="Filter by airline">
            <option value="">All airlines</option>
            {airlines.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </ListToolbar>
      }
      error={error}
    >
      <div className="mb-3"><EntityTabs tabs={[{ id: "queue", label: "Queue" }, { id: "reports", label: "Reports" }]} active={mode} onChange={(m) => setMode(m as "queue" | "reports")} /></div>

      {mode === "reports" ? (
        <div className="space-y-3">
          <StatStrip>
            <KpiCard label="Pending tickets" value={reports.pending} tone="warning" />
            <KpiCard label="Issued today" value={reports.issuedToday} tone="accent" />
            <KpiCard label="Cancelled" value={reports.cancelled} tone="danger" />
            <KpiCard label="Refunded" value={reports.refunded} />
            <KpiCard label="Travel today" value={reports.travelToday} tone="success" />
          </StatStrip>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Surface>
              <SurfaceHeader title="Airline performance" hint="Cases per airline." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Airline</th><th className="px-3 py-1.5 text-right">Cases</th></tr></thead>
                  <tbody>{reports.airline.map(([name, n]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{n}</td></tr>))}</tbody>
                </table>
              </div>
            </Surface>
            <Surface>
              <SurfaceHeader title="Executive performance" hint="Tickets handled per executive." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Executive</th><th className="px-3 py-1.5 text-right">Total</th><th className="px-3 py-1.5 text-right">Issued</th><th className="px-3 py-1.5 text-right">Cancelled</th></tr></thead>
                  <tbody>{reports.exec.map(([name, e]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{e.total}</td><td className="px-3 py-1.5 text-right tabular-nums text-emerald-600">{e.issued}</td><td className="px-3 py-1.5 text-right tabular-nums text-red-600">{e.cancelled}</td></tr>))}</tbody>
                </table>
              </div>
            </Surface>
          </div>
          <p className="px-1 text-[10.5px] text-[var(--muted-foreground)]">Revenue is reported in the Finance module (per-invoice); not summed here.</p>
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
              title={`${visible.length} ticket case${visible.length === 1 ? "" : "s"}`}
              hint={selectedTicket ? `Selected: ${selectedTicket.referenceNo} — Enter to open Ticket 360.` : "Click a row to select; double-click to open Ticket 360."}
              action={<button type="button" className={btnGhost} disabled={!selectedTicket} title={selectedTicket ? `Export ${selectedTicket.referenceNo}` : "Select a row first"} onClick={() => selectedTicket && exportExcel([selectedTicket])}><FileSpreadsheet size={12} /> Export</button>}
            />
            <DataTable
              rows={visible}
              columns={columns}
              rowKey={(r) => r.id}
              loading={loading}
              emptyTitle="No air ticket cases yet"
              emptyHint="Create a case, then enter PNR / flight details from your consolidator."
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
          <SheetHeader className="sr-only"><SheetTitle>Ticket 360</SheetTitle></SheetHeader>
          {viewId && (bundle ? <TicketSummaryHeader bundle={bundle} staffMap={staffMap} /> : <div className="p-8 text-center text-[12px] text-[var(--muted-foreground)]">Loading Ticket 360…</div>)}
        </SheetContent>
      </Sheet>
    </ListPageShell>
  );
}

export function NewTicketingCasePage() {
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
        serviceType: "air_ticket",
        customerId,
        priority,
        title: title.trim() || `Air ticket — ${cust?.fullName || "customer"}`,
        direction: "outbound",
      });
      navigate(`/ticketing/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create case");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Plane}
        title="New Air Ticket Case"
        subtitle="Creates an application and applies the active air_ticket workflow template."
        breadcrumb={[
          { label: "Bookings", to: "/ticketing" },
          { label: "Air Ticketing", to: "/ticketing" },
          { label: "New" },
        ]}
      />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div>
            <label className={labelCls} htmlFor="tk-customer">
              Customer *
            </label>
            <select
              id="tk-customer"
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
                title="Scan passenger passport"
                savePassportOnConfirm={!!customerId}
                onAutofill={(fields) => {
                  const name = ocrFullName(fields);
                  if (name) setTitle((t) => t || `Air ticket — ${name}`);
                }}
              />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="tk-priority">
              Priority
            </label>
            <select id="tk-priority" className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="tk-title">
              Title
            </label>
            <input
              id="tk-title"
              className={inputCls}
              placeholder="Auto if blank"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className={btnPrimary} style={btnPrimaryStyle}>
              {loading ? "Creating…" : "Create case"}
            </button>
            <button type="button" onClick={() => navigate("/ticketing")} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
