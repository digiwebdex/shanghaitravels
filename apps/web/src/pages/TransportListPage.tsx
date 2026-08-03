import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAgentFilter } from "@/lib/useAgentFilter";
import { Car, Plus, RefreshCw, Search } from "lucide-react";
import { applicationsApi, customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  ListPageShell,
  ListToolbar,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  searchInputClassName,
  selectClassName,
} from "@/components/enterprise/Page";
import { ErrorBanner } from "@/components/Feedback";
import { TransportModuleNav } from "@/components/transport/TransportModuleNav";

const STATUSES = [
  "draft",
  "in_progress",
  "docs_required",
  "on_hold",
  "submitted",
  "approved",
  "rejected",
  "completed",
  "cancelled",
];

export default function TransportListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { agentId } = useAgentFilter();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await applicationsApi.list({
        serviceType: "transport",
        limit: 100,
        q: q || undefined,
        status: status || undefined,
        agentId,
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load transport bookings");
    } finally {
      setLoading(false);
    }
  }, [q, status, agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const done = rows.filter((r) => r.status === "approved" || r.status === "completed").length;
    const active = rows.filter((r) => r.status === "in_progress" || r.status === "submitted").length;
    const hold = rows.filter((r) => r.status === "on_hold" || r.status === "docs_required").length;
    return { done, active, hold };
  }, [rows]);

  const columns: Column<Application>[] = [
    {
      key: "ref",
      header: "Reference",
      render: (a) => (
        <Link to={`/transport/${a.id}`} className="font-mono text-[11.5px] font-bold text-[var(--accent)] hover:underline">
          {a.referenceNo}
        </Link>
      ),
    },
    { key: "customer", header: "Customer", render: (a) => a.customer?.fullName || a.customerId.slice(0, 8) },
    {
      key: "title",
      header: "Title",
      className: "max-w-[220px] truncate",
      render: (a) => <span className="text-[var(--muted-foreground)]">{a.title || "—"}</span>,
    },
    {
      key: "stage",
      header: "Stage",
      render: (a) => (
        <span className="tabular-nums">
          {a.currentStage}/{a.totalStages}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
  ];

  return (
    <ListPageShell
      lookupFilters
      wide
      icon={Car}
      title="Transport"
      subtitle="Supplier-purchased transfers (no fleet)."
      breadcrumb={[{ label: "Bookings", to: "/transport" }, { label: "Transport" }]}
      moduleNav={<TransportModuleNav />}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
          <Can perm="application:create">
            <Link to="/transport/new" className={btnPrimary} style={btnPrimaryStyle}>
              <Plus size={13} /> New Transport Booking
            </Link>
          </Can>
        </>
      }
      stats={
        <StatStrip>
          <KpiCard label="Total bookings" value={total} />
          <KpiCard label="In progress" value={stats.active} tone="accent" />
          <KpiCard label="Needs action" value={stats.hold} tone="warning" />
          <KpiCard label="Completed" value={stats.done} tone="success" />
        </StatStrip>
      }
      toolbar={
        <ListToolbar>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              placeholder="Search ref / customer…"
              className={searchInputClassName}
              aria-label="Search transport bookings"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClassName}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </ListToolbar>
      }
      error={error}
    >
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle="No transport bookings yet"
        emptyHint="Create a booking or adjust filters."
      />
    </ListPageShell>
  );
}

export function NewTransportCasePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void customersApi
      .list({ limit: 200 })
      .then((r) => setCustomers(listOf<Customer>(r)))
      .catch(() => setCustomers([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Select a customer");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cust = customers.find((c) => c.id === customerId);
      const app = await applicationsApi.create({
        serviceType: "transport",
        customerId,
        priority,
        title: title.trim() || `Transport — ${cust?.fullName || "customer"}`,
        direction: "outbound",
      });
      navigate(`/transport/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Car}
        title="New Transport Booking"
        subtitle="Creates an application and applies the active transport workflow template."
        breadcrumb={[
          { label: "Bookings", to: "/transport" },
          { label: "Transport", to: "/transport" },
          { label: "New" },
        ]}
      />
      <TransportModuleNav />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div>
            <label className={labelCls} htmlFor="tp-customer">
              Customer *
            </label>
            <select
              id="tp-customer"
              className={inputCls}
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">— select —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.code})
                </option>
              ))}
            </select>
            <Link to="/customers" className="mt-1 inline-block text-[11px] font-semibold text-[var(--accent)]">
              Create customer first →
            </Link>
          </div>
          <div>
            <label className={labelCls} htmlFor="tp-priority">
              Priority
            </label>
            <select id="tp-priority" className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="tp-title">
              Title
            </label>
            <input
              id="tp-title"
              className={inputCls}
              placeholder="Auto if blank"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className={btnPrimary} style={btnPrimaryStyle}>
              {loading ? "Creating…" : "Create booking"}
            </button>
            <button type="button" onClick={() => navigate("/transport")} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
