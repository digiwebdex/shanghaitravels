import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Wallet } from "lucide-react";
import { expensesApi, financeApi, type ExpenseRow } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Account } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { Column, DataTable } from "@/components/enterprise/DataTable";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
} from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { fmtBDTPlain, toPoisha } from "@/lib/money";

const CATEGORIES = ["office", "salary", "vendor", "marketing", "utility", "other"];

export default function FinanceExpensesPage() {
  const workspace = workspaceById("finance")!;
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "office",
    description: "",
    amount: "",
    vendorName: "",
    accountId: "",
    method: "cash",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [exp, acc] = await Promise.all([expensesApi.list({ limit: 100 }), financeApi.accounts().catch(() => [])]);
      const accountRows = listOf<Account>(acc);
      setRows(listOf<ExpenseRow>(exp));
      setAccounts(accountRows);
      setForm((f) => (f.accountId || !accountRows[0] ? f : { ...f, accountId: accountRows[0].id }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.accountId || !form.amount) {
      setError("Account and amount are required");
      return;
    }
    setError("");
    setOk("");
    try {
      await expensesApi.create({
        category: form.category,
        description: form.description.trim() || undefined,
        amount: toPoisha(form.amount),
        vendorName: form.vendorName.trim() || undefined,
        accountId: form.accountId,
        method: form.method,
      });
      setOk("Expense recorded");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const columns: Column<ExpenseRow>[] = [
    { key: "date", header: "Paid", render: (r) => r.paidAt?.slice(0, 10) || "—" },
    { key: "cat", header: "Category", render: (r) => r.category },
    { key: "desc", header: "Description", render: (r) => r.description || "—" },
    { key: "vendor", header: "Vendor", render: (r) => r.vendorName || "—" },
    { key: "method", header: "Method", render: (r) => r.method },
    {
      key: "amount",
      header: "Amount",
      className: "text-right tabular-nums font-semibold",
      render: (r) => fmtBDTPlain(r.amount),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Wallet}
        title="Expenses"
        subtitle="Cash/bank outflows. Requires expense:manage."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Expenses" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="expense:manage">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setShowForm((s) => !s)}>
                <Plus size={13} /> Record expense
              </button>
            </Can>
          </>
        }
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <FinanceModuleNav />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {showForm && (
        <Surface>
          <SurfaceHeader title="Record expense" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Amount (BDT) *</label>
              <input className={inputCls} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Paid from *</label>
              <select className={inputCls} value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Vendor</label>
              <input className={inputCls} value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Method</label>
              <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option value="cash">cash</option>
                <option value="bank">bank</option>
                <option value="card">card</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>Save</button>
              <button type="button" className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </Surface>
      )}

      <Surface>
        <SurfaceHeader title={`${rows.length} expense${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No expenses" />
      </Surface>
    </PageShell>
  );
}
