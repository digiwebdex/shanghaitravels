import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { BookOpen } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { fsApi, glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { GlAccount } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";

type Entry = {
  journalId: string;
  journalNo: string;
  entryDate: string;
  memo?: string | null;
  debitPoisha: number;
  creditPoisha: number;
  balancePoisha: number;
  account?: { code: string; name: string };
};

export default function FinanceLedgerPage() {
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [glAccountId, setGlAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [closing, setClosing] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void glApi.listAccounts({ active: "true" }).then(setAccounts).catch(() => setAccounts([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (glAccountId) {
        const r = await fsApi.ledgerDrilldown(glAccountId, { from: from || undefined, to: to || undefined });
        setEntries((r.entries || []) as Entry[]);
        setClosing(r.closingPoisha || 0);
      } else {
        const r = await fsApi.ledger({ from: from || undefined, to: to || undefined, limit: 200 });
        setEntries((r.entries || []) as Entry[]);
        setClosing(r.closingPoisha || 0);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ledger inquiry failed");
    } finally {
      setLoading(false);
    }
  }, [glAccountId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageShell wide>
      <PageHeader
        icon={BookOpen}
        title="Ledger inquiry"
        subtitle="Drill into posted journal lines with running balance."
        breadcrumb={[{ label: "Finance ERP", to: "/finance" }, { label: "Ledger inquiry" }]}
      />
      <FinanceModuleNav />
        <ErrorBanner message={error} />

        <div className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Account (drill-down)</label>
            <select className={inputCls} value={glAccountId} onChange={(e) => setGlAccountId(e.target.value)}>
              <option value="">All posted lines</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>From</label>
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <section className="bg-white rounded-xl border border-[var(--border)] p-4">
            <p className="text-[11px] text-[var(--muted-foreground)] mb-2">
              {entries.length} lines · Closing {formatBdt(closing)}
            </p>
            {entries.length === 0 ? (
              <p className="text-[11px] text-[var(--muted-foreground)]">No posted lines for this filter.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <th className="px-2 py-2 font-bold">Date</th>
                    <th className="px-2 py-2 font-bold">Journal</th>
                    <th className="px-2 py-2 font-bold">Account</th>
                    <th className="px-2 py-2 font-bold">Debit</th>
                    <th className="px-2 py-2 font-bold">Credit</th>
                    <th className="px-2 py-2 font-bold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={`${e.journalId}-${i}`} className="border-b border-[var(--border)] text-[11px]">
                      <td className="px-2 py-1.5">{new Date(e.entryDate).toLocaleDateString("en-BD")}</td>
                      <td className="px-2 py-1.5">
                        <Link to={`/finance/journals/${e.journalId}`} className="font-bold text-[var(--accent)] hover:underline">
                          {e.journalNo}
                        </Link>
                      </td>
                      <td className="px-2 py-1.5">{e.account ? `${e.account.code}` : "—"}</td>
                      <td className="px-2 py-1.5">{e.debitPoisha ? formatBdt(e.debitPoisha) : "—"}</td>
                      <td className="px-2 py-1.5">{e.creditPoisha ? formatBdt(e.creditPoisha) : "—"}</td>
                      <td className="px-2 py-1.5 font-semibold">{formatBdt(e.balancePoisha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
    </PageShell>
  );
}
