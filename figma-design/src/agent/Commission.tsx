import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, Award, Clock, Percent, CheckCircle2 } from "lucide-react";
import { COMMISSION_MONTHS, SERVICE_COMMISSION, AGENT_PROFILE, TIER_CFG, fmtAED, TYPE_CFG } from "./data";

const PIE_COLORS = ["#14213D","#F97316","#16A34A","#0891B2","#EC4899"];

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg text-[11px]">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name === "earned" ? "Earned" : "Pending"}: {fmtAED(p.value)}</p>
      ))}
    </div>
  );
};

export default function Commission() {
  const tier = TIER_CFG[AGENT_PROFILE.tier];
  const totalEarned  = COMMISSION_MONTHS.reduce((s, m) => s + m.earned, 0);
  const totalPending = COMMISSION_MONTHS.reduce((s, m) => s + m.pending, 0);
  const thisMonth = COMMISSION_MONTHS[COMMISSION_MONTHS.length - 1];
  const totalRevenue = SERVICE_COMMISSION.reduce((s, x) => s + x.revenue, 0);

  const pieData = SERVICE_COMMISSION.map(sc => ({
    name: sc.label,
    value: sc.commission,
  }));

  const nextTierRate = AGENT_PROFILE.tier === "gold" ? TIER_CFG.platinum.rate : TIER_CFG.gold.rate;
  const nextTierLabel = AGENT_PROFILE.tier === "gold" ? "Platinum" : "Gold";
  const bookingsDone = 68;
  const bookingsNeeded = AGENT_PROFILE.tier === "gold" ? 150 : 50;
  const tierPct = Math.min(100, Math.round((bookingsDone / bookingsNeeded) * 100));

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-slate-800 text-[20px] font-bold">Commission & Reports</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Earnings overview and analytics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Earned (YTD)", value: fmtAED(totalEarned),         sub: "Aug 2024 – Jan 2025", icon: TrendingUp, ic: "bg-emerald-50 text-emerald-600", vc: "text-emerald-600" },
          { label: "This Month",         value: fmtAED(thisMonth.earned),    sub: "January 2025",        icon: Award,     ic: "bg-amber-50 text-amber-600",   vc: "text-slate-800" },
          { label: "Pending Clearance",  value: fmtAED(totalPending),        sub: "Awaiting confirmation", icon: Clock,  ic: "bg-blue-50 text-blue-600",     vc: "text-slate-800" },
          { label: "Commission Rate",    value: `${tier.rate}%`,             sub: `${tier.label} tier`,  icon: Percent,   ic: "bg-purple-50 text-purple-600", vc: "text-purple-700" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">{k.label}</p>
              <div className={`size-7 rounded-lg flex items-center justify-center ${k.ic}`}><k.icon size={13} /></div>
            </div>
            <p className={`text-[24px] font-bold leading-none mb-1 ${k.vc}`}>{k.value}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-5">
        {/* Monthly bar */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-bold text-slate-800">Monthly Commission</p>
              <p className="text-[10px] text-slate-400">Aug 2024 – Jan 2025</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-[2px] bg-[#14213D] inline-block" /> Earned</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-[2px] bg-emerald-300 inline-block" /> Pending</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={COMMISSION_MONTHS} barGap={2} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<Tip />} cursor={{ fill: "#F8FAFC" }} />
              <Bar dataKey="earned"  radius={[3,3,0,0]} fill="#14213D" name="earned" />
              <Bar dataKey="pending" radius={[3,3,0,0]} fill="#6EE7B7" name="pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie by service */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-[13px] font-bold text-slate-800 mb-4">Commission by Service</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => fmtAED(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {SERVICE_COMMISSION.map((sc, i) => (
              <div key={sc.type} className="flex items-center gap-2 text-[11px]">
                <span className="size-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="flex-1 text-slate-600">{sc.label}</span>
                <span className="font-mono font-bold text-slate-800">{fmtAED(sc.commission)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service breakdown table + Tier progress */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-800">Service Breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Service","Bookings","Revenue","Commission","Rate"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {SERVICE_COMMISSION.map((sc, i) => {
                  const ty = TYPE_CFG[sc.type];
                  const commPct = Math.round((sc.commission / sc.revenue) * 100);
                  const sharePct = Math.round((sc.revenue / totalRevenue) * 100);
                  return (
                    <tr key={sc.type} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${ty.bg} ${ty.color}`}>{ty.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[12px] font-semibold text-slate-700">{sc.bookings}</td>
                      <td className="px-5 py-4">
                        <p className="text-[12px] font-bold font-mono text-slate-800">{fmtAED(sc.revenue)}</p>
                        <p className="text-[9px] text-slate-400">{sharePct}% of total</p>
                      </td>
                      <td className="px-5 py-4 text-[12px] font-bold font-mono text-emerald-600">+{fmtAED(sc.commission)}</td>
                      <td className="px-5 py-4 text-[12px] font-semibold text-slate-600">{commPct}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-5 py-3 text-[11px] font-bold text-slate-600">Total</td>
                  <td className="px-5 py-3 text-[12px] font-bold text-slate-800">{SERVICE_COMMISSION.reduce((s,x)=>s+x.bookings,0)}</td>
                  <td className="px-5 py-3 text-[12px] font-bold font-mono text-slate-800">{fmtAED(totalRevenue)}</td>
                  <td className="px-5 py-3 text-[12px] font-bold font-mono text-emerald-600">+{fmtAED(SERVICE_COMMISSION.reduce((s,x)=>s+x.commission,0))}</td>
                  <td className="px-5 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tier progress */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] font-bold text-slate-800">Tier Progress</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Complete {bookingsNeeded - bookingsDone} more bookings to unlock <span className="font-semibold text-slate-700">{nextTierLabel} ({nextTierRate}%)</span>.
            </p>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
              <span>{bookingsDone} bookings</span>
              <span>{bookingsNeeded} needed</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${tierPct}%` }} />
            </div>
            {(["silver","gold","platinum"] as const).map(t => {
              const tc = TIER_CFG[t];
              const cur = t === AGENT_PROFILE.tier;
              return (
                <div key={t} className={`flex items-center gap-2.5 py-2.5 border-b border-slate-50 last:border-0 ${cur ? "" : "opacity-40"}`}>
                  <span className={`size-1.5 rounded-full ${cur ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className={`text-[11px] font-semibold ${tc.color} flex-1`}>{tc.label}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">{tc.rate}%</span>
                  {cur && <CheckCircle2 size={12} className="text-emerald-500" />}
                </div>
              );
            })}
          </div>

          <div className="bg-[#14213D] rounded-xl p-5 text-white">
            <p className="text-[11px] font-bold text-white/60 mb-1">Projected Annual</p>
            <p className="text-[26px] font-bold font-mono text-emerald-400">{fmtAED(totalEarned * 2)}</p>
            <p className="text-[10px] text-white/35 mt-0.5">Based on H1 2024–2025 pace</p>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5">
              {[
                ["At Gold (10%)",    fmtAED(totalRevenue * 0.10)],
                ["At Platinum (13%)",fmtAED(totalRevenue * 0.13)],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between text-[11px]">
                  <span className="text-white/45">{k}</span>
                  <span className="text-white/80 font-mono font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
