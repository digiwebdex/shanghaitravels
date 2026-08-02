import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, Plus, RefreshCw, Search, Users } from "lucide-react";
import { customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { passportExpiry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { Column, DataTable } from "@/components/enterprise/DataTable";
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
import { CustomerDocumentTimeline } from "@/components/ocr/OcrOpsWidget";

export default function CustomersPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await customersApi.list({ limit: 100, q: search || undefined });
      const data = listOf<Customer>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const withEmail = rows.filter((c) => !!c.email).length;
    const withPassport = rows.filter((c) => (c.passports?.length ?? 0) > 0).length;
    return { withEmail, withPassport };
  }, [rows]);

  const columns: Column<Customer>[] = [
    {
      key: "code",
      header: "Code",
      render: (c) => (
        <button
          type="button"
          className="font-mono text-[11.5px] font-bold text-[var(--accent)] hover:underline"
          onClick={() => setSelected(c)}
        >
          {c.code}
        </button>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (c) => (
        <button type="button" className="font-semibold text-[var(--primary)] hover:underline" onClick={() => setSelected(c)}>
          {c.fullName}
        </button>
      ),
    },
    { key: "phone", header: "Phone", render: (c) => c.phone || "—" },
    { key: "email", header: "Email", render: (c) => c.email || "—" },
    { key: "nationality", header: "Nationality", render: (c) => c.nationality || "—" },
  ];

  if (selected) {
    return (
      <CustomerDetail
        id={selected.id}
        onBack={() => {
          setSelected(null);
          void load(q);
        }}
      />
    );
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Users}
        title="Customer Management"
        subtitle="Profiles, contact details, and passport links for bookings."
        breadcrumb={[{ label: "Customers" }, { label: "Directory" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load(q)}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="customer:create">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setShowCreate((s) => !s)}>
                <Plus size={13} /> Add Customer
              </button>
            </Can>
          </>
        }
      />
      <StatStrip>
        <KpiCard label="Total customers" value={total} />
        <KpiCard label="Loaded" value={rows.length} tone="accent" />
        <KpiCard label="With email" value={stats.withEmail} />
        <KpiCard label="With passport" value={stats.withPassport} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {showCreate && can("customer:create") && (
        <CreateCustomerForm
          onCancel={() => setShowCreate(false)}
          onCreated={(c) => {
            setShowCreate(false);
            setOk(`Customer created: ${c.code}`);
            setSelected(c);
          }}
        />
      )}

      <Surface>
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
          emptyHint="Create a customer to start a visa case."
        />
      </Surface>
    </PageShell>
  );
}

function CreateCustomerForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (c: Customer) => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    nationality: "Bangladeshi",
    gender: "",
    dob: "",
    address: "",
    notes: "",
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
      const c = await customersApi.create(body);
      onCreated(c);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Surface>
      <SurfaceHeader title="New customer" hint="Phone and full name are required." />
      <form onSubmit={submit} className="space-y-3 p-4 sm:p-5">
        <ErrorBanner message={error} />
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
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className={btnPrimary} style={btnPrimaryStyle}>
            {loading ? "Saving…" : "Create customer"}
          </button>
          <button type="button" onClick={onCancel} className={btnGhost}>
            Cancel
          </button>
        </div>
      </form>
    </Surface>
  );
}

function CustomerDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { can } = useAuth();
  const [c, setC] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    whatsapp: "",
    nationality: "",
    gender: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const cust = await customersApi.get(id);
        if (cancelled) return;
        setC(cust);
        setForm({
          fullName: cust.fullName || "",
          phone: cust.phone || "",
          email: cust.email || "",
          whatsapp: cust.whatsapp || "",
          nationality: cust.nationality || "",
          gender: cust.gender || "",
          address: cust.address || "",
          notes: cust.notes || "",
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const updated = await customersApi.update(id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        nationality: form.nationality.trim() || null,
        gender: form.gender || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      });
      setC(updated);
      setOk("Customer updated.");
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-20">
          <InlineSpinner />
        </div>
      </PageShell>
    );
  }
  if (!c) {
    return (
      <PageShell>
        <ErrorBanner message={error || "Customer not found"} />
        <button type="button" onClick={onBack} className="text-[12px] font-semibold text-[var(--accent)]">
          ← Back
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        icon={Users}
        title={c.fullName}
        subtitle={`${c.code}${c.phone ? ` · ${c.phone}` : ""}${c.email ? ` · ${c.email}` : ""}`}
        breadcrumb={[
          { label: "Customers", to: "/customers" },
          { label: "Directory", to: "/customers" },
          { label: c.code },
        ]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={onBack}>
              <ChevronLeft size={12} /> Back
            </button>
            <Can perm="customer:update">
              <button type="button" className={btnGhost} onClick={() => setEditing((v) => !v)}>
                {editing ? "Close" : "Edit"}
              </button>
            </Can>
            <Link to={`/visa/new?customerId=${c.id}`} className={btnPrimary} style={btnPrimaryStyle}>
              New visa case
            </Link>
          </>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Surface padded>
        {editing && can("customer:update") ? (
          <form onSubmit={save} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                ["fullName", "Full name"],
                ["phone", "Phone"],
                ["email", "Email"],
                ["whatsapp", "WhatsApp"],
                ["nationality", "Nationality"],
                ["address", "Address"],
              ] as const
            ).map(([k, label]) => (
              <div key={k}>
                <label className={labelCls}>{label}</label>
                <input className={inputCls} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className={labelCls}>Gender</label>
              <select className={inputCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">—</option>
                <option value="male">male</option>
                <option value="female">female</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Save changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
            <div>
              <p className={labelCls}>Nationality</p>
              <p className="font-semibold text-[var(--primary)]">{c.nationality || "—"}</p>
            </div>
            <div>
              <p className={labelCls}>Gender</p>
              <p className="font-semibold text-[var(--primary)]">{c.gender || "—"}</p>
            </div>
            <div>
              <p className={labelCls}>Address</p>
              <p className="font-semibold text-[var(--primary)]">{c.address || "—"}</p>
            </div>
            <div>
              <p className={labelCls}>Notes</p>
              <p className="font-semibold text-[var(--primary)]">{c.notes || "—"}</p>
            </div>
          </div>
        )}
      </Surface>

      <Surface>
        <SurfaceHeader title="Passports" />
        <div className="space-y-3 p-4 sm:p-5">
          <ScanDocumentPanel
            customerId={c.id}
            defaultDocType="passport"
            title="Scan passport"
            onAutofill={(fields) => {
              setForm((f) => ({
                ...f,
                fullName: ocrFullName(fields) || f.fullName,
                nationality: fields.nationality || f.nationality,
                gender: ocrGenderToForm(fields.gender) || f.gender,
              }));
              setOk("OCR fields applied — save customer if demographics changed.");
              void customersApi.get(id).then(setC);
            }}
          />
          {(c.passports || []).length === 0 ? (
            <p className="text-[12px] text-[var(--muted-foreground)]">
              No passports yet — scan above or open Passport Management.
            </p>
          ) : (
            <ul className="space-y-2">
              {c.passports!.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-[12px] ring-1 ring-[var(--ring-card)]"
                >
                  <span className="font-mono font-bold text-[var(--primary)]">{p.passportNo}</span>
                  <span className="text-[var(--muted-foreground)]">
                    {p.issuingCountry || "—"} · exp {passportExpiry(p)}
                    {p.isPrimary ? " · primary" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to={`/passports?customerId=${c.id}`} className="inline-block text-[11px] font-semibold text-[var(--accent)] hover:underline">
            Manage passports →
          </Link>
        </div>
      </Surface>

      <Surface padded>
        <CustomerDocumentTimeline customerId={c.id} passports={c.passports} />
      </Surface>
    </PageShell>
  );
}
