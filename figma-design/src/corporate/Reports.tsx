import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Download, FileText, TrendingUp, CheckCircle2,
  Clock, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  INVOICES, MONTHLY_SPEND, DEPT_SPEND, EMPLOYEES, fmtAED,
} from "./data";

type ChartTab = "dept" | "monthly" | "employees";

const CHART_TABS: { key: ChartTab; label: string }[] = [
  { key: "dept",      label: "By Department" },
  { key: "monthly",   label: "Monthly Trend"  },
  { key: "employees", label: "Top Spenders"   },
];

const PIE_PALETTE = ["#0B1829","#1e3a5f","#2d5a9e","#F97316","#fb923c","#94A3B8","#e2e8f0"];

const INV_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid:      { label: "Paid",      color: "text-emerald-700", bg: "bg-emerald-100" },
  unpaid:    { label: "Unpaid",    color: "text-orange-700",  bg: "bg-orange-100"  },
  overdue:   { label: "Overdue",   color: "text-red-700",     bg: "bg-red-100"     },
  draft:     { label: "Draft",     color: "text-slate-600",   bg: "bg-slate-100"   },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E2E5EA] rounded-lg p-2.5 shadow-lg text-[11px]">
      <p className="font-bold text-[#0B1829] mb-1">{label ?? payload[0]?.name}</p>
      <p className="text-[#94A3B8]">Amount: <span className="font-semibold text-[#0B1829]">{fmtAED(payload[0]?.value ?? 0)}</span></p>
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }: any) => {
  if (percent < 0.07) return null;
  const RAD = Math.PI / 180;
  const rx = cx + (outerRadius + 18) * Math.cos(-midAngle * RAD);
  const ry = cy + (outerRadius + 18) * Math.sin(-midAngle * RAD);
  return (
    <text x={rx} y={ry} textAnchor={rx > cx ? "start" : "end"} fontSize="10" fill="#64748B">
      {name} ({Math.round(percent * 100)}%)
    </text>
  );
};

const topSpenders = [...EMPLOYEES]
  .sort((a, b) => b.totalSpend - a.totalSpend)
  .slice(0, 7)
  .map(e => ({ name: e.name.split(" ")[0] + " " + e.name.split(" ")[1]?.[0] + ".", spend: e.totalSpend }));

export default function Reports() {
  const [chartTab, setChartTab] = useState<ChartTab>("dept");
  const [sortDesc, setSortDesc] = useState(true);

  const totalInvoiced  = INVOICES.reduce((s, i) => s + i.amount, 0);
  const totalPaid      = INVOICES.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalUnpaid    = INVOICES.filter(i => i.status !== "paid" && i.status !== "draft").reduce((s, i) => s + i.amount, 0);
  const avgPerInvoice  = Math.round(totalInvoiced / INVOICES.length);

  const sorted = [...INVOICES].sort((a, b) =>
    sortDesc
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0B1829] text-[20px] font-bold">Invoices & Reports</h1>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">ACME Corp · Fiscal year 2024 – 2025</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E5EA] text-[12px] font-semibold text-[#64748B] hover:bg-[#EEF0F4] transition-colors">
            <Download size={12} /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1829] text-white text-[12px] font-semibold hover:bg-[#162840] transition-colors">
            <FileText size={12} /> Download PDF Report
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced",    value: fmtAED(totalInvoiced), sub: `${INVOICES.length} invoices`, icon: FileText,    ic: "bg-indigo-50 text-indigo-600" },
          { label: "Total Paid",        value: fmtAED(totalPaid),     sub: `${INVOICES.filter(i => i.status === "paid").length} invoices cleared`, icon: CheckCircle2, ic: "bg-emerald-50 text-emerald-600" },
          { label: "Outstanding",       value: fmtAED(totalUnpaid),   sub: `${INVOICES.filter(i => i.status !== "paid" && i.status !== "draft").length} invoices due`, icon: AlertCircle,  ic: "bg-orange-50 text-orange-600" },
          { label: "Avg per Invoice",   value: fmtAED(avgPerInvoice), sub: "All time average",            icon: TrendingUp,  ic: "bg-blue-50 text-blue-600" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2E5EA] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em]">{k.label}</p>
              <div className={`size-7 rounded-lg flex items-center justify-center ${k.ic}`}>
                <k.icon size={13} />
              </div>
            </div>
            <p className="text-[22px] font-bold text-[#0B1829] leading-none mb-1">{k.value}</p>
            <p className="text-[10px] text-[#94A3B8]">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Analytics panel */}
      <div className="bg-white rounded-xl border border-[#E2E5EA] p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[13px] font-bold text-[#0B1829]">Spend Analytics</p>
          <div className="flex gap-1 p-1 bg-[#EEF0F4] rounded-lg">
            {CHART_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setChartTab(t.key)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${chartTab === t.key ? "bg-white text-[#0B1829] shadow-sm" : "text-[#94A3B8] hover:text-[#0B1829]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {chartTab === "dept" && (
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={DEPT_SPEND}
                    dataKey="spend"
                    nameKey="dept"
                    cx="50%" cy="50%"
                    outerRadius={88}
                    innerRadius={52}
                    labelLine={false}
                    label={PieLabel}
                  >
                    {DEPT_SPEND.map((_, i) => (
                      <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtAED(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-2 space-y-2.5 self-center">
              {DEPT_SPEND.map((d, i) => (
                <div key={d.dept} className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                  <span className="text-[11px] text-[#64748B] flex-1">{d.dept}</span>
                  <span className="text-[11px] font-bold font-mono text-[#0B1829]">{fmtAED(d.spend)}</span>
                  <span className="text-[10px] text-[#94A3B8] w-8 text-right">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {chartTab === "monthly" && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_SPEND} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
              <Bar dataKey="spend"  radius={[3, 3, 0, 0]} fill="#0B1829" name="Spend"  />
              <Bar dataKey="budget" radius={[3, 3, 0, 0]} fill="#E2E5EA" name="Budget" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartTab === "employees" && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSpenders} layout="vertical" barCategoryGap="20%">
              <XAxis type="number" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(v: number) => fmtAED(v)} />
              <Bar dataKey="spend" radius={[0, 3, 3, 0]} fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-xl border border-[#E2E5EA] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E5EA]">
          <p className="text-[13px] font-bold text-[#0B1829]">Invoice History</p>
          <button
            onClick={() => setSortDesc(d => !d)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#94A3B8] hover:text-[#0B1829] transition-colors"
          >
            Date {sortDesc ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E5EA]">
              <tr>
                {["Invoice #","Date","Description","Applications","Amount","Status","Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F6F9]">
              {sorted.map(inv => {
                const cfg = INV_STATUS[inv.status] ?? INV_STATUS.draft;
                return (
                  <tr key={inv.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[12px] font-semibold text-[#0B1829]">{inv.number}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-[#94A3B8] whitespace-nowrap">{inv.date}</td>
                    <td className="px-5 py-3.5 text-[12px] text-[#334155] max-w-[200px] truncate">{inv.description}</td>
                    <td className="px-5 py-3.5 text-[12px] text-[#64748B]">{inv.applications}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-bold font-mono text-[#0B1829]">{fmtAED(inv.amount)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 text-[11px] font-semibold text-[#94A3B8] hover:text-[#0B1829] transition-colors">
                          <Download size={11} /> PDF
                        </button>
                        {inv.status !== "paid" && (
                          <button className="flex items-center gap-1 text-[11px] font-bold text-[#F97316] hover:underline">
                            <Clock size={10} /> Pay Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E5EA] bg-[#F8FAFC]">
          <p className="text-[11px] text-[#94A3B8]">{INVOICES.length} invoices total</p>
          <button className="text-[11px] font-semibold text-[#F97316] hover:underline">Load more</button>
        </div>
      </div>
    </div>
  );
}
