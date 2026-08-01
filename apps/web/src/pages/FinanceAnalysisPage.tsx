import { useCallback, useEffect, useState } from "react";
import { PieChart } from "lucide-react";
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

type Mode = "account" | "cost-center" | "branch" | "currency" | "travel";

export default function FinanceAnalysisPage() {
  const [mode, setMode] = useState<Mode>("branch");
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [glAccountId, setGlAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void glApi.listAccounts({ active: "true" }).then(setAccounts).catch(() => setAccounts([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = { from: from || undefined, to: to || undefined };
      if (mode === "account") {
        if (!glAccountId) {
          setError("Select an account");
          setData(null);
          return;
        }
        setData(await fsApi.analysisAccount(glAccountId, q));
      } else if (mode === "cost-center") setData(await fsApi.analysisCostCenter(q));
      else if (mode === "branch") setData(await fsApi.analysisBranch(q));
      else if (mode === "currency") setData(await fsApi.analysisCurrency(q));
      else setData(await fsApi.travelValidation());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Analysis failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [mode, glAccountId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = (data as { rows?: { code?: string; name?: string; branchId?: string | null; currencyCode?: string; debitPoisha?: number; creditPoisha?: number; netPoisha?: number; journalCount?: number }[] })
    ?.rows;

  return (
    <PageShell wide>
      <PageHeader
        icon={PieChart}
        title="Financial analysis"
        subtitle="Account, cost center, branch, currency — plus travel ERP posting validation."
        breadcrumb={[{ label: "Finance ERP", to: "/finance" }, { label: "Financial analysis" }]}
      />
      <FinanceModuleNav />
        <ErrorBanner message={error} />

        <div className="flex flex-wrap gap-1">
          {(
            [
              ["branch", "Branch"],
              ["cost-center", "Cost center"],
              ["currency", "Currency"],
              ["account", "Account"],
              ["travel", "Travel validation"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setMode(k)}
              className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold border ${
                mode === k ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
          {mode === "account" && (
            <div className="sm:col-span-2">
              <label className={labelCls}>Account</label>
              <select className={inputCls} value={glAccountId} onChange={(e) => setGlAccountId(e.target.value)}>
                <option value="">Select…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {mode !== "travel" && (
            <>
              <div>
                <label className={labelCls}>From</label>
                <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>To</label>
                <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : mode === "travel" && data ? (
          <pre className="bg-white rounded-xl border border-slate-200 p-4 text-[10px] overflow-auto max-h-[520px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : rows ? (
          <section className="bg-white rounded-xl border border-slate-200 p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="px-2 py-2 font-bold">Key</th>
                  <th className="px-2 py-2 font-bold">Debit</th>
                  <th className="px-2 py-2 font-bold">Credit</th>
                  <th className="px-2 py-2 font-bold">Net / count</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 text-[11px]">
                    <td className="px-2 py-1.5 font-semibold">
                      {r.code || r.currencyCode || r.branchId || r.name || "—"}
                    </td>
                    <td className="px-2 py-1.5">{formatBdt(r.debitPoisha)}</td>
                    <td className="px-2 py-1.5">{formatBdt(r.creditPoisha)}</td>
                    <td className="px-2 py-1.5">
                      {r.netPoisha != null ? formatBdt(r.netPoisha) : r.journalCount != null ? `${r.journalCount} journals` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : data ? (
          <pre className="bg-white rounded-xl border border-slate-200 p-4 text-[10px] overflow-auto max-h-[520px]">
            {JSON.stringify(data, null, 2)}
          </pre>
        ) : null}
    </PageShell>
  );
}
