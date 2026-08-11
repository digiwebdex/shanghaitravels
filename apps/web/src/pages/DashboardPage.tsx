import { memo, useMemo } from "react";
import { Link } from "react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  CreditCard,
  Handshake,
  PieChart as PieChartIcon,
  RefreshCw,
  ScanLine,
  Truck,
  UserRound,
  Workflow,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner } from "@/components/Feedback";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  PageHeader,
  PageShell,
  SkeletonRows,
  Surface,
  SurfaceHeader,
  btnGhost,
} from "@/components/enterprise/Page";
import { QUICK_ACTIONS } from "@/config/quickActions";
import {
  DashboardDataProvider,
  useDashboardData,
  type Metric,
} from "@/dashboard/DashboardDataProvider";
import { fmtBDTCompact, fmtBDTPlain } from "@/lib/money";
import { brand, chartColors } from "@/styles/tokens";
import { JourneyContinuity, NextStepBanner } from "@/components/workflow/MasterJourney";

function roleLens(role?: string): {
  title: string;
  body: string;
  actions: { label: string; to: string; primary?: boolean }[];
} {
  const r = (role || "").toLowerCase();
  if (r.includes("visa")) {
    return {
      title: "Visa officer lens",
      body: "Work docs-required and embassy stages from the Operations queue, then Booking 360.",
      actions: [
        { label: "Visa queue", to: "/operations?tab=visa", primary: true },
        { label: "Document Intelligence", to: "/operations/document-intelligence" },
      ],
    };
  }
  if (r.includes("ticket") || r.includes("air")) {
    return {
      title: "Ticketing lens",
      body: "Issue tickets from the air-ticket desk; keep finance on Booking 360.",
      actions: [
        { label: "Ticket queue", to: "/operations?tab=ticket", primary: true },
        { label: "Air ticketing", to: "/ticketing" },
      ],
    };
  }
  if (r.includes("account") || r.includes("finance")) {
    return {
      title: "Accounts lens",
      body: "Invoices and payments always originate from bookings — no duplicate entry.",
      actions: [
        { label: "Invoices", to: "/finance/invoices", primary: true },
        { label: "Payments", to: "/finance/payments" },
      ],
    };
  }
  if (r.includes("sales") || r.includes("crm")) {
    return {
      title: "Sales lens",
      body: "Start from the customer: Customer → Quotation → Booking.",
      actions: [
        { label: "Customers", to: "/customers", primary: true },
        { label: "Booking wizard", to: "/bookings/new" },
      ],
    };
  }
  if (r.includes("ops") || r.includes("operation")) {
    return {
      title: "Operations lens",
      body: "One queue for every service. Open Booking 360 — avoid module hopping.",
      actions: [
        { label: "Operations workspace", to: "/operations", primary: true },
        { label: "Urgent", to: "/operations?tab=urgent" },
      ],
    };
  }
  return {
    title: "Executive lens",
    body: "Company-wide KPIs. Start bookings from the unified wizard; drill into Customer 360 and Booking 360.",
    actions: [
      { label: "New booking", to: "/bookings/new", primary: true },
      { label: "Operations", to: "/operations" },
      { label: "Customers", to: "/customers" },
    ],
  };
}

const MetricCard = memo(function MetricCard({ metric, money }: { metric: Metric; money?: boolean }) {
  if (metric.provenance === "unavailable" && metric.value == null) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{metric.label}</p>
        <p className="mt-2 text-[13px] font-semibold text-[var(--navy-200)]">—</p>
      </div>
    );
  }
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{metric.label}</p>
        <span
          className={`rounded px-1.5 py-[1px] text-[8px] font-bold uppercase ${
            metric.provenance === "aggregate"
              ? "bg-[var(--success-bg)] text-[var(--success-foreground)]"
              : "bg-[var(--muted)] text-[var(--muted-foreground)]"
          }`}
        >
          {metric.provenance}
        </span>
      </div>
      <p className="mt-2 text-[20px] font-black tabular-nums tracking-tight text-[var(--primary)]">
        {money ? fmtBDTCompact(metric.value as number) : (metric.value ?? 0).toLocaleString()}
      </p>
      {money && metric.value != null && (
        <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{fmtBDTPlain(metric.value as number)}</p>
      )}
    </>
  );
  if (metric.href) {
    return (
      <Link
        to={metric.href}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] transition-all hover:border-[var(--accent)] hover:shadow-[var(--shadow-md)]"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
      {inner}
    </div>
  );
});

function DashboardBody() {
  const { user, can } = useAuth();
  const d = useDashboardData();
  const actions = useMemo(
    () => QUICK_ACTIONS.filter((a) => !a.perm || can(a.perm)).slice(0, 10),
    [can],
  );

  const kpiRow = useMemo(
    () => [
      { m: d.kpis.revenue, money: true },
      { m: d.kpis.profit, money: true },
      { m: d.kpis.todaysBookings, money: false },
      { m: d.kpis.bookings, money: false },
      { m: d.kpis.pendingApplications, money: false },
      { m: d.kpis.pendingInvoices, money: false },
      { m: d.kpis.receivables, money: true },
      { m: d.kpis.payables, money: true },
      { m: d.kpis.supplierDue, money: true },
      { m: d.kpis.customers, money: false },
      { m: d.kpis.agents, money: false },
      { m: d.kpis.corporateClients, money: false },
      { m: d.kpis.pendingTasks, money: false },
      { m: d.kpis.unreadComms, money: false },
    ],
    [d.kpis],
  );

  const lens = roleLens(user?.role);

  // Simple Home — the daily-work shortcuts as big tiles, front and centre.
  // Each is permission-gated, so a user only sees what they can actually do.
  const homeTiles = useMemo(
    () =>
      [
        { label: "Customers", hint: "Add or find a customer", to: "/customers", perm: "customer:read", icon: UserRound },
        { label: "New Booking", hint: "Start a service", to: "/bookings/new", perm: "application:create", icon: ClipboardList },
        { label: "Scan Passport", hint: "OCR a document", to: "/operations/document-intelligence", perm: "ocr:use", icon: ScanLine },
        { label: "Take Payment", hint: "Record money in", to: "/finance/payments", perm: "ar:read", icon: CreditCard },
        { label: "Today's Work", hint: "Operations queue", to: "/operations", perm: "application:read", icon: Workflow },
        { label: "Reports", hint: "Business overview", to: "/analytics", perm: "analytics:read", icon: PieChartIcon },
      ].filter((t) => !t.perm || can(t.perm)),
    [can],
  );

  return (
    <PageShell wide>
      <PageHeader
        title="Company Dashboard"
        subtitle={`Welcome, ${user?.fullName || user?.email}. Role-aware KPIs with a single master journey.`}
        actions={
          <button type="button" className={btnGhost} onClick={() => d.refresh()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />

      {homeTiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {homeTiles.map((t) => (
            <Link
              key={t.to + t.label}
              to={t.to}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-md"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ background: brand.accent }}
              >
                <t.icon size={20} />
              </span>
              <span className="mt-1 text-[13.5px] font-bold text-[var(--foreground)]">{t.label}</span>
              <span className="text-[11px] text-[var(--muted-foreground)]">{t.hint}</span>
            </Link>
          ))}
        </div>
      )}

      <JourneyContinuity
        active="booking"
        startFrom="customer"
        previousHint="Customer → Documents → OCR"
        nextHint="Operations queue → Finance → Travel"
      />
      <NextStepBanner title={lens.title} body={lens.body} actions={lens.actions} />

      <ErrorBanner message={d.error} />

      {d.loading ? (
        <SkeletonRows rows={10} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            {kpiRow.map(({ m, money }) => (
              <MetricCard key={m.label} metric={m} money={money} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Surface className="xl:col-span-2">
              <SurfaceHeader title="Booking trend" hint="Monthly application counts · analytics/executive" />
              <div className="h-64 p-4">
                {d.charts.bookingTrend.points.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={d.charts.bookingTrend.points}>
                      <defs>
                        <linearGradient id="bookFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={brand.accent} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={brand.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="key" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke={brand.accent} fill="url(#bookFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Surface>

            <Surface>
              <SurfaceHeader title="Service distribution" hint="Cases by service" />
              <div className="h-64 p-4">
                {d.charts.serviceDistribution.points.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={d.charts.serviceDistribution.points}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {d.charts.serviceDistribution.points.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Surface>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Surface>
              <SurfaceHeader title="Revenue by service" hint="analytics/finance" />
              <div className="h-56 p-4">
                {d.charts.revenueByService.points.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.charts.revenueByService.points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtBDTCompact(v)} />
                      <Tooltip formatter={(v: number) => fmtBDTPlain(v)} />
                      <Bar dataKey="value" fill={brand.primary} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Surface>
            <Surface>
              <SurfaceHeader title="Cash position" hint="Collected · Expenses · Net" />
              <div className="h-56 p-4">
                {d.charts.cashFlow.points.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.charts.cashFlow.points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtBDTCompact(v)} />
                      <Tooltip formatter={(v: number) => fmtBDTPlain(v)} />
                      <Bar dataKey="value" fill={brand.accent} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Surface>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Surface className="lg:col-span-2">
              <SurfaceHeader
                title="Recent applications"
                action={
                  <Link to="/visa" className="flex items-center gap-1 text-[11px] font-semibold text-orange-700 hover:underline">
                    View all <ArrowRight size={11} />
                  </Link>
                }
              />
              {d.recent.applications.length === 0 ? (
                <p className="px-4 py-10 text-center text-[11.5px] text-[var(--muted-foreground)]">No recent applications</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[9.5px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      <th className="px-4 py-2 font-bold">Ref</th>
                      <th className="px-4 py-2 font-bold">Service</th>
                      <th className="px-4 py-2 font-bold">Customer</th>
                      <th className="px-4 py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.recent.applications.map((a) => (
                      <tr key={a.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/80">
                        <td className="px-4 py-2.5">
                          <Link
                            to={serviceHref(a.serviceType, a.id)}
                            className="font-mono text-[11px] font-bold text-orange-700 hover:underline"
                          >
                            {a.referenceNo}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-[var(--muted-foreground)]">{a.serviceType}</td>
                        <td className="px-4 py-2.5 text-[11px] text-[var(--primary)]">{a.customer?.fullName || "—"}</td>
                        <td className="px-4 py-2.5">
                          <Pill value={a.status} tone={statusTone(a.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Surface>

            <div className="space-y-4">
              <Surface>
                <SurfaceHeader title="Quick actions" />
                <div className="grid grid-cols-2 gap-1.5 p-3">
                  {actions.map((a) => (
                    <Link
                      key={a.id}
                      to={a.to}
                      className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-2.5 py-2 text-[11px] font-semibold text-[var(--primary)] transition-colors hover:border-orange-200 hover:bg-orange-50/50"
                    >
                      <a.icon size={13} className="flex-shrink-0 text-orange-600" />
                      <span className="truncate">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </Surface>

              <Surface>
                <SurfaceHeader title="Pending tasks" />
                {d.tasks.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[11px] text-[var(--muted-foreground)]">No open tasks</p>
                ) : (
                  <ul className="divide-y divide-[var(--border)]">
                    {d.tasks.map((t) => (
                      <li key={t.id} className="flex items-start justify-between gap-2 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] font-semibold text-[var(--primary)]">{t.title}</p>
                          {t.dueAt && (
                            <p className="text-[10px] text-[var(--muted-foreground)]">Due {t.dueAt.slice(0, 10)}</p>
                          )}
                        </div>
                        <Pill value={t.status} tone={statusTone(t.status)} />
                      </li>
                    ))}
                  </ul>
                )}
              </Surface>

              <Surface>
                <SurfaceHeader title="Partners snapshot" />
                <div className="space-y-2 p-3">
                  <SnapRow icon={UserRound} label="Customers" metric={d.kpis.customers} />
                  <SnapRow icon={Handshake} label="Agents" metric={d.kpis.agents} />
                  <SnapRow icon={Building2} label="Corporate" metric={d.kpis.corporateClients} />
                  <SnapRow icon={Truck} label="Supplier due" metric={d.kpis.supplierDue} money />
                </div>
              </Surface>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}

function SnapRow({
  icon: Icon,
  label,
  metric,
  money,
}: {
  icon: typeof UserRound;
  label: string;
  metric: Metric;
  money?: boolean;
}) {
  return (
    <Link
      to={metric.href || "/"}
      className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--muted)]"
    >
      <Icon size={14} className="text-orange-600" />
      <span className="flex-1 text-[11.5px] font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[12px] font-bold tabular-nums text-[var(--primary)]">
        {metric.value == null ? "—" : money ? fmtBDTCompact(metric.value as number) : metric.value.toLocaleString()}
      </span>
    </Link>
  );
}

function EmptyChart() {
  return <p className="flex h-full items-center justify-center text-[11.5px] text-[var(--muted-foreground)]">No chart data for your permissions</p>;
}

function serviceHref(serviceType: string, id: string): string {
  const map: Record<string, string> = {
    visa: `/visa/${id}`,
    air_ticket: `/ticketing/${id}`,
    hotel: `/hotels/${id}`,
    transport: `/transport/${id}`,
    tour: `/tours/${id}`,
    hajj: `/hajj/${id}`,
    umrah: `/hajj/${id}`,
  };
  return map[serviceType] || `/visa/${id}`;
}

export default function DashboardPage() {
  return (
    <DashboardDataProvider>
      <DashboardBody />
    </DashboardDataProvider>
  );
}
