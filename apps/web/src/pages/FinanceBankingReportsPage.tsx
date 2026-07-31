import { useCallback, useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { bankingApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";

export default function FinanceBankingReportsPage() {
  const [position, setPosition] = useState<{
    asOf: string;
    rows: { id: string; name: string; kind: string; balancePoisha: number }[];
    totalPoisha: number;
  } | null>(null);
  const [flow, setFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pos, cf] = await Promise.all([bankingApi.reportDailyPosition(), bankingApi.reportCashFlow()]);
      setPosition(pos);
      setFlow(cf);
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
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 size={16} className="text-amber-600" /> Banking reports
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Daily cash position, cash flow summary — bank/cash books via API.
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
              <h2 className="text-[12px] font-bold mb-2">Daily cash position</h2>
              <p className="text-[11px] text-slate-500 mb-3">As of {position?.asOf ? new Date(position.asOf).toLocaleString() : "—"}</p>
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-500 border-b">
                    <th className="px-2 py-2">Account</th>
                    <th className="px-2 py-2">Kind</th>
                    <th className="px-2 py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(position?.rows || []).map((r) => (
                    <tr key={r.id} className="border-b border-slate-50">
                      <td className="px-2 py-2 font-semibold">{r.name}</td>
                      <td className="px-2 py-2">{r.kind}</td>
                      <td className="px-2 py-2">{formatBdt(r.balancePoisha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] font-bold mt-3">Total {formatBdt(position?.totalPoisha || 0)}</p>
            </section>
            {flow?.summary && (
              <section className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                {Object.entries(flow.summary as Record<string, number>).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-slate-500">{k}</p>
                    <p className="font-bold">{formatBdt(v)}</p>
                  </div>
                ))}
                <div>
                  <p className="text-slate-500">net</p>
                  <p className="font-bold">{formatBdt(flow.netPoisha || 0)}</p>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
