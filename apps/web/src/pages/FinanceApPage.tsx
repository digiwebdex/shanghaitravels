import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { apApi, suppliersApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { ApDocument, Supplier } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { AP_TYPES, docLinesPayload, validateDocLines } from "@/lib/arap";
import { formatBdt } from "@/lib/gl";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";

export default function FinanceApPage() {
  const [rows, setRows] = useState<ApDocument[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [type, setType] = useState("bill");
  const [supplierId, setSupplierId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [desc, setDesc] = useState("");
  const [amountBdt, setAmountBdt] = useState("");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [docs, sup] = await Promise.all([
        apApi.listDocuments({ limit: 100 }),
        suppliersApi.list({ limit: 100 }),
      ]);
      setRows(docs);
      setSuppliers(sup.data || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load AP");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const lines = [{ description: desc, amountBdt }];
    const bad = validateDocLines(lines);
    if (bad || !supplierId) {
      setError(bad || "Select a supplier");
      return;
    }
    setError("");
    setOk("");
    try {
      const doc = await apApi.createDocument({
        type,
        supplierId,
        applicationId: applicationId.trim() || undefined,
        dueDate: dueDate || undefined,
        lines: docLinesPayload(lines),
      });
      setOk(`Created ${doc.docNo}`);
      setDesc("");
      setAmountBdt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const stats = useMemo(() => {
    const openBal = rows.reduce((s, r) => s + (r.balancePoisha || 0), 0);
    const drafts = rows.filter((r) => r.status === "draft").length;
    return { openBal, drafts };
  }, [rows]);

  const columns: Column<ApDocument>[] = [
    {
      key: "doc",
      header: "Doc",
      render: (r) => (
        <Link to={`/finance/ap/${r.id}`} className="font-semibold text-[var(--accent)] hover:underline">
          {r.docNo}
        </Link>
      ),
    },
    { key: "supplier", header: "Supplier", render: (r) => r.supplier?.name || r.supplierId },
    { key: "type", header: "Type", render: (r) => r.type },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status} tone={statusTone(r.status)} /> },
    {
      key: "total",
      header: "Total",
      className: "text-right tabular-nums",
      render: (r) => formatBdt(r.totalPoisha),
    },
    {
      key: "balance",
      header: "Balance",
      className: "text-right tabular-nums font-semibold",
      render: (r) => formatBdt(r.balancePoisha),
    },
    { key: "case", header: "Case", render: (r) => r.application?.referenceNo || "—" },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={FileSpreadsheet}
        title="Accounts Payable"
        subtitle="Supplier bills, payments, advances, credit/debit notes — posts through Phase C1 GL."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Accounts Payable" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <FinanceModuleNav />
      <StatStrip>
        <KpiCard label="Documents" value={rows.length} />
        <KpiCard label="Drafts" value={stats.drafts} tone="warning" />
        <KpiCard label="Open balance" value={formatBdt(stats.openBal)} tone="danger" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="ap:manage">
        <Surface>
          <SurfaceHeader title="New AP document" />
          <form onSubmit={(e) => void create(e)} className="space-y-3 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                  {AP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Supplier *</label>
                <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                  <option value="">Select…</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Due date</label>
                <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description *</label>
                <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Amount (৳) *</label>
                <input className={inputCls} value={amountBdt} onChange={(e) => setAmountBdt(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Case ID (optional)</label>
                <input
                  className={inputCls}
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="Application UUID"
                />
              </div>
            </div>
            <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
              Create draft
            </button>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} document${rows.length === 1 ? "" : "s"}`} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No AP documents"
          emptyHint="Create a supplier bill linked to a case when needed."
        />
      </Surface>
    </PageShell>
  );
}
