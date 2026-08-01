import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { apApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { PageHeader, PageShell, Surface, SurfaceHeader } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { fmtBDTPlain } from "@/lib/money";
import { inputCls, labelCls } from "@/components/cases/formStyles";

type ApSupplier = { id: string; code: string; name: string; type?: string; outstandingPoisha: number };

export default function FinanceSupplierLedgerPage() {
  const workspace = workspaceById("finance")!;
  const [suppliers, setSuppliers] = useState<ApSupplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [entries, setEntries] = useState<unknown[]>([]);
  const [closing, setClosing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await apApi.listSuppliers();
        if (cancelled) return;
        setSuppliers(rows);
        if (rows[0]) setSupplierId(rows[0].id);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load suppliers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!supplierId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await apApi.reportSupplierLedger(supplierId);
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
  }, [supplierId]);

  return (
    <PageShell>
      <PageHeader
        icon={Truck}
        title="Supplier Ledger"
        subtitle="AP supplier ledger from /ap/reports/supplier-ledger."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Supplier Ledger" }]}
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
            hint={supplierId ? `Closing ${fmtBDTPlain(closing)}` : undefined}
            action={
              <div>
                <label className={labelCls} htmlFor="sl-sup">Supplier</label>
                <select id="sl-sup" className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11.5px]">
              <thead className="bg-slate-50 text-[9.5px] uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-2">Entry</th></tr>
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
