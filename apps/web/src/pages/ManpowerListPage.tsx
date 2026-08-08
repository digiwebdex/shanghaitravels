import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAgentFilter } from "@/lib/useAgentFilter";
import { Briefcase, Eye, FileSpreadsheet, HardHat, Plus, RefreshCw, Search } from "lucide-react";
import { applicationsApi, customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { ManpowerSummaryHeader } from "@/components/manpower/ManpowerSummaryHeader";
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
import { ScanDocumentPanel } from "@/components/ocr/ScanDocumentPanel";

const PENDING = new Set(["draft", "in_progress", "docs_required", "on_hold"]);

const STATUSES = [
  "draft", "in_progress", "docs_required", "on_hold", "submitted",
  "approved", "rejected", "completed", "cancelled",
];

/**
 * V15 — Manpower / overseas employment enterprise queue (serviceType "work").
 * New vertical page (backend WorkDetail existed; frontend was unbuilt). Same
 * template + shared chrome as the frozen verticals; creation lives here because
 * the unified wizard (frozen Booking Engine) does not offer this service.
 */
export default function ManpowerListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"queue" | "reports">("queue");

  const { agentId } = useAgentFilter();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await applicationsApi.list({
        serviceType: "work", limit: 100, q: q || undefined, status: status || undefined, agentId,
        expand: "work,passport", // additive — work detail + worker passport
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load manpower cases");
    } finally {
      setLoading(false);
    }
  }, [q, status, agentId]);

  useEffect(() => { void load(); }, [load]);

  const countries = useMemo(() => Array.from(new Set(rows.map((r) => r.work?.country).filter(Boolean) as string[])).sort(), [rows]);
  const visible = useMemo(() => rows.filter((r) =>
    (!priority || r.priority === priority) && (!country || r.work?.country === country),
  ), [rows, priority, country]);

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
    const medicalFit = rows.filter((r) => (r.work?.medicalStatus || "").toLowerCase() === "fit").length;
    const bmetCleared = rows.filter((r) => !!r.work?.bmetClearance).length;
    const departuresToday = rows.filter((r) => isToday(r.work?.departureDate)).length;
    const deployed = rows.filter((r) => {
      const st = (r.stages || []).find((x) => x.stageNo === r.currentStage);
      return (st?.name || "").toLowerCase().includes("deploy") || r.status === "completed";
    }).length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const byEmployer = new Map<string, number>();
    const byExec = new Map<string, { total: number; deployed: number; cancelled: number }>();
    for (const r of rows) {
      byEmployer.set(r.work?.employerName || "—", (byEmployer.get(r.work?.employerName || "—") || 0) + 1);
      const ex = r.assignedTo ? qc.staffMap[r.assignedTo] || "Assigned" : "Unassigned";
      const e = byExec.get(ex) || { total: 0, deployed: 0, cancelled: 0 };
      e.total++;
      if (r.status === "completed") e.deployed++;
      if (r.status === "cancelled") e.cancelled++;
      byExec.set(ex, e);
    }
    return {
      pending, medicalFit, bmetCleared, departuresToday, deployed, cancelled,
      employer: Array.from(byEmployer.entries()).sort((a, b) => b[1] - a[1]) as [string, number][],
      exec: Array.from(byExec.entries()).sort((a, b) => b[1].total - a[1].total) as [string, { total: number; deployed: number; cancelled: number }][],
    };
  }, [rows, qc.staffMap]);

  const CSV_COLS: [string, (a: Application) => string][] = [
    ["Reference", (a) => a.referenceNo], ["Worker", (a) => a.customer?.fullName || ""],
    ["Employer", (a) => a.work?.employerName || ""], ["Job", (a) => a.work?.jobTitle || ""],
    ["Country", (a) => a.work?.country || ""], ["Visa Type", (a) => a.work?.visaType || ""],
    ["Permit", (a) => a.work?.workPermitNo || ""], ["BMET", (a) => a.work?.bmetClearance || ""],
    ["Medical", (a) => a.work?.medicalStatus || ""], ["Departure", (a) => fmtD(a.work?.departureDate)],
    ["Status", (a) => a.status], ["Priority", (a) => a.priority || ""],
    ["Stage", (a) => `${a.currentStage}/${a.totalStages}`],
    ["Executive", (a) => (a.assignedTo ? qc.staffMap[a.assignedTo] || a.assignedTo : "")],
  ];

  const columns: Column<Application>[] = [
    { key: "select", className: "w-8", header: (
      <input type="checkbox" aria-label="Select all" className="cursor-pointer" checked={qc.allSelected} ref={(el) => { if (el) el.indeterminate = qc.someSelected; }} onChange={qc.toggleAll} />
    ), render: (a) => (
      <input type="checkbox" aria-label={`Select ${a.referenceNo}`} className="cursor-pointer" checked={qc.selectedIds.has(a.id)} onClick={(e) => e.stopPropagation()} onChange={() => qc.toggleOne(a.id)} />
    ) },
    { key: "avatar", header: "", className: "w-10", render: (a) => <Avatar name={a.customer?.fullName} /> },
    { key: "ref", header: "Reference", className: "font-mono font-semibold", render: (a) => (
      <button type="button" onClick={() => qc.openView(a)} className="text-[var(--accent)] hover:underline">{a.referenceNo}</button>
    ) },
    { key: "worker", header: "Worker", render: (a) => (
      <button type="button" onClick={() => qc.openView(a)} className="text-left font-semibold text-[var(--primary)] hover:underline">{a.customer?.fullName || "—"}</button>
    ) },
    { key: "employer", header: "Employer", render: (a) => a.work?.employerName || "—" },
    { key: "job", header: "Job", render: (a) => a.work?.jobTitle || "—" },
    { key: "country", header: "Country", render: (a) => (a.work?.country ? <Pill value={a.work.country} tone="blue" /> : "—") },
    { key: "visa", header: "Visa", render: (a) => a.work?.visaType || "—" },
    { key: "bmet", header: "BMET", render: (a) => (a.work?.bmetClearance ? <Pill value="cleared" tone="green" /> : <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">pending</span>) },
    { key: "medical", header: "Medical", render: (a) => (a.work?.medicalStatus ? <Pill value={a.work.medicalStatus} tone={statusTone(a.work.medicalStatus)} /> : "—") },
    { key: "departure", header: "Departure", className: "tabular-nums text-[11px]", render: (a) => fmtD(a.work?.departureDate) },
    { key: "exec", header: "Executive", render: (a) => (a.assignedTo ? qc.staffMap[a.assignedTo] || "Assigned" : <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">Unassigned</span>) },
    { key: "priority", header: "Priority", render: (a) => <Pill value={a.priority || "normal"} tone={priorityTone(a.priority)} /> },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
    { key: "stage", header: "Progress", className: "tabular-nums", render: (a) => {
      const pct = a.totalStages ? Math.round((Math.min(a.currentStage, a.totalStages) / a.totalStages) * 100) : 0;
      return (<div className="w-20"><div className="mb-0.5 text-[10px] text-[var(--muted-foreground)]">{a.currentStage}/{a.totalStages}</div><div className="h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div></div>);
    } },
    { key: "actions", header: "Actions", className: "text-right", render: (a) => (
      <div className="flex items-center justify-end gap-1">
        <button type="button" className={`${btnGhost} px-2 py-1`} title="Manpower 360" aria-label="View" onClick={() => qc.openView(a)}><Eye size={13} /></button>
        <Link to={`/bookings/${a.id}`} className={`${btnGhost} px-2 py-1`} title="Open workspace" aria-label="Workspace"><Briefcase size={13} /></Link>
      </div>
    ) },
  ];

  return (
    <ListPageShell
      lookupFilters
      wide
      icon={HardHat}
      title="Manpower"
      subtitle="Overseas employment — employer verification, medical, visa/permit, BMET, deployment."
      breadcrumb={[{ label: "Bookings", to: "/manpower" }, { label: "Manpower" }]}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}><RefreshCw size={12} /> Refresh</button>
          <Can perm="application:create">
            <Link to="/manpower/new" className={btnPrimary} style={btnPrimaryStyle}><Plus size={13} /> New Manpower Case</Link>
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
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load()} placeholder="Search ref / worker…" className={searchInputClassName} aria-label="Search manpower cases" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClassName} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClassName} aria-label="Filter by priority">
            <option value="">All priority</option>
            {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectClassName} aria-label="Filter by country">
            <option value="">All countries</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </ListToolbar>
      }
      error={error}
    >
      <div className="mb-3"><EntityTabs tabs={[{ id: "queue", label: "Queue" }, { id: "reports", label: "Reports" }]} active={mode} onChange={(m) => setMode(m as "queue" | "reports")} /></div>

      {mode === "reports" ? (
        <div className="space-y-3">
          <StatStrip>
            <KpiCard label="Pending cases" value={reports.pending} tone="warning" />
            <KpiCard label="Medical fit" value={reports.medicalFit} tone="success" />
            <KpiCard label="BMET cleared" value={reports.bmetCleared} tone="success" />
            <KpiCard label="Departures today" value={reports.departuresToday} tone="accent" />
            <KpiCard label="Deployed" value={reports.deployed} tone="accent" />
            <KpiCard label="Cancelled" value={reports.cancelled} tone="danger" />
          </StatStrip>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Surface>
              <SurfaceHeader title="Employer performance" hint="Cases per employer." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Employer</th><th className="px-3 py-1.5 text-right">Cases</th></tr></thead>
                  <tbody>{reports.employer.map(([name, n]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{n}</td></tr>))}</tbody>
                </table>
              </div>
            </Surface>
            <Surface>
              <SurfaceHeader title="Executive performance" hint="Cases handled per executive." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Executive</th><th className="px-3 py-1.5 text-right">Total</th><th className="px-3 py-1.5 text-right">Deployed</th><th className="px-3 py-1.5 text-right">Cancelled</th></tr></thead>
                  <tbody>{reports.exec.map(([name, e]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{e.total}</td><td className="px-3 py-1.5 text-right tabular-nums text-emerald-600">{e.deployed}</td><td className="px-3 py-1.5 text-right tabular-nums text-red-600">{e.cancelled}</td></tr>))}</tbody>
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
                <button type="button" className={btnGhost} onClick={() => exportCaseCsv("manpower", CSV_COLS, visible.filter((r) => qc.selectedIds.has(r.id)))}><FileSpreadsheet size={12} /> Export</button>
                <button type="button" className={`${btnGhost} ml-auto`} onClick={qc.clearSelection}>Clear</button>
              </div>
            </Surface>
          )}
          <Surface>
            <SurfaceHeader
              title={`${visible.length} manpower case${visible.length === 1 ? "" : "s"}`}
              hint={qc.selectedCase ? `Selected: ${qc.selectedCase.referenceNo} — Enter to open Manpower 360.` : "Click a row to select; double-click to open Manpower 360."}
              action={<button type="button" className={btnGhost} disabled={!qc.selectedCase} title={qc.selectedCase ? `Export ${qc.selectedCase.referenceNo}` : "Select a row first"} onClick={() => qc.selectedCase && exportCaseCsv("manpower", CSV_COLS, [qc.selectedCase])}><FileSpreadsheet size={12} /> Export</button>}
            />
            <DataTable
              rows={visible}
              columns={columns}
              rowKey={(r) => r.id}
              loading={loading}
              emptyTitle="No manpower cases yet"
              emptyHint="Create an overseas-employment case to start the deployment pipeline."
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
          <SheetHeader className="sr-only"><SheetTitle>Manpower 360</SheetTitle></SheetHeader>
          {qc.viewId && (qc.bundle ? <ManpowerSummaryHeader bundle={qc.bundle} staffMap={qc.staffMap} /> : <div className="p-8 text-center text-[12px] text-[var(--muted-foreground)]">Loading Manpower 360…</div>)}
        </SheetContent>
      </Sheet>
    </ListPageShell>
  );
}

/**
 * Creation form for manpower cases (serviceType "work"; the unified wizard —
 * frozen Booking Engine — does not offer this service). Mirrors NewStudentCasePage.
 */
export function NewManpowerCasePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [countryName, setCountryName] = useState("China");
  const [visaType, setVisaType] = useState("Z");
  const [contractMonths, setContractMonths] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void customersApi.list({ limit: 200 }).then((r) => setCustomers(listOf<Customer>(r))).catch(() => setCustomers([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) { setError("Pick a customer"); return; }
    setLoading(true);
    setError("");
    try {
      const selected = customers.find((c) => c.id === customerId);
      const app = await applicationsApi.create({
        serviceType: "work",
        customerId,
        title: `${countryName || "Overseas"} ${jobTitle || "employment"} — ${selected?.fullName || ""}`.trim(),
        priority,
        direction: "outbound",
        source: "walkin",
      });
      await applicationsApi.putDetail(app.id, "work", {
        employerName: employerName.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        country: countryName.trim() || undefined,
        visaType: visaType.trim() || undefined,
        contractMonths: contractMonths ? Number(contractMonths) : undefined,
      });
      navigate(`/bookings/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create case");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={HardHat}
        title="New Manpower Case"
        subtitle="Creates an application on the 11-stage overseas-employment workflow."
        breadcrumb={[{ label: "Bookings", to: "/manpower" }, { label: "Manpower", to: "/manpower" }, { label: "New" }]}
      />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={labelCls}>Customer (worker) *</label>
            <select className={inputCls} required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— select —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName} ({c.code})</option>
              ))}
            </select>
            <Link to="/customers" className="mt-1 inline-block text-[11px] font-semibold text-[var(--accent)]">Create customer first →</Link>
            <div className="mt-2">
              <ScanDocumentPanel
                customerId={customerId || undefined}
                defaultDocType="passport"
                title="Scan passport for worker"
                savePassportOnConfirm={!!customerId}
                onAutofill={() => { /* passport saved via panel when customer selected */ }}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Employer</label>
            <input className={inputCls} value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder="Employer / company" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Job title</label>
              <input className={inputCls} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Welder" />
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <input className={inputCls} value={countryName} onChange={(e) => setCountryName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Visa type</label>
              <input className={inputCls} value={visaType} onChange={(e) => setVisaType(e.target.value)} placeholder="e.g. Z" />
            </div>
            <div>
              <label className={labelCls}>Contract (months)</label>
              <input className={inputCls} inputMode="numeric" value={contractMonths} onChange={(e) => setContractMonths(e.target.value.replace(/[^\d]/g, ""))} placeholder="24" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className={btnPrimary} style={btnPrimaryStyle}>
              {loading ? "Creating…" : "Create case"}
            </button>
            <button type="button" onClick={() => navigate("/manpower")} className={btnGhost}>Cancel</button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
