import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { fsApi, glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ERP } from "@/config/env";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";
import { downloadBlob, statementBalanced, validateDateRange } from "@/lib/statements";

type Tab = "balance-sheet" | "profit-loss" | "cash-flow" | "equity" | "trial-balance";

export default function FinanceStatementsPage() {
  const [tab, setTab] = useState<Tab>("balance-sheet");
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState(() => `${new Date().getUTCFullYear()}-01-01`);
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [compareAsOf, setCompareAsOf] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [periods, setPeriods] = useState<{ id: string; code: string }[]>([]);
  const [periodIds, setPeriodIds] = useState("");

  useEffect(() => {
    void glApi.listFiscalYears().then((years) => {
      const ps = years.flatMap((y) => (y.periods || []).map((p) => ({ id: p.id, code: p.code })));
      setPeriods(ps);
    });
  }, []);

  const load = useCallback(async () => {
    const rangeErr = validateDateRange(from, to);
    if (rangeErr && (tab === "profit-loss" || tab === "cash-flow" || tab === "equity")) {
      setError(rangeErr);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let r: Record<string, unknown>;
      if (tab === "balance-sheet") {
        r = (await fsApi.balanceSheet({ asOf, compareAsOf: compareAsOf || undefined })) as Record<string, unknown>;
      } else if (tab === "profit-loss") {
        r = (await fsApi.profitLoss({ from, to })) as Record<string, unknown>;
      } else if (tab === "cash-flow") {
        r = (await fsApi.cashFlow({ from, to })) as Record<string, unknown>;
      } else if (tab === "equity") {
        r = (await fsApi.equity({ from, to })) as Record<string, unknown>;
      } else {
        r = (await fsApi.trialBalance({ asOf })) as Record<string, unknown>;
      }
      setData(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load statement");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, asOf, from, to, compareAsOf]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMulti() {
    if (!periodIds.trim()) {
      setError("Select at least one period for multi-period");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData((await fsApi.multiPeriod({ report: tab === "profit-loss" ? "profit-loss" : "balance-sheet", periodIds })) as Record<
        string,
        unknown
      >);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Multi-period failed");
    } finally {
      setLoading(false);
    }
  }

  async function exportReport(format: "csv" | "html") {
    try {
      const q: Record<string, string> = { format };
      if (tab === "balance-sheet" || tab === "trial-balance") q.asOf = asOf;
      else {
        q.from = from;
        q.to = to;
      }
      const text = await fsApi.exportRaw(tab, q);
      downloadBlob(`${tab}.${format === "csv" ? "csv" : "html"}`, text, format === "csv" ? "text/csv" : "text/html");
      if (format === "html") {
        const w = window.open("", "_blank");
        if (w) {
          w.document.write(text);
          w.document.close();
        }
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Export failed");
    }
  }

  const bs = data && !("comparative" in data && data.comparative) ? data : (data as { current?: Record<string, unknown> })?.current;
  const totals = (bs as { totals?: { assetsPoisha?: number; liabilitiesAndEquityPoisha?: number; balanced?: boolean } })?.totals;

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-amber-600" /> Financial statements
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Balance Sheet, P&amp;L, Cash Flow, Equity — built from posted journals only.
          </p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />

        <div className="flex flex-wrap gap-1">
          {(
            [
              ["balance-sheet", "Balance Sheet"],
              ["profit-loss", "Profit & Loss"],
              ["cash-flow", "Cash Flow"],
              ["equity", "Equity"],
              ["trial-balance", "Trial Balance"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold border ${
                tab === k ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
          {(tab === "balance-sheet" || tab === "trial-balance") && (
            <>
              <div>
                <label className={labelCls}>As of</label>
                <input type="date" className={inputCls} value={asOf} onChange={(e) => setAsOf(e.target.value)} />
              </div>
              {tab === "balance-sheet" && (
                <div>
                  <label className={labelCls}>Compare as of</label>
                  <input type="date" className={inputCls} value={compareAsOf} onChange={(e) => setCompareAsOf(e.target.value)} />
                </div>
              )}
            </>
          )}
          {(tab === "profit-loss" || tab === "cash-flow" || tab === "equity") && (
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
          <div className="sm:col-span-4 flex flex-wrap gap-2 items-end">
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
            >
              Refresh
            </button>
            <Can perm="fs:export">
              <button
                type="button"
                onClick={() => void exportReport("csv")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold"
              >
                Export Excel (CSV)
              </button>
              <button
                type="button"
                onClick={() => void exportReport("html")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold"
              >
                Print / PDF
              </button>
            </Can>
            <span className="text-[10px] text-slate-400">API {ERP}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <h2 className="text-[12px] font-bold text-slate-800">Multi-period</h2>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className={labelCls}>Period IDs (comma-separated)</label>
              <input
                className={inputCls}
                value={periodIds}
                onChange={(e) => setPeriodIds(e.target.value)}
                placeholder={periods.slice(0, 2).map((p) => p.id).join(",") || "period-id,…"}
              />
            </div>
            <button
              type="button"
              onClick={() => void loadMulti()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold"
            >
              Run multi-period
            </button>
          </div>
          {periods.length > 0 && (
            <p className="text-[10px] text-slate-400">
              Available: {periods.slice(0, 8).map((p) => p.code).join(", ")}
              {periods.length > 8 ? "…" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : data ? (
          <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            {tab === "balance-sheet" && bs && (
              <>
                <p className="text-[11px] text-slate-600">
                  Assets {formatBdt(totals?.assetsPoisha)} · L+E {formatBdt(totals?.liabilitiesAndEquityPoisha)} ·{" "}
                  {statementBalanced(totals) ? "Balanced ✓" : "Check imbalance"}
                </p>
                <StatementSection title="Assets" rows={(bs as { assets?: Row[] }).assets} />
                <StatementSection title="Liabilities" rows={(bs as { liabilities?: Row[] }).liabilities} />
                <StatementSection title="Equity" rows={(bs as { equity?: Row[] }).equity} />
              </>
            )}
            {tab === "profit-loss" && (
              <>
                <p className="text-[11px] text-slate-600">
                  Net income {formatBdt((data as { totals?: { netIncomePoisha?: number } }).totals?.netIncomePoisha)}
                </p>
                <StatementSection title="Income" rows={(data as { income?: Row[] }).income} />
                <StatementSection title="Expenses" rows={(data as { expenses?: Row[] }).expenses} />
              </>
            )}
            {(tab === "cash-flow" || tab === "equity" || tab === "trial-balance" || "columns" in data) && (
              <pre className="text-[10px] bg-slate-50 p-3 rounded-lg overflow-auto max-h-[480px] whitespace-pre-wrap">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}

type Row = { code: string; name: string; displayPoisha?: number; balancePoisha?: number; debitPoisha?: number; creditPoisha?: number };

function StatementSection({ title, rows }: { title: string; rows?: Row[] }) {
  if (!rows?.length) return <p className="text-[11px] text-slate-400">{title}: none</p>;
  return (
    <div>
      <h3 className="text-[11px] font-bold text-slate-700 mb-1">{title}</h3>
      <table className="w-full text-left mb-3">
        <thead>
          <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
            <th className="px-2 py-1 font-bold">Code</th>
            <th className="px-2 py-1 font-bold">Name</th>
            <th className="px-2 py-1 font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.code} className="border-b border-slate-50 text-[11px]">
              <td className="px-2 py-1 font-semibold">{r.code}</td>
              <td className="px-2 py-1">{r.name}</td>
              <td className="px-2 py-1">{formatBdt(r.displayPoisha ?? r.balancePoisha)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
