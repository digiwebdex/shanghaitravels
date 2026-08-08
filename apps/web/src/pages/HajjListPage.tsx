import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAgentFilter } from "@/lib/useAgentFilter";
import { Briefcase, Eye, FileSpreadsheet, Moon, Plus, RefreshCw, Search } from "lucide-react";
import { applicationsApi, customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { HajjSummaryHeader } from "@/components/hajj/HajjSummaryHeader";
import { exportCaseCsv, useCaseQueue } from "@/lib/useCaseQueue";
import { fmtD, isToday, priorityTone } from "@/components/enterprise/CaseSummary";
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
import { HajjModuleNav } from "@/components/hajj/HajjModuleNav";
import { ScanDocumentPanel, ocrFullName } from "@/components/ocr/ScanDocumentPanel";

const PENDING = new Set(["draft", "in_progress", "docs_required", "on_hold"]);

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

export default function HajjListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"queue" | "reports">("queue");

  const { agentId } = useAgentFilter();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const types = kind ? [kind] : ["hajj", "umrah"];
      const results = await Promise.all(
        types.map((serviceType) =>
          applicationsApi.list({
            serviceType, limit: 100, q: q || undefined, status: status || undefined, agentId,
            expand: "hajj,passport", // additive — hajjUmrah detail + pilgrim passport
          }),
        ),
      );
      const data = results.flatMap((r) => listOf<Application>(r));
      data.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setRows(data);
      setTotal(data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load Hajj/Umrah bookings");
    } finally {
      setLoading(false);
    }
  }, [q, status, kind, agentId]);

  useEffect(() => { void load(); }, [load]);

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.hajjUmrah?.packageCategory).filter(Boolean) as string[])).sort(), [rows]);
  const visible = useMemo(() => rows.filter((r) =>
    (!priority || r.priority === priority) && (!category || r.hajjUmrah?.packageCategory === category),
  ), [rows, priority, category]);

  const qc = useCaseQueue(visible);

  const stats = useMemo(() => {
    const done = rows.filter((r) => r.status === "approved" || r.status === "completed").length;
    const active = rows.filter((r) => r.status === "in_progress" || r.status === "submitted").length;
    const hold = rows.filter((r) => r.status === "on_hold" || r.status === "docs_required").length;
    return { done, active, hold };
  }, [rows]);

  // Phase 5 reports (client-side over the loaded rows).
  const reports = useMemo(() => {
    const pending = rows.filter((r) => PENDING.has(r.status)).length;
    const visaApproved = rows.filter((r) => (r.hajjUmrah?.visaStatus || "").toLowerCase() === "approved").length;
    const visaPending = rows.filter((r) => ["not_applied", "applied"].includes((r.hajjUmrah?.visaStatus || "").toLowerCase())).length;
    const departuresToday = rows.filter((r) => isToday(r.hajjUmrah?.departureDate)).length;
    const onGround = rows.filter((r) => {
      const d = r.hajjUmrah?.departureDate ? new Date(r.hajjUmrah.departureDate).getTime() : null;
      const ret = r.hajjUmrah?.returnDate ? new Date(r.hajjUmrah.returnDate).getTime() : null;
      return d != null && ret != null && d <= Date.now() && Date.now() <= ret && !["cancelled", "rejected"].includes(r.status);
    }).length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const byGroup = new Map<string, number>();
    const byExec = new Map<string, { total: number; visaApproved: number; cancelled: number }>();
    for (const r of rows) {
      byGroup.set(r.hajjUmrah?.groupName || r.hajjUmrah?.groupCode || "—", (byGroup.get(r.hajjUmrah?.groupName || r.hajjUmrah?.groupCode || "—") || 0) + 1);
      const ex = r.assignedTo ? qc.staffMap[r.assignedTo] || "Assigned" : "Unassigned";
      const e = byExec.get(ex) || { total: 0, visaApproved: 0, cancelled: 0 };
      e.total++;
      if ((r.hajjUmrah?.visaStatus || "").toLowerCase() === "approved") e.visaApproved++;
      if (r.status === "cancelled") e.cancelled++;
      byExec.set(ex, e);
    }
    return {
      pending, visaApproved, visaPending, departuresToday, onGround, cancelled,
      group: Array.from(byGroup.entries()).sort((a, b) => b[1] - a[1]) as [string, number][],
      exec: Array.from(byExec.entries()).sort((a, b) => b[1].total - a[1].total) as [string, { total: number; visaApproved: number; cancelled: number }][],
    };
  }, [rows, qc.staffMap]);

  const CSV_COLS: [string, (a: Application) => string][] = [
    ["Reference", (a) => a.referenceNo], ["Kind", (a) => a.serviceType],
    ["Pilgrim", (a) => a.hajjUmrah?.pilgrimName || a.customer?.fullName || ""],
    ["Passport", (a) => a.hajjUmrah?.passportNo || a.customer?.passports?.[0]?.passportNo || ""],
    ["Package", (a) => a.hajjUmrah?.packageName || ""], ["Category", (a) => a.hajjUmrah?.packageCategory || ""],
    ["Group", (a) => a.hajjUmrah?.groupName || a.hajjUmrah?.groupCode || ""],
    ["Departure", (a) => fmtD(a.hajjUmrah?.departureDate)], ["Return", (a) => fmtD(a.hajjUmrah?.returnDate)],
    ["Visa", (a) => a.hajjUmrah?.visaStatus || ""], ["Status", (a) => a.status], ["Priority", (a) => a.priority || ""],
    ["Stage", (a) => `${a.currentStage}/${a.totalStages}`],
    ["Executive", (a) => (a.assignedTo ? qc.staffMap[a.assignedTo] || a.assignedTo : "")],
  ];

  const columns: Column<Application>[] = [
    { key: "select", className: "w-8", header: (
      <input type="checkbox" aria-label="Select all" className="cursor-pointer" checked={qc.allSelected} ref={(el) => { if (el) el.indeterminate = qc.someSelected; }} onChange={qc.toggleAll} />
    ), render: (a) => (
      <input type="checkbox" aria-label={`Select ${a.referenceNo}`} className="cursor-pointer" checked={qc.selectedIds.has(a.id)} onClick={(e) => e.stopPropagation()} onChange={() => qc.toggleOne(a.id)} />
    ) },
    { key: "avatar", header: "", className: "w-10", render: (a) => <Avatar name={a.hajjUmrah?.pilgrimName || a.customer?.fullName} /> },
    { key: "ref", header: "Reference", className: "font-mono font-semibold", render: (a) => (
      <button type="button" onClick={() => qc.openView(a)} className="text-[var(--accent)] hover:underline">{a.referenceNo}</button>
    ) },
    { key: "kind", header: "Kind", render: (a) => <Pill value={a.serviceType === "umrah" ? "Umrah" : "Hajj"} tone="blue" /> },
    { key: "pilgrim", header: "Pilgrim", render: (a) => (
      <button type="button" onClick={() => qc.openView(a)} className="text-left font-semibold text-[var(--primary)] hover:underline">{a.hajjUmrah?.pilgrimName || a.customer?.fullName || "—"}</button>
    ) },
    { key: "package", header: "Package", render: (a) => a.hajjUmrah?.packageName || a.title || "—" },
    { key: "group", header: "Group", render: (a) => a.hajjUmrah?.groupName || a.hajjUmrah?.groupCode || "—" },
    { key: "departure", header: "Departure", className: "tabular-nums text-[11px]", render: (a) => fmtD(a.hajjUmrah?.departureDate) },
    { key: "return", header: "Return", className: "tabular-nums text-[11px]", render: (a) => fmtD(a.hajjUmrah?.returnDate) },
    { key: "visa", header: "Visa", render: (a) => (a.hajjUmrah?.visaStatus ? <Pill value={a.hajjUmrah.visaStatus} tone={statusTone(a.hajjUmrah.visaStatus)} /> : "—") },
    { key: "exec", header: "Executive", render: (a) => (a.assignedTo ? qc.staffMap[a.assignedTo] || "Assigned" : <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">Unassigned</span>) },
    { key: "priority", header: "Priority", render: (a) => <Pill value={a.priority || "normal"} tone={priorityTone(a.priority)} /> },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
    { key: "stage", header: "Progress", className: "tabular-nums", render: (a) => {
      const pct = a.totalStages ? Math.round((Math.min(a.currentStage, a.totalStages) / a.totalStages) * 100) : 0;
      return (<div className="w-20"><div className="mb-0.5 text-[10px] text-[var(--muted-foreground)]">{a.currentStage}/{a.totalStages}</div><div className="h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div></div>);
    } },
    { key: "actions", header: "Actions", className: "text-right", render: (a) => (
      <div className="flex items-center justify-end gap-1">
        <button type="button" className={`${btnGhost} px-2 py-1`} title="Hajj 360" aria-label="View" onClick={() => qc.openView(a)}><Eye size={13} /></button>
        <Link to={`/hajj/${a.id}`} className={`${btnGhost} px-2 py-1`} title="Open workspace" aria-label="Workspace"><Briefcase size={13} /></Link>
      </div>
    ) },
  ];

  return (
    <ListPageShell
      lookupFilters
      wide
      icon={Moon}
      title="Hajj & Umrah"
      subtitle="Pilgrims, packages, groups, visas, flights, hotels, payments."
      breadcrumb={[{ label: "Bookings", to: "/hajj" }, { label: "Hajj & Umrah" }]}
      moduleNav={<HajjModuleNav />}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}><RefreshCw size={12} /> Refresh</button>
          <Can perm="application:create">
            <Link to="/hajj/new" className={btnPrimary} style={btnPrimaryStyle}><Plus size={13} /> New Booking</Link>
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
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load()} placeholder="Search ref / customer…" className={searchInputClassName} aria-label="Search Hajj bookings" />
          </div>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectClassName} aria-label="Filter by kind">
            <option value="">Hajj + Umrah</option>
            <option value="hajj">Hajj only</option>
            <option value="umrah">Umrah only</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClassName} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClassName} aria-label="Filter by priority">
            <option value="">All priority</option>
            {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClassName} aria-label="Filter by package category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </ListToolbar>
      }
      error={error}
    >
      <div className="mb-3"><EntityTabs tabs={[{ id: "queue", label: "Queue" }, { id: "reports", label: "Reports" }]} active={mode} onChange={(m) => setMode(m as "queue" | "reports")} /></div>

      {mode === "reports" ? (
        <div className="space-y-3">
          <StatStrip>
            <KpiCard label="Pending bookings" value={reports.pending} tone="warning" />
            <KpiCard label="Visa approved" value={reports.visaApproved} tone="success" />
            <KpiCard label="Visa pending" value={reports.visaPending} tone="warning" />
            <KpiCard label="Departures today" value={reports.departuresToday} tone="accent" />
            <KpiCard label="On ground now" value={reports.onGround} tone="accent" />
            <KpiCard label="Cancelled" value={reports.cancelled} tone="danger" />
          </StatStrip>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Surface>
              <SurfaceHeader title="Group performance" hint="Pilgrims per group." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Group</th><th className="px-3 py-1.5 text-right">Pilgrims</th></tr></thead>
                  <tbody>{reports.group.map(([name, n]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{n}</td></tr>))}</tbody>
                </table>
              </div>
            </Surface>
            <Surface>
              <SurfaceHeader title="Executive performance" hint="Bookings handled per executive." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Executive</th><th className="px-3 py-1.5 text-right">Total</th><th className="px-3 py-1.5 text-right">Visa OK</th><th className="px-3 py-1.5 text-right">Cancelled</th></tr></thead>
                  <tbody>{reports.exec.map(([name, e]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{e.total}</td><td className="px-3 py-1.5 text-right tabular-nums text-emerald-600">{e.visaApproved}</td><td className="px-3 py-1.5 text-right tabular-nums text-red-600">{e.cancelled}</td></tr>))}</tbody>
                </table>
              </div>
            </Surface>
          </div>
        </div>
      ) : (
        <>
          {qc.selectedIds.size > 0 && (
            <Surface>
              <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
                <span className="text-[12px] font-bold text-[var(--foreground)]">{qc.selectedIds.size} selected</span>
                <button type="button" className={btnGhost} onClick={() => exportCaseCsv("hajj", CSV_COLS, visible.filter((r) => qc.selectedIds.has(r.id)))}><FileSpreadsheet size={12} /> Export</button>
                <button type="button" className={`${btnGhost} ml-auto`} onClick={qc.clearSelection}>Clear</button>
              </div>
            </Surface>
          )}
          <Surface>
            <SurfaceHeader
              title={`${visible.length} booking${visible.length === 1 ? "" : "s"}`}
              hint={qc.selectedCase ? `Selected: ${qc.selectedCase.referenceNo} — Enter to open Hajj 360.` : "Click a row to select; double-click to open Hajj 360."}
              action={<button type="button" className={btnGhost} disabled={!qc.selectedCase} title={qc.selectedCase ? `Export ${qc.selectedCase.referenceNo}` : "Select a row first"} onClick={() => qc.selectedCase && exportCaseCsv("hajj", CSV_COLS, [qc.selectedCase])}><FileSpreadsheet size={12} /> Export</button>}
            />
            <DataTable
              rows={visible}
              columns={columns}
              rowKey={(r) => r.id}
              loading={loading}
              emptyTitle="No Hajj/Umrah bookings yet"
              emptyHint="Create a booking or adjust filters."
              selectedKey={qc.selectedKey}
              onRowClick={(r) => qc.setSelectedKey(r.id)}
              onRowDoubleClick={(r) => qc.openView(r)}
              rowClassName={(r) => (["cancelled", "rejected"].includes(r.status) ? "opacity-60" : "")}
            />
          </Surface>
        </>
      )}

      <Sheet open={!!qc.viewId} onOpenChange={(o) => !o && qc.setViewId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
          <SheetHeader className="sr-only"><SheetTitle>Hajj 360</SheetTitle></SheetHeader>
          {qc.viewId && (qc.bundle ? <HajjSummaryHeader bundle={qc.bundle} staffMap={qc.staffMap} /> : <div className="p-8 text-center text-[12px] text-[var(--muted-foreground)]">Loading Hajj 360…</div>)}
        </SheetContent>
      </Sheet>
    </ListPageShell>
  );
}

export function NewHajjCasePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [serviceType, setServiceType] = useState<"hajj" | "umrah">("hajj");
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
        serviceType,
        customerId,
        priority,
        title: title.trim() || `${serviceType === "hajj" ? "Hajj" : "Umrah"} — ${cust?.fullName || "customer"}`,
        direction: "outbound",
      });
      navigate(`/hajj/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Moon}
        title="New Hajj / Umrah Booking"
        subtitle="Creates an application and applies the active hajj or umrah workflow template."
        breadcrumb={[
          { label: "Bookings", to: "/hajj" },
          { label: "Hajj & Umrah", to: "/hajj" },
          { label: "New" },
        ]}
      />
      <HajjModuleNav />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div>
            <label className={labelCls} htmlFor="hj-kind">
              Kind *
            </label>
            <select
              id="hj-kind"
              className={inputCls}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as "hajj" | "umrah")}
            >
              <option value="hajj">Hajj</option>
              <option value="umrah">Umrah</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="hj-customer">
              Customer *
            </label>
            <select
              id="hj-customer"
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
                title="Scan pilgrim passport"
                savePassportOnConfirm={!!customerId}
                onAutofill={(fields) => {
                  const name = ocrFullName(fields);
                  if (name) {
                    setTitle((t) => t || `${serviceType === "hajj" ? "Hajj" : "Umrah"} — ${name}`);
                  }
                }}
              />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="hj-priority">
              Priority
            </label>
            <select id="hj-priority" className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="hj-title">
              Title
            </label>
            <input
              id="hj-title"
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
            <button type="button" onClick={() => navigate("/hajj")} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
