import { Link } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, ArrowRight, AlertCircle,
  FileText, Users, CreditCard, CheckCircle2,
} from "lucide-react";
import {
  APPLICATIONS, EMPLOYEES, MONTHLY_SPEND, DEPT_SPEND,
  STATUS_CFG, PRIORITY_CFG, CREDIT_LIMIT, CREDIT_USED, fmtAED,
} from "./data";

// ── shared sub-components ────────────────────────────────────────────────────
function Kpi({
  label, value, sub, trend, up, warn,
}: {
  label: string; value: string; sub: string;
  trend?: string; up?: boolean; warn?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 ${
        warn ? "border-orange-200 bg-orange-50/50" : "border-[#E2E5EA]"
      }`}
    >
      <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-3">
        {label}
      </p>
      <p
        className={`text-[26px] font-bold leading-none mb-1.5 ${
          warn ? "text-orange-600" : "text-[#0B1829]"
        }`}
      >
        {value}
      </p>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#94A3B8]">{sub}</p>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-semibold ${
              up ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E2E5EA] rounded-lg p-3 shadow-lg text-[11px]">
      <p className="font-bold text-[#0B1829] mb-1">{label}</p>
      <p className="text-[#94A3B8]">
        Spend:{" "}
        <span className="font-semibold text-[#0B1829]">{fmtAED(payload[0]?.value ?? 0)}</span>
      </p>
      <p className="text-[#94A3B8]">
        Budget:{" "}
        <span className="font-semibold text-[#0B1829]">{fmtAED(payload[1]?.value ?? 0)}</span>
      </p>
    </div>
  );
};

// ── page ─────────────────────────────────────────────────────────────────────
export default function CorpDashboard() {
  const pending   = APPLICATIONS.filter((a) => a.status === "pending_approval");
  const totalSpend = EMPLOYEES.reduce((s, e) => s + e.totalSpend, 0);
  const creditPct  = Math.round((CREDIT_USED / CREDIT_LIMIT) * 100);
  const activeEmp  = EMPLOYEES.filter((e) => e.status === "active").length;

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0B1829] text-[20px] font-bold">Company Dashboard</h1>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            ACME Corp · January 2025 · All figures in AED
          </p>
        </div>
        <Link
          to="/corporate/applications"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1829] text-white text-[12px] font-semibold hover:bg-[#162840] transition-colors"
        >
          <FileText size={13} /> New Application
        </Link>
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertCircle size={14} className="text-orange-600 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-orange-700">
            {pending.length} application{pending.length > 1 ? "s" : ""} are awaiting your approval
          </p>
          <Link
            to="/corporate/approvals"
            className="ml-auto text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
          >
            Review now <ArrowRight size={11} />
          </Link>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <Kpi label="YTD Travel Spend"    value={fmtAED(totalSpend)}             sub="Full year 2024"                    trend="+12.4%" up />
        <Kpi label="Active Employees"    value={activeEmp.toString()}            sub={`of ${EMPLOYEES.length} enrolled`} trend="+2 this quarter" up />
        <Kpi label="Pending Approvals"   value={pending.length.toString()}       sub="Requires your action"              warn={pending.length > 0} />
        <Kpi label="Credit Utilisation"  value={`${creditPct}%`}                 sub={`${fmtAED(CREDIT_USED)} of ${fmtAED(CREDIT_LIMIT)}`} trend={creditPct > 70 ? "High" : "Normal"} up={creditPct <= 70} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Spend vs budget */}
        <div className="col-span-2 bg-white rounded-xl border border-[#E2E5EA] p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[13px] font-bold text-[#0B1829]">Monthly Spend vs Budget</p>
              <p className="text-[10px] text-[#94A3B8]">Aug 2024 – Jan 2025</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-[2px] bg-[#0B1829] inline-block" /> Spend
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-[2px] bg-[#E2E5EA] inline-block" /> Budget
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_SPEND} barGap={3} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#F8FAFC" }} />
              <Bar dataKey="spend"  radius={[3, 3, 0, 0]} fill="#0B1829" />
              <Bar dataKey="budget" radius={[3, 3, 0, 0]} fill="#E2E5EA" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dept breakdown */}
        <div className="bg-white rounded-xl border border-[#E2E5EA] p-5">
          <p className="text-[13px] font-bold text-[#0B1829] mb-0.5">Spend by Department</p>
          <p className="text-[10px] text-[#94A3B8] mb-5">YTD 2024</p>
          <div className="space-y-3.5">
            {DEPT_SPEND.map((d, i) => {
              const palette = ["#0B1829","#1e3a5f","#2d5a9e","#F97316","#fb923c","#94A3B8","#cbd5e1"];
              return (
                <div key={d.dept}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#334155] font-medium">{d.dept}</span>
                    <span className="text-[#94A3B8] font-mono">{fmtAED(d.spend)}</span>
                  </div>
                  <div className="h-1.5 bg-[#EEF0F4] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.pct}%`, backgroundColor: palette[i] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active requests + quick stats */}
      <div className="grid grid-cols-3 gap-5">
        {/* Requests table */}
        <div className="col-span-2 bg-white rounded-xl border border-[#E2E5EA] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E5EA]">
            <p className="text-[13px] font-bold text-[#0B1829]">Active Requests</p>
            <Link
              to="/corporate/applications"
              className="text-[11px] font-semibold text-[#F97316] hover:underline flex items-center gap-1"
            >
              All applications <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-[#F4F6F9]">
            {[...pending, ...APPLICATIONS.filter((a) => ["approved", "processing"].includes(a.status))].slice(0, 6).map((app) => {
              const cfg = STATUS_CFG[app.status];
              const pri = PRIORITY_CFG[app.priority];
              return (
                <Link
                  key={app.id}
                  to="/corporate/approvals"
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFBFC] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[12px] font-semibold text-[#0B1829] truncate">{app.service}</p>
                      <span className="flex items-center gap-1">
                        <span className={`size-1.5 rounded-full ${pri.dot}`} />
                        <span className="text-[9px] text-[#94A3B8] font-medium">{pri.label}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-[#94A3B8]">
                      {app.employeeName} · {app.department} · {app.ref}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <p className="text-[12px] font-bold font-mono text-[#0B1829] flex-shrink-0">
                    {fmtAED(app.amount)}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick stat tiles */}
        <div className="space-y-4">
          {[
            { label: "Applications This Month", value: "15",          icon: FileText,    bg: "bg-indigo-50",   ic: "text-indigo-600" },
            { label: "Active Employees",         value: String(activeEmp), icon: Users,  bg: "bg-emerald-50",  ic: "text-emerald-600" },
            { label: "Outstanding Invoice",      value: fmtAED(47800), icon: CreditCard, bg: "bg-orange-50",   ic: "text-orange-600" },
            { label: "Completed This Month",     value: String(APPLICATIONS.filter(a=>a.status==="completed").length), icon: CheckCircle2, bg: "bg-green-50", ic: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2E5EA] p-4 flex items-center gap-3">
              <div className={`size-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <s.icon size={16} className={s.ic} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wide truncate">{s.label}</p>
                <p className="text-[15px] font-bold text-[#0B1829]">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
