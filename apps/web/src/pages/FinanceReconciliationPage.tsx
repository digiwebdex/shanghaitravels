import { FormEvent, useCallback, useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { bankingApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { BankAccountRow } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";

export default function FinanceReconciliationPage() {
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [csv, setCsv] = useState("date,description,amount,ref\n2026-07-30,Deposit,5000,REF1\n2026-07-30,Charge,-50,CHG1");
  const [statementBalance, setStatementBalance] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [lastStatement, setLastStatement] = useState<any>(null);
  const [lastRecon, setLastRecon] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const a = await bankingApi.listAccounts({ kind: "bank", active: "true" });
      setAccounts(a);
      if (!bankAccountId && a[0]) setBankAccountId(a[0].id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [bankAccountId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function importCsv(e: FormEvent) {
    e.preventDefault();
    try {
      const st = await bankingApi.importCsv({ bankAccountId, csv });
      setLastStatement(st);
      setOk(`Imported statement with ${(st as { lines?: unknown[] }).lines?.length || 0} lines`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Import failed");
    }
  }

  async function startRecon(e: FormEvent) {
    e.preventDefault();
    try {
      const bal = Math.round(Number(statementBalance || 0) * 100);
      const recon = await bankingApi.startReconciliation({
        bankAccountId,
        statementId: lastStatement?.id,
        statementBalancePoisha: bal,
      });
      setLastRecon(recon);
      setOk(`Reconciliation started · difference ${formatBdt((recon as { differencePoisha?: number }).differencePoisha || 0)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Recon failed");
    }
  }

  async function complete() {
    if (!lastRecon?.id) return;
    try {
      const r = await bankingApi.completeReconciliation(lastRecon.id);
      setLastRecon(r);
      setOk("Reconciliation completed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Complete failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Scale size={16} className="text-amber-600" /> Bank reconciliation
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            CSV statement import, match/unmatch lines, complete reconciliation session.
          </p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        {loading ? (
          <div className="flex justify-center py-12">
            <InlineSpinner />
          </div>
        ) : (
          <Can perm="banking:reconcile">
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Bank account</label>
                <select className={inputCls} value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <form onSubmit={(e) => void importCsv(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Import CSV</p>
                <textarea className={inputCls + " min-h-[120px] font-mono text-[10px]"} value={csv} onChange={(e) => setCsv(e.target.value)} />
                <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                  Import statement
                </button>
              </form>
              <form onSubmit={(e) => void startRecon(e)} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-2 items-end">
                <div>
                  <label className={labelCls}>Statement balance (৳)</label>
                  <input className={inputCls} value={statementBalance} onChange={(e) => setStatementBalance(e.target.value)} required />
                </div>
                <button type="submit" className="px-3 py-1.5 rounded-lg border text-[10.5px] font-semibold">
                  Start reconciliation
                </button>
                {lastRecon?.id && lastRecon.status !== "completed" && (
                  <button type="button" onClick={() => void complete()} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                    Complete
                  </button>
                )}
              </form>
              {lastStatement?.lines && (
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[11px] font-bold mb-2">Statement lines (matched / unmatched)</p>
                  <ul className="text-[11px] space-y-1">
                    {lastStatement.lines.map((l: any) => (
                      <li key={l.id} className="flex justify-between border-b border-slate-50 py-1">
                        <span>
                          {l.description} · {l.matchStatus}
                        </span>
                        <span>{formatBdt(l.amountPoisha)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Can>
        )}
      </div>
    </div>
  );
}
