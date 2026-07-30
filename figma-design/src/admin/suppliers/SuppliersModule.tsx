import { useState } from "react";
import {
  Package, Search, Plus, Star, TrendingUp, TrendingDown, Minus,
  Phone, Mail, Globe, FileText, CheckCircle2, Clock, XCircle,
  AlertTriangle, BarChart2, Eye, DollarSign,
} from "lucide-react";
import {
  SUPPLIERS, CONTRACTS, SCORECARDS, SUPPLIER_INVOICES, SUPPLIER_PAYMENTS,
  Supplier, Contract, PerformanceScore, SupplierInvoice,
  SupplierType, ContractStatus, fmtAED,
} from "./data";

type SuppTab = "directory" | "contracts" | "scorecards" | "invoices" | "payments";

const TABS: { key: SuppTab; label: string }[] = [
  { key: "directory",  label: "Supplier Directory" },
  { key: "contracts",  label: "Contracts" },
  { key: "scorecards", label: "Performance Scorecards" },
  { key: "invoices",   label: "Invoices" },
  { key: "payments",   label: "Payments" },
];

const TYPE_CONFIG: Record<SupplierType, { label: string; bg: string; text: string; icon: string }> = {
  airline:   { label: "Airline",   bg: "bg-blue-500/20",    text: "text-blue-400",    icon: "✈" },
  hotel:     { label: "Hotel",     bg: "bg-purple-500/20",  text: "text-purple-400",  icon: "🏨" },
  transport: { label: "Transport", bg: "bg-cyan-500/20",    text: "text-cyan-400",    icon: "🚗" },
  courier:   { label: "Courier",   bg: "bg-amber-500/20",   text: "text-amber-400",   icon: "📦" },
  insurance: { label: "Insurance", bg: "bg-emerald-500/20", text: "text-emerald-400", icon: "🛡" },
};

const CONTRACT_CFG: Record<ContractStatus, { label: string; bg: string; text: string }> = {
  active:          { label: "Active",          bg: "bg-emerald-500/20", text: "text-emerald-400" },
  expired:         { label: "Expired",         bg: "bg-red-500/20",     text: "text-red-400"     },
  pending_renewal: { label: "Pending Renewal", bg: "bg-amber-500/20",   text: "text-amber-400"   },
  terminated:      { label: "Terminated",      bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
};

const INV_CFG: Record<SupplierInvoice["status"], { label: string; bg: string; text: string }> = {
  received: { label: "Received", bg: "bg-blue-500/20",    text: "text-blue-400"    },
  approved: { label: "Approved", bg: "bg-amber-500/20",   text: "text-amber-400"   },
  paid:     { label: "Paid",     bg: "bg-emerald-500/20", text: "text-emerald-400" },
  disputed: { label: "Disputed", bg: "bg-purple-500/20",  text: "text-purple-400"  },
  overdue:  { label: "Overdue",  bg: "bg-red-500/20",     text: "text-red-400"     },
};

function TypeBadge({ type }: { type: SupplierType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function ScoreBar({ value, max = 100, color = "bg-amber-500" }: { value: number; max?: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  const barColor = value >= 90 ? "bg-emerald-500" : value >= 75 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-700 rounded-full h-1.5">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-300 w-8 text-right">{value}%</span>
    </div>
  );
}

// ── Directory ─────────────────────────────────────────────────────────────────
function DirectoryTab() {
  const [typeFilter, setTypeFilter] = useState<SupplierType | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Supplier | null>(null);

  const types: (SupplierType | "all")[] = ["all", "airline", "hotel", "transport", "courier", "insurance"];
  const filtered = SUPPLIERS.filter(s =>
    (typeFilter === "all" || s.type === typeFilter) &&
    (s.name.toLowerCase().includes(query.toLowerCase()) || s.country.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search suppliers..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
          </div>
          <div className="flex rounded-lg overflow-hidden border border-zinc-700">
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${typeFilter === t ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
                {t === "all" ? "All" : TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>
          <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 flex-shrink-0">
            <Plus size={14} /> Add Supplier
          </button>
        </div>

        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} onClick={() => setSelected(s)}
              className={`bg-zinc-900 rounded-xl border cursor-pointer transition-all p-4 hover:border-zinc-700
                ${selected?.id === s.id ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${TYPE_CONFIG[s.type].bg}`}>
                  {TYPE_CONFIG[s.type].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-zinc-100">{s.name}</span>
                    <TypeBadge type={s.type} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-600/40 text-zinc-400"}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{s.city}, {s.country}</span>
                    <span>{s.contactName}</span>
                    <span>{s.accountCode}</span>
                    <span>AM: {s.accountManager}</span>
                  </div>
                </div>
                <div className="flex gap-6 text-center flex-shrink-0">
                  <div>
                    <div className="text-sm font-bold text-amber-400">{s.commissionPct}%</div>
                    <div className="text-xs text-zinc-500">Commission</div>
                  </div>
                  {s.overrideAED > 0 && (
                    <div>
                      <div className="text-sm font-bold text-zinc-200">AED {s.overrideAED}</div>
                      <div className="text-xs text-zinc-500">Override</div>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-0.5 text-sm font-bold text-emerald-400">
                      <Star size={12} className="fill-emerald-400" /> {s.rating}
                    </div>
                    <div className="text-xs text-zinc-500">Rating</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-200">{s.creditTermDays}d</div>
                    <div className="text-xs text-zinc-500">Terms</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No suppliers found.</div>
          )}
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${TYPE_CONFIG[selected.type].bg}`}>
              {TYPE_CONFIG[selected.type].icon}
            </div>
            <div>
              <div className="font-semibold text-zinc-100">{selected.name}</div>
              <div className="text-xs text-zinc-500">{selected.accountCode}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Type", TYPE_CONFIG[selected.type].label],
              ["Country", `${selected.city}, ${selected.country}`],
              ["Contact", selected.contactName],
              ["Email", selected.contactEmail],
              ["Phone", selected.contactPhone],
              ["Website", selected.website],
              ["Account Manager", selected.accountManager],
              ["Credit Terms", `${selected.creditTermDays} days`],
              ["Credit Limit", fmtAED(selected.creditLimitAED)],
              ["Commission", `${selected.commissionPct}%`],
              ["Override", selected.overrideAED > 0 ? `AED ${selected.overrideAED}` : "None"],
              ["Joined", selected.joinedAt],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-zinc-500 flex-shrink-0">{k}</span>
                <span className="text-zinc-300 text-right text-xs">{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-2">Tags</div>
            <div className="flex flex-wrap gap-1">
              {selected.tags.map(t => (
                <span key={t} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
          <button className="w-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold py-2 rounded-lg">
            View Profile
          </button>
        </div>
      )}
    </div>
  );
}

// ── Contracts ─────────────────────────────────────────────────────────────────
function ContractsTab() {
  const [selected, setSelected] = useState<Contract | null>(null);

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-zinc-400">{CONTRACTS.length} contracts</div>
          <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus size={14} /> New Contract
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Contract No.","Supplier","Type","Description","Value","Start","End","Renewal Notice","Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTRACTS.map((c, i) => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className={`border-b border-zinc-800/60 cursor-pointer transition-colors hover:bg-zinc-800/40
                    ${selected?.id === c.id ? "bg-amber-500/5 border-l-2 border-l-amber-500" : i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{c.contractNo}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{c.supplierName}</td>
                  <td className="px-4 py-3"><TypeBadge type={c.supplierType} /></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-xs truncate">{c.description}</td>
                  <td className="px-4 py-3 text-zinc-200">{fmtAED(c.value)}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.startDate}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.endDate}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.renewalNotice}d</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONTRACT_CFG[c.status].bg} ${CONTRACT_CFG[c.status].text}`}>
                      {CONTRACT_CFG[c.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Contract</div>
            <div className="text-lg font-bold text-white">{selected.contractNo}</div>
            <div className="text-sm text-slate-400 mt-0.5">{selected.supplierName}</div>
          </div>
          <div className="p-5 space-y-4">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONTRACT_CFG[selected.status].bg} ${CONTRACT_CFG[selected.status].text}`}>
              {CONTRACT_CFG[selected.status].label}
            </span>
            <p className="text-sm text-zinc-400">{selected.description}</p>
            <div className="space-y-2 text-sm">
              {[
                ["Value", fmtAED(selected.value)],
                ["Start", selected.startDate],
                ["End", selected.endDate],
                ["Discount", `${selected.discountPct}%`],
                ["Override", selected.overrideAED > 0 ? `AED ${selected.overrideAED}` : "None"],
                ["Renewal Notice", `${selected.renewalNotice} days`],
                ["Signed At", selected.signedAt ?? "—"],
                ["Signed By", selected.signedBy ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-zinc-500">{k}</span>
                  <span className="text-zinc-300">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-400">
              <div className="font-semibold text-zinc-300 mb-1">Terms</div>
              {selected.terms}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold py-2 rounded-lg">Renew</button>
              <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1">
                <FileText size={12} /> PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Performance Scorecards ────────────────────────────────────────────────────
function ScorecardsTab() {
  const [selected, setSelected] = useState<PerformanceScore | null>(null);

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) =>
    trend === "up" ? <TrendingUp size={14} className="text-emerald-400" />
    : trend === "down" ? <TrendingDown size={14} className="text-red-400" />
    : <Minus size={14} className="text-zinc-400" />;

  const scoreColor = (n: number) =>
    n >= 90 ? "text-emerald-400" : n >= 75 ? "text-amber-400" : "text-red-400";

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0 space-y-3">
        {SCORECARDS.map(sc => (
          <div key={sc.id} onClick={() => setSelected(sc)}
            className={`bg-zinc-900 rounded-xl border cursor-pointer transition-all p-5 hover:border-zinc-700
              ${selected?.id === sc.id ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800"}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${TYPE_CONFIG[sc.supplierType].bg}`}>
                {TYPE_CONFIG[sc.supplierType].icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-zinc-100">{sc.supplierName}</span>
                  <TypeBadge type={sc.supplierType} />
                  <span className="text-xs text-zinc-500">{sc.period}</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "On-Time", value: sc.onTimeDelivery },
                    { label: "Response", value: sc.responseTime },
                    { label: "Satisfaction", value: sc.satisfactionScore },
                    { label: "Dispute Rate", value: sc.disputeRate, invert: true },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="text-xs text-zinc-500 mb-1">{m.label}</div>
                      <ScoreBar value={m.invert ? 100 - m.value * 10 : m.value} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className={`text-2xl font-bold ${scoreColor(sc.overallScore)}`}>{sc.overallScore}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-zinc-500">
                  <TrendIcon trend={sc.trend} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${TYPE_CONFIG[selected.supplierType].bg}`}>
              {TYPE_CONFIG[selected.supplierType].icon}
            </div>
            <div>
              <div className="font-semibold text-zinc-100">{selected.supplierName}</div>
              <div className="text-xs text-zinc-500">{selected.period}</div>
            </div>
          </div>
          <div className={`text-center py-4 rounded-xl bg-zinc-800`}>
            <div className={`text-4xl font-bold ${selected.overallScore >= 90 ? "text-emerald-400" : selected.overallScore >= 75 ? "text-amber-400" : "text-red-400"}`}>
              {selected.overallScore}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Overall Score</div>
          </div>
          <div className="space-y-3">
            {[
              { label: "On-Time Delivery", value: selected.onTimeDelivery },
              { label: "Response Time", value: selected.responseTime },
              { label: "Satisfaction Score", value: selected.satisfactionScore },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{m.label}</span>
                  <span className="text-zinc-300">{m.value}%</span>
                </div>
                <ScoreBar value={m.value} />
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400 text-xs">Dispute Rate</span>
              <span className={`text-xs font-bold ${selected.disputeRate > 3 ? "text-red-400" : "text-emerald-400"}`}>{selected.disputeRate}%</span>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500 text-xs">Transactions</span><span className="text-zinc-300">{selected.totalTransactions.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500 text-xs">Volume</span><span className="text-zinc-300">{fmtAED(selected.totalVolumeAED)}</span></div>
          </div>
          {selected.issues.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                <AlertTriangle size={11} /> Issues Flagged
              </div>
              <ul className="space-y-1">
                {selected.issues.map(issue => (
                  <li key={issue} className="text-xs text-red-300">• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Invoices ──────────────────────────────────────────────────────────────────
function InvoicesTab() {
  const [selected, setSelected] = useState<SupplierInvoice | null>(null);

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Invoice Ref","Supplier","Type","Description","Amount (AED)","Issued","Due","Paid","Status",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SUPPLIER_INVOICES.map((inv, i) => (
                <tr key={inv.id} onClick={() => setSelected(inv)}
                  className={`border-b border-zinc-800/60 cursor-pointer transition-colors hover:bg-zinc-800/40
                    ${selected?.id === inv.id ? "bg-amber-500/5 border-l-2 border-l-amber-500" : i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{inv.ref}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{inv.supplierName}</td>
                  <td className="px-4 py-3"><TypeBadge type={inv.supplierType} /></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-xs truncate">{inv.description}</td>
                  <td className="px-4 py-3 text-zinc-100 font-bold">{fmtAED(inv.amountAED)}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.issuedAt}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.dueDate}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.paidAt ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${INV_CFG[inv.status].bg} ${INV_CFG[inv.status].text}`}>
                      {INV_CFG[inv.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === "received" && (
                      <button className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">Approve</button>
                    )}
                    {inv.status === "approved" && (
                      <button className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/30 transition-colors">Pay</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Supplier Invoice</div>
            <div className="text-base font-bold text-white">{selected.ref}</div>
            <div className="text-sm text-slate-400 mt-0.5">{selected.supplierName}</div>
          </div>
          <div className="p-5 space-y-4">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${INV_CFG[selected.status].bg} ${INV_CFG[selected.status].text}`}>
              {INV_CFG[selected.status].label}
            </span>
            <p className="text-xs text-zinc-400">{selected.description}</p>
            <div className="space-y-2 text-sm">
              {[
                ["Type", TYPE_CONFIG[selected.supplierType].label],
                ["Amount", selected.currency !== "AED" ? `${selected.currency} ${selected.amount.toLocaleString()}` : "—"],
                ["Amount (AED)", fmtAED(selected.amountAED)],
                ["Issued", selected.issuedAt],
                ["Due", selected.dueDate],
                ["Paid", selected.paidAt ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-zinc-500">{k}</span>
                  <span className="text-zinc-300">{v}</span>
                </div>
              ))}
            </div>
            {selected.status === "approved" && (
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2 rounded-lg">
                Process Payment
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payments ──────────────────────────────────────────────────────────────────
function PaymentsTab() {
  const total = SUPPLIER_PAYMENTS.reduce((a, p) => a + p.amountAED, 0);

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Total Payments (shown)</div>
          <div className="text-2xl font-bold text-emerald-400">{fmtAED(total)}</div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Outstanding Invoices</div>
          <div className="text-2xl font-bold text-amber-400">
            {fmtAED(SUPPLIER_INVOICES.filter(i => i.status === "received" || i.status === "approved").reduce((a, i) => a + i.amountAED, 0))}
          </div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Paid Invoices</div>
          <div className="text-2xl font-bold text-zinc-100">
            {SUPPLIER_INVOICES.filter(i => i.status === "paid").length}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["ID","Supplier","Invoice Ref","Amount (AED)","Method","Bank/Ref","Date","Processed By","Notes"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUPPLIER_PAYMENTS.map((p, i) => (
              <tr key={p.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 font-mono text-xs text-amber-400">{p.id.toUpperCase()}</td>
                <td className="px-4 py-3 text-zinc-200 font-medium">{p.supplierName}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.invoiceRef}</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">{fmtAED(p.amountAED)}</td>
                <td className="px-4 py-3 text-zinc-400 capitalize">{p.method.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.bankRef ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-400">{p.date}</td>
                <td className="px-4 py-3 text-zinc-400">{p.processedBy}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{p.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function SuppliersModule() {
  const [tab, setTab] = useState<SuppTab>("directory");

  return (
    <div className="flex flex-col h-full bg-[#0D1117]">
      <div className="flex-shrink-0 px-6 pt-6 pb-0 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 flex items-center justify-center">
            <Package size={16} className="text-cyan-400" />
          </div>
          <h1 className="text-lg font-bold text-zinc-100">Supplier Management</h1>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === t.key ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "directory"  && <DirectoryTab />}
        {tab === "contracts"  && <ContractsTab />}
        {tab === "scorecards" && <ScorecardsTab />}
        {tab === "invoices"   && <InvoicesTab />}
        {tab === "payments"   && <PaymentsTab />}
      </div>
    </div>
  );
}
