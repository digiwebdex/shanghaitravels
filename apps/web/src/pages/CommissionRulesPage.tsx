import { FormEvent, useCallback, useEffect, useState } from "react";
import { Percent, Plus, RefreshCw, Trash2 } from "lucide-react";
import { commissionRulesApi, type CommissionRule } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
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

const SERVICE_TYPES = ["", "visa", "air_ticket", "hotel", "tour", "transport", "hajj", "umrah", "student", "work", "corporate"];
const EMPTY = { name: "", basis: "percentage", value: "500", priority: "0", serviceType: "" };

export default function CommissionRulesPage() {
  const [rows, setRows] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await commissionRulesApi.list());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required");
    setError("");
    setOk("");
    try {
      await commissionRulesApi.create({
        name: form.name.trim(),
        basis: form.basis,
        value: Math.round(Number(form.value) || 0),
        priority: Math.round(Number(form.priority) || 0),
        serviceType: form.serviceType || null,
      });
      setOk("Rule created");
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function remove(id: string) {
    try {
      await commissionRulesApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  const columns: Column<CommissionRule>[] = [
    { key: "name", header: "Rule", render: (r) => <span className="font-semibold text-[var(--primary)]">{r.name}</span> },
    { key: "basis", header: "Basis", render: (r) => r.basis },
    {
      key: "value",
      header: "Value",
      className: "tabular-nums",
      render: (r) => (r.basis === "percentage" ? `${(r.value / 100).toFixed(2)}%` : fmtBDTPlain(r.value)),
    },
    { key: "scope", header: "Scope", render: (r) => r.serviceType || "any" },
    { key: "priority", header: "Priority", className: "tabular-nums", render: (r) => String(r.priority) },
    { key: "active", header: "Status", render: (r) => <Pill value={r.active ? "active" : "inactive"} tone={statusTone(r.active ? "active" : "inactive")} /> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <Can perm="commission:manage">
          <button type="button" className={btnGhost} onClick={() => void remove(r.id)} aria-label="Delete rule">
            <Trash2 size={12} />
          </button>
        </Can>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Percent}
        title="Commission Rules"
        subtitle="Rule-driven commission (basis × scope). The most-specific active rule computes an agent's commission on an invoice. Primary agent earns 100% (splits are a future capability)."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Commission Rules" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="commission:manage">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setShowForm((s) => !s)}>
                <Plus size={13} /> New rule
              </button>
            </Can>
          </>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {showForm && (
        <Can perm="commission:manage">
          <Surface>
            <SurfaceHeader title="New commission rule" hint="Percentage value is basis points (500 = 5%). Fixed value is in poisha." />
            <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">
              <div>
                <label className={labelCls} htmlFor="cr-name">Name *</label>
                <input id="cr-name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls} htmlFor="cr-basis">Basis</label>
                <select id="cr-basis" className={selectClassName} value={form.basis} onChange={(e) => setForm({ ...form, basis: e.target.value })}>
                  <option value="percentage">percentage (bps)</option>
                  <option value="fixed">fixed (poisha)</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="cr-value">Value</label>
                <input id="cr-value" className={inputCls} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="cr-service">Service scope</label>
                <select id="cr-service" className={selectClassName} value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s || "any"} value={s}>{s || "any service"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="cr-priority">Priority</label>
                <input id="cr-priority" className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>Save rule</button>
                <button type="button" className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </Surface>
        </Can>
      )}

      <Surface>
        <SurfaceHeader title={`${rows.length} rule${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No commission rules" emptyHint="Create a rule to drive automatic commission." />
      </Surface>
    </PageShell>
  );
}
