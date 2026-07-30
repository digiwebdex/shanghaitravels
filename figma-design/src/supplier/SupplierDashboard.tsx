import { Link } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Inbox, DollarSign, Star, TrendingUp, ArrowRight, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { SUPPLIER, REQUESTS, INVOICES, MONTHLY_REVENUE, STATUS_CFG, INV_STATUS, fmtAED } from "./data";

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-lg text-[11px]">
      <p className="font-bold text-slate-800 mb-1">{label}</p>
      <p className="text-violet-600">Revenue: {fmtAED(payload[0].value)}</p>
      {payload[1] && <p className="text-slate-500">Bookings: {payload[1].value}</p>}
    </div>
  );
};

export default function SupplierDashboard() {
  const pending  = REQUESTS.filter(r => r.status === "pending");
  const expiring = pending.filter(r => r.priority === "high");
  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const thisMonth    = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1];
  const overdue = INVOICES.filter(i => i.status === "overdue");

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-slate-800 text-[20px] font-bold">{SUPPLIER.name}</h1>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-slate-400">{SUPPLIER.supplierId} · {SUPPLIER.category}</span>
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-slate-700">{SUPPLIER.rating}</span>
            <span className="text-[10px] text-slate-400">({SUPPLIER.totalReviews})</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {expiring.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-[12px] font-semibold text-amber-700">
              {expiring.length} high-priority request{expiring.length > 1 ? "s" : ""} expiring within 24 hours.
            </p>
            <Link to="/supplier/requests" className="ml-auto text-[11px] font-bold text-amber-600 hover:underline whitespace-nowrap flex items-center gap-1">
              Review now <ArrowRight size={10} />
            </Link>
          </div>
        )}
        {overdue.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
            <p className="text-[12px] font-semibold text-red-700">
              {overdue.length} overdue invoice{overdue.length > 1 ? "s" : ""} — follow up with agent{overdue.length > 1 ? "s" : ""}.
            </p>
            <Link to="/supplier/invoices" className="ml-auto text-[11px] font-bold text-red-600 hover:underline whitespace-nowrap flex items-center gap-1">
              View invoices <ArrowRight size={10} />
            </Link>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pending Requests", value: String(pending.length),            sub: `${expiring.length} high priority`,       icon: Inbox,       ic: "bg-violet-50 text-violet-600",  vc: "text-violet-600" },
          { label: "Revenue (YTD)",    value: fmtAED(totalRevenue),              sub: `${fmtAED(thisMonth.revenue)} this month`, icon: DollarSign,  ic: "bg-emerald-50 text-emerald-600",vc: "text-slate-800"  },
          { label: "Overall Rating",   value: String(SUPPLIER.rating),           sub: `${SUPPLIER.totalReviews} reviews`,        icon: Star,        ic: "bg-amber-50 text-amber-600",    vc: "text-amber-600"  },
          { label: "Response Rate",    value: `${SUPPLIER.responseRate}%`,       sub: `Avg ${SUPPLIER.avgResponseTime}`,         icon: TrendingUp,  ic: "bg-blue-50 text-blue-600",      vc: "text-slate-800"  },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">{k.label}</p>
              <div className={`size-7 rounded-lg flex items-center justify-center ${k.ic}`}><k.icon size={13} /></div>
            </div>
            <p className={`text-[26px] font-bold leading-none mb-1 ${k.vc}`}>{k.value}</p>
            <p className="text-[10px] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart + Pending requests */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] font-bold text-slate-800">Revenue Trend</p>
              <p className="text-[10px] text-slate-400">Aug 2024 – Jan 2025</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={MONTHLY_REVENUE} barCategoryGap="36%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<Tip />} cursor={{ fill: "#F8FAFC" }} />
              <Bar dataKey="revenue" radius={[4,4,0,0]} fill="#7C3AED" name="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pending requests queue */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-800">Pending Requests</p>
            <Link to="/supplier/requests" className="text-[11px] font-semibold text-violet-600 hover:underline flex items-center gap-1">
              All <ArrowRight size={10} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {pending.slice(0, 4).map(r => (
              <div key={r.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[12px] font-semibold text-slate-800 leading-snug flex-1">{r.serviceName}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${r.priority === "high" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                    {r.priority === "high" ? "URGENT" : "NORMAL"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{r.agentName} · {r.checkIn} – {r.checkOut}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono text-slate-800">{fmtAED(r.totalValue)}</span>
                  <div className="flex gap-1">
                    <button className="px-2.5 py-1 rounded-md bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-colors">Accept</button>
                    <button className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold hover:bg-slate-200 transition-colors">Decline</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent invoices + Stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-800">Recent Invoices</p>
            <Link to="/supplier/invoices" className="text-[11px] font-semibold text-violet-600 hover:underline flex items-center gap-1">All <ArrowRight size={10} /></Link>
          </div>
          <div className="divide-y divide-slate-50">
            {INVOICES.slice(0, 4).map(inv => {
              const st = INV_STATUS[inv.status];
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800">{inv.number}</p>
                    <p className="text-[10px] text-slate-400">{inv.agentName} · {inv.serviceName}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 whitespace-nowrap">{inv.dueDate}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.color}`}>{st.label}</span>
                  <p className="text-[12px] font-bold font-mono text-slate-800 flex-shrink-0">{fmtAED(inv.total)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Performance snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[13px] font-bold text-slate-800 mb-4">Performance</p>
            <div className="space-y-3">
              {[
                { label: "Acceptance Rate", value: `${SUPPLIER.acceptanceRate}%`, width: SUPPLIER.acceptanceRate, color: "bg-emerald-400" },
                { label: "Response Rate",   value: `${SUPPLIER.responseRate}%`,   width: SUPPLIER.responseRate,   color: "bg-violet-400" },
                { label: "Guest Rating",    value: `${SUPPLIER.rating}/5`,         width: (SUPPLIER.rating/5)*100, color: "bg-amber-400"  },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-500">{m.label}</span>
                    <span className="font-bold text-slate-800">{m.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.width}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/supplier/performance" className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:underline">
              Full report <ArrowRight size={10} />
            </Link>
          </div>

          {/* Account manager */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[12px] font-bold text-slate-800 mb-3">Account Manager</p>
            <p className="text-[13px] font-semibold text-slate-800">{SUPPLIER.accountManager.name}</p>
            <p className="text-[10px] text-slate-400 mb-3">Shanghai Travels Partner Desk</p>
            <div className="space-y-1.5 text-[11px]">
              <a href={`mailto:${SUPPLIER.accountManager.email}`} className="block text-violet-600 hover:underline">{SUPPLIER.accountManager.email}</a>
              <a href={`tel:${SUPPLIER.accountManager.phone}`} className="block text-slate-500 hover:text-slate-700">{SUPPLIER.accountManager.phone}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
