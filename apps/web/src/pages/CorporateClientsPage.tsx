import { FormEvent, useCallback, useEffect, useState } from "react";
import { Building2, Plus, RefreshCw } from "lucide-react";
import { corporateClientsApi, type CorporateClient } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { PartnerModuleNav } from "@/components/partners/PartnerModuleNav";
import { Column, DataTable, Pill } from "@/components/enterprise/DataTable";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
} from "@/components/enterprise/Page";
import { fmtBDTPlain, toPoisha } from "@/lib/money";

export default function CorporateClientsPage() {
  const [rows, setRows] = useState<CorporateClient[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    creditLimit: "",
    paymentTermsDays: "30",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await corporateClientsApi.list({ q: q.trim() || undefined, limit: 100 });
      setRows(listOf<CorporateClient>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load corporate clients");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim()) {
      setError("Company name is required");
      return;
    }
    setError("");
    setOk("");
    try {
      await corporateClientsApi.create({
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        creditLimit: form.creditLimit ? toPoisha(form.creditLimit) : 0,
        paymentTermsDays: Math.round(Number(form.paymentTermsDays) || 0),
      });
      setOk("Corporate client created");
      setForm({
        companyName: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        creditLimit: "",
        paymentTermsDays: "30",
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const columns: Column<CorporateClient>[] = [
    {
      key: "name",
      header: "Company",
      render: (r) => <span className="font-semibold text-slate-800">{r.companyName}</span>,
    },
    { key: "contact", header: "Contact", render: (r) => r.contactPerson || "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
    {
      key: "credit",
      header: "Credit limit",
      className: "text-right tabular-nums",
      render: (r) => fmtBDTPlain(r.creditLimit ?? 0),
    },
    {
      key: "terms",
      header: "Terms",
      render: (r) => `${r.paymentTermsDays ?? 0} days`,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Pill value={r.isActive === false ? "inactive" : "active"} tone={r.isActive === false ? "red" : "green"} />
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Building2}
        title="Corporate Clients"
        subtitle="B2B companies with credit limits and payment terms. Create requires corporate:manage."
        breadcrumb={[{ label: "Business Partners" }, { label: "Corporate Clients" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="corporate:manage">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setShowForm((s) => !s)}>
                <Plus size={13} /> Add client
              </button>
            </Can>
          </>
        }
      />
      <PartnerModuleNav />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {showForm && (
        <Can perm="corporate:manage">
          <Surface>
            <SurfaceHeader title="Add corporate client" hint="Credit limit is entered in BDT and stored as poisha." />
            <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <label className={labelCls} htmlFor="cc-name">Company name *</label>
                <input id="cc-name" className={inputCls} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls} htmlFor="cc-contact">Contact person</label>
                <input id="cc-contact" className={inputCls} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="cc-phone">Phone</label>
                <input id="cc-phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="cc-email">Email</label>
                <input id="cc-email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="cc-credit">Credit limit (BDT)</label>
                <input id="cc-credit" className={inputCls} value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="cc-terms">Payment terms (days)</label>
                <input id="cc-terms" className={inputCls} value={form.paymentTermsDays} onChange={(e) => setForm({ ...form, paymentTermsDays: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls} htmlFor="cc-address">Address</label>
                <input id="cc-address" className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex gap-2 sm:col-span-3">
                <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>Save client</button>
                <button type="button" className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </Surface>
        </Can>
      )}

      <Surface>
        <SurfaceHeader
          title={`${rows.length} client${rows.length === 1 ? "" : "s"}`}
          action={
            <input
              className="w-44 rounded-lg border border-slate-200 px-3 py-1.5 text-[11.5px] sm:w-60"
              placeholder="Search companies…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search corporate clients"
            />
          }
        />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No corporate clients"
          emptyHint="Add a client or check customer:read permission."
        />
      </Surface>
    </PageShell>
  );
}
