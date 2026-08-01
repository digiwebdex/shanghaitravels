import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Receipt, RefreshCw } from "lucide-react";
import { financeApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { fmtBDTPlain } from "@/lib/money";

type Inv = Invoice & { customer?: { fullName?: string; code?: string } };

export default function FinanceInvoicesPage() {
  const workspace = workspaceById("finance")!;
  const [rows, setRows] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await financeApi.listInvoices({ limit: 100 });
      setRows(listOf<Inv>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Inv>[] = [
    {
      key: "no",
      header: "Invoice",
      render: (r) => (
        <Link to={`/finance/ar`} className="font-mono font-bold text-amber-700 hover:underline">
          {r.invoiceNo}
        </Link>
      ),
    },
    { key: "customer", header: "Customer", render: (r) => r.customer?.fullName || r.customerId },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status} tone={statusTone(r.status)} /> },
    { key: "total", header: "Total", className: "text-right tabular-nums", render: (r) => fmtBDTPlain(r.total) },
    { key: "paid", header: "Paid", className: "text-right tabular-nums", render: (r) => fmtBDTPlain(r.paid ?? 0) },
    {
      key: "due",
      header: "Due",
      className: "text-right tabular-nums font-semibold",
      render: (r) => (
        <span className={(r.due ?? 0) > 0 ? "text-red-600" : "text-slate-500"}>{fmtBDTPlain(r.due ?? 0)}</span>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Receipt}
        title="Invoices"
        subtitle="Customer invoices from /invoices. Amounts require invoice:amount:read."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Invoices" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <FinanceModuleNav />
      <ErrorBanner message={error} />
      <Surface>
        <SurfaceHeader title={`${rows.length} invoice${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No invoices" />
      </Surface>
    </PageShell>
  );
}
