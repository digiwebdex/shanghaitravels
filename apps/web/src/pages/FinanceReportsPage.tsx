import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { BarChart2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
} from "@/components/enterprise/Page";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { GlAccount, JournalEntry } from "@/lib/types";
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
    <PageShell wide>
      <PageHeader
        icon={BarChart2}
        title="Finance reports"
        subtitle="Chart of Accounts, Journal Register, Trial Balance — ledger must remain balanced."
        breadcrumb={[{ label: "Finance ERP", to: "/finance" }, { label: "Finance reports" }]}
      />
      <FinanceModuleNav />
        <ErrorBanner message={error} />

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <section className="bg-white rounded-xl border border-[var(--border)] p-4">
              <h2 className="text-[12px] font-bold text-[var(--primary)] mb-3">Trial Balance</h2>
              {!tb || tb.rows.length === 0 ? (
                <p className="text-[11px] text-[var(--muted-foreground)]">No posted journals yet.</p>
              ) : (
                <>
                  <p className="text-[11px] mb-2 text-[var(--muted-foreground)]">
                    Totals {formatBdt(tb.totalDebitPoisha)} / {formatBdt(tb.totalCreditPoisha)} ·{" "}
                    {tb.balanced ? "Balanced ✓" : "OUT OF BALANCE"}
                  </p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase text-[var(--muted-foreground)] border-b border-[var(--border)]">
                        <th className="px-3 py-2 font-bold">Code</th>
                        <th className="px-3 py-2 font-bold">Name</th>
                        <th className="px-3 py-2 font-bold">Debit</th>
                        <th className="px-3 py-2 font-bold">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tb.rows.map((r) => (
                        <tr key={r.code} className="border-b border-[var(--border)] text-[11px]">
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

            <section className="bg-white rounded-xl border border-[var(--border)] p-4">
              <h2 className="text-[12px] font-bold text-[var(--primary)] mb-3">Journal Register</h2>
              {register.length === 0 ? (
                <p className="text-[11px] text-[var(--muted-foreground)]">No journals.</p>
              ) : (
                <ul className="space-y-2">
                  {register.slice(0, 30).map((j) => (
                    <li key={j.id} className="text-[11px] flex flex-wrap gap-x-3 border-b border-[var(--border)] pb-2">
                      <Link to={`/finance/journals/${j.id}`} className="font-bold text-[var(--accent)] hover:underline">
                        {j.journalNo}
                      </Link>
                      <span className="text-[var(--muted-foreground)]">{j.status}</span>
                      <span className="text-[var(--muted-foreground)]">{formatBdt(j.totalDebitPoisha)}</span>
                      <span className="text-[var(--muted-foreground)]">{j.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-xl border border-[var(--border)] p-4">
              <h2 className="text-[12px] font-bold text-[var(--primary)] mb-3">Chart of Accounts</h2>
              <p className="text-[11px] text-[var(--muted-foreground)] mb-2">{accounts.length} accounts</p>
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {accounts.map((a) => (
                  <li key={a.id} className="text-[11px] flex gap-2 border-b border-[var(--border)] pb-1">
                    <span className="font-semibold w-16">{a.code}</span>
                    <span className="text-[var(--primary)] flex-1">{a.name}</span>
                    <span className="text-[var(--muted-foreground)]">{a.type}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
    </PageShell>
  );
}
