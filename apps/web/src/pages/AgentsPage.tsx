import { FormEvent, useCallback, useEffect, useState } from "react";
import { Handshake, Plus, RefreshCw } from "lucide-react";
import { agentsApi, type Agent } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { inputCls, labelCls } from "@/components/cases/formStyles";
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
} from "@/components/enterprise/Page";
import { fmtBDTPlain } from "@/lib/money";

export default function AgentsPage() {
  const [rows, setRows] = useState<Agent[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", commissionRateBps: "250" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await agentsApi.list({ q: q.trim() || undefined, limit: 100 });
      setRows(listOf<Agent>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [q]);

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
      await agentsApi.create({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        commissionRateBps: Math.round(Number(form.commissionRateBps) || 0),
      });
      setOk("Agent created");
      setForm({ name: "", phone: "", email: "", address: "", commissionRateBps: "250" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const columns: Column<Agent>[] = [
    { key: "code", header: "Code", className: "font-mono font-semibold", render: (r) => r.code },
    { key: "name", header: "Name", render: (r) => <span className="font-semibold text-[var(--primary)]">{r.name}</span> },
    { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
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
        subtitle="B2B referrers with commission wallets. Viewing requires commission:read; create requires agent:manage."
        breadcrumb={[{ label: "Business Partners", to: "/partners/suppliers" }, { label: "Agents" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="agent:manage">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setShowForm((s) => !s)}>
                <Plus size={13} /> Add agent
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
            <SurfaceHeader title="Add agent" hint="Commission rate is in basis points (250 = 2.5%)." />
            <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <label className={labelCls} htmlFor="ag-name">Name *</label>
                <input id="ag-name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
                <label className={labelCls} htmlFor="ag-bps">Commission (bps)</label>
                <input id="ag-bps" className={inputCls} value={form.commissionRateBps} onChange={(e) => setForm({ ...form, commissionRateBps: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="ag-address">Address</label>
                <input id="ag-address" className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex gap-2 sm:col-span-3">
                <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>Save agent</button>
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
            <input
              className="w-44 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11.5px] sm:w-60"
              placeholder="Search agents…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search agents"
            />
          }
        />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No agents"
          emptyHint="Add an agent or check commission:read permission."
        />
      </Surface>
    </PageShell>
  );
}
