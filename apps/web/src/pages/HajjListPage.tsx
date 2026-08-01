import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Moon, Plus, RefreshCw, Search } from "lucide-react";
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
import { HajjModuleNav } from "@/components/hajj/HajjModuleNav";

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

export default function HajjListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const types = kind ? [kind] : ["hajj", "umrah"];
      const results = await Promise.all(
        types.map((serviceType) =>
          applicationsApi.list({
            serviceType,
            limit: 100,
            q: q || undefined,
            status: status || undefined,
          }),
        ),
      );
      const data = results.flatMap((r) => listOf<Application>(r));
      data.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setRows(data);
      setTotal(data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load Hajj/Umrah bookings");
    } finally {
      setLoading(false);
    }
  }, [q, status, kind]);

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
        <Link to={`/hajj/${a.id}`} className="font-mono text-[11.5px] font-bold text-[var(--accent)] hover:underline">
          {a.referenceNo}
        </Link>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      render: (a) => <span className="capitalize text-[var(--muted-foreground)]">{a.serviceType}</span>,
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
      wide
      icon={Moon}
      title="Hajj & Umrah"
      subtitle="Pilgrims, packages, groups, visas, flights, hotels, payments."
      breadcrumb={[{ label: "Bookings", to: "/hajj" }, { label: "Hajj & Umrah" }]}
      moduleNav={<HajjModuleNav />}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
          <Can perm="application:create">
            <Link to="/hajj/new" className={btnPrimary} style={btnPrimaryStyle}>
              <Plus size={13} /> New Booking
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
              aria-label="Search Hajj bookings"
            />
          </div>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={selectClassName}
            aria-label="Filter by kind"
          >
            <option value="">Hajj + Umrah</option>
            <option value="hajj">Hajj only</option>
            <option value="umrah">Umrah only</option>
          </select>
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
        emptyTitle="No Hajj/Umrah bookings yet"
        emptyHint="Create a booking or adjust filters."
      />
    </ListPageShell>
  );
}

export function NewHajjCasePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [serviceType, setServiceType] = useState<"hajj" | "umrah">("hajj");
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
        serviceType,
        customerId,
        priority,
        title: title.trim() || `${serviceType === "hajj" ? "Hajj" : "Umrah"} — ${cust?.fullName || "customer"}`,
        direction: "outbound",
      });
      navigate(`/hajj/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={Moon}
        title="New Hajj / Umrah Booking"
        subtitle="Creates an application and applies the active hajj or umrah workflow template."
        breadcrumb={[
          { label: "Bookings", to: "/hajj" },
          { label: "Hajj & Umrah", to: "/hajj" },
          { label: "New" },
        ]}
      />
      <HajjModuleNav />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <div>
            <label className={labelCls} htmlFor="hj-kind">
              Kind *
            </label>
            <select
              id="hj-kind"
              className={inputCls}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as "hajj" | "umrah")}
            >
              <option value="hajj">Hajj</option>
              <option value="umrah">Umrah</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="hj-customer">
              Customer *
            </label>
            <select
              id="hj-customer"
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
            <label className={labelCls} htmlFor="hj-priority">
              Priority
            </label>
            <select id="hj-priority" className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="hj-title">
              Title
            </label>
            <input
              id="hj-title"
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
            <button type="button" onClick={() => navigate("/hajj")} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
