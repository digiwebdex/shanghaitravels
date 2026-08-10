/**
 * Shanghai Travels Owner Requirement — Submit Report.
 *
 * The register of real SUBMISSION events (embassy/authority). Same audited
 * server path as the Delivery Report (GET /reports/submit → the shared
 * movementsReport with mode="submit"), so Submit Date is never fabricated —
 * it is VisaDetail.submittedAt or the completion of an "Embassy Submission" /
 * "Application Submitted" workflow stage. Columns per the owner spec: SL · Name
 * · Passport No · Category · Type · Submit Date · Customer · Remarks.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Send } from "lucide-react";
import {
  ListPageShell, EmptyPanel, StatStrip, KpiCard, ListToolbar, searchInputClassName, selectClassName, labelCls,
} from "@/components/enterprise/Page";
import { DataTable, Pill, type Column } from "@/components/enterprise/DataTable";
import { reportsApi, type DeliveryReportRow } from "@/lib/services";

const CUSTOMER_TYPES = [
  { value: "all", label: "All" },
  { value: "agent", label: "Agent" },
  { value: "corporate", label: "Corporate Customer" },
  { value: "individual", label: "Individual Customer" },
] as const;

const fmtD = (v: string | null) =>
  v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

type Row = DeliveryReportRow & { sl: number };

export default function SubmitReportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customerType, setCustomerType] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await reportsApi.submit({ from: from || undefined, to: to || undefined, customerType, take: 200 });
      setRows(r.data.map((d, i) => ({ ...d, sl: i + 1 })));
      setTotal(r.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the submit report");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [from, to, customerType]);

  useEffect(() => { void load(); }, [load]);

  const columns: Column<Row>[] = [
    { key: "sl", header: "SL", className: "w-12 text-center", render: (r) => <span className="text-[11px] text-[var(--muted-foreground)]">{r.sl}</span> },
    {
      key: "name", header: "Name", className: "min-w-[150px]",
      render: (r) => (
        <Link to={`/bookings/${r.applicationId}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)]">
          {r.name || "—"}
          <span className="ml-1 text-[10px] font-normal text-[var(--muted-foreground)]">{r.referenceNo}</span>
        </Link>
      ),
    },
    { key: "passportNo", header: "Passport No", className: "min-w-[110px] font-mono text-[11.5px]", render: (r) => r.passportNo || "—" },
    { key: "category", header: "Category", className: "w-24", render: (r) => <Pill value={r.category} tone="blue" /> },
    { key: "type", header: "Type", className: "min-w-[90px] capitalize", render: (r) => (r.type || "—").replace(/_/g, " ") },
    { key: "submitDate", header: "Submit Date", className: "w-28 whitespace-nowrap", render: (r) => <span className="font-semibold text-[var(--foreground)]">{fmtD(r.submitDate)}</span> },
    {
      key: "customer", header: "Customer", className: "min-w-[130px]",
      render: (r) => (
        <span>
          <Pill value={r.customerClass} tone={r.customerClass === "Agent" ? "blue" : r.customerClass === "Corporate" ? "amber" : "slate"} />
          {r.customerOwner && <span className="ml-1 text-[10.5px] text-[var(--muted-foreground)]">{r.customerOwner}</span>}
        </span>
      ),
    },
    { key: "remarks", header: "Remarks", className: "min-w-[120px] max-w-[220px]", render: (r) => <span className="line-clamp-2 text-[11px] text-[var(--muted-foreground)]">{r.remarks || "—"}</span> },
  ];

  return (
    <ListPageShell
      title="Submit Report"
      subtitle="Applications submitted to the embassy/authority — Shanghai Travels Owner Requirement."
      icon={Send}
      breadcrumb={[{ label: "Reports", to: "/analytics" }, { label: "Submit Report" }]}
      error={error}
      wide
      loading={loading}
      stats={<StatStrip><KpiCard label="Submitted records" value={String(total)} /></StatStrip>}
      toolbar={
        <ListToolbar>
          <div>
            <label className={labelCls} htmlFor="sr-from">Search Date — from</label>
            <input id="sr-from" type="date" className={searchInputClassName} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="sr-to">to</label>
            <input id="sr-to" type="date" className={searchInputClassName} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="sr-ctype">Customer Type</label>
            <select id="sr-ctype" className={selectClassName} value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
              {CUSTOMER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </ListToolbar>
      }
      empty={rows.length === 0 && !loading ? <EmptyPanel title="No submitted records found." hint="Records appear when an application reaches its submission stage." /> : undefined}
    >
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.applicationId} />
    </ListPageShell>
  );
}
