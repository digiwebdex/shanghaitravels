import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { BarChart2 } from "lucide-react";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { GlAccount, JournalEntry } from "@/lib/types";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";

export default function FinanceReportsPage() {
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [register, setRegister] = useState<JournalEntry[]>([]);
  const [tb, setTb] = useState<{
    rows: { code: string; name: string; type: string; debitPoisha: number; creditPoisha: number; balancePoisha: number }[];
    totalDebitPoisha: number;
    totalCreditPoisha: number;
    balanced: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coa, reg, trial] = await Promise.all([
        glApi.reportCoa(),
        glApi.reportRegister(),
        glApi.reportTrialBalance(),
      ]);
      setAccounts(coa.accounts || []);
      setRegister(reg.data || []);
      setTb(trial);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load finance reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 size={16} className="text-amber-600" /> Finance reports
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Chart of Accounts, Journal Register, Trial Balance — ledger must remain balanced.
          </p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">Trial Balance</h2>
              {!tb || tb.rows.length === 0 ? (
                <p className="text-[11px] text-slate-400">No posted journals yet.</p>
              ) : (
                <>
                  <p className="text-[11px] mb-2 text-slate-600">
                    Totals {formatBdt(tb.totalDebitPoisha)} / {formatBdt(tb.totalCreditPoisha)} ·{" "}
                    {tb.balanced ? "Balanced ✓" : "OUT OF BALANCE"}
                  </p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                        <th className="px-3 py-2 font-bold">Code</th>
                        <th className="px-3 py-2 font-bold">Name</th>
                        <th className="px-3 py-2 font-bold">Debit</th>
                        <th className="px-3 py-2 font-bold">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tb.rows.map((r) => (
                        <tr key={r.code} className="border-b border-slate-50 text-[11px]">
                          <td className="px-3 py-2 font-semibold">{r.code}</td>
                          <td className="px-3 py-2">{r.name}</td>
                          <td className="px-3 py-2">{r.debitPoisha ? formatBdt(r.debitPoisha) : "—"}</td>
                          <td className="px-3 py-2">{r.creditPoisha ? formatBdt(r.creditPoisha) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">Journal Register</h2>
              {register.length === 0 ? (
                <p className="text-[11px] text-slate-400">No journals.</p>
              ) : (
                <ul className="space-y-2">
                  {register.slice(0, 30).map((j) => (
                    <li key={j.id} className="text-[11px] flex flex-wrap gap-x-3 border-b border-slate-50 pb-2">
                      <Link to={`/finance/journals/${j.id}`} className="font-bold text-amber-700 hover:underline">
                        {j.journalNo}
                      </Link>
                      <span className="text-slate-500">{j.status}</span>
                      <span className="text-slate-600">{formatBdt(j.totalDebitPoisha)}</span>
                      <span className="text-slate-400">{j.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">Chart of Accounts</h2>
              <p className="text-[11px] text-slate-500 mb-2">{accounts.length} accounts</p>
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {accounts.map((a) => (
                  <li key={a.id} className="text-[11px] flex gap-2 border-b border-slate-50 pb-1">
                    <span className="font-semibold w-16">{a.code}</span>
                    <span className="text-slate-700 flex-1">{a.name}</span>
                    <span className="text-slate-400">{a.type}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
