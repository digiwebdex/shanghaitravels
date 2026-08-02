import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router";
import { Plus, RefreshCw, Truck } from "lucide-react";
import { apApi, suppliersApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Supplier } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { PartnerModuleNav } from "@/components/partners/PartnerModuleNav";
import { Column, DataTable, Pill } from "@/components/enterprise/DataTable";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost, btnPrimary, btnPrimaryStyle } from "@/components/enterprise/Page";
import { SUPPLIER_TYPES, supplierTypeLabel } from "@/config/nav";
import { fmtBDTPlain } from "@/lib/money";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { NextStepBanner } from "@/components/workflow/MasterJourney";

type Row = Supplier & { outstandingPoisha?: number };

/**
 * Supplier directory. Serves both `/partners/suppliers` (all types) and
 * `/partners/suppliers/:type`, and joins in AP outstanding balances so the
 * commercial picture sits next to the contact record.
 */
export default function SuppliersPage() {
  const navigate = useNavigate();
  const { type } = useParams<{ type?: string }>();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: type ?? "airline",
    contactName: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, type: type ?? "airline" }));
  }, [type]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, dues] = await Promise.all([
        suppliersApi.list({ type: type || undefined, q: q.trim() || undefined, limit: 200 }),
        // AP balances are a separate permission; a 403 here must not blank the directory.
        apApi.listSuppliers().catch(() => []),
      ]);
      const dueBySupplier = new Map(dues.map((d) => [d.id, d.outstandingPoisha]));
      setRows(listOf<Supplier>(list).map((s) => ({ ...s, outstandingPoisha: dueBySupplier.get(s.id) })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, [type, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setOk("");
    try {
      await suppliersApi.create({
        name: form.name.trim(),
        type: form.type,
        contactName: form.contactName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setOk(`${supplierTypeLabel(form.type).replace(/s$/, "")} created`);
      setForm({ name: "", type: form.type, contactName: "", phone: "", email: "", address: "", notes: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const totalDue = useMemo(
    () => rows.reduce((sum, r) => sum + (r.outstandingPoisha ?? 0), 0),
    [rows],
  );

  const typeSummary = useMemo(() => {
    const map = new Map<string, { count: number; due: number }>();
    for (const r of rows) {
      const key = r.type || "other";
      const cur = map.get(key) || { count: 0, due: 0 };
      cur.count += 1;
      cur.due += r.outstandingPoisha ?? 0;
      map.set(key, cur);
    }
    return SUPPLIER_TYPES.map((t) => ({
      ...t,
      count: map.get(t.type)?.count ?? 0,
      due: map.get(t.type)?.due ?? 0,
    }));
  }, [rows]);

  const activeCount = useMemo(() => rows.filter((r) => r.isActive !== false).length, [rows]);

  const columns: Column<Row>[] = [
    { key: "code", header: "Code", className: "font-mono font-semibold text-[var(--primary)]", render: (r) => r.code },
    { key: "name", header: "Name", render: (r) => <span className="font-semibold text-[var(--primary)]">{r.name}</span> },
    {
      key: "type",
      header: "Type",
      render: (r) => <Pill value={r.type || "other"} tone="blue" />,
    },
    { key: "contact", header: "Contact", render: (r) => r.contactName || "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
    {
      key: "due",
      header: "AP Outstanding",
      className: "text-right tabular-nums",
      render: (r) =>
        r.outstandingPoisha == null ? (
          <span className="text-[var(--navy-200)]">—</span>
        ) : (
          <span className={r.outstandingPoisha > 0 ? "font-semibold text-red-600" : "text-[var(--muted-foreground)]"}>
            {fmtBDTPlain(r.outstandingPoisha)}
          </span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Pill value={r.isActive === false ? "inactive" : "active"} tone={r.isActive === false ? "red" : "green"} />,
    },
  ];

  const heading = type ? supplierTypeLabel(type) : "Supplier directory";

  return (
    <PageShell wide>
      <PageHeader
        icon={Truck}
        title={heading}
        subtitle="Every airline, hotel, embassy, DMC and transport partner the agency buys from. Supplier records drive Accounts Payable, package costing and supplier ledgers."
        breadcrumb={[{ label: "Business Partners" }, { label: "Suppliers", to: "/partners/suppliers" }, ...(type ? [{ label: heading }] : [])]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="supplier:manage">
              <button
                type="button"
                className={btnPrimary}
                style={btnPrimaryStyle}
                onClick={() => setShowForm((s) => !s)}
              >
                <Plus size={13} /> Add supplier
              </button>
            </Can>
          </>
        }
      />

      <PartnerModuleNav />

      <NextStepBanner
        title="Supplier Center"
        body="Suppliers stay separate from customers, agents and corporate clients. Link them from Booking 360 — payables flow from booking → supplier invoice → payment."
        actions={[
          { label: "AP desk", to: "/finance/ap", primary: true },
          { label: "Operations queue", to: "/operations" },
          { label: "New booking", to: "/bookings/new" },
        ]}
      />
      <div className="mb-3">
        <EntityTabs
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "bookings", label: "Bookings" },
            { id: "invoices", label: "Invoices" },
            { id: "payments", label: "Payments" },
            { id: "performance", label: "Performance" },
            { id: "documents", label: "Documents" },
            { id: "packages", label: "Packages" },
            { id: "timeline", label: "Timeline" },
          ]}
          active="overview"
          onChange={(id) => {
            if (id === "invoices" || id === "payments") navigate("/finance/ap");
            else if (id === "packages") navigate("/products/packages");
            else if (id === "bookings") navigate("/operations");
            else if (id === "documents") navigate("/operations/documents");
          }}
        />
      </div>

      {!type && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="Supplier type summary">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Directory</p>
            <p className="mt-1 text-[22px] font-black tabular-nums text-[var(--primary)]">{rows.length}</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {activeCount} active
              {totalDue > 0 ? ` · ${fmtBDTPlain(totalDue)} due` : ""}
            </p>
          </div>
          {typeSummary
            .filter((t) => t.count > 0)
            .map((t) => (
              <Link
                key={t.type}
                to={`/partners/suppliers/${t.type}`}
                className="rounded-2xl border border-[var(--border)] bg-white p-3.5 transition-all hover:border-orange-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  <t.icon size={12} className="text-orange-600" />
                  {t.label}
                </div>
                <p className="mt-1 text-[22px] font-black tabular-nums text-[var(--primary)]">{t.count}</p>
                <p className={`text-[10px] ${t.due > 0 ? "font-semibold text-red-600" : "text-[var(--muted-foreground)]"}`}>
                  {t.due > 0 ? `${fmtBDTPlain(t.due)} due` : "No AP due"}
                </p>
              </Link>
            ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1" role="navigation" aria-label="Filter by supplier type">
        <NavLink
          to="/partners/suppliers"
          end
          className={({ isActive }) =>
            `rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              isActive
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-slate-300"
            }`
          }
        >
          All types
        </NavLink>
        {SUPPLIER_TYPES.map((t) => (
          <NavLink
            key={t.type}
            to={`/partners/suppliers/${t.type}`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-slate-300"
              }`
            }
          >
            <t.icon size={12} />
            {t.label}
          </NavLink>
        ))}
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {showForm && (
        <Can perm="supplier:manage">
          <Surface>
            <SurfaceHeader title="Add supplier" hint="Creates a record usable by AP, packages and bookings." />
            <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <label className={labelCls} htmlFor="sup-name">
                  Name *
                </label>
                <input
                  id="sup-name"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="sup-type">
                  Type *
                </label>
                <select
                  id="sup-type"
                  className={inputCls}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {SUPPLIER_TYPES.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="sup-contact">
                  Contact person
                </label>
                <input
                  id="sup-contact"
                  className={inputCls}
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="sup-phone">
                  Phone
                </label>
                <input
                  id="sup-phone"
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="sup-email">
                  Email
                </label>
                <input
                  id="sup-email"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="sup-address">
                  Address
                </label>
                <input
                  id="sup-address"
                  className={inputCls}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls} htmlFor="sup-notes">
                  Notes
                </label>
                <input
                  id="sup-notes"
                  className={inputCls}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2 sm:col-span-3">
                <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                  Save supplier
                </button>
                <button type="button" className={btnGhost} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </Surface>
        </Can>
      )}

      <Surface>
        <SurfaceHeader
          title={`${rows.length} supplier${rows.length === 1 ? "" : "s"}`}
          hint={totalDue > 0 ? `${fmtBDTPlain(totalDue)} outstanding across this view` : undefined}
          action={
            <div className="flex gap-2">
              <input
                className="w-44 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11.5px] sm:w-60"
                placeholder="Search name, code, contact…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void load()}
                aria-label="Search suppliers"
              />
              <Link to="/products/packages" className={btnGhost}>
                Packages
              </Link>
              <Link to="/finance/ap" className={btnGhost}>
                Open AP
              </Link>
            </div>
          }
        />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No suppliers in this view"
          emptyHint="Add a supplier, clear the search, or check the supplier:read permission."
        />
      </Surface>
    </PageShell>
  );
}
