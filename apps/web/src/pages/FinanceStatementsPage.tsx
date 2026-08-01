import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { fsApi, glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ERP } from "@/config/env";
import { Can } from "@/auth/Can";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";
import { downloadBlob, statementBalanced, validateDateRange } from "@/lib/statements";
import { Column, DataTable } from "@/components/enterprise/DataTable";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  selectClassName,
} from "@/components/enterprise/Page";

type Tab = "balance-sheet" | "profit-loss" | "cash-flow" | "equity" | "trial-balance";
type Row = {
  code: string;
  name: string;
  displayPoisha?: number;
  balancePoisha?: number;
  debitPoisha?: number;
  creditPoisha?: number;
};

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
      setData(
        (await fsApi.multiPeriod({
          report: tab === "profit-loss" ? "profit-loss" : "balance-sheet",
          periodIds,
        })) as Record<string, unknown>,
      );
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
    <PageShell wide>
      <PageHeader
        icon={FileSpreadsheet}
        title="Financial statements"
        subtitle="Balance Sheet, P&L, Cash Flow, Equity — built from posted journals only."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Statements" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <FinanceModuleNav />
      <ErrorBanner message={error} />

      <div className="flex flex-wrap gap-1.5">
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
            className={`${selectClassName} ${
              tab === k
                ? "!border-[var(--accent)] !bg-[var(--orange-50)] font-bold text-[var(--accent)]"
                : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Surface padded>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          {(tab === "balance-sheet" || tab === "trial-balance") && (
            <>
              <div>
                <label className={labelCls}>As of</label>
                <input type="date" className={inputCls} value={asOf} onChange={(e) => setAsOf(e.target.value)} />
              </div>
              {tab === "balance-sheet" && (
                <div>
                  <label className={labelCls}>Compare as of</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={compareAsOf}
                    onChange={(e) => setCompareAsOf(e.target.value)}
                  />
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
          <div className="flex flex-wrap items-end gap-2 sm:col-span-4">
            <button type="button" onClick={() => void load()} className={btnPrimary} style={btnPrimaryStyle}>
              Refresh
            </button>
            <Can perm="fs:export">
              <button type="button" onClick={() => void exportReport("csv")} className={btnGhost}>
                Export Excel (CSV)
              </button>
              <button type="button" onClick={() => void exportReport("html")} className={btnGhost}>
                Print / PDF
              </button>
            </Can>
            <span className="text-[10px] text-[var(--muted-foreground)]">API {ERP}</span>
          </div>
        </div>
      </Surface>

      <Surface>
        <SurfaceHeader title="Multi-period" />
        <div className="space-y-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <label className={labelCls}>Period IDs (comma-separated)</label>
              <input
                className={inputCls}
                value={periodIds}
                onChange={(e) => setPeriodIds(e.target.value)}
                placeholder={periods.slice(0, 2).map((p) => p.id).join(",") || "period-id,…"}
              />
            </div>
            <button type="button" onClick={() => void loadMulti()} className={btnGhost}>
              Run multi-period
            </button>
          </div>
          {periods.length > 0 && (
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Available: {periods.slice(0, 8).map((p) => p.code).join(", ")}
              {periods.length > 8 ? "…" : ""}
            </p>
          )}
        </div>
      </Surface>

      {loading ? (
        <Surface padded>
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        </Surface>
      ) : data ? (
        <Surface padded className="space-y-3">
          {tab === "balance-sheet" && bs && (
            <>
              <p className="text-[12px] text-[var(--muted-foreground)]">
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
              <p className="text-[12px] text-[var(--muted-foreground)]">
                Net income {formatBdt((data as { totals?: { netIncomePoisha?: number } }).totals?.netIncomePoisha)}
              </p>
              <StatementSection title="Income" rows={(data as { income?: Row[] }).income} />
              <StatementSection title="Expenses" rows={(data as { expenses?: Row[] }).expenses} />
            </>
          )}
          {(tab === "cash-flow" || tab === "equity" || tab === "trial-balance" || "columns" in data) && (
            <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--navy-50)] p-3 text-[10px]">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </Surface>
      ) : null}
    </PageShell>
  );
}

function StatementSection({ title, rows }: { title: string; rows?: Row[] }) {
  const columns: Column<Row>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-semibold">{r.code}</span> },
    { key: "name", header: "Name", render: (r) => r.name },
    {
      key: "amount",
      header: "Amount",
      className: "text-right tabular-nums",
      render: (r) => formatBdt(r.displayPoisha ?? r.balancePoisha),
    },
  ];

  if (!rows?.length) {
    return <p className="text-[12px] text-[var(--muted-foreground)]">{title}: none</p>;
  }

  return (
    <div>
      <h3 className="mb-1 text-[12px] font-bold text-[var(--primary)]">{title}</h3>
      <DataTable rows={rows} columns={columns} rowKey={(r) => r.code} emptyTitle={`${title}: none`} maxHeight={320} />
    </div>
  );
}
