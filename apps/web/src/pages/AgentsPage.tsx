import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Handshake, Plus, RefreshCw } from "lucide-react";
import { agentsApi, agentTiersApi, type Agent, type AgentTier } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { PartnerModuleNav } from "@/components/partners/PartnerModuleNav";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  selectClassName,
} from "@/components/enterprise/Page";
import { fmtBDTPlain } from "@/lib/money";

const STATUS_FILTERS = ["", "pending", "active", "suspended", "rejected"] as const;
const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  commissionRateBps: "250",
  companyName: "",
  contactPerson: "",
  tradeLicenseNo: "",
  nationalId: "",
  tierId: "",
  asApplicant: true,
};

export default function AgentsPage() {
  const [rows, setRows] = useState<Agent[]>([]);
  const [tiers, setTiers] = useState<AgentTier[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await agentsApi.list({ q: q.trim() || undefined, status: status || undefined, limit: 100 });
      setRows(listOf<Agent>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    agentTiersApi.list().then(setTiers).catch(() => setTiers([]));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setOk("");
    try {
      await agentsApi.create({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        commissionRateBps: Math.round(Number(form.commissionRateBps) || 0),
        companyName: form.companyName.trim() || undefined,
        contactPerson: form.contactPerson.trim() || undefined,
        tradeLicenseNo: form.tradeLicenseNo.trim() || undefined,
        nationalId: form.nationalId.trim() || undefined,
        tierId: form.tierId || undefined,
        onboarding: form.asApplicant,
      });
      setOk(form.asApplicant ? "Applicant registered — pending approval" : "Agent created");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const columns: Column<Agent>[] = [
    { key: "code", header: "Code", className: "font-mono font-semibold", render: (r) => r.code },
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <Link to={`/partners/agents/${r.id}`} className="font-semibold text-[var(--accent)] hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: "company", header: "Company", render: (r) => r.companyName || "—" },
    { key: "tier", header: "Tier", render: (r) => r.tier?.name || "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
    {
      key: "rate",
      header: "Commission",
      className: "tabular-nums",
      render: (r) => `${((r.commissionRateBps ?? 0) / 100).toFixed(2)}%`,
    },
    {
      key: "wallet",
      header: "Wallet",
      className: "text-right tabular-nums",
      render: (r) => fmtBDTPlain(r.walletBalance ?? 0),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Pill value={r.status || "active"} tone={statusTone(r.status || "active")} />,
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Handshake}
        title="Agents"
        subtitle="B2B agents & onboarding. Viewing requires commission:read; onboarding & approval require agent:manage."
        breadcrumb={[{ label: "Business Partners", to: "/partners/suppliers" }, { label: "Agents" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="agent:manage">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setShowForm((s) => !s)}>
                <Plus size={13} /> Onboard agent
              </button>
            </Can>
          </>
        }
      />
      <PartnerModuleNav />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {showForm && (
        <Can perm="agent:manage">
          <Surface>
            <SurfaceHeader title="Onboard agent" hint="Applicants start as pending and require approval. Commission rate is in basis points (250 = 2.5%)." />
            <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <label className={labelCls} htmlFor="ag-name">Name *</label>
                <input id="ag-name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls} htmlFor="ag-company">Company</label>
                <input id="ag-company" className={inputCls} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ag-contact">Contact person</label>
                <input id="ag-contact" className={inputCls} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ag-phone">Phone</label>
                <input id="ag-phone" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ag-email">Email</label>
                <input id="ag-email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ag-tier">Tier</label>
                <select id="ag-tier" className={selectClassName} value={form.tierId} onChange={(e) => setForm({ ...form, tierId: e.target.value })}>
                  <option value="">— unassigned —</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="ag-license">Trade license</label>
                <input id="ag-license" className={inputCls} value={form.tradeLicenseNo} onChange={(e) => setForm({ ...form, tradeLicenseNo: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ag-nid">National ID</label>
                <input id="ag-nid" className={inputCls} value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ag-bps">Commission (bps)</label>
                <input id="ag-bps" className={inputCls} value={form.commissionRateBps} onChange={(e) => setForm({ ...form, commissionRateBps: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls} htmlFor="ag-address">Address</label>
                <input id="ag-address" className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-[11.5px] font-semibold text-[var(--foreground)] sm:col-span-3">
                <input type="checkbox" checked={form.asApplicant} onChange={(e) => setForm({ ...form, asApplicant: e.target.checked })} />
                Register as onboarding applicant (pending approval)
              </label>
              <div className="flex gap-2 sm:col-span-3">
                <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>{form.asApplicant ? "Submit application" : "Create active agent"}</button>
                <button type="button" className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </Surface>
        </Can>
      )}

      <Surface>
        <SurfaceHeader
          title={`${rows.length} agent${rows.length === 1 ? "" : "s"}`}
          action={
            <div className="flex items-center gap-2">
              <select className={selectClassName} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                {STATUS_FILTERS.map((s) => (
                  <option key={s || "all"} value={s}>{s ? s : "All statuses"}</option>
                ))}
              </select>
              <input
                className="w-44 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11.5px] sm:w-60"
                placeholder="Search agents…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void load()}
                aria-label="Search agents"
              />
            </div>
          }
        />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No agents"
          emptyHint="Onboard an agent or check commission:read permission."
        />
      </Surface>
    </PageShell>
  );
}
