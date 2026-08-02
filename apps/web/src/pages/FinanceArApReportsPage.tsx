import { useCallback, useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { PageHeader, PageShell } from "@/components/enterprise/Page";
import { apApi, arApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { AgingRow } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";

export default function FinanceArApReportsPage() {
  const [arAging, setArAging] = useState<AgingRow[]>([]);
  const [apAging, setApAging] = useState<AgingRow[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ar, ap, sum] = await Promise.all([
        arApi.reportAging(),
        apApi.reportAging(),
        arApi.reportOutstanding(),
      ]);
      setArAging(ar.data || []);
      setApAging(ap.data || []);
      setSummary(sum);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load reports");
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
        title="AR / AP reports"
        subtitle="Aging, outstanding summary — customer & supplier ledgers available via API."
        breadcrumb={[{ label: "Finance ERP", to: "/finance" }, { label: "AR / AP reports" }]}
      />
      <FinanceModuleNav />
        <ErrorBanner message={error} />

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            {summary && (
              <section className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <p className="text-[var(--muted-foreground)]">AR outstanding</p>
                  <p className="font-bold text-[var(--primary)]">{formatBdt(Number(summary.arOutstandingPoisha || 0))}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">AP outstanding</p>
                  <p className="font-bold text-[var(--primary)]">{formatBdt(Number(summary.apOutstandingPoisha || 0))}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">AR customers</p>
                  <p className="font-bold text-[var(--primary)]">{String(summary.arCustomers ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[var(--muted-foreground)]">AP suppliers</p>
                  <p className="font-bold text-[var(--primary)]">{String(summary.apSuppliers ?? 0)}</p>
                </div>
              </section>
            )}

            <AgingTable title="AR Aging" rows={arAging} />
            <AgingTable title="AP Aging" rows={apAging} />
          </>
        )}
    </PageShell>
  );
}

function AgingTable({ title, rows }: { title: string; rows: AgingRow[] }) {
  return (
    <section className="bg-white rounded-xl border border-[var(--border)] p-4">
      <h2 className="text-[12px] font-bold text-[var(--primary)] mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-[11px] text-[var(--muted-foreground)]">No outstanding balances.</p>
      ) : (
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-[10px] uppercase text-[var(--muted-foreground)] border-b">
              <th className="px-2 py-2">Party</th>
              <th className="px-2 py-2">Current</th>
              <th className="px-2 py-2">1–30</th>
              <th className="px-2 py-2">31–60</th>
              <th className="px-2 py-2">61–90</th>
              <th className="px-2 py-2">90+</th>
              <th className="px-2 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code + r.name} className="border-b border-[var(--border)]">
                <td className="px-2 py-2 font-semibold">
                  {r.code} · {r.name}
                </td>
                <td className="px-2 py-2">{formatBdt(r.current)}</td>
                <td className="px-2 py-2">{formatBdt(r["1-30"])}</td>
                <td className="px-2 py-2">{formatBdt(r["31-60"])}</td>
                <td className="px-2 py-2">{formatBdt(r["61-90"])}</td>
                <td className="px-2 py-2">{formatBdt(r["90+"])}</td>
                <td className="px-2 py-2 font-bold">{formatBdt(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
