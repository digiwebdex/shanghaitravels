import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAgentFilter } from "@/lib/useAgentFilter";
import { Eye, FileSpreadsheet, Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { customersApi, type IntelligenceProfile } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { Column, DataTable, Pill } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CustomerIntelligencePanel } from "@/components/search/CustomerIntelligencePanel";
import { downloadBlob } from "@/lib/statements";
import {
  KpiCard,
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
} from "@/components/enterprise/Page";
import { ScanDocumentPanel, ocrFullName, ocrGenderToForm } from "@/components/ocr/ScanDocumentPanel";
import { ModuleLookupFilters } from "@/components/enterprise/ModuleLookupFilters";

type BadgeTone = "slate" | "green" | "amber" | "red" | "blue";

/** Descriptor badges under the customer name (derived from existing list fields). */
function customerBadges(c: Customer): { label: string; tone: BadgeTone }[] {
  const out: { label: string; tone: BadgeTone }[] = [];
  if (c.type === "corporate") out.push({ label: "Corporate", tone: "blue" });
  else out.push({ label: "Individual", tone: "slate" });
  if (c.primaryAgent) out.push({ label: "Agent-Owned", tone: "amber" });
  if (c.status && c.status.toLowerCase() !== "active") out.push({ label: c.status, tone: "red" });
  return out;
}

/** Columnar CSV export (single row or many) — reuses downloadBlob. */
function exportCustomersExcel(list: Customer[]) {
  if (!list.length) return;
  const cols: [string, (c: Customer) => string][] = [
    ["Code", (c) => c.code], ["Name", (c) => c.fullName],
    ["Phone", (c) => c.phone || ""], ["Email", (c) => c.email || ""], ["WhatsApp", (c) => c.whatsapp || ""],
    ["Nationality", (c) => c.nationality || ""], ["Gender", (c) => c.gender || ""],
    ["DOB", (c) => (c.dob ? String(c.dob).slice(0, 10) : "")],
    ["Type", (c) => c.type || ""], ["Status", (c) => c.status || ""],
    ["Owner", (c) => (c.primaryAgent ? `${c.primaryAgent.name} (${c.primaryAgent.code})` : "House")],
    ["Address", (c) => c.address || ""],
  ];
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const header = cols.map((x) => x[0]);
  const body = list.map((c) => cols.map((x) => x[1](c)));
  const csv = "\uFEFF" + [header, ...body].map((r) => r.map(esc).join(",")).join("\r\n");
  downloadBlob(list.length === 1 ? `${list[0].code}.csv` : `customers-${list.length}.csv`, csv, "text/csv;charset=utf-8");
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Customer | null>(null);
  // Selection (keyboard target) + right-side Customer 360 drawer.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [profile, setProfile] = useState<IntelligenceProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  // Multi-select bulk actions.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const scrollPosRef = useRef(0);

  const { agentId } = useAgentFilter();

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await customersApi.list({ limit: 100, q: search || undefined, agentId });
      const data = listOf<Customer>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Fetch the 360° profile whenever the drawer opens (reuses intelligenceProfile).
  useEffect(() => {
    if (!viewId) { setProfile(null); return; }
    let alive = true;
    setProfileLoading(true);
    setProfile(null);
    customersApi
      .intelligenceProfile(viewId)
      .then((p) => { if (alive) setProfile(p); })
      .catch(() => { if (alive) setProfile(null); })
      .finally(() => { if (alive) setProfileLoading(false); });
    return () => { alive = false; };
  }, [viewId]);

  const selectedCustomer = rows.find((r) => r.id === selectedKey) || null;
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selectedIds.has(r.id));

  function openView(c: Customer) {
    setSelectedKey(c.id);
    setViewId(c.id);
  }
  function openCreate() {
    setError(""); setOk(""); setEditing(null); setShowForm(true);
  }
  function startEdit(c: Customer) {
    setError(""); setOk("");
    scrollPosRef.current = window.scrollY;
    setEditing(c);
    setShowForm(true);
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  async function doRemove(c: Customer) {
    setBusy(true); setError("");
    try {
      await customersApi.remove(c.id);
      setOk(`${c.fullName} deleted`);
      setConfirm(null);
      if (viewId === c.id) setViewId(null);
      await load(q);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function runBulkDelete() {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    setBusy(true); setError(""); setOk("");
    let done = 0, skipped = 0;
    try {
      for (const c of targets) {
        try { await customersApi.remove(c.id); done++; } catch { skipped++; }
      }
      setOk(`Deleted ${done} customer${done === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}.`);
      setSelectedIds(new Set());
      setBulkConfirm(false);
      await load(q);
    } finally {
      setBusy(false);
    }
  }

  // Keyboard shortcuts on the selected row: Enter → View, Ctrl/⌘+E → Edit, Delete → Delete.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedKey || showForm || viewId || confirm || bulkConfirm) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const c = rows.find((x) => x.id === selectedKey);
      if (!c) return;
      if (e.key === "Enter") { e.preventDefault(); openView(c); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
        if (can("customer:update")) { e.preventDefault(); startEdit(c); }
      } else if (e.key === "Delete") {
        if (can("customer:delete")) { e.preventDefault(); setConfirm(c); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey, rows, showForm, viewId, confirm, bulkConfirm, can]);

  const stats = useMemo(() => {
    const corporate = rows.filter((c) => c.type === "corporate").length;
    const agentOwned = rows.filter((c) => c.primaryAgent).length;
    const withEmail = rows.filter((c) => !!c.email).length;
    return { corporate, agentOwned, withEmail };
  }, [rows]);

  const columns: Column<Customer>[] = [
    {
      key: "select",
      className: "w-8",
      header: (
        <input
          type="checkbox"
          aria-label="Select all customers"
          className="cursor-pointer"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected; }}
          onChange={toggleAll}
        />
      ),
      render: (c) => (
        <input
          type="checkbox"
          aria-label={`Select ${c.fullName}`}
          className="cursor-pointer"
          checked={selectedIds.has(c.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleOne(c.id)}
        />
      ),
    },
    { key: "avatar", header: "", className: "w-10", render: (c) => <Avatar name={c.fullName} /> },
    {
      key: "code",
      header: "Code",
      className: "font-mono font-semibold",
      render: (c) => (
        <button type="button" onClick={() => openView(c)} className="text-[var(--accent)] hover:underline">
          {c.code}
        </button>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (c) => {
        const badges = customerBadges(c);
        return (
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => openView(c)} className="text-left font-semibold text-[var(--primary)] hover:underline">
              {c.fullName}
            </button>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {badges.map((b) => <Pill key={b.label} value={b.label} tone={b.tone} />)}
              </div>
            )}
          </div>
        );
      },
    },
    { key: "phone", header: "Phone", render: (c) => c.phone || "—" },
    { key: "email", header: "Email", render: (c) => c.email || "—" },
    {
      key: "owner",
      header: "Owner",
      render: (c) =>
        c.primaryAgent ? (
          <span className="font-medium text-[var(--primary)]" title={c.primaryAgent.code}>{c.primaryAgent.name}</span>
        ) : (
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">House</span>
        ),
    },
    { key: "nationality", header: "Nationality", render: (c) => c.nationality || "—" },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Can perm="customer:read">
            <button type="button" className={`${btnGhost} px-2 py-1`} title="View" aria-label="View" onClick={() => openView(c)}>
              <Eye size={13} />
            </button>
          </Can>
          <Can perm="customer:update">
            <button type="button" className={`${btnGhost} px-2 py-1`} title="Edit" aria-label="Edit" onClick={() => startEdit(c)}>
              <Pencil size={13} />
            </button>
          </Can>
          <Can perm="customer:delete">
            <button type="button" className={`${btnGhost} px-2 py-1 text-red-600`} title="Delete" aria-label="Delete" disabled={busy} onClick={() => setConfirm(c)}>
              <Trash2 size={13} />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Users}
        title="Customer Management"
        subtitle="Profiles, contact details, ownership, and passport links for bookings."
        breadcrumb={[{ label: "Customers" }, { label: "Directory" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load(q)}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="customer:create">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={openCreate}>
                <Plus size={13} /> Add Customer
              </button>
            </Can>
          </>
        }
      />
      <StatStrip>
        <KpiCard label="Total customers" value={total} />
        <KpiCard label="Loaded" value={rows.length} tone="accent" />
        <KpiCard label="Agent-owned" value={stats.agentOwned} />
        <KpiCard label="Corporate" value={stats.corporate} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {bulkConfirm && (
        <Can perm="customer:delete">
          <Surface>
            <div className="p-4 sm:p-5">
              <p className="text-[13px] font-bold text-[var(--primary)]">Delete {selectedIds.size} customer{selectedIds.size === 1 ? "" : "s"}?</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">
                Soft-delete only — bookings, invoices, passports and history are retained. This cannot be undone from here.
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" className={btnGhost} onClick={() => setBulkConfirm(false)}>Cancel</button>
                <button type="button" className={btnPrimary} style={btnPrimaryStyle} disabled={busy} onClick={() => void runBulkDelete()}>Delete selected</button>
              </div>
            </div>
          </Surface>
        </Can>
      )}

      {selectedIds.size > 0 && (
        <Surface>
          <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
            <span className="text-[12px] font-bold text-[var(--foreground)]">{selectedIds.size} selected</span>
            <span className="text-[11px] text-[var(--muted-foreground)]">Bulk actions:</span>
            <button type="button" className={btnGhost} onClick={() => exportCustomersExcel(rows.filter((r) => selectedIds.has(r.id)))}>
              <FileSpreadsheet size={12} /> Export
            </button>
            <Can perm="customer:delete">
              <button type="button" className={btnGhost} disabled={busy} onClick={() => setBulkConfirm(true)}>
                <Trash2 size={12} /> Delete
              </button>
            </Can>
            <button type="button" className={`${btnGhost} ml-auto`} onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        </Surface>
      )}

      {confirm && (
        <Can perm="customer:delete">
          <Surface>
            <div className="p-4 sm:p-5">
              <p className="text-[13px] font-bold text-[var(--primary)]">Delete customer?</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">
                This soft-deletes <span className="font-semibold">{confirm.fullName}</span> ({confirm.code}). Bookings, invoices, passports and history are retained.
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" className={btnGhost} onClick={() => setConfirm(null)}>Cancel</button>
                <button type="button" className={btnPrimary} style={btnPrimaryStyle} disabled={busy} onClick={() => void doRemove(confirm)}>Delete</button>
              </div>
            </div>
          </Surface>
        </Can>
      )}

      {showForm && (can("customer:create") || can("customer:update")) && (
        <CustomerForm
          editing={editing}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onDone={(c, created) => {
            setShowForm(false);
            setEditing(null);
            if (created) {
              setOk(`Customer created: ${c.code}`);
              navigate(`/customers/${c.id}`);
            } else {
              setOk(`Customer updated: ${c.code}`);
              void load(q).then(() => requestAnimationFrame(() => window.scrollTo(0, scrollPosRef.current)));
            }
          }}
        />
      )}

      <Surface>
        <ModuleLookupFilters />
        <SurfaceHeader
          title={`${rows.length} customer${rows.length === 1 ? "" : "s"} shown`}
          hint={selectedCustomer ? `Selected: ${selectedCustomer.fullName} — Enter to view, Ctrl+E to edit, Del to delete.` : "Click a row to select it; double-click to open Customer 360."}
          action={
            <button
              type="button"
              className={btnGhost}
              disabled={!selectedCustomer}
              title={selectedCustomer ? `Export ${selectedCustomer.fullName} as Excel` : "Select a customer row first"}
              onClick={() => selectedCustomer && exportCustomersExcel([selectedCustomer])}
            >
              <FileSpreadsheet size={12} /> Export
            </button>
          }
        />
        <ListToolbar>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load(q)}
              placeholder="Search name / phone / code / email…"
              className={searchInputClassName}
            />
          </div>
          <button type="button" className={btnGhost} onClick={() => void load(q)}>
            Search
          </button>
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No customers yet"
          emptyHint="Create a customer, then open Customer 360."
          selectedKey={selectedKey}
          onRowClick={(r) => setSelectedKey(r.id)}
          onRowDoubleClick={(r) => openView(r)}
          rowClassName={(r) => (r.status && r.status.toLowerCase() !== "active" ? "opacity-60" : "")}
        />
      </Surface>

      {/* Customer 360 drawer — reuses the Sheet + CustomerIntelligencePanel, no navigation away. */}
      <Sheet open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Customer 360</SheetTitle>
          </SheetHeader>
          {viewId && <CustomerIntelligencePanel profile={profile} loading={profileLoading} />}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

function CustomerForm({
  editing,
  onCancel,
  onDone,
}: {
  editing: Customer | null;
  onCancel: () => void;
  onDone: (c: Customer, created: boolean) => void;
}) {
  const [form, setForm] = useState({
    fullName: editing?.fullName || "",
    phone: editing?.phone || "",
    email: editing?.email || "",
    nationality: editing?.nationality || "Bangladeshi",
    gender: editing?.gender || "",
    dob: editing?.dob ? String(editing.dob).slice(0, 10) : "",
    address: editing?.address || "",
    notes: editing?.notes || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
      };
      if (form.email.trim()) body.email = form.email.trim();
      if (form.nationality.trim()) body.nationality = form.nationality.trim();
      if (form.gender) body.gender = form.gender;
      if (form.dob) body.dob = form.dob;
      if (form.address.trim()) body.address = form.address.trim();
      if (form.notes.trim()) body.notes = form.notes.trim();
      const c = editing ? await customersApi.update(editing.id, body) : await customersApi.create(body);
      onDone(c, !editing);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : editing ? "Update failed" : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Surface>
      <SurfaceHeader title={editing ? `Edit customer · ${editing.code}` : "New customer"} hint="Phone and full name are required." />
      <form onSubmit={submit} className="space-y-3 p-4 sm:p-5">
        <ErrorBanner message={error} />
        {!editing && (
          <ScanDocumentPanel
            defaultDocType="passport"
            savePassportOnConfirm={false}
            title="Scan ID / Passport"
            onAutofill={(fields) => {
              setForm((f) => ({
                ...f,
                fullName: ocrFullName(fields) || f.fullName,
                nationality: fields.nationality || f.nationality,
                gender: ocrGenderToForm(fields.gender) || f.gender,
                dob: fields.dateOfBirth || f.dob,
              }));
            }}
          />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Full name *</label>
            <input className={inputCls} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Phone *</label>
            <input className={inputCls} required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Nationality</label>
            <input className={inputCls} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Gender</label>
            <select className={inputCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">—</option>
              <option value="male">male</option>
              <option value="female">female</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date of birth</label>
            <input type="date" className={inputCls} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Address</label>
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className={btnPrimary} style={btnPrimaryStyle}>
            {loading ? "Saving…" : editing ? "Save changes" : "Create customer"}
          </button>
          <button type="button" onClick={onCancel} className={btnGhost}>
            Cancel
          </button>
        </div>
      </form>
    </Surface>
  );
}
