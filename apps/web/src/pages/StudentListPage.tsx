import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAgentFilter } from "@/lib/useAgentFilter";
import { Briefcase, Eye, FileSpreadsheet, GraduationCap, Plus, RefreshCw, Search } from "lucide-react";
import { applicationsApi, customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { StudentSummaryHeader } from "@/components/students/StudentSummaryHeader";
import { exportCaseCsv, useCaseQueue } from "@/lib/useCaseQueue";
import { priorityTone } from "@/components/enterprise/CaseSummary";
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
const DEGREE_LEVELS = ["diploma", "bachelor", "master", "phd"];

const STATUSES = [
  "draft", "in_progress", "docs_required", "on_hold", "submitted",
  "approved", "rejected", "completed", "cancelled",
];

/**
 * V14 — Student Consultancy enterprise queue. New vertical page (backend
 * StudentDetail existed; frontend was unbuilt). Same template + shared chrome
 * as the frozen verticals; creation lives here because the unified wizard
 * (frozen Booking Engine) intentionally does not offer the student service.
 */
export default function StudentListPage() {
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
        serviceType: "student", limit: 100, q: q || undefined, status: status || undefined, agentId,
        expand: "student,passport", // additive — student detail + applicant passport
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load student cases");
    } finally {
      setLoading(false);
    }
  }, [q, status, agentId]);

  useEffect(() => { void load(); }, [load]);

  const countries = useMemo(() => Array.from(new Set(rows.map((r) => r.student?.country).filter(Boolean) as string[])).sort(), [rows]);
  const visible = useMemo(() => rows.filter((r) =>
    (!priority || r.priority === priority) && (!country || r.student?.country === country),
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
    const stageName = (r: Application) => {
      const st = (r.stages || []).find((x) => x.stageNo === r.currentStage);
      return (st?.name || "").toLowerCase();
    };
    const pending = rows.filter((r) => PENDING.has(r.status)).length;
    const applied = rows.filter((r) => r.currentStage >= 5 && r.totalStages >= 11).length;
    const offers = rows.filter((r) => r.currentStage >= 6 && r.totalStages >= 11).length;
    const visaStage = rows.filter((r) => stageName(r).includes("visa")).length;
    const enrolled = rows.filter((r) => stageName(r).includes("enrol") || r.status === "completed").length;
    const cancelled = rows.filter((r) => r.status === "cancelled").length;
    const byCountry = new Map<string, number>();
    const byExec = new Map<string, { total: number; enrolled: number; cancelled: number }>();
    for (const r of rows) {
      byCountry.set(r.student?.country || "—", (byCountry.get(r.student?.country || "—") || 0) + 1);
      const ex = r.assignedTo ? qc.staffMap[r.assignedTo] || "Assigned" : "Unassigned";
      const e = byExec.get(ex) || { total: 0, enrolled: 0, cancelled: 0 };
      e.total++;
      if (r.status === "completed") e.enrolled++;
      if (r.status === "cancelled") e.cancelled++;
      byExec.set(ex, e);
    }
    return {
      pending, applied, offers, visaStage, enrolled, cancelled,
      country: Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1]) as [string, number][],
      exec: Array.from(byExec.entries()).sort((a, b) => b[1].total - a[1].total) as [string, { total: number; enrolled: number; cancelled: number }][],
    };
  }, [rows, qc.staffMap]);

  const CSV_COLS: [string, (a: Application) => string][] = [
    ["Reference", (a) => a.referenceNo], ["Student", (a) => a.customer?.fullName || ""],
    ["Institution", (a) => a.student?.institution || ""], ["Country", (a) => a.student?.country || ""],
    ["Course", (a) => a.student?.courseName || ""], ["Degree", (a) => a.student?.degreeLevel || ""],
    ["Intake", (a) => a.student?.intakeTerm || ""], ["Status", (a) => a.status], ["Priority", (a) => a.priority || ""],
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
    { key: "student", header: "Student", render: (a) => (
      <button type="button" onClick={() => qc.openView(a)} className="text-left font-semibold text-[var(--primary)] hover:underline">{a.customer?.fullName || "—"}</button>
    ) },
    { key: "institution", header: "Institution", render: (a) => a.student?.institution || "—" },
    { key: "country", header: "Country", render: (a) => (a.student?.country ? <Pill value={a.student.country} tone="blue" /> : "—") },
    { key: "course", header: "Course", className: "max-w-[180px] truncate", render: (a) => a.student?.courseName || "—" },
    { key: "degree", header: "Degree", render: (a) => a.student?.degreeLevel || "—" },
    { key: "intake", header: "Intake", render: (a) => a.student?.intakeTerm || "—" },
    { key: "exec", header: "Executive", render: (a) => (a.assignedTo ? qc.staffMap[a.assignedTo] || "Assigned" : <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">Unassigned</span>) },
    { key: "priority", header: "Priority", render: (a) => <Pill value={a.priority || "normal"} tone={priorityTone(a.priority)} /> },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
    { key: "stage", header: "Progress", className: "tabular-nums", render: (a) => {
      const pct = a.totalStages ? Math.round((Math.min(a.currentStage, a.totalStages) / a.totalStages) * 100) : 0;
      return (<div className="w-20"><div className="mb-0.5 text-[10px] text-[var(--muted-foreground)]">{a.currentStage}/{a.totalStages}</div><div className="h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div></div>);
    } },
    { key: "actions", header: "Actions", className: "text-right", render: (a) => (
      <div className="flex items-center justify-end gap-1">
        <button type="button" className={`${btnGhost} px-2 py-1`} title="Student 360" aria-label="View" onClick={() => qc.openView(a)}><Eye size={13} /></button>
        <Link to={`/bookings/${a.id}`} className={`${btnGhost} px-2 py-1`} title="Open workspace" aria-label="Workspace"><Briefcase size={13} /></Link>
      </div>
    ) },
  ];

  return (
    <ListPageShell
      lookupFilters
      wide
      icon={GraduationCap}
      title="Student Consultancy"
      subtitle="Study-abroad counseling, applications, offers, visas, enrolment."
      breadcrumb={[{ label: "Bookings", to: "/students" }, { label: "Student Consultancy" }]}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}><RefreshCw size={12} /> Refresh</button>
          <Can perm="application:create">
            <Link to="/students/new" className={btnPrimary} style={btnPrimaryStyle}><Plus size={13} /> New Student Case</Link>
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
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load()} placeholder="Search ref / student…" className={searchInputClassName} aria-label="Search student cases" />
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
            <KpiCard label="Applications submitted" value={reports.applied} tone="accent" />
            <KpiCard label="Offers received" value={reports.offers} tone="accent" />
            <KpiCard label="In visa processing" value={reports.visaStage} />
            <KpiCard label="Enrolled" value={reports.enrolled} tone="success" />
            <KpiCard label="Cancelled" value={reports.cancelled} tone="danger" />
          </StatStrip>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Surface>
              <SurfaceHeader title="Country performance" hint="Cases per destination country." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Country</th><th className="px-3 py-1.5 text-right">Cases</th></tr></thead>
                  <tbody>{reports.country.map(([name, n]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{n}</td></tr>))}</tbody>
                </table>
              </div>
            </Surface>
            <Surface>
              <SurfaceHeader title="Executive performance" hint="Cases handled per executive." />
              <div className="overflow-x-auto p-2">
                <table className="w-full text-left text-[12px]">
                  <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Executive</th><th className="px-3 py-1.5 text-right">Total</th><th className="px-3 py-1.5 text-right">Enrolled</th><th className="px-3 py-1.5 text-right">Cancelled</th></tr></thead>
                  <tbody>{reports.exec.map(([name, e]) => (<tr key={name} className="border-t border-[var(--border)]"><td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td><td className="px-3 py-1.5 text-right tabular-nums">{e.total}</td><td className="px-3 py-1.5 text-right tabular-nums text-emerald-600">{e.enrolled}</td><td className="px-3 py-1.5 text-right tabular-nums text-red-600">{e.cancelled}</td></tr>))}</tbody>
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
                <button type="button" className={btnGhost} onClick={() => exportCaseCsv("students", CSV_COLS, visible.filter((r) => qc.selectedIds.has(r.id)))}><FileSpreadsheet size={12} /> Export</button>
                <button type="button" className={`${btnGhost} ml-auto`} onClick={qc.clearSelection}>Clear</button>
              </div>
            </Surface>
          )}
          <Surface>
            <SurfaceHeader
              title={`${visible.length} student case${visible.length === 1 ? "" : "s"}`}
              hint={qc.selectedCase ? `Selected: ${qc.selectedCase.referenceNo} — Enter to open Student 360.` : "Click a row to select; double-click to open Student 360."}
              action={<button type="button" className={btnGhost} disabled={!qc.selectedCase} title={qc.selectedCase ? `Export ${qc.selectedCase.referenceNo}` : "Select a row first"} onClick={() => qc.selectedCase && exportCaseCsv("students", CSV_COLS, [qc.selectedCase])}><FileSpreadsheet size={12} /> Export</button>}
            />
            <DataTable
              rows={visible}
              columns={columns}
              rowKey={(r) => r.id}
              loading={loading}
              emptyTitle="No student cases yet"
              emptyHint="Create a student consultancy case to start the enrolment pipeline."
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
          <SheetHeader className="sr-only"><SheetTitle>Student 360</SheetTitle></SheetHeader>
          {qc.viewId && (qc.bundle ? <StudentSummaryHeader bundle={qc.bundle} staffMap={qc.staffMap} /> : <div className="p-8 text-center text-[12px] text-[var(--muted-foreground)]">Loading Student 360…</div>)}
        </SheetContent>
      </Sheet>
    </ListPageShell>
  );
}

/**
 * Creation form for student cases (the unified wizard — frozen Booking Engine —
 * intentionally does not offer this service). Mirrors NewVisaCasePage: create
 * the application, upsert the student detail, jump to the booking workspace.
 */
export function NewStudentCasePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [institution, setInstitution] = useState("");
  const [countryName, setCountryName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("bachelor");
  const [intakeTerm, setIntakeTerm] = useState("");
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
        serviceType: "student",
        customerId,
        title: `${countryName || "Study"} ${degreeLevel} — ${selected?.fullName || ""}`.trim(),
        priority,
        direction: "outbound",
        source: "walkin",
      });
      await applicationsApi.putDetail(app.id, "student", {
        institution: institution.trim() || undefined,
        country: countryName.trim() || undefined,
        courseName: courseName.trim() || undefined,
        degreeLevel,
        intakeTerm: intakeTerm.trim() || undefined,
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
        icon={GraduationCap}
        title="New Student Case"
        subtitle="Creates an application on the 11-stage student consultancy workflow."
        breadcrumb={[{ label: "Bookings", to: "/students" }, { label: "Student Consultancy", to: "/students" }, { label: "New" }]}
      />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={labelCls}>Customer *</label>
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
                title="Scan passport for applicant"
                savePassportOnConfirm={!!customerId}
                onAutofill={() => { /* passport saved via panel when customer selected */ }}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Institution</label>
            <input className={inputCls} value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="University / college" />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input className={inputCls} value={countryName} onChange={(e) => setCountryName(e.target.value)} placeholder="e.g. China" />
          </div>
          <div>
            <label className={labelCls}>Course</label>
            <input className={inputCls} value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Program / course name" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Degree level</label>
              <select className={inputCls} value={degreeLevel} onChange={(e) => setDegreeLevel(e.target.value)}>
                {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Intake term</label>
              <input className={inputCls} value={intakeTerm} onChange={(e) => setIntakeTerm(e.target.value)} placeholder="e.g. Fall 2026" />
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
            <button type="button" onClick={() => navigate("/students")} className={btnGhost}>Cancel</button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
