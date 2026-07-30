import { Link } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Wallet, TrendingUp, Users, List, ArrowRight, AlertCircle,
  FileText, Plane, Building2, Truck, Coffee, PlusCircle, CheckCircle2,
} from "lucide-react";
import { AGENT_PROFILE, BOOKINGS, PASSENGERS, COMMISSION_MONTHS, STATUS_CFG, TYPE_CFG, TIER_CFG, fmtAED } from "./data";

const QUICK = [
  { label: "Visa",      icon: FileText,  to: "/agent/book?type=visa",      color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { label: "Ticket",    icon: Plane,     to: "/agent/book?type=ticket",    color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
  { label: "Hotel",     icon: Building2, to: "/agent/book?type=hotel",     color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
  { label: "Transport", icon: Truck,     to: "/agent/book?type=transport", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
  { label: "Catering",  icon: Coffee,    to: "/agent/book?type=catering",  color: "bg-pink-50 text-pink-700 hover:bg-pink-100" },
];

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg text-[11px]">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "earned" ? "Earned" : "Pending"}: {fmtAED(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function AgentDashboard() {
  const tier = TIER_CFG[AGENT_PROFILE.tier];
  const totalComm = COMMISSION_MONTHS.reduce((s, m) => s + m.earned + m.pending, 0);
  const thisMonth = COMMISSION_MONTHS[COMMISSION_MONTHS.length - 1];
  const active = BOOKINGS.filter(b => ["submitted","processing","approved"].includes(b.status));
  const pending = BOOKINGS.filter(b => b.status === "submitted");
  const secPct = Math.round((AGENT_PROFILE.securityDeposit / AGENT_PROFILE.securityLimit) * 100);
  const completed = BOOKINGS.filter(b => b.status === "completed");

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-800 text-[20px] font-bold">{AGENT_PROFILE.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label} Agent</span>
            <span className="text-[11px] text-slate-400">{AGENT_PROFILE.agentId} · {tier.rate}% commission rate</span>
          </div>
        </div>
        <Link to="/agent/book" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54] transition-colors">
          <PlusCircle size={13} /> New Booking
        </Link>
      </div>

      {/* Low balance alert */}
      {AGENT_PROFILE.walletBalance < 30000 && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-amber-700">
            Wallet balance ({fmtAED(AGENT_PROFILE.walletBalance)}) is below the recommended threshold.
          </p>
          <Link to="/agent/wallet" className="ml-auto text-[11px] font-bold text-amber-600 hover:underline whitespace-nowrap flex items-center gap-1">
            Top-up <ArrowRight size={10} />
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Wallet Balance",     value: fmtAED(AGENT_PROFILE.walletBalance), sub: "Available",            icon: Wallet,    ic: "bg-emerald-50 text-emerald-600", vc: "text-emerald-600" },
          { label: "Commission (YTD)",   value: fmtAED(totalComm),                   sub: `+${fmtAED(thisMonth.earned)} this month`, icon: TrendingUp,ic: "bg-amber-50 text-amber-600",   vc: "text-slate-800" },
          { label: "Active Bookings",    value: String(active.length),               sub: `${pending.length} awaiting review`,icon: List,     ic: "bg-blue-50 text-blue-600",     vc: "text-slate-800" },
          { label: "Passengers on File", value: String(PASSENGERS.length),           sub: "Batch-ready",          icon: Users,     ic: "bg-purple-50 text-purple-600",  vc: "text-slate-800" },
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

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-bold text-slate-800">Commission Trend</p>
              <p className="text-[10px] text-slate-400">Aug 2024 – Jan 2025</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-[2px] bg-[#14213D] inline-block" /> Earned</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-[2px] bg-emerald-300 inline-block" /> Pending</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
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

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-[13px] font-bold text-slate-800 mb-4">Quick Booking</p>
          <div className="space-y-2">
            {QUICK.map(a => (
              <Link key={a.label} to={a.to} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-semibold transition-colors ${a.color}`}>
                <a.icon size={14} />
                {a.label}
                <ArrowRight size={11} className="ml-auto opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Active Bookings + Security / Tier */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-800">Active Bookings</p>
            <Link to="/agent/bookings" className="text-[11px] font-semibold text-[#F97316] hover:underline flex items-center gap-1">
              All bookings <ArrowRight size={10} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {active.slice(0, 5).map(b => {
              const st = STATUS_CFG[b.status];
              const ty = TYPE_CFG[b.type];
              return (
                <div key={b.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${ty.bg} ${ty.color} flex-shrink-0`}>{ty.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">{b.service}</p>
                    <p className="text-[10px] text-slate-400">{b.ref} · {b.destination} · {b.travelDate}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.color}`}>{st.label}</span>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-bold font-mono text-slate-800">{fmtAED(b.amount)}</p>
                    <p className="text-[9px] text-emerald-600 font-semibold">+{fmtAED(b.commission)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[13px] font-bold text-slate-800 mb-1">Security Deposit</p>
            <p className="text-[10px] text-slate-400 mb-4">Held against credit facility</p>
            <div className="flex items-end gap-2 mb-3">
              <p className="text-[24px] font-bold font-mono text-slate-800">{fmtAED(AGENT_PROFILE.securityDeposit)}</p>
              <p className="text-[11px] text-slate-400 mb-1">of {fmtAED(AGENT_PROFILE.securityLimit)}</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full bg-[#14213D]" style={{ width: `${secPct}%` }} />
            </div>
            <p className="text-[10px] text-slate-400">{secPct}% · Credit limit {fmtAED(AGENT_PROFILE.creditLimit)}</p>
            <Link to="/agent/wallet" className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-[#F97316] hover:underline">
              Manage <ArrowRight size={10} />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-slate-800">Agent Tier</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              {completed.length} completed bookings. Need {150 - completed.length} more for Platinum ({TIER_CFG.platinum.rate}% rate).
            </p>
            {(["silver","gold","platinum"] as const).map(t => {
              const tc = TIER_CFG[t];
              const cur = t === AGENT_PROFILE.tier;
              return (
                <div key={t} className={`flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-0 ${cur ? "" : "opacity-35"}`}>
                  <span className={`size-1.5 rounded-full ${cur ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <span className={`text-[11px] font-semibold ${tc.color} flex-1`}>{tc.label}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-600">{tc.rate}%</span>
                  {cur && <CheckCircle2 size={12} className="text-emerald-500" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
