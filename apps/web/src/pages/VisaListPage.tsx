import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAgentFilter } from "@/lib/useAgentFilter";
import { Briefcase, Eye, FileCheck, FileSpreadsheet, Plus, RefreshCw, Search } from "lucide-react";
import { applicationsApi, customersApi, destinationsApi, financeApi, usersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { AppDocument, Application, Customer, Invoice, Journey, StaffUser } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { VisaSummaryHeader, type VisaDetailBundle } from "@/components/visa/VisaSummaryHeader";
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
import {
  DEFAULT_VISA_DESTINATIONS,
  VISA_CATEGORY_OPTIONS,
  VISA_LETTER_BY_CATEGORY,
} from "@/config/checklist";
import { destinationCountry, type DestinationMaster } from "@/lib/destinations";
import { ScanDocumentPanel } from "@/components/ocr/ScanDocumentPanel";

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

export default function VisaListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [visaType, setVisaType] = useState("");
  const [embassy, setEmbassy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"queue" | "reports">("queue");
  // Selection + Visa 360 drawer.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<VisaDetailBundle | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { agentId } = useAgentFilter();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await applicationsApi.list({
        serviceType: "visa", limit: 100, q: q || undefined, status: status || undefined, agentId,
        expand: "visa", // additive — visa detail + applicant passport
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load visa cases");
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

  // Visa 360 bundle whenever the drawer opens (row already has visa+passport; add journey/finance/docs).
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

  // Advanced-filter option lists (from loaded rows).
  const visaTypes = useMemo(() => Array.from(new Set(rows.map((r) => r.visa?.visaType).filter(Boolean) as string[])).sort(), [rows]);
  const embassies = useMemo(() => Array.from(new Set(rows.map((r) => r.visa?.embassy).filter(Boolean) as string[])).sort(), [rows]);

  const visible = useMemo(() => rows.filter((r) =>
    (!priority || r.priority === priority) &&
    (!visaType || r.visa?.visaType === visaType) &&
    (!embassy || r.visa?.embassy === embassy),
  ), [rows, priority, visaType, embassy]);

  const stats = useMemo(() => {
    const approved = rows.filter((r) => r.status === "approved" || r.status === "completed").length;
    const active = rows.filter((r) => r.status === "in_progress" || r.status === "submitted").length;
    const hold = rows.filter((r) => r.status === "on_hold" || r.status === "docs_required").length;
    return { approved, active, hold };
  }, [rows]);

  // Phase 5 reports (client-side from the loaded visa rows).
  const reports = useMemo(() => {
    const pending = rows.filter((r) => PENDING.has(r.status)).length;
    const submitted = rows.filter((r) => r.status === "submitted" || r.visa?.submittedAt).length;
    const interviewToday = rows.filter((r) => isToday(r.visa?.appointmentAt)).length;
    const collectionToday = rows.filter((r) => isToday(r.visa?.collectedAt) || isToday(r.visa?.decisionAt)).length;
    const delivered = rows.filter((r) => !!r.visa?.deliveredAt).length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    const approvedN = rows.filter((r) => r.status === "approved" || r.status === "completed").length;
    const approvalRate = approvedN + rejected > 0 ? Math.round((approvedN / (approvedN + rejected)) * 100) : 0;
    const byExec = new Map<string, { total: number; approved: number; rejected: number }>();
    for (const r of rows) {
      const key = r.assignedTo ? staffMap[r.assignedTo] || "Assigned" : "Unassigned";
      const e = byExec.get(key) || { total: 0, approved: 0, rejected: 0 };
      e.total++;
      if (r.status === "approved" || r.status === "completed") e.approved++;
      if (r.status === "rejected") e.rejected++;
      byExec.set(key, e);
    }
    return { pending, submitted, interviewToday, collectionToday, delivered, rejected, approvalRate, exec: Array.from(byExec.entries()).sort((a, b) => b[1].total - a[1].total) };
  }, [rows, staffMap]);

  const selectedVisa = visible.find((r) => r.id === selectedKey) || null;
  const allSelected = visible.length > 0 && visible.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && visible.some((r) => selectedIds.has(r.id));
  function openView(a: Application) { setSelectedKey(a.id); setViewId(a.id); }
  function toggleOne(id: string) { setSelectedIds((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  function toggleAll() { setSelectedIds(allSelected ? new Set() : new Set(visible.map((r) => r.id))); }
  function exportExcel(list: Application[]) {
    if (!list.length) return;
    const cols: [string, (a: Application) => string][] = [
      ["Reference", (a) => a.referenceNo], ["Customer", (a) => a.customer?.fullName || ""],
      ["Passport", (a) => a.customer?.passports?.[0]?.passportNo || ""], ["Embassy", (a) => a.visa?.embassy || ""],
      ["Visa Type", (a) => a.visa?.visaType || ""], ["Status", (a) => a.status], ["Priority", (a) => a.priority || ""],
      ["Stage", (a) => `${a.currentStage}/${a.totalStages}`], ["Submitted", (a) => fmtD(a.visa?.submittedAt)],
      ["Collected", (a) => fmtD(a.visa?.collectedAt || a.visa?.decisionAt)],
      ["Assigned", (a) => (a.assignedTo ? staffMap[a.assignedTo] || a.assignedTo : "")],
    ];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [cols.map((c) => c[0]), ...list.map((a) => cols.map((c) => c[1](a)))].map((r) => r.map(esc).join(",")).join("\r\n");
    downloadBlob(list.length === 1 ? `${list[0].referenceNo}.csv` : `visa-${list.length}.csv`, csv, "text/csv;charset=utf-8");
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
    { key: "passport", header: "Passport", className: "font-mono text-[11px]", render: (a) => a.customer?.passports?.[0]?.passportNo || "—" },
    { key: "embassy", header: "Embassy", render: (a) => a.visa?.embassy || "—" },
    { key: "visaType", header: "Visa Type", render: (a) => (a.visa?.visaType ? <Pill value={a.visa.visaType} tone="blue" /> : "—") },
    { key: "submitted", header: "Submitted", className: "tabular-nums text-[11px]", render: (a) => fmtD(a.visa?.submittedAt) },
    { key: "collected", header: "Collection", className: "tabular-nums text-[11px]", render: (a) => fmtD(a.visa?.collectedAt || a.visa?.decisionAt) },
    { key: "assigned", header: "Executive", render: (a) => (a.assignedTo ? staffMap[a.assignedTo] || "Assigned" : <span className="text-[10.5px] uppercase text-[var(--muted-foreground)]">Unassigned</span>) },
    { key: "stage", header: "Stage", className: "tabular-nums", render: (a) => {
      const pct = a.totalStages ? Math.round((Math.min(a.currentStage, a.totalStages) / a.totalStages) * 100) : 0;
      return (<div className="w-20"><div className="mb-0.5 text-[10px] text-[var(--muted-foreground)]">{a.currentStage}/{a.totalStages}</div><div className="h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div></div>);
    } },
    { key: "priority", header: "Priority", render: (a) => <Pill value={a.priority || "normal"} tone={priorityTone(a.priority)} /> },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
    { key: "actions", header: "Actions", className: "text-right", render: (a) => (
      <div className="flex items-center justify-end gap-1">
        <button type="button" className={`${btnGhost} px-2 py-1`} title="Visa 360" aria-label="View" onClick={() => openView(a)}><Eye size={13} /></button>
        <Link to={`/visa/${a.id}`} className={`${btnGhost} px-2 py-1`} title="Open workspace" aria-label="Workspace"><Briefcase size={13} /></Link>
      </div>
    ) },
  ];

  return (
    <ListPageShell
      lookupFilters
      wide
      icon={FileCheck}
      title="Visa Services"
      subtitle="China visa cases on the CVASC workflow."
      breadcrumb={[{ label: "Bookings", to: "/visa" }, { label: "Visa Services" }]}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}><RefreshCw size={12} /> Refresh</button>
          <Can perm="application:create">
            <Link to="/visa/new" className={btnPrimary} style={btnPrimaryStyle}><Plus size={13} /> New Visa Case</Link>
          </Can>
        </>
      }
      stats={
        <StatStrip>
          <KpiCard label="Total cases" value={total} />
          <KpiCard label="In progress" value={stats.active} tone="accent" />
          <KpiCard label="Needs action" value={stats.hold} tone="warning" />
          <KpiCard label="Approved" value={stats.approved} tone="success" />
        </StatStrip>
      }
      toolbar={
        <ListToolbar>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void load()} placeholder="Search ref / customer…" className={searchInputClassName} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClassName}>
            <option value="">All statuses</option>
            {["draft", "in_progress", "docs_required", "on_hold", "submitted", "approved", "rejected", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClassName}>
            <option value="">All priority</option>
            {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={visaType} onChange={(e) => setVisaType(e.target.value)} className={selectClassName}>
            <option value="">All types</option>
            {visaTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={embassy} onChange={(e) => setEmbassy(e.target.value)} className={selectClassName}>
            <option value="">All embassies</option>
            {embassies.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </ListToolbar>
      }
      error={error}
    >
      <div className="mb-3"><EntityTabs tabs={[{ id: "queue", label: "Queue" }, { id: "reports", label: "Reports" }]} active={mode} onChange={(m) => setMode(m as "queue" | "reports")} /></div>

      {mode === "reports" ? (
        <div className="space-y-3">
          <StatStrip>
            <KpiCard label="Visa pending" value={reports.pending} tone="warning" />
            <KpiCard label="Visa submitted" value={reports.submitted} tone="accent" />
            <KpiCard label="Interview today" value={reports.interviewToday} />
            <KpiCard label="Collection today" value={reports.collectionToday} />
            <KpiCard label="Delivered" value={reports.delivered} tone="success" />
            <KpiCard label="Rejected" value={reports.rejected} tone="danger" />
            <KpiCard label="Approval rate" value={`${reports.approvalRate}%`} tone="success" />
          </StatStrip>
          <Surface>
            <SurfaceHeader title="Executive performance" hint="Visa cases handled per assigned executive." />
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left text-[12px]">
                <thead><tr className="text-[9.5px] uppercase tracking-wide text-[var(--muted-foreground)]"><th className="px-3 py-1.5">Executive</th><th className="px-3 py-1.5 text-right">Total</th><th className="px-3 py-1.5 text-right">Approved</th><th className="px-3 py-1.5 text-right">Rejected</th><th className="px-3 py-1.5 text-right">Approval %</th></tr></thead>
                <tbody>
                  {reports.exec.map(([name, e]) => (
                    <tr key={name} className="border-t border-[var(--border)]">
                      <td className="px-3 py-1.5 font-semibold text-[var(--primary)]">{name}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{e.total}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-emerald-600">{e.approved}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-red-600">{e.rejected}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{e.approved + e.rejected > 0 ? Math.round((e.approved / (e.approved + e.rejected)) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
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
              title={`${visible.length} visa case${visible.length === 1 ? "" : "s"}`}
              hint={selectedVisa ? `Selected: ${selectedVisa.referenceNo} — Enter to open Visa 360.` : "Click a row to select; double-click to open Visa 360."}
              action={<button type="button" className={btnGhost} disabled={!selectedVisa} title={selectedVisa ? `Export ${selectedVisa.referenceNo}` : "Select a row first"} onClick={() => selectedVisa && exportExcel([selectedVisa])}><FileSpreadsheet size={12} /> Export</button>}
            />
            <DataTable
              rows={visible}
              columns={columns}
              rowKey={(r) => r.id}
              loading={loading}
              emptyTitle="No visa cases yet"
              emptyHint="Create a China visa case to start the CVASC pipeline."
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
          <SheetHeader className="sr-only"><SheetTitle>Visa 360</SheetTitle></SheetHeader>
          {viewId && (bundle ? <VisaSummaryHeader bundle={bundle} staffMap={staffMap} /> : <div className="p-8 text-center text-[12px] text-[var(--muted-foreground)]">Loading Visa 360…</div>)}
        </SheetContent>
      </Sheet>
    </ListPageShell>
  );
}

export function NewVisaCasePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetCustomer = params.get("customerId") || "";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [destinations, setDestinations] = useState<string[]>([...DEFAULT_VISA_DESTINATIONS]);
  const [customerId, setCustomerId] = useState(presetCustomer);
  const [destination, setDestination] = useState("China");
  const [visaCategory, setVisaCategory] = useState("tourist");
  const [visaLetter, setVisaLetter] = useState("L");
  const [priceBdt, setPriceBdt] = useState("");
  const [discountBdt, setDiscountBdt] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const letterOptions = VISA_LETTER_BY_CATEGORY[visaCategory] || VISA_LETTER_BY_CATEGORY.tourist;

  useEffect(() => {
    void customersApi
      .list({ limit: 200 })
      .then((r) => setCustomers(listOf<Customer>(r)))
      .catch(() => setCustomers([]));
    void destinationsApi
      .list({ limit: 200, status: "published" })
      .then((r) => {
        const rows = listOf<DestinationMaster>(r);
        const names = rows
          .map((d) => destinationCountry(d) || d.name)
          .map((n) => n.trim())
          .filter(Boolean);
        if (names.length) {
          const merged = Array.from(new Set([...DEFAULT_VISA_DESTINATIONS, ...names]));
          setDestinations(merged);
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    const opts = VISA_LETTER_BY_CATEGORY[visaCategory] || VISA_LETTER_BY_CATEGORY.tourist;
    if (!opts.some((o) => o.value === visaLetter)) {
      setVisaLetter(opts[0]?.value || "L");
    }
  }, [visaCategory, visaLetter]);

  const selected = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);
  const categoryLabel =
    VISA_CATEGORY_OPTIONS.find((c) => c.value === visaCategory)?.label || visaCategory;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Pick a customer");
      return;
    }
    if (!destination.trim()) {
      setError("Pick a destination");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const caseTitle =
        `${destination.trim()} ${categoryLabel} ${visaLetter} — ${selected?.fullName || ""}`.trim();
      const noteLines = [
        `Visa type: ${visaLetter}`,
        priceBdt.trim() ? `Price: ৳${priceBdt.trim()}` : "",
        discountBdt.trim() ? `Discount: ৳${discountBdt.trim()}` : "",
        referredBy.trim() ? `Referred by: ${referredBy.trim()}` : "",
      ].filter(Boolean);

      const app = await applicationsApi.create({
        serviceType: "visa",
        customerId,
        title: caseTitle,
        priority,
        direction: "outbound",
        source: referredBy.trim() ? "referral" : "walkin",
      });
      await applicationsApi.putVisa(app.id, {
        visaType: visaCategory,
        destination: destination.trim(),
        entryType: "single",
        embassy: destination.trim().toLowerCase() === "china" ? "CVASC Dhaka" : undefined,
        notes: noteLines.join("\n") || undefined,
      });
      if (noteLines.length > 1) {
        void applicationsApi.note(app.id, noteLines.join(" · ")).catch(() => undefined);
      }
      navigate(`/visa/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create case");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={FileCheck}
        title="New Visa Case"
        subtitle="Creates an application and applies the active CVASC workflow template."
        breadcrumb={[
          { label: "Bookings", to: "/visa" },
          { label: "Visa Services", to: "/visa" },
          { label: "New" },
        ]}
      />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={labelCls}>Customer *</label>
            <select className={inputCls} required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
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
                title="Scan passport for applicant"
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
            <label className={labelCls}>Destination *</label>
            <select
              className={inputCls}
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {destinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Visa category *</label>
            <select
              className={inputCls}
              required
              value={visaCategory}
              onChange={(e) => setVisaCategory(e.target.value)}
            >
              {VISA_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Visa type *</label>
            <select
              className={inputCls}
              required
              value={visaLetter}
              onChange={(e) => setVisaLetter(e.target.value)}
            >
              {letterOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Price (BDT)</label>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder="0"
                value={priceBdt}
                onChange={(e) => setPriceBdt(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <div>
              <label className={labelCls}>Discount (BDT)</label>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder="0"
                value={discountBdt}
                onChange={(e) => setDiscountBdt(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Referred by</label>
            <input
              className={inputCls}
              placeholder="Agent / staff / partner name"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className={btnPrimary} style={btnPrimaryStyle}>
              {loading ? "Creating…" : "Create case"}
            </button>
            <button type="button" onClick={() => navigate("/visa")} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
