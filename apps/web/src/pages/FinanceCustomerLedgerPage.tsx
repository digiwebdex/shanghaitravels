import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { arApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { PageHeader, PageShell, Surface, SurfaceHeader } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { fmtBDTPlain } from "@/lib/money";
import { inputCls, labelCls } from "@/components/cases/formStyles";

type ArCustomer = { id: string; code: string; fullName: string; outstandingPoisha: number; invoiceCount: number };

export default function FinanceCustomerLedgerPage() {
  const workspace = workspaceById("finance")!;
  const [customers, setCustomers] = useState<ArCustomer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [entries, setEntries] = useState<unknown[]>([]);
  const [closing, setClosing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await arApi.listCustomers();
        if (cancelled) return;
        setCustomers(rows);
        if (rows[0]) setCustomerId(rows[0].id);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load customers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await arApi.reportCustomerLedger(customerId);
        if (cancelled) return;
        setEntries(Array.isArray(r.entries) ? r.entries : []);
        setClosing(r.closingPoisha);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load ledger");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <PageShell>
      <PageHeader
        icon={UserRound}
        title="Customer Ledger"
        subtitle="AR customer ledger from /ar/reports/customer-ledger."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Customer Ledger" }]}
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <FinanceModuleNav />
      <ErrorBanner message={error} />
      {loading ? (
        <div className="flex justify-center py-16"><InlineSpinner /></div>
      ) : (
        <Surface>
          <SurfaceHeader
            title="Ledger"
            hint={customerId ? `Closing ${fmtBDTPlain(closing)}` : undefined}
            action={
              <div>
                <label className={labelCls} htmlFor="cl-cust">Customer</label>
                <select id="cl-cust" className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.code})</option>
                  ))}
                </select>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11.5px]">
              <thead className="bg-slate-50 text-[9.5px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2">Entry</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td className="px-4 py-10 text-center text-slate-400">No ledger entries</td></tr>
                ) : (
                  entries.map((e, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-mono text-[10.5px] text-slate-600">{JSON.stringify(e)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
    </PageShell>
  );
}
