import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, RefreshCw, Search, Users } from "lucide-react";
import { customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
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

export default function CustomersPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
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
        <Link
          to={`/customers/${c.id}`}
          className="font-mono text-[11.5px] font-bold text-[var(--accent)] hover:underline"
        >
          {c.code}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (c) => (
        <Link to={`/customers/${c.id}`} className="font-semibold text-[var(--primary)] hover:underline">
          {c.fullName}
        </Link>
      ),
    },
    { key: "phone", header: "Phone", render: (c) => c.phone || "—" },
    { key: "email", header: "Email", render: (c) => c.email || "—" },
    { key: "nationality", header: "Nationality", render: (c) => c.nationality || "—" },
  ];

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
            navigate(`/customers/${c.id}`);
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
          <Link to="/bookings/new" className={`${btnGhost} text-[11px] font-bold`}>
            New booking wizard
          </Link>
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No customers yet"
          emptyHint="Create a customer, then open Customer 360."
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

