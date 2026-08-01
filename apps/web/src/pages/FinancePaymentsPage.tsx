import { useCallback, useEffect, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { arApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { ArDocument } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { fmtBDTPlain } from "@/lib/money";

/**
 * Payments list — the /payments API is write-only (record/refund).
 * Receipts appear as AR documents of type payment, so we list those.
 */
export default function FinancePaymentsPage() {
  const workspace = workspaceById("finance")!;
  const [rows, setRows] = useState<ArDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await arApi.listDocuments({ type: "payment", limit: 100 });
      setRows(listOf<ArDocument>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<ArDocument>[] = [
    { key: "no", header: "Doc", className: "font-mono font-semibold", render: (r) => r.docNo },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status} tone={statusTone(r.status)} /> },
    { key: "date", header: "Date", render: (r) => r.issueDate?.slice(0, 10) || "—" },
    {
      key: "total",
      header: "Amount",
      className: "text-right tabular-nums font-semibold",
      render: (r) => fmtBDTPlain(r.totalPoisha),
    },
    { key: "ref", header: "Reference", render: (r) => r.reference || r.memo || "—" },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={CreditCard}
        title="Payments"
        subtitle="Customer receipts listed from AR payment documents. Recording a payment uses POST /payments (payment:record)."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Payments" }]}
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
        <SurfaceHeader title={`${rows.length} payment${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No payments" />
      </Surface>
    </PageShell>
  );
}
