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
  Handshake,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  PageHeader,
  PageShell,
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

const CHART_COLORS = ["#F59E0B", "#14213D", "#0EA5E9", "#10B981", "#F97316", "#6366F1", "#EC4899", "#64748B"];

function MetricCard({ metric, money }: { metric: Metric; money?: boolean }) {
  if (metric.provenance === "unavailable" && metric.value == null) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{metric.label}</p>
        <p className="mt-2 text-[13px] font-semibold text-slate-300">—</p>
      </div>
    );
  }
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{metric.label}</p>
        <span
          className={`rounded px-1.5 py-[1px] text-[8px] font-bold uppercase ${
            metric.provenance === "aggregate"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {metric.provenance}
        </span>
      </div>
      <p className="mt-2 text-[20px] font-black tabular-nums tracking-tight text-slate-900">
        {money ? fmtBDTCompact(metric.value as number) : (metric.value ?? 0).toLocaleString()}
      </p>
      {money && metric.value != null && (
        <p className="mt-0.5 text-[10px] text-slate-400">{fmtBDTPlain(metric.value as number)}</p>
      )}
    </>
  );
  if (metric.href) {
    return (
      <Link
        to={metric.href}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-amber-300 hover:shadow-sm"
      >
        {inner}
      </Link>
    );
  }
  return <div className="rounded-2xl border border-slate-200 bg-white p-4">{inner}</div>;
}

function DashboardBody() {
  const { user, can } = useAuth();
  const d = useDashboardData();
  const actions = QUICK_ACTIONS.filter((a) => !a.perm || can(a.perm)).slice(0, 10);

  const kpiRow = [
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
  ];

  return (
    <PageShell wide>
      <PageHeader
        title="Company Dashboard"
        subtitle={`Welcome, ${user?.fullName || user?.email}. Live company-wide view — not visa-only.`}
        actions={
          <button type="button" className={btnGhost} onClick={() => d.refresh()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />

      <ErrorBanner message={d.error} />

      {d.loading ? (
        <div className="flex justify-center py-20">
          <InlineSpinner />
        </div>
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
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="key" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#F59E0B" fill="url(#bookFill)" strokeWidth={2} />
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
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
                      <Bar dataKey="value" fill="#14213D" radius={[6, 6, 0, 0]} />
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
                      <Bar dataKey="value" fill="#F97316" radius={[6, 6, 0, 0]} />
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
                  <Link to="/visa" className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline">
                    View all <ArrowRight size={11} />
                  </Link>
                }
              />
              {d.recent.applications.length === 0 ? (
                <p className="px-4 py-10 text-center text-[11.5px] text-slate-400">No recent applications</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[9.5px] uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-2 font-bold">Ref</th>
                      <th className="px-4 py-2 font-bold">Service</th>
                      <th className="px-4 py-2 font-bold">Customer</th>
                      <th className="px-4 py-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.recent.applications.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                        <td className="px-4 py-2.5">
                          <Link
                            to={serviceHref(a.serviceType, a.id)}
                            className="font-mono text-[11px] font-bold text-amber-700 hover:underline"
                          >
                            {a.referenceNo}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-slate-600">{a.serviceType}</td>
                        <td className="px-4 py-2.5 text-[11px] text-slate-700">{a.customer?.fullName || "—"}</td>
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
                      className="flex items-center gap-2 rounded-xl border border-slate-100 px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:border-amber-200 hover:bg-amber-50/50"
                    >
                      <a.icon size={13} className="flex-shrink-0 text-amber-600" />
                      <span className="truncate">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </Surface>

              <Surface>
                <SurfaceHeader title="Pending tasks" />
                {d.tasks.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[11px] text-slate-400">No open tasks</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {d.tasks.map((t) => (
                      <li key={t.id} className="flex items-start justify-between gap-2 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[11.5px] font-semibold text-slate-800">{t.title}</p>
                          {t.dueAt && (
                            <p className="text-[10px] text-slate-400">Due {t.dueAt.slice(0, 10)}</p>
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
      className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50"
    >
      <Icon size={14} className="text-amber-600" />
      <span className="flex-1 text-[11.5px] font-medium text-slate-600">{label}</span>
      <span className="text-[12px] font-bold tabular-nums text-slate-900">
        {metric.value == null ? "—" : money ? fmtBDTCompact(metric.value as number) : metric.value.toLocaleString()}
      </span>
    </Link>
  );
}

function EmptyChart() {
  return <p className="flex h-full items-center justify-center text-[11.5px] text-slate-400">No chart data for your permissions</p>;
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
