/**
 * Shanghai Travels Owner Requirement — Delivery Report.
 *
 * Operational register of passport/service submissions and CUSTOMER deliveries:
 * SL · Name · Passport No · Category · Type · Submit Date · Delivery Date ·
 * Customer · Remarks — with date-range search and an
 * All / Agent / Corporate Customer / Individual Customer filter.
 *
 * Every column is traced to existing data (see AdminService.deliveryReport):
 * Submit Date = the visa form's submittedAt or the completion of a …Submission
 * workflow stage; Delivery Date = VisaDetail.deliveredAt (stamped only when the
 * "Delivered" stage completes) or a completed "Delivered" stage — an embassy
 * return (Collected) never shows here as a customer delivery. Filtering is
 * server-side; nothing is loaded wholesale into the browser.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { PackageCheck } from "lucide-react";
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

export default function DeliveryReportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [customerType, setCustomerType] = useState<string>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await reportsApi.delivery({ from: from || undefined, to: to || undefined, customerType, take: 200 });
      setRows(r.data.map((d, i) => ({ ...d, sl: i + 1 })));
      setTotal(r.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the delivery report");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [from, to, customerType]);

  useEffect(() => { void load(); }, [load]);

  const delivered = useMemo(() => rows.filter((r) => r.deliveryDate).length, [rows]);
  const awaiting = useMemo(() => rows.filter((r) => r.submitDate && !r.deliveryDate).length, [rows]);

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
    { key: "submitDate", header: "Submit Date", className: "w-28 whitespace-nowrap", render: (r) => fmtD(r.submitDate) },
    {
      key: "deliveryDate", header: "Delivery Date", className: "w-32 whitespace-nowrap",
      render: (r) =>
        r.deliveryDate ? (
          <span className="font-semibold text-emerald-600">{fmtD(r.deliveryDate)}</span>
        ) : r.embassyCollectedAt ? (
          // Embassy return ≠ customer delivery — shown honestly as pending.
          <span className="text-[10.5px] text-amber-600" title={`Received from embassy ${fmtD(r.embassyCollectedAt)} — not yet delivered to the customer`}>
            with office
          </span>
        ) : (
          "—"
        ),
    },
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
      title="Delivery Reports"
      subtitle="Passport & document submissions and customer deliveries — Shanghai Travels Owner Requirement."
      icon={PackageCheck}
      breadcrumb={[{ label: "Reports", to: "/analytics" }, { label: "Delivery Report" }]}
      error={error}
      wide
      loading={loading}
      stats={
        <StatStrip>
          <KpiCard label="Records" value={String(total)} />
          <KpiCard label="Delivered to customer" value={String(delivered)} />
          <KpiCard label="Awaiting delivery" value={String(awaiting)} />
        </StatStrip>
      }
      toolbar={
        <ListToolbar>
          <div>
            <label className={labelCls} htmlFor="dr-from">Search Date — from</label>
            <input id="dr-from" type="date" className={searchInputClassName} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="dr-to">to</label>
            <input id="dr-to" type="date" className={searchInputClassName} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="dr-ctype">Customer Type</label>
            <select id="dr-ctype" className={selectClassName} value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
              {CUSTOMER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </ListToolbar>
      }
      empty={
        rows.length === 0 && !loading ? (
          <EmptyPanel title="No delivery records found." hint="Records appear when an application is submitted or delivered through its workflow." />
        ) : undefined
      }
    >
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.applicationId} />
    </ListPageShell>
  );
}
