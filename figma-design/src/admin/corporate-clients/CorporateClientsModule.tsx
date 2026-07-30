import { useState } from "react";
import {
  Briefcase, Search, Plus, TrendingUp, TrendingDown, AlertTriangle,
  Users, DollarSign, CreditCard, FileText, CheckCircle2, Clock,
  XCircle, BarChart2, Building2, ChevronRight, Eye, RefreshCw,
} from "lucide-react";
import {
  COMPANIES, CORP_EMPLOYEES, PRICING_RULES, BILLING_RUNS, CORP_INVOICES, CORP_PAYMENTS,
  CorporateCompany, CorporateInvoice, BillingRun,
  fmtAED,
} from "./data";

type CorpTab =
  | "companies" | "employees" | "credit" | "pricing"
  | "billing" | "invoices" | "performance" | "payments";

const TABS: { key: CorpTab; label: string }[] = [
  { key: "companies",   label: "Company Profiles" },
  { key: "employees",   label: "Employee List" },
  { key: "credit",      label: "Credit Management" },
  { key: "pricing",     label: "Pricing Rules" },
  { key: "billing",     label: "Monthly Billing" },
  { key: "invoices",    label: "Invoices" },
  { key: "performance", label: "Performance" },
  { key: "payments",    label: "Payments" },
];

const STATUS_CFG = {
  active:    { label: "Active",    bg: "bg-emerald-500/20", text: "text-emerald-400" },
  suspended: { label: "Suspended", bg: "bg-amber-500/20",   text: "text-amber-400"   },
  inactive:  { label: "Inactive",  bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
};

const BILLING_CFG: Record<BillingRun["status"], { label: string; bg: string; text: string }> = {
  draft:     { label: "Draft",     bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
  generated: { label: "Generated", bg: "bg-blue-500/20",    text: "text-blue-400"    },
  sent:      { label: "Sent",      bg: "bg-amber-500/20",   text: "text-amber-400"   },
  paid:      { label: "Paid",      bg: "bg-emerald-500/20", text: "text-emerald-400" },
  overdue:   { label: "Overdue",   bg: "bg-red-500/20",     text: "text-red-400"     },
};

const INV_CFG: Record<CorporateInvoice["status"], { label: string; bg: string; text: string }> = {
  draft:    { label: "Draft",    bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
  sent:     { label: "Sent",     bg: "bg-amber-500/20",   text: "text-amber-400"   },
  paid:     { label: "Paid",     bg: "bg-emerald-500/20", text: "text-emerald-400" },
  overdue:  { label: "Overdue",  bg: "bg-red-500/20",     text: "text-red-400"     },
  disputed: { label: "Disputed", bg: "bg-purple-500/20",  text: "text-purple-400"  },
};

function StatusBadge({ status }: { status: CorporateCompany["status"] }) {
  const cfg = STATUS_CFG[status];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function BillingBadge({ status }: { status: BillingRun["status"] }) {
  const cfg = BILLING_CFG[status];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function InvBadge({ status }: { status: CorporateInvoice["status"] }) {
  const cfg = INV_CFG[status];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function CreditBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct > 80 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-500">Used: {fmtAED(used)}</span>
        <span className="text-zinc-500">Limit: {fmtAED(limit)}</span>
      </div>
      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-xs text-zinc-500 mt-0.5">{pct.toFixed(0)}% utilized</div>
    </div>
  );
}

// ── Company Profiles ──────────────────────────────────────────────────────────
function CompaniesTab() {
  const [selected, setSelected] = useState<CorporateCompany | null>(null);
  const [query, setQuery] = useState("");
  const filtered = COMPANIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.industry.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search companies..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
          </div>
          <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus size={14} /> Add Company
          </button>
        </div>
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
              className={`bg-zinc-900 rounded-xl border cursor-pointer transition-all p-4 hover:border-zinc-700
                ${selected?.id === c.id ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800"}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-zinc-100">{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{c.industry}</span>
                    <span>{c.emirate}, {c.country}</span>
                    <span>AM: {c.accountManager}</span>
                  </div>
                </div>
                <div className="flex gap-6 text-center flex-shrink-0">
                  <div>
                    <div className="text-sm font-bold text-zinc-200">{fmtAED(c.ytdSpend)}</div>
                    <div className="text-xs text-zinc-500">YTD Spend</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-200">{c.paymentTermDays}d</div>
                    <div className="text-xs text-zinc-500">Terms</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-200">{c.contractExpiry}</div>
                    <div className="text-xs text-zinc-500">Contract</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center text-white font-bold">
              {selected.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-zinc-100">{selected.name}</div>
              <div className="text-xs text-zinc-500">{selected.tradeLicense}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Industry", selected.industry],
              ["Contact", selected.contactName],
              ["Email", selected.contactEmail],
              ["Phone", selected.contactPhone],
              ["Address", selected.address],
              ["Account Manager", selected.accountManager],
              ["Contract Expiry", selected.contractExpiry],
              ["Payment Terms", `${selected.paymentTermDays} days`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-zinc-500 flex-shrink-0">{k}</span>
                <span className="text-zinc-300 text-right text-xs">{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-2">Services</div>
            <div className="flex flex-wrap gap-1">
              {selected.services.map(s => (
                <span key={s} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
          <CreditBar used={selected.creditUsedAED} limit={selected.creditLimitAED} />
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-zinc-200">{fmtAED(selected.ytdSpend)}</div>
              <div className="text-xs text-zinc-500">YTD Spend</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <div className="text-sm font-bold text-zinc-200">{fmtAED(selected.totalSpend)}</div>
              <div className="text-xs text-zinc-500">Total Spend</div>
            </div>
          </div>
          <button className="w-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold py-2 rounded-lg">
            View Full Profile
          </button>
        </div>
      )}
    </div>
  );
}

// ── Employee List ──────────────────────────────────────────────────────────────
function EmployeesTab() {
  const [companyFilter, setCompanyFilter] = useState("all");
  const filtered = companyFilter === "all" ? CORP_EMPLOYEES : CORP_EMPLOYEES.filter(e => e.companyId === companyFilter);

  const gradeColor = (g: string) => g === "first" ? "text-amber-400" : g === "business" ? "text-blue-400" : "text-zinc-400";

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
          <option value="all">All Companies</option>
          {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="ml-auto text-xs text-zinc-500">{filtered.length} employees</div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Plus size={14} /> Add Employee
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Name","Company","Designation","Nationality","Travel Grade","Hotel Grade","Approval","Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const company = COMPANIES.find(c => c.id === e.companyId);
              return (
                <tr key={e.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-200">{e.name}</div>
                    <div className="text-xs text-zinc-500">{e.email}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{company?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{e.designation}</td>
                  <td className="px-4 py-3 text-zinc-400">{e.nationality}</td>
                  <td className={`px-4 py-3 font-medium capitalize ${gradeColor(e.travelGrade)}`}>{e.travelGrade}</td>
                  <td className="px-4 py-3 text-zinc-400 capitalize">{e.hotelGrade.replace("star", "★")}</td>
                  <td className="px-4 py-3">
                    {e.approvalRequired
                      ? <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Required</span>
                      : <span className="text-xs bg-zinc-700/60 text-zinc-500 px-2 py-0.5 rounded-full">None</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-600/40 text-zinc-400"}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Credit Management ──────────────────────────────────────────────────────────
function CreditTab() {
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4 mb-2">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Total Credit Extended</div>
          <div className="text-2xl font-bold text-zinc-100">{fmtAED(COMPANIES.reduce((a, c) => a + c.creditLimitAED, 0))}</div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Total Credit Used</div>
          <div className="text-2xl font-bold text-amber-400">{fmtAED(COMPANIES.reduce((a, c) => a + c.creditUsedAED, 0))}</div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Available Credit</div>
          <div className="text-2xl font-bold text-emerald-400">{fmtAED(COMPANIES.reduce((a, c) => a + (c.creditLimitAED - c.creditUsedAED), 0))}</div>
        </div>
      </div>

      <div className="space-y-3">
        {COMPANIES.filter(c => c.creditLimitAED > 0).map(c => {
          const pct = Math.round((c.creditUsedAED / c.creditLimitAED) * 100);
          const isHighRisk = pct > 80;
          return (
            <div key={c.id} className={`bg-zinc-900 rounded-xl border p-5 ${isHighRisk ? "border-red-500/30" : "border-zinc-800"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100">{c.name}</span>
                    <StatusBadge status={c.status} />
                    {isHighRisk && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle size={10} /> High Utilization
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{c.industry} · {c.paymentTermDays}d payment terms · AM: {c.accountManager}</div>
                </div>
                <button className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">
                  Adjust Limit
                </button>
              </div>
              <CreditBar used={c.creditUsedAED} limit={c.creditLimitAED} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pricing Rules ──────────────────────────────────────────────────────────────
function PricingTab() {
  const SERVICE_COLORS: Record<string, string> = {
    flights: "bg-blue-500/20 text-blue-400",
    hotels: "bg-purple-500/20 text-purple-400",
    visa: "bg-amber-500/20 text-amber-400",
    transport: "bg-cyan-500/20 text-cyan-400",
    insurance: "bg-emerald-500/20 text-emerald-400",
    tours: "bg-rose-500/20 text-rose-400",
  };
  const RULE_LABEL: Record<string, string> = {
    percentage_discount: "% Discount",
    fixed_discount: "Fixed Discount",
    markup: "Markup",
    net_rate: "Net Rate",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-zinc-400">{PRICING_RULES.length} active pricing rules</div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Plus size={14} /> Add Rule
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Company","Service","Rule Type","Value","Applies To","Valid From","Valid To","Active"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICING_RULES.map((r, i) => (
              <tr key={r.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 text-zinc-200 font-medium">{r.companyName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${SERVICE_COLORS[r.service] ?? "bg-zinc-700 text-zinc-400"}`}>{r.service}</span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{RULE_LABEL[r.ruleType]}</td>
                <td className="px-4 py-3 text-amber-400 font-bold">
                  {r.ruleType === "fixed_discount" ? `AED ${r.value}` : r.ruleType === "net_rate" ? "Net" : `${r.value}%`}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs max-w-xs truncate">{r.appliesTo}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{r.validFrom}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{r.validTo}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-600/40 text-zinc-400"}`}>
                    {r.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Monthly Billing ────────────────────────────────────────────────────────────
function BillingTab() {
  const [selected, setSelected] = useState<BillingRun | null>(null);

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-zinc-400">Monthly billing runs</div>
          <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <RefreshCw size={14} /> Generate New Run
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Run ID","Company","Period","Items","Gross","Discount","Net","Status","Due",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BILLING_RUNS.map((b, i) => (
                <tr key={b.id} onClick={() => setSelected(b)}
                  className={`border-b border-zinc-800/60 cursor-pointer transition-colors hover:bg-zinc-800/40
                    ${selected?.id === b.id ? "bg-amber-500/5 border-l-2 border-l-amber-500" : i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{b.id.toUpperCase()}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{b.companyName}</td>
                  <td className="px-4 py-3 text-zinc-400">{b.period}</td>
                  <td className="px-4 py-3 text-zinc-400">{b.itemCount}</td>
                  <td className="px-4 py-3 text-zinc-200">{b.totalAED > 0 ? fmtAED(b.totalAED) : "—"}</td>
                  <td className="px-4 py-3 text-red-400">{b.discountAED > 0 ? `-${fmtAED(b.discountAED)}` : "—"}</td>
                  <td className="px-4 py-3 text-zinc-100 font-bold">{b.netAED > 0 ? fmtAED(b.netAED) : "—"}</td>
                  <td className="px-4 py-3"><BillingBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{b.dueDate}</td>
                  <td className="px-4 py-3">
                    {b.status === "draft" && (
                      <button className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">Generate</button>
                    )}
                    {b.status === "generated" && (
                      <button className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/30 transition-colors">Send</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && selected.netAED > 0 && (
        <div className="w-72 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div>
            <div className="font-mono text-xs text-amber-400">{selected.id.toUpperCase()}</div>
            <div className="font-bold text-zinc-100 mt-0.5">{selected.companyName}</div>
            <div className="text-xs text-zinc-500">{selected.period}</div>
          </div>
          <BillingBadge status={selected.status} />
          <div className="space-y-2 text-sm">
            {[
              ["Period", `${selected.periodStart} – ${selected.periodEnd}`],
              ["Items", selected.itemCount.toString()],
              ["Generated", selected.generatedAt ?? "—"],
              ["Sent", selected.sentAt ?? "—"],
              ["Paid", selected.paidAt ?? "—"],
              ["Due Date", selected.dueDate],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-zinc-500">{k}</span>
                <span className="text-zinc-300">{v}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-zinc-800 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Gross</span><span className="text-zinc-300">{fmtAED(selected.totalAED)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Discount</span><span className="text-red-400">−{fmtAED(selected.discountAED)}</span></div>
            <div className="flex justify-between font-bold"><span className="text-zinc-400">Net</span><span className="text-amber-400 text-base">{fmtAED(selected.netAED)}</span></div>
          </div>
          {selected.status === "sent" && (
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2 rounded-lg">Mark as Paid</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Invoices ──────────────────────────────────────────────────────────────────
function InvoicesTab() {
  const [selected, setSelected] = useState<CorporateInvoice | null>(null);

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Invoice Ref","Company","Period","Subtotal","Discount","Total","Status","Due","Paid"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CORP_INVOICES.map((inv, i) => (
                <tr key={inv.id} onClick={() => setSelected(inv)}
                  className={`border-b border-zinc-800/60 cursor-pointer transition-colors hover:bg-zinc-800/40
                    ${selected?.id === inv.id ? "bg-amber-500/5 border-l-2 border-l-amber-500" : i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{inv.ref}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{inv.companyName}</td>
                  <td className="px-4 py-3 text-zinc-400">{inv.period}</td>
                  <td className="px-4 py-3 text-zinc-300">{fmtAED(inv.subtotal)}</td>
                  <td className="px-4 py-3 text-red-400">{inv.discount > 0 ? `-${fmtAED(inv.discount)}` : "—"}</td>
                  <td className="px-4 py-3 text-zinc-100 font-bold">{fmtAED(inv.total)}</td>
                  <td className="px-4 py-3"><InvBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.dueDate}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.paidAt ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Corporate Invoice</div>
            <div className="text-lg font-bold text-white">{selected.ref}</div>
            <div className="text-sm text-slate-400 mt-0.5">{selected.companyName}</div>
          </div>
          <div className="p-5 space-y-4">
            <InvBadge status={selected.status} />
            <div className="space-y-1.5 text-sm">
              {[
                ["Period", selected.period],
                ["Issued", selected.issuedAt],
                ["Due", selected.dueDate],
                ["Paid", selected.paidAt ?? "—"],
                ["Method", selected.method ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-zinc-500">{k}</span>
                  <span className="text-zinc-300">{v}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-800 pt-3 space-y-1.5 text-sm">
              {selected.services.map(s => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-zinc-500">{s.label}</span>
                  <span className="text-zinc-300">{fmtAED(s.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-zinc-800">
                <span className="text-zinc-400">Discount</span>
                <span className="text-red-400">−{fmtAED(selected.discount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-zinc-300">Total</span>
                <span className="text-amber-400 text-base">{fmtAED(selected.total)}</span>
              </div>
            </div>
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2">
              <FileText size={14} /> Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Performance Dashboard ──────────────────────────────────────────────────────
function PerformanceTab() {
  const topCompanies = [...COMPANIES].sort((a, b) => b.ytdSpend - a.ytdSpend).slice(0, 5);
  const totalYTD = COMPANIES.reduce((a, c) => a + c.ytdSpend, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Accounts", value: COMPANIES.filter(c => c.status === "active").length.toString(), icon: Building2, color: "text-blue-400" },
          { label: "YTD Revenue", value: fmtAED(totalYTD), icon: DollarSign, color: "text-emerald-400" },
          { label: "Total Employees", value: CORP_EMPLOYEES.length.toString(), icon: Users, color: "text-amber-400" },
          { label: "Overdue Invoices", value: CORP_INVOICES.filter(i => i.status === "overdue").length.toString(), icon: AlertTriangle, color: "text-red-400" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500">{k.label}</span>
                <Icon size={16} className={k.color} />
              </div>
              <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-5">Top Clients by YTD Spend</h3>
        <div className="space-y-4">
          {topCompanies.map(c => {
            const pct = Math.round((c.ytdSpend / totalYTD) * 100);
            return (
              <div key={c.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-300">{c.name}</span>
                  <span className="text-amber-400 font-medium">{fmtAED(c.ytdSpend)} <span className="text-zinc-600">({pct}%)</span></span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Invoice Status Breakdown</h3>
          <div className="space-y-3">
            {(["paid","sent","overdue","disputed"] as const).map(s => {
              const count = CORP_INVOICES.filter(i => i.status === s).length;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-zinc-400 capitalize">{s}</div>
                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                    <div className={`h-full rounded-full ${INV_CFG[s].bg.replace("/20","/60")}`}
                      style={{ width: `${(count / CORP_INVOICES.length) * 100}%` }} />
                  </div>
                  <div className="w-4 text-xs text-zinc-500 text-right">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Services Mix</h3>
          <div className="space-y-2">
            {["Flights","Hotels","Visa","Transport","Insurance","Tours"].map(s => {
              const count = COMPANIES.filter(c => c.services.includes(s)).length;
              return (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <div className="w-20 text-zinc-400">{s}</div>
                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                    <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${(count / COMPANIES.length) * 100}%` }} />
                  </div>
                  <div className="text-xs text-zinc-500">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Payments ──────────────────────────────────────────────────────────────────
function PaymentsTab() {
  return (
    <div className="p-6">
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["ID","Company","Invoice Ref","Amount","Method","Date","Received By"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CORP_PAYMENTS.map((p, i) => (
              <tr key={p.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 font-mono text-xs text-amber-400">{p.id.toUpperCase()}</td>
                <td className="px-4 py-3 text-zinc-200 font-medium">{p.companyName}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs font-mono">{p.invoiceRef}</td>
                <td className="px-4 py-3 text-emerald-400 font-bold">{fmtAED(p.amount)}</td>
                <td className="px-4 py-3 text-zinc-400 capitalize">{p.method.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-zinc-400">{p.date}</td>
                <td className="px-4 py-3 text-zinc-400">{p.receivedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function CorporateClientsModule() {
  const [tab, setTab] = useState<CorpTab>("companies");

  return (
    <div className="flex flex-col h-full bg-[#0D1117]">
      <div className="flex-shrink-0 px-6 pt-6 pb-0 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center">
            <Briefcase size={16} className="text-amber-400" />
          </div>
          <h1 className="text-lg font-bold text-zinc-100">Corporate Clients</h1>
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
        {tab === "companies"   && <CompaniesTab />}
        {tab === "employees"   && <EmployeesTab />}
        {tab === "credit"      && <CreditTab />}
        {tab === "pricing"     && <PricingTab />}
        {tab === "billing"     && <BillingTab />}
        {tab === "invoices"    && <InvoicesTab />}
        {tab === "performance" && <PerformanceTab />}
        {tab === "payments"    && <PaymentsTab />}
      </div>
    </div>
  );
}
