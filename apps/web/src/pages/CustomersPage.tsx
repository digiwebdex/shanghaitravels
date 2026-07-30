import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, ChevronLeft } from "lucide-react";
import { customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { passportExpiry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

const inputCls =
  "w-full px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-amber-400";
const labelCls = "block text-[10px] font-bold text-slate-500 mb-1";

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
    <div>
      <DemoBadge moduleKey="customers" />
      <div className="p-5 max-w-[1200px]">
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h1 className="text-[16px] font-bold text-slate-800">Customer Management</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">{total} customers · live API</p>
          </div>
          <Can perm="customer:create">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
            >
              <Plus size={13} /> Add Customer
            </button>
          </Can>
        </div>

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

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load(q);
                }}
                placeholder="Search name / phone / code / email…"
                className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="button"
              onClick={() => void load(q)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Search
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No records yet" hint="Create a customer to start a visa case." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-[9.5px] uppercase tracking-wider text-slate-400 border-b border-slate-50">
                  <th className="px-4 py-2 font-bold">Code</th>
                  <th className="px-4 py-2 font-bold">Name</th>
                  <th className="px-4 py-2 font-bold">Phone</th>
                  <th className="px-4 py-2 font-bold">Email</th>
                  <th className="px-4 py-2 font-bold">Nationality</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-4 py-2.5 text-[11px] font-mono font-bold text-amber-700">{c.code}</td>
                    <td className="px-4 py-2.5 text-[11px] font-semibold text-slate-800">{c.fullName}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600">{c.phone}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500">{c.email || "—"}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500">{c.nationality || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
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
    <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <h2 className="text-[13px] font-bold text-slate-800 mb-3">New customer</h2>
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg text-[11px] font-bold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
        >
          {loading ? "Saving…" : "Create customer"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CustomerDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { can } = useAuth();
  const [c, setC] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", whatsapp: "", nationality: "", gender: "", address: "", notes: "" });

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
      <div className="flex justify-center py-20">
        <InlineSpinner />
      </div>
    );
  }
  if (!c) {
    return (
      <div className="p-5">
        <ErrorBanner message={error || "Customer not found"} />
        <button type="button" onClick={onBack} className="text-[11px] text-amber-600 font-semibold">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-[900px]">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 mb-3">
        <ChevronLeft size={14} /> Customers
      </button>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-mono font-bold text-amber-600">{c.code}</p>
            <h1 className="text-[18px] font-bold text-slate-800">{c.fullName}</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {c.phone}
              {c.email ? ` · ${c.email}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Can perm="customer:update">
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                {editing ? "Close" : "Edit"}
              </button>
            </Can>
            <Link
              to={`/visa/new?customerId=${c.id}`}
              className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
            >
              New visa case
            </Link>
          </div>
        </div>

        {editing && can("customer:update") && (
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
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
              <button type="submit" className="px-4 py-2 rounded-lg text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Save changes
              </button>
            </div>
          </form>
        )}

        {!editing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Nationality</p>
              <p className="font-semibold text-slate-700">{c.nationality || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Gender</p>
              <p className="font-semibold text-slate-700">{c.gender || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Address</p>
              <p className="font-semibold text-slate-700">{c.address || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Notes</p>
              <p className="font-semibold text-slate-700">{c.notes || "—"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-[13px] font-bold text-slate-800 mb-3">Passports</h2>
        {(c.passports || []).length === 0 ? (
          <p className="text-[11px] text-slate-400">No passports yet — add via Passport Management or a visa case.</p>
        ) : (
          <ul className="space-y-2">
            {c.passports!.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-[11px] border border-slate-100 rounded-lg px-3 py-2">
                <span className="font-mono font-bold text-slate-800">{p.passportNo}</span>
                <span className="text-slate-500">
                  {p.issuingCountry || "—"} · exp {passportExpiry(p)}
                  {p.isPrimary ? " · primary" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link to={`/passports?customerId=${c.id}`} className="inline-block mt-3 text-[10.5px] font-semibold text-amber-600 hover:underline">
          Manage passports →
        </Link>
      </div>
    </div>
  );
}
