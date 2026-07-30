import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { ArrowUpRight, ArrowDownLeft, AlertCircle, TrendingDown } from "lucide-react";
import {
  TRANSACTIONS, MONTHLY_SPEND, DEPT_SPEND,
  CREDIT_LIMIT, CREDIT_USED, fmtAED,
} from "./data";

const available = CREDIT_LIMIT - CREDIT_USED;
const usedPct   = Math.round((CREDIT_USED / CREDIT_LIMIT) * 100);

// ── SVG Arc Gauge ────────────────────────────────────────────────────────────
function ArcGauge() {
  const W = 240, H = 200;
  const cx = W / 2, cy = 125;
  const rOuter = 90, rInner = 64;
  const startDeg = 210, totalDeg = 300;
  const filledDeg = (usedPct / 100) * totalDeg;

  const rad = (d: number) => (d * Math.PI) / 180;
  const pt = (deg: number, r: number) => ({
    x: cx + r * Math.cos(rad(deg - 90)),
    y: cy + r * Math.sin(rad(deg - 90)),
  });
  const arc = (startD: number, sweepD: number, color: string) => {
    const e = startD + sweepD;
    const s1 = pt(startD, rOuter), e1 = pt(e, rOuter);
    const s2 = pt(startD, rInner), e2 = pt(e, rInner);
    const lg = sweepD > 180 ? 1 : 0;
    return (
      <path
        d={`M ${s1.x} ${s1.y} A ${rOuter} ${rOuter} 0 ${lg} 1 ${e1.x} ${e1.y} L ${e2.x} ${e2.y} A ${rInner} ${rInner} 0 ${lg} 0 ${s2.x} ${s2.y} Z`}
        fill={color}
      />
    );
  };

  const trackColor  = "#EEF0F4";
  const fillColor   = usedPct >= 85 ? "#EF4444" : usedPct >= 65 ? "#F97316" : "#0B1829";
  const labelColor  = fillColor;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[240px] mx-auto">
      {arc(startDeg, totalDeg,    trackColor)}
      {arc(startDeg, filledDeg,   fillColor)}
      {/* tick marks at 0 / 25 / 50 / 75 / 100 */}
      {[0, 25, 50, 75, 100].map(pct => {
        const deg = startDeg + (pct / 100) * totalDeg;
        const p1 = pt(deg, rOuter + 6);
        const p2 = pt(deg, rOuter + 1);
        return <line key={pct} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />;
      })}
      {/* center label */}
      <text x={cx} y={cy - 14} textAnchor="middle" fontSize="10" fill="#94A3B8" fontWeight="600" letterSpacing="1">UTILISED</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="32" fill={labelColor} fontWeight="800">{usedPct}%</text>
      <text x={cx} y={cy + 40} textAnchor="middle" fontSize="10" fill="#94A3B8">{fmtAED(CREDIT_USED)}</text>
      {/* edge labels */}
      <text x="20"  y={H - 8} fontSize="9" fill="#94A3B8">0</text>
      <text x={W - 28} y={H - 8} fontSize="9" fill="#94A3B8">500k</text>
    </svg>
  );
}

const AreaTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E2E5EA] rounded-lg p-2.5 shadow-lg text-[11px]">
      <p className="font-bold text-[#0B1829] mb-1">{label}</p>
      <p className="text-[#94A3B8]">Spend: <span className="font-semibold text-[#0B1829]">{fmtAED(payload[0]?.value ?? 0)}</span></p>
    </div>
  );
};

export default function Credit() {
  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-[#0B1829] text-[20px] font-bold">Credit Limit & Usage</h1>
        <p className="text-[11px] text-[#94A3B8] mt-0.5">ACME Corp · Limit: {fmtAED(CREDIT_LIMIT)} · Net-30 payment terms</p>
      </div>

      {usedPct >= 65 && (
        <div className="flex items-center gap-3 p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
          <AlertCircle size={14} className="text-orange-600 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-orange-700">
            Credit utilisation at {usedPct}% — consider requesting a limit increase before month-end.
          </p>
          <button className="ml-auto text-[11px] font-bold text-orange-600 hover:underline whitespace-nowrap">Request Increase</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Gauge card */}
        <div className="bg-white rounded-xl border border-[#E2E5EA] p-5 flex flex-col">
          <p className="text-[13px] font-bold text-[#0B1829] mb-4">Credit Utilisation</p>
          <ArcGauge />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-[#F8FAFC] rounded-lg p-3 text-center">
              <p className="text-[9px] text-[#94A3B8] font-semibold uppercase tracking-wide mb-1">Used</p>
              <p className="text-[12px] font-bold font-mono text-[#0B1829]">{fmtAED(CREDIT_USED)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-[9px] text-[#94A3B8] font-semibold uppercase tracking-wide mb-1">Available</p>
              <p className="text-[12px] font-bold font-mono text-emerald-700">{fmtAED(available)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-[#E2E5EA] pt-4">
            {[["Credit Limit","AED 500,000"],["Reset Date","1 Feb 2025"],["Payment Terms","Net 30"]].map(([k,v]) => (
              <div key={k} className="flex justify-between text-[11px]">
                <span className="text-[#94A3B8]">{k}</span>
                <span className="font-semibold text-[#0B1829]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend area chart */}
        <div className="bg-white rounded-xl border border-[#E2E5EA] p-5">
          <p className="text-[13px] font-bold text-[#0B1829] mb-0.5">Monthly Spend Trend</p>
          <p className="text-[10px] text-[#94A3B8] mb-4">Aug 2024 – Jan 2025</p>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={MONTHLY_SPEND}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0B1829" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#0B1829" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<AreaTip />} />
              <Area type="monotone" dataKey="spend" stroke="#0B1829" strokeWidth={2} fill="url(#grad)" dot={{ fill: "#0B1829", r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center gap-6 text-[11px] border-t border-[#E2E5EA] pt-4">
            <div><p className="text-[#94A3B8]">Avg Monthly</p><p className="font-bold font-mono text-[#0B1829]">AED 27,416</p></div>
            <div><p className="text-[#94A3B8]">YTD Total</p><p className="font-bold font-mono text-[#0B1829]">AED 164,500</p></div>
            <div className="ml-auto flex items-center gap-1 text-red-500 text-[11px] font-semibold"><TrendingDown size={11} /> −8.2%</div>
          </div>
        </div>

        {/* Dept bar chart */}
        <div className="bg-white rounded-xl border border-[#E2E5EA] p-5">
          <p className="text-[13px] font-bold text-[#0B1829] mb-0.5">Usage by Department</p>
          <p className="text-[10px] text-[#94A3B8] mb-4">YTD cumulative spend</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={DEPT_SPEND} layout="vertical" barCategoryGap="18%">
              <XAxis type="number" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={68} />
              <Tooltip formatter={(v: number) => fmtAED(v)} />
              <Bar dataKey="spend" radius={[0, 3, 3, 0]} fill="#0B1829" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction ledger */}
      <div className="bg-white rounded-xl border border-[#E2E5EA] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E5EA]">
          <p className="text-[13px] font-bold text-[#0B1829]">Transaction History</p>
          <button className="text-[11px] font-semibold text-[#94A3B8] hover:text-[#0B1829] transition-colors">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E5EA]">
              <tr>
                {["Date","Description","Reference","Amount","Running Balance"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F6F9]">
              {TRANSACTIONS.map(tx => (
                <tr key={tx.id} className="hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-5 py-3.5 text-[11px] text-[#94A3B8] whitespace-nowrap">{tx.date}</td>
                  <td className="px-5 py-3.5 text-[12px] text-[#334155]">{tx.description}</td>
                  <td className="px-5 py-3.5 text-[11px] font-mono text-[#94A3B8]">{tx.ref}</td>
                  <td className="px-5 py-3.5">
                    <div className={`flex items-center gap-1 text-[12px] font-bold font-mono ${tx.type === "credit" ? "text-emerald-600" : "text-[#0B1829]"}`}>
                      {tx.type === "credit" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                      {tx.type === "credit" ? "+" : "−"}{fmtAED(tx.amount)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-mono font-semibold text-[#0B1829]">{fmtAED(tx.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center px-5 py-3 border-t border-[#E2E5EA] bg-[#F8FAFC]">
          <p className="text-[11px] text-[#94A3B8]">{TRANSACTIONS.length} transactions shown</p>
          <button className="text-[11px] font-semibold text-[#F97316] hover:underline">Load more</button>
        </div>
      </div>
    </div>
  );
}
