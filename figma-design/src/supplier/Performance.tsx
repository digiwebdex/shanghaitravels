import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { Star, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { SUPPLIER, RATING_BREAKDOWN, MONTHLY_REVENUE, fmtAED } from "./data";

const REVIEWS = [
  { guest: "James W.",       date: "07 Jan 2025", rating: 5, service: "Executive Suite",     comment: "Impeccable service and breathtaking views. The butler was outstanding." },
  { guest: "Sarah T.",       date: "05 Jan 2025", rating: 5, service: "Deluxe King Room",    comment: "Spotless room, incredible breakfast spread. Will absolutely return." },
  { guest: "Kenji T.",       date: "03 Jan 2025", rating: 4, service: "Spa Day Package",     comment: "Excellent facilities but massage appointment ran 15 min late." },
  { guest: "Fatima A.",      date: "29 Dec 2024", rating: 5, service: "Presidential Suite",  comment: "Once-in-a-lifetime experience. Worth every dirham." },
  { guest: "David T.",       date: "26 Dec 2024", rating: 4, service: "Superior Twin Room",  comment: "Great location and comfortable rooms. Room service was a bit slow." },
];

const MONTHLY_RATINGS = [
  { month: "Aug", rating: 4.5 },
  { month: "Sep", rating: 4.6 },
  { month: "Oct", rating: 4.7 },
  { month: "Nov", rating: 4.8 },
  { month: "Dec", rating: 4.8 },
  { month: "Jan", rating: 4.7 },
];

const Stars = ({ score, size = 12 }: { score: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size} className={i <= Math.round(score) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
    ))}
  </div>
);

export default function Performance() {
  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-slate-800 text-[20px] font-bold">Performance</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">Ratings, metrics and guest feedback</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Overall Rating",    value: String(SUPPLIER.rating), sub: `${SUPPLIER.totalReviews} reviews`, icon: Star,        vc: "text-amber-500", ic: "bg-amber-50 text-amber-600" },
          { label: "Acceptance Rate",   value: `${SUPPLIER.acceptanceRate}%`, sub: "Requests accepted",         icon: CheckCircle2, vc: "text-emerald-600", ic: "bg-emerald-50 text-emerald-600" },
          { label: "Response Rate",     value: `${SUPPLIER.responseRate}%`,   sub: `Avg ${SUPPLIER.avgResponseTime} response`, icon: TrendingUp, vc: "text-slate-800", ic: "bg-blue-50 text-blue-600" },
          { label: "Avg Response Time", value: SUPPLIER.avgResponseTime,     sub: "To booking requests",        icon: Clock,       vc: "text-violet-600", ic: "bg-violet-50 text-violet-600" },
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

      <div className="grid grid-cols-3 gap-5">
        {/* Rating breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[13px] font-bold text-slate-800">Rating Breakdown</p>
              <p className="text-[10px] text-slate-400">By category</p>
            </div>
            <div className="text-right">
              <p className="text-[32px] font-bold text-amber-500 leading-none">{SUPPLIER.rating}</p>
              <Stars score={SUPPLIER.rating} size={11} />
            </div>
          </div>
          <div className="space-y-3">
            {RATING_BREAKDOWN.map(rb => (
              <div key={rb.category}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-600">{rb.category}</span>
                  <span className="font-bold text-slate-800">{rb.score}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${(rb.score / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-[13px] font-bold text-slate-800 mb-1">Rating Trend</p>
          <p className="text-[10px] text-slate-400 mb-4">Aug 2024 – Jan 2025</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={MONTHLY_RATINGS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[4, 5]} tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => v.toFixed(1)} />
              <Line type="monotone" dataKey="rating" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-[13px] font-bold text-slate-800 mb-1">Monthly Bookings</p>
          <p className="text-[10px] text-slate-400 mb-4">Aug 2024 – Jan 2025</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={MONTHLY_REVENUE} barCategoryGap="36%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="bookings" radius={[3,3,0,0]} fill="#7C3AED" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent reviews */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[13px] font-bold text-slate-800">Recent Guest Reviews</p>
        </div>
        <div className="divide-y divide-slate-50">
          {REVIEWS.map((r, i) => (
            <div key={i} className="flex items-start gap-5 px-5 py-4">
              <div className="size-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-700 text-[11px] font-bold">{r.guest.split(" ")[0][0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[12px] font-bold text-slate-800">{r.guest}</p>
                  <Stars score={r.rating} size={10} />
                  <span className="text-[10px] text-slate-400 ml-auto">{r.date}</span>
                </div>
                <p className="text-[10px] text-violet-600 font-semibold mb-1">{r.service}</p>
                <p className="text-[12px] text-slate-600 leading-relaxed">{r.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement tips */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[13px] font-bold text-slate-800 mb-4">Improvement Opportunities</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: AlertCircle, color: "text-amber-600 bg-amber-50", text: "Value score (4.4) is your lowest category — consider reviewing seasonal pricing." },
            { icon: Clock,       color: "text-blue-600 bg-blue-50",   text: "3 requests expired last month — enable push notifications for faster response." },
            { icon: Star,        color: "text-emerald-600 bg-emerald-50", text: "Location and Staff are rated highest — highlight these in your service descriptions." },
            { icon: TrendingUp,  color: "text-violet-600 bg-violet-50", text: "Acceptance rate at 88% — accepting more Q1 requests could push you to Preferred tier." },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100">
              <div className={`size-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tip.color}`}>
                <tip.icon size={13} />
              </div>
              <p className="text-[12px] text-slate-600 leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
