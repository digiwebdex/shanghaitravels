import { useCallback, useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { financeApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { downloadBlob } from "@/lib/statements";
import {
  KpiCard,
  ListToolbar,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  inputCls,
  labelCls,
  selectClassName,
} from "@/components/enterprise/Page";
import { type Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { ErrorBanner } from "@/components/Feedback";
import { fmtBDTPlain } from "@/lib/money";

const REPORTS = [
  { value: "collection", label: "Collection" },
  { value: "receipts", label: "Receipt" },
  { value: "refunds", label: "Refund" },
  { value: "outstanding", label: "Outstanding" },
  { value: "overdue", label: "Overdue" },
  { value: "revenue", label: "Revenue" },
  { value: "invoices", label: "Invoice" },
  { value: "tax", label: "Tax Summary" },
];
const MONEY_KEYS = new Set(["amount", "total", "paid", "due", "subtotal", "discount", "tax"]);
const DATE_KEYS = new Set(["date", "dueAt"]);
const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default function FinanceCommercialReportsPage() {
  const [type, setType] = useState("collection");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<Awaited<ReturnType<typeof financeApi.report>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await financeApi.report(type, { from: from || undefined, to: to || undefined }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [type, from, to]);
  useEffect(() => {
    void load();
  }, [load]);

  const rows = data?.rows || [];
  const cols: Column<Record<string, unknown>>[] = rows[0]
    ? Object.keys(rows[0]).map((k) => ({
        key: k,
        header: label(k),
        className: MONEY_KEYS.has(k) ? "text-right tabular-nums" : "",
        render: (r) => {
          const v = r[k];
          if (v == null || v === "") return "—";
          if (MONEY_KEYS.has(k)) return fmtBDTPlain(Number(v));
          if (DATE_KEYS.has(k)) return new Date(String(v)).toLocaleDateString();
          if (k === "status") return <Pill value={String(v)} tone={statusTone(String(v))} />;
          return String(v);
        },
      }))
    : [];

  function exportCsv() {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      keys.map(label).join(","),
      ...rows.map((r) => keys.map((k) => esc(MONEY_KEYS.has(k) ? (Number(r[k]) / 100).toFixed(2) : r[k])).join(",")),
    ].join("\n");
    downloadBlob(`finance-${type}-report.csv`, csv, "text/csv;charset=utf-8");
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={BarChart3}
        title="Commercial Reports"
        subtitle="Collection · Outstanding · Overdue · Receipts · Refunds · Revenue · Tax — computed from live invoices & payments."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Commercial Reports" }]}
        actions={
          <div className="flex items-center gap-2">
            <button type="button" className={btnGhost} onClick={exportCsv} disabled={!rows.length}>
              <Download size={12} /> Export CSV
            </button>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        }
      />
      <FinanceModuleNav />
      <ErrorBanner message={error} />

      <StatStrip>
        <KpiCard label={`${REPORTS.find((r) => r.value === type)?.label} total`} value={fmtBDTPlain(data?.total ?? 0)} tone="accent" />
        <KpiCard label="Records" value={data?.count ?? 0} />
        <KpiCard label="From" value={data?.period ? new Date(data.period.from).toLocaleDateString() : "—"} />
        <KpiCard label="To" value={data?.period ? new Date(data.period.to).toLocaleDateString() : "—"} />
      </StatStrip>

      <Surface>
        <ListToolbar>
          <div>
            <label className={labelCls}>Report</label>
            <select className={selectClassName} value={type} onChange={(e) => setType(e.target.value)}>
              {REPORTS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
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
        </ListToolbar>
        <SurfaceHeader title={`${data?.count ?? 0} record${(data?.count ?? 0) === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={cols} rowKey={(r) => JSON.stringify(r)} loading={loading} emptyTitle="No records for this period" />
      </Surface>
    </PageShell>
  );
}
