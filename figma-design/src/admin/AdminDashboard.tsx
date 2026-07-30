import { Link } from "react-router";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle, TrendingUp, TrendingDown, Clock, CheckCircle2,
  FilePlus, UserPlus, CalendarDays, FileText, Users2, BarChart2, ArrowRight,
} from "lucide-react";
import {
  FUNNEL_DATA, REVENUE_DATA, ACTIVITY, PORTAL_STATUS, fmtM,
} from "./data";

// ── Funnel color ramp: purple → indigo → blue → sky → teal → emerald ─────────
const FUNNEL_COLORS = [
  "#8B5CF6","#7C3AED","#6D28D9",
  "#4F46E5","#4338CA",
  "#3B82F6","#2563EB",
  "#0EA5E9","#0284C7",
  "#06B6D4","#0891B2",
  "#14B8A6","#0D9488",
  "#10B981","#059669",
];

// ── Activity type → dot color + portal badge ──────────────────────────────────
const ACT_DOT: Record<string, string> = {
  application: "bg-blue-500", payment: "bg-emerald-500", sla: "bg-red-500",
  approval: "bg-violet-500", booking: "bg-amber-500", system: "bg-slate-400", verification: "bg-cyan-500",
};
const PORTAL_BADGE: Record<string, string> = {
  customer: "bg-blue-100 text-blue-700", agent: "bg-emerald-100 text-emerald-700",
  corporate: "bg-slate-100 text-slate-600", supplier: "bg-violet-100 text-violet-700",
  staff: "bg-sky-100 text-sky-700", admin: "bg-amber-100 text-amber-700",
};

// ── Recharts tooltip ──────────────────────────────────────────────────────────
function RevTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-[10.5px]">
      <p className="font-bold text-slate-700 mb-1">{label} 2024</p>
      <p className="text-amber-600 font-semibold">Revenue: {fmtM(payload[0]?.value ?? 0)}</p>
      {payload[1] && <p className="text-blue-500 mt-0.5">Target: {fmtM(payload[1].value)}</p>}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const maxFunnel = FUNNEL_DATA[0].count;
  const convRate  = ((FUNNEL_DATA[14].count / FUNNEL_DATA[0].count) * 100).toFixed(1);

  const KPIs = [
    {
      label: "Active Applications", value: "847", sub: "+12% vs yesterday",
      up: true, bar: "bg-blue-500", icon: FileText, ic: "bg-blue-50 text-blue-600",
    },
    {
      label: "Revenue Today", value: "AED 284,500", sub: "+8% vs daily avg",
      up: true, bar: "bg-emerald-500", icon: TrendingUp, ic: "bg-emerald-50 text-emerald-600", mono: true,
    },
    {
      label: "SLA Breaches", value: "12", sub: "+3 vs yesterday",
      up: false, bar: "bg-red-500", icon: AlertTriangle, ic: "bg-red-100 text-red-600", red: true,
    },
    {
      label: "Pending Approvals", value: "34", sub: "8 urgent · 26 normal",
      bar: "bg-amber-400", icon: Clock, ic: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="p-5 space-y-5 max-w-[1440px]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-slate-900 leading-none">Admin Dashboard</h1>
          <p className="text-[11px] text-slate-400 mt-1">
            Thursday, 9 January 2025 · Last synced 2 min ago · Dubai HQ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9.5px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 size={9} /> All Systems Operational
          </span>
          <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-lg text-amber-400" style={{ background: "#0D1117" }}>
            ERP v3.1
          </span>
        </div>
      </div>

      {/* ── SLA alert ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-300 rounded-xl">
        <AlertTriangle size={13} className="text-red-600 flex-shrink-0" />
        <p className="text-[11.5px] font-bold text-red-700 flex-1">
          12 active SLA breaches across Customer and Staff portals — immediate action required
        </p>
        <Link to="/staff/tasks" className="flex items-center gap-0.5 text-[10.5px] font-bold text-red-600 hover:underline flex-shrink-0">
          View breaches <ArrowRight size={9} />
        </Link>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {KPIs.map(k => (
          <div key={k.label} className={`bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden ${k.red ? "bg-red-50/30" : ""}`}>
            <div className={`absolute top-0 left-0 bottom-0 w-[3px] rounded-l-xl ${k.bar}`} />
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[9.5px] font-bold uppercase tracking-wide ${k.red ? "text-red-400" : "text-slate-400"}`}>{k.label}</p>
              <div className={`size-7 rounded-lg flex items-center justify-center ${k.ic}`}>
                <k.icon size={13} />
              </div>
            </div>
            <p className={`font-bold leading-none mb-1.5 ${k.mono ? "font-mono text-[19px]" : "text-[32px]"} ${k.red ? "text-red-600" : "text-slate-800"}`}>
              {k.value}
            </p>
            <div className="flex items-center gap-1">
              {k.up !== undefined && (
                k.up
                  ? <TrendingUp size={11} className="text-emerald-500" />
                  : <TrendingDown size={11} className="text-red-400" />
              )}
              <span className={`text-[10px] ${k.red ? "text-red-500 font-semibold" : k.up ? "text-emerald-600 font-semibold" : "text-slate-500"}`}>
                {k.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart + Activity ───────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-5">

        {/* Revenue AreaChart */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-bold text-slate-800">Monthly Revenue</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Aug 2024 – Jan 2025 · vs target</p>
            </div>
            <div className="flex items-center gap-4 text-[9.5px] text-slate-500">
              <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 rounded bg-amber-400"/><span>Revenue</span></div>
              <div className="flex items-center gap-1.5"><div className="w-6 border-t-2 border-dashed border-blue-400"/><span>Target</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip content={<RevTip />} cursor={{ stroke: "#F59E0B", strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} fill="url(#adminRevGrad)"
                dot={{ r: 3, fill: "#F59E0B", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#F59E0B" }} />
              <Area type="monotone" dataKey="target" stroke="#3B82F6" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live activity feed */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
            <p className="text-[12.5px] font-bold text-slate-800">Live Activity</p>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-slate-400 font-medium">Real-time</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {ACTIVITY.map(item => {
              const dot = ACT_DOT[item.type] ?? "bg-slate-400";
              const badge = PORTAL_BADGE[item.portal] ?? "bg-slate-100 text-slate-500";
              return (
                <div key={item.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <span className={`size-[6px] rounded-full flex-shrink-0 mt-[5px] ${dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10.5px] text-slate-700 leading-snug">
                      {item.text}
                      {item.ref && (
                        <span className="ml-1.5 font-mono font-bold text-amber-600 text-[9.5px]">{item.ref}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full capitalize ${badge}`}>{item.portal}</span>
                      <span className="text-[8.5px] text-slate-400">{item.at}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Funnel + Actions/Status ────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-5">

        {/* Application pipeline funnel */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[13px] font-bold text-slate-800">Application Pipeline</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {FUNNEL_DATA[0].count.toLocaleString()} active applications · 15 workflow stages
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9.5px] text-slate-400 uppercase font-bold tracking-wide">End-to-end conversion</p>
              <p className="text-[18px] font-bold text-emerald-600 font-mono leading-tight">{convRate}%</p>
            </div>
          </div>

          <div className="space-y-[5px]">
            {FUNNEL_DATA.map((stage, i) => {
              const w    = (stage.count / maxFunnel) * 100;
              const prev = i > 0 ? FUNNEL_DATA[i - 1].count : null;
              const drop = prev ? ((prev - stage.count) / prev * 100) : 0;
              return (
                <div key={stage.stage} className="flex items-center gap-2.5 group">
                  <div className="w-[82px] text-right flex-shrink-0">
                    <span className="text-[9px] text-slate-400 group-hover:text-slate-600 transition-colors truncate block">{stage.short}</span>
                  </div>
                  <div className="flex-1 h-[14px] bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${w}%`, backgroundColor: FUNNEL_COLORS[i] }}
                    />
                  </div>
                  <div className="w-[72px] flex-shrink-0 flex items-baseline gap-1">
                    <span className="text-[10px] font-bold font-mono text-slate-700 w-8 text-right">{stage.count}</span>
                    {drop > 5 && (
                      <span className={`text-[8px] font-semibold ${drop > 20 ? "text-red-400" : "text-slate-400"}`}>
                        -{drop.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
            {[["#8B5CF6","Inquiry → Payment"],["#0EA5E9","Embassy Pipeline"],["#10B981","Completion"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-[9.5px] text-slate-500">
                <span className="size-2 rounded-sm flex-shrink-0" style={{ backgroundColor: c as string }} /> {l}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions + portal health */}
        <div className="col-span-2 space-y-4">

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[12px] font-bold text-slate-800 mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New Application",  icon: FilePlus,     cls: "text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100" },
                { label: "Add Customer",     icon: UserPlus,     cls: "text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100"         },
                { label: "Schedule",         icon: CalendarDays, cls: "text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"},
                { label: "Create Invoice",   icon: FileText,     cls: "text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100"     },
                { label: "Add Agent",        icon: Users2,       cls: "text-cyan-600 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100"         },
                { label: "Run Report",       icon: BarChart2,    cls: "text-pink-600 bg-pink-50 border border-pink-200 hover:bg-pink-100"         },
              ].map(qa => (
                <button key={qa.label}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${qa.cls}`}
                >
                  <qa.icon size={12} className="flex-shrink-0" />
                  <span className="text-[10px] font-semibold leading-snug">{qa.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Portal health */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-[12px] font-bold text-slate-800">Portal Health</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">4/5 OK</span>
            </div>
            <div className="divide-y divide-slate-50">
              {PORTAL_STATUS.map(ps => {
                const dotCls = ps.health === "operational" ? "bg-emerald-500" : ps.health === "degraded" ? "bg-amber-500" : "bg-red-500";
                const valCls = ps.health === "operational" ? "text-emerald-600" : ps.health === "degraded" ? "text-amber-600" : "text-red-600";
                return (
                  <div key={ps.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                    <span className={`size-[7px] rounded-full flex-shrink-0 ${dotCls}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] font-semibold text-slate-700 truncate">{ps.label}</p>
                        <span className={`text-[9px] font-bold capitalize flex-shrink-0 ${valCls}`}>{ps.health}</span>
                      </div>
                      <p className="text-[8.5px] text-slate-400 mt-0.5">{ps.sessions} sessions · {ps.actions} actions/hr</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Module count badge */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-slate-200">
            <div className="size-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <BarChart2 size={13} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[10.5px] font-bold text-slate-700">20 Modules Active</p>
              <p className="text-[9px] text-slate-400">15 service · 5 operations</p>
            </div>
            <Link to="/admin/reports" className="ml-auto text-[10px] font-semibold text-amber-600 hover:underline flex items-center gap-0.5 flex-shrink-0">
              Reports <ArrowRight size={9} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
