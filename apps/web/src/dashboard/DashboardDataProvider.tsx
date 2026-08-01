/**
 * DashboardDataProvider
 *
 * Components must never fetch multiple APIs directly.
 * This provider owns named source loaders (one endpoint each),
 * permission-gates them, deduplicates in-flight fetches, and
 * exposes computed KPIs / series with provenance:
 *   aggregate | derived | unavailable
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/auth/AuthProvider";
import { listOf } from "@/lib/api";
import {
  agentsApi,
  analyticsApi,
  applicationsApi,
  arApi,
  corporateClientsApi,
  customersApi,
  financeApi,
  reportsApi,
  salesApi,
  tasksApi,
  type FinanceSummary,
  type OperationalReport,
} from "@/lib/services";
import type { Application, Customer } from "@/lib/types";

type TaskRow = { id: string; title: string; status: string; dueAt?: string | null };

export type Provenance = "aggregate" | "derived" | "unavailable";

export type Metric<T = number> = {
  value: T | null;
  provenance: Provenance;
  label: string;
  href?: string;
};

export type SeriesPoint = { key: string; value: number; label?: string };

export type DashboardData = {
  loading: boolean;
  error: string;
  refresh: () => void;
  kpis: {
    revenue: Metric;
    profit: Metric;
    bookings: Metric;
    customers: Metric;
    agents: Metric;
    corporateClients: Metric;
    supplierDue: Metric;
    receivables: Metric;
    payables: Metric;
    pendingTasks: Metric;
    unreadComms: Metric;
    todaysBookings: Metric;
    pendingApplications: Metric;
    pendingInvoices: Metric;
    todaysPayments: Metric;
  };
  charts: {
    bookingTrend: { points: SeriesPoint[]; provenance: Provenance };
    serviceDistribution: { points: SeriesPoint[]; provenance: Provenance };
    revenueByService: { points: SeriesPoint[]; provenance: Provenance };
    countryDistribution: { points: SeriesPoint[]; provenance: Provenance };
    cashFlow: { points: SeriesPoint[]; provenance: Provenance };
  };
  recent: {
    applications: Application[];
    customers: Customer[];
  };
  tasks: { id: string; title: string; status: string; dueAt?: string | null }[];
  notifications: { id: string; subject?: string | null; body: string; status: string; createdAt: string }[];
};

type SourceKey =
  | "financeSummary"
  | "operational"
  | "arOutstanding"
  | "executive"
  | "financeAnalytics"
  | "customerAnalytics"
  | "customers"
  | "agents"
  | "corporate"
  | "applications"
  | "invoices"
  | "tasks"
  | "commsSla"
  | "bankingCash";

type Sources = Partial<{
  financeSummary: FinanceSummary;
  operational: OperationalReport;
  arOutstanding: Record<string, unknown>;
  executive: Record<string, unknown>;
  financeAnalytics: Record<string, unknown>;
  customerAnalytics: Record<string, unknown>;
  customers: { total: number; rows: Customer[] };
  agents: { total: number };
  corporate: { total: number };
  applications: { total: number; today: number; pending: number; rows: Application[] };
  invoices: { pending: number };
  tasks: { open: number; rows: { id: string; title: string; status: string; dueAt?: string | null }[] };
  commsSla: { open: number };
  bankingCash: { deposits: number; withdrawals: number; netPoisha: number };
}>;

const Ctx = createContext<DashboardData | null>(null);

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

const CLOSED = new Set(["approved", "rejected", "completed", "cancelled"]);

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const { can } = useAuth();
  const [sources, setSources] = useState<Sources>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      const next: Sources = {};
      const jobs: Promise<void>[] = [];

      const run = (_key: SourceKey, perm: string | null, fn: () => Promise<void>) => {
        if (perm && !can(perm)) return;
        jobs.push(
          fn().catch(() => {
            // Soft-fail individual sources — dashboard stays usable.
          }),
        );
      };

      run("financeSummary", "financial-report:read", async () => {
        next.financeSummary = await reportsApi.financeSummary();
      });
      run("operational", "report:read", async () => {
        next.operational = await reportsApi.operational();
      });
      run("arOutstanding", "financial-report:read", async () => {
        next.arOutstanding = await arApi.reportOutstanding();
      });
      run("executive", "analytics:read", async () => {
        next.executive = await analyticsApi.executive();
      });
      run("financeAnalytics", "analytics:read", async () => {
        next.financeAnalytics = await analyticsApi.finance();
      });
      run("customerAnalytics", "analytics:read", async () => {
        next.customerAnalytics = await analyticsApi.customer();
      });
      run("customers", "customer:read", async () => {
        const r = await customersApi.list({ limit: 8 });
        const rows = listOf<Customer>(r);
        const total = r && typeof r === "object" && "total" in r ? num((r as { total: number }).total) : rows.length;
        next.customers = { total, rows };
      });
      run("agents", "commission:read", async () => {
        const r = await agentsApi.list({ limit: 1 });
        next.agents = { total: num(r.total) };
      });
      run("corporate", "customer:read", async () => {
        const r = await corporateClientsApi.list({ limit: 1 });
        next.corporate = { total: num(r.total) };
      });
      run("applications", "application:read", async () => {
        const r = await applicationsApi.list({ limit: 50 });
        const rows = listOf<Application>(r);
        const total = r && typeof r === "object" && "total" in r ? num((r as { total: number }).total) : rows.length;
        const today = rows.filter((a) => isToday(a.createdAt)).length;
        const pending = rows.filter((a) => !CLOSED.has(a.status)).length;
        next.applications = { total, today, pending, rows };
      });
      run("invoices", "invoice:amount:read", async () => {
        const r = await financeApi.listInvoices({ limit: 50 });
        const rows = listOf<{ status: string }>(r);
        next.invoices = {
          pending: rows.filter((i) => ["draft", "issued", "partial"].includes(i.status)).length,
        };
      });
      run("tasks", "task:read", async () => {
        try {
          const r = await tasksApi.list({ limit: 20 });
          const rows = listOf<TaskRow>(r);
          next.tasks = {
            open: rows.filter((t) => ["open", "in_progress"].includes(t.status)).length,
            rows: rows.slice(0, 8),
          };
        } catch {
          // Fallback: sales tasks if ops tasks unavailable
          const r = await salesApi.listTasks({ limit: "20" });
          const rows = listOf<TaskRow>(r);
          next.tasks = {
            open: rows.filter((t) => t.status !== "done").length,
            rows: rows.slice(0, 8),
          };
        }
      });
      run("commsSla", "comms:read", async () => {
        try {
          const sla = await apiFetchSafe<{ open?: number }>("/comms/sla");
          next.commsSla = { open: num(sla?.open) };
        } catch {
          next.commsSla = { open: 0 };
        }
      });

      await Promise.all(jobs);
      if (cancelled || ac.signal.aborted) return;
      setSources(next);
      setLoading(false);
    })().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [can, tick]);

  const data = useMemo<DashboardData>(() => {
    const s = sources;
    const m = (
      label: string,
      value: number | null | undefined,
      provenance: Provenance,
      href?: string,
    ): Metric<number> => ({
      label,
      value: value ?? null,
      provenance: value == null ? "unavailable" : provenance,
      href,
    });

    const ar = s.arOutstanding;
    const receivables = ar ? num(ar.arOutstandingPoisha) : s.financeSummary?.receivable;
    const payables = ar ? num(ar.apOutstandingPoisha) : null;
    const supplierDue = ar ? num(ar.apOutstandingPoisha) : null;

    const finA = s.financeAnalytics;
    const revenueByServiceRaw = Array.isArray(finA?.revenueByService)
      ? (finA!.revenueByService as { serviceType: string; revenuePoisha: number }[])
      : [];
    const profitRows = Array.isArray(finA?.profitContributionByService)
      ? (finA!.profitContributionByService as { contributionPoisha: number }[])
      : [];
    const profitTotal = profitRows.length
      ? profitRows.reduce((sum, r) => sum + num(r.contributionPoisha), 0)
      : s.financeSummary
        ? s.financeSummary.netCash
        : null;

    const exec = s.executive;
    const monthly = (exec?.monthlySalesTrend as { bookings?: { month: string; count: number }[] } | undefined)
      ?.bookings;
    const byService =
      s.operational?.casesByService ??
      ((exec?.bookingConversion as { byService?: Record<string, number> } | undefined)?.byService as
        | Record<string, number>
        | undefined);

    const geo = Array.isArray(s.customerAnalytics?.geographicDistribution)
      ? (s.customerAnalytics!.geographicDistribution as { nationality: string; count: number }[])
      : [];

    return {
      loading,
      error,
      refresh,
      kpis: {
        revenue: m("Revenue", s.financeSummary?.invoiced ?? null, "aggregate", "/finance/dashboard"),
        profit: m("Profit", profitTotal, profitRows.length ? "aggregate" : s.financeSummary ? "derived" : "unavailable", "/analytics/finance"),
        bookings: m("Bookings", s.applications?.total ?? sumRecord(s.operational?.casesByService), s.applications ? "derived" : s.operational ? "aggregate" : "unavailable", "/visa"),
        customers: m("Active Customers", s.customers?.total ?? null, "derived", "/customers"),
        agents: m("Agents", s.agents?.total ?? null, "derived", "/partners/agents"),
        corporateClients: m("Corporate Clients", s.corporate?.total ?? null, "derived", "/partners/corporate"),
        supplierDue: m("Supplier Due", supplierDue, ar ? "aggregate" : "unavailable", "/finance/ap"),
        receivables: m("Receivables", receivables ?? null, ar || s.financeSummary ? "aggregate" : "unavailable", "/finance/ar"),
        payables: m("Payables", payables, ar ? "aggregate" : "unavailable", "/finance/ap"),
        pendingTasks: m("Pending Tasks", s.tasks?.open ?? s.operational?.openTasks ?? null, s.tasks ? "derived" : s.operational ? "aggregate" : "unavailable", "/sales/tasks"),
        unreadComms: m("Open Communications", s.commsSla?.open ?? null, s.commsSla ? "aggregate" : "unavailable", "/comms"),
        todaysBookings: m("Today's Bookings", s.applications?.today ?? null, "derived", "/visa"),
        pendingApplications: m("Pending Applications", s.applications?.pending ?? null, "derived", "/visa"),
        pendingInvoices: m("Pending Invoices", s.invoices?.pending ?? null, "derived", "/finance/invoices"),
        todaysPayments: m("Today's Payments", null, "unavailable", "/finance/payments"),
      },
      charts: {
        bookingTrend: {
          provenance: monthly ? "aggregate" : "unavailable",
          points: (monthly || []).map((b) => ({ key: b.month, value: num(b.count), label: b.month })),
        },
        serviceDistribution: {
          provenance: byService ? "aggregate" : "unavailable",
          points: Object.entries(byService || {}).map(([k, v]) => ({ key: k, value: num(v), label: k })),
        },
        revenueByService: {
          provenance: revenueByServiceRaw.length ? "aggregate" : "unavailable",
          points: revenueByServiceRaw.map((r) => ({
            key: r.serviceType,
            value: num(r.revenuePoisha),
            label: r.serviceType,
          })),
        },
        countryDistribution: {
          provenance: geo.length ? "aggregate" : "unavailable",
          points: geo.slice(0, 8).map((g) => ({ key: g.nationality, value: num(g.count), label: g.nationality })),
        },
        cashFlow: {
          provenance: s.financeSummary ? "derived" : "unavailable",
          points: s.financeSummary
            ? [
                { key: "collected", value: s.financeSummary.collected, label: "Collected" },
                { key: "expenses", value: s.financeSummary.expenses, label: "Expenses" },
                { key: "net", value: s.financeSummary.netCash, label: "Net Cash" },
              ]
            : [],
        },
      },
      recent: {
        applications: s.applications?.rows.slice(0, 8) ?? [],
        customers: s.customers?.rows.slice(0, 6) ?? [],
      },
      tasks: s.tasks?.rows ?? [],
      notifications: [],
    };
  }, [sources, loading, error, refresh]);

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

function sumRecord(r?: Record<string, number>): number | null {
  if (!r) return null;
  return Object.values(r).reduce((s, n) => s + num(n), 0);
}

/** Tiny helper so the provider can hit /comms/sla without expanding services.ts surface further. */
async function apiFetchSafe<T>(path: string): Promise<T> {
  const { apiFetch } = await import("@/lib/api");
  return apiFetch<T>(path);
}

export function useDashboardData(): DashboardData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDashboardData must be used inside DashboardDataProvider");
  return ctx;
}
