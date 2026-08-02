import { useEffect, useState } from "react";
import { RefreshCw, Wallet } from "lucide-react";
import { financeApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Account } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { Column, DataTable, Pill } from "@/components/enterprise/DataTable";
import { PageHeader, PageShell, Surface, SurfaceHeader, btnGhost } from "@/components/enterprise/Page";
import { fmtBDTPlain } from "@/lib/money";

export default function FinanceCashPage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(listOf<Account>(await financeApi.accounts()));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const columns: Column<Account>[] = [
    { key: "name", header: "Account", render: (r) => <span className="font-semibold text-[var(--primary)]">{r.name}</span> },
    { key: "type", header: "Type", render: (r) => <Pill value={r.type} tone="blue" /> },
    {
      key: "bal",
      header: "Balance",
      className: "text-right tabular-nums font-bold",
      render: (r) => fmtBDTPlain(r.currentBalance),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        icon={Wallet}
        title="Cash & Bank Accounts"
        subtitle="Legacy cash/bank accounts from /accounts. Requires bank:read."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Cash" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <FinanceModuleNav />
      <ErrorBanner message={error} />
      <Surface>
        <SurfaceHeader title={`${rows.length} account${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No accounts" />
      </Surface>
    </PageShell>
  );
}
