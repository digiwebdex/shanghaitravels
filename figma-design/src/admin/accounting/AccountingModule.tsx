import { useState } from "react";
import {
  DollarSign, BookOpen, CreditCard, BarChart2, FileText, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle2, Clock, XCircle, Plus,
  Search, ChevronRight, RefreshCw, Download, Filter, ChevronDown,
  Eye, Building2,
} from "lucide-react";
import {
  ACCOUNTS, JOURNAL_VOUCHERS, CASH_BANK_ENTRIES,
  AR_INVOICES, AP_INVOICES, EXPENSES, INCOME_RECORDS,
  VAT_RETURNS, BANK_STATEMENT_ITEMS,
  PNL_LINES, BS_LINES, TB_LINES, CF_LINES,
  FLine, Account, AccountType,
  fmtAED, fmt,
} from "./data";

type AccTab =
  | "accounts" | "journal" | "cash_bank" | "ledger"
  | "ar" | "ap" | "expenses" | "income"
  | "vat" | "reconciliation" | "pnl" | "balance_sheet"
  | "trial_balance" | "cash_flow";

const TABS: { key: AccTab; label: string }[] = [
  { key: "accounts",       label: "Chart of Accounts" },
  { key: "journal",        label: "Journal Vouchers" },
  { key: "cash_bank",      label: "Cash & Bank" },
  { key: "ledger",         label: "Ledger" },
  { key: "ar",             label: "Receivables (AR)" },
  { key: "ap",             label: "Payables (AP)" },
  { key: "expenses",       label: "Expenses" },
  { key: "income",         label: "Income" },
  { key: "vat",            label: "VAT / Tax" },
  { key: "reconciliation", label: "Bank Reconciliation" },
  { key: "pnl",            label: "Profit & Loss" },
  { key: "balance_sheet",  label: "Balance Sheet" },
  { key: "trial_balance",  label: "Trial Balance" },
  { key: "cash_flow",      label: "Cash Flow" },
];

const TYPE_COLOR: Record<AccountType, string> = {
  asset:     "text-blue-400",
  liability: "text-red-400",
  equity:    "text-purple-400",
  revenue:   "text-emerald-400",
  expense:   "text-amber-400",
};

// ── Shared: Financial Statement Table ─────────────────────────────────────────
function FinancialTable({
  lines, period, title, subtitle,
}: {
  lines: FLine[]; period: string; title: string; subtitle?: string;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-5">
        <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Statement Period: {period}</div>
        <div className="text-xl font-bold text-white">{title}</div>
        {subtitle && <div className="text-sm text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
      <div className="p-8">
        <table className="w-full text-sm">
          <tbody>
            {lines.map((line, i) => {
              if (line.separator) return <tr key={i}><td colSpan={2} className="py-2"><div className="border-t border-zinc-800" /></td></tr>;
              if (line.isSection && !line.isTotal) return (
                <tr key={i}>
                  <td colSpan={2} className={`pt-4 pb-1 text-xs font-bold uppercase tracking-widest ${line.indent ? "pl-" + (line.indent * 4) : ""} ${line.isBold ? "text-zinc-300" : "text-zinc-500"}`}>
                    {line.label}
                  </td>
                </tr>
              );
              const indentClass = line.indent === 1 ? "pl-6" : line.indent === 2 ? "pl-12" : "";
              const isMarginLine = line.label.includes("Margin");
              if (isMarginLine) return (
                <tr key={i} className="italic">
                  <td className={`py-0.5 text-zinc-500 text-xs ${indentClass}`}>{line.label}</td>
                  <td className="py-0.5 text-right text-zinc-500 text-xs">{line.amount}%</td>
                </tr>
              );
              return (
                <tr key={i} className={`${line.isTotal ? "border-t border-zinc-700 mt-1" : ""}`}>
                  <td className={`py-1 ${indentClass} ${line.isTotal ? "font-semibold text-zinc-200 pt-2" : "text-zinc-400"}`}>
                    {line.label || <span className="text-zinc-700">—</span>}
                  </td>
                  <td className={`py-1 text-right font-mono text-sm ${
                    line.isTotal && line.isBold
                      ? line.negative ? "font-bold text-red-300" : "font-bold text-zinc-100"
                      : line.negative ? "text-zinc-300" : "text-zinc-300"
                  }`}>
                    {line.amount !== undefined && line.label && !isMarginLine ? (
                      line.negative
                        ? <span>({fmt(line.amount)})</span>
                        : fmt(line.amount)
                    ) : null}
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

// ── Chart of Accounts ─────────────────────────────────────────────────────────
function AccountsTab() {
  const [typeFilter, setTypeFilter] = useState<AccountType | "all">("all");
  const [query, setQuery] = useState("");
  const filtered = ACCOUNTS.filter(a =>
    (typeFilter === "all" || a.type === typeFilter) &&
    !a.isHeader &&
    (a.name.toLowerCase().includes(query.toLowerCase()) || a.code.includes(query))
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search accounts..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
          {(["all","asset","liability","equity","revenue","expense"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${typeFilter === t ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
        <button className="ml-auto bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Plus size={14} /> Add Account
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Code", "Account Name", "Type", "Category", "Balance (AED)", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={a.code} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 font-mono text-xs text-zinc-400">{a.code}</td>
                <td className="px-4 py-3 text-zinc-200 font-medium">{a.name}</td>
                <td className={`px-4 py-3 capitalize text-xs font-semibold ${TYPE_COLOR[a.type]}`}>{a.type}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs capitalize">{a.category.replace(/_/g, " ")}</td>
                <td className={`px-4 py-3 font-mono font-medium ${a.balance < 0 ? "text-red-400" : "text-zinc-100"}`}>
                  {a.balance < 0 ? `(${fmt(a.balance)})` : fmt(a.balance)}
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"><Eye size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-700 bg-zinc-800/40">
              <td colSpan={4} className="px-4 py-3 text-xs font-bold text-zinc-400">TOTAL (filtered)</td>
              <td className="px-4 py-3 font-mono font-bold text-zinc-100">
                {fmt(filtered.reduce((a, acc) => a + acc.balance, 0))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Journal Vouchers ──────────────────────────────────────────────────────────
function JournalTab() {
  const [selected, setSelected] = useState(JOURNAL_VOUCHERS[0]);
  const [showNew, setShowNew] = useState(false);

  const STATUS_CFG = {
    posted:   { label: "Posted",   bg: "bg-emerald-500/20", text: "text-emerald-400" },
    draft:    { label: "Draft",    bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
    reversed: { label: "Reversed", bg: "bg-red-500/20",     text: "text-red-400"     },
  };

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setShowNew(!showNew)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus size={14} /> New Journal Voucher
          </button>
        </div>

        {showNew && (
          <div className="bg-zinc-900 rounded-xl border border-amber-500/30 p-5 mb-4">
            <div className="text-sm font-semibold text-zinc-300 mb-3">New Journal Voucher</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Date", type: "date" },
                { label: "JV Type", type: "select", opts: ["General","Payment","Receipt","Adjustment"] },
                { label: "Narration", type: "text" },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-zinc-500 mb-1">{f.label}</label>
                  {f.type === "select"
                    ? <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
                        {f.opts?.map(o => <option key={o}>{o}</option>)}
                      </select>
                    : <input type={f.type} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
                  }
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-zinc-700 overflow-hidden mb-3">
              <table className="w-full text-xs">
                <thead><tr className="bg-zinc-800 border-b border-zinc-700">
                  <th className="px-3 py-2 text-left text-zinc-500">Account</th>
                  <th className="px-3 py-2 text-right text-zinc-500">Debit</th>
                  <th className="px-3 py-2 text-right text-zinc-500">Credit</th>
                  <th className="px-3 py-2 text-left text-zinc-500">Narration</th>
                </tr></thead>
                <tbody>
                  {[0, 1].map(r => (
                    <tr key={r} className="border-b border-zinc-800">
                      <td className="px-3 py-1.5">
                        <select className="w-full bg-transparent text-zinc-300 text-xs focus:outline-none">
                          {ACCOUNTS.filter(a => !a.isHeader).map(a => (
                            <option key={a.code}>{a.code} — {a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5"><input type="number" placeholder="0.00" className="w-full bg-transparent text-zinc-300 text-right text-xs focus:outline-none" /></td>
                      <td className="px-3 py-1.5"><input type="number" placeholder="0.00" className="w-full bg-transparent text-zinc-300 text-right text-xs focus:outline-none" /></td>
                      <td className="px-3 py-1.5"><input type="text" className="w-full bg-transparent text-zinc-300 text-xs focus:outline-none" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">Cancel</button>
              <button className="px-4 py-2 text-sm bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400">Save & Post</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {JOURNAL_VOUCHERS.map(jv => (
            <div key={jv.id} onClick={() => setSelected(jv)}
              className={`bg-zinc-900 rounded-xl border cursor-pointer transition-all p-4 hover:border-zinc-700
                ${selected?.id === jv.id ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-amber-400">{jv.ref}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CFG[jv.status].bg} ${STATUS_CFG[jv.status].text}`}>{STATUS_CFG[jv.status].label}</span>
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full capitalize">{jv.type}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">{jv.date} · {jv.narration}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-zinc-100">{fmtAED(jv.totalDebit)}</div>
                  <div className="text-xs text-zinc-500">{jv.preparedBy}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="w-96 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Journal Voucher</div>
            <div className="text-lg font-bold text-white">{selected.ref}</div>
            <div className="text-sm text-slate-400 mt-0.5">{selected.date}</div>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-zinc-400 bg-zinc-800 rounded-lg p-3">{selected.narration}</p>
            <div className="rounded-lg border border-zinc-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-zinc-800 border-b border-zinc-700">
                  <th className="px-3 py-2 text-left text-zinc-500">Account</th>
                  <th className="px-3 py-2 text-right text-zinc-500">Debit</th>
                  <th className="px-3 py-2 text-right text-zinc-500">Credit</th>
                </tr></thead>
                <tbody>
                  {selected.lines.map((l, i) => (
                    <tr key={i} className="border-b border-zinc-800/60">
                      <td className="px-3 py-2 text-zinc-300">{l.accountName}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-200">{l.debit > 0 ? fmt(l.debit) : "—"}</td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-200">{l.credit > 0 ? fmt(l.credit) : "—"}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-800 font-semibold">
                    <td className="px-3 py-2 text-zinc-400">TOTAL</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-100">{fmt(selected.totalDebit)}</td>
                    <td className="px-3 py-2 text-right font-mono text-zinc-100">{fmt(selected.totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-xs text-zinc-500 flex justify-between">
              <span>Prepared by: {selected.preparedBy}</span>
            </div>
            {selected.status === "posted" && (
              <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-2 rounded-lg">
                Reverse Entry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cash & Bank ───────────────────────────────────────────────────────────────
function CashBankTab() {
  const balance = CASH_BANK_ENTRIES[CASH_BANK_ENTRIES.length - 1].balance;
  const totalReceipts = CASH_BANK_ENTRIES.filter(e => e.type === "receipt").reduce((a, e) => a + e.debit, 0);
  const totalPayments = CASH_BANK_ENTRIES.filter(e => e.type === "payment").reduce((a, e) => a + e.credit, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Current Balance</div>
          <div className="text-2xl font-bold text-emerald-400">{fmtAED(balance)}</div>
          <div className="text-xs text-zinc-500 mt-1">Bank — Emirates NBD</div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Total Receipts (period)</div>
          <div className="text-2xl font-bold text-blue-400">{fmtAED(totalReceipts)}</div>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="text-xs text-zinc-500 mb-1">Total Payments (period)</div>
          <div className="text-2xl font-bold text-red-400">{fmtAED(totalPayments)}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Date","Ref","Description","Party","Type","Receipts","Payments","Balance"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CASH_BANK_ENTRIES.map((e, i) => (
              <tr key={e.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 text-zinc-400 text-xs">{e.date}</td>
                <td className="px-4 py-3 font-mono text-xs text-amber-400">{e.ref}</td>
                <td className="px-4 py-3 text-zinc-200">{e.description}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{e.party ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize
                    ${e.type === "receipt" ? "bg-emerald-500/20 text-emerald-400"
                    : e.type === "payment" ? "bg-red-500/20 text-red-400"
                    : "bg-blue-500/20 text-blue-400"}`}>
                    {e.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-emerald-400">{e.debit > 0 ? fmt(e.debit) : "—"}</td>
                <td className="px-4 py-3 font-mono text-red-400">{e.credit > 0 ? fmt(e.credit) : "—"}</td>
                <td className="px-4 py-3 font-mono font-bold text-zinc-100">{fmt(e.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Ledger ────────────────────────────────────────────────────────────────────
function LedgerTab() {
  const [selectedCode, setSelectedCode] = useState("1130");
  const account = ACCOUNTS.find(a => a.code === selectedCode);

  const txns = CASH_BANK_ENTRIES.filter(e => account?.name.includes("NBD"));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Select Account</label>
          <select value={selectedCode} onChange={e => setSelectedCode(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500 min-w-[300px]">
            {ACCOUNTS.filter(a => !a.isHeader).map(a => (
              <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 ml-2">
          <input type="date" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" defaultValue="2025-01-01" />
          <input type="date" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" defaultValue="2025-01-31" />
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm mt-4">Run</button>
      </div>

      {account && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest">{account.code}</div>
              <div className="text-lg font-bold text-white">{account.name}</div>
              <div className={`text-xs mt-0.5 capitalize ${TYPE_COLOR[account.type]}`}>{account.type} · {account.category.replace(/_/g, " ")}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Closing Balance</div>
              <div className="text-2xl font-bold text-amber-400">{fmtAED(account.balance)}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-zinc-800">
                {["Date","Ref","Description","Debit","Credit","Balance"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {txns.length > 0 ? txns.map((e, i) => (
                  <tr key={e.id} className={`border-b border-zinc-800/60 ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                    <td className="px-5 py-2.5 text-zinc-400 text-xs">{e.date}</td>
                    <td className="px-5 py-2.5 font-mono text-xs text-amber-400">{e.ref}</td>
                    <td className="px-5 py-2.5 text-zinc-200">{e.description}</td>
                    <td className="px-5 py-2.5 font-mono text-emerald-400">{e.debit > 0 ? fmt(e.debit) : "—"}</td>
                    <td className="px-5 py-2.5 font-mono text-red-400">{e.credit > 0 ? fmt(e.credit) : "—"}</td>
                    <td className="px-5 py-2.5 font-mono font-bold text-zinc-100">{fmt(e.balance)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                    No transactions for this account in the selected period.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AR Dashboard ──────────────────────────────────────────────────────────────
function ARTab() {
  const outstanding = AR_INVOICES.filter(i => i.status !== "paid").reduce((a, i) => a + i.outstanding, 0);
  const overdue = AR_INVOICES.filter(i => i.status.startsWith("overdue")).reduce((a, i) => a + i.outstanding, 0);
  const current = AR_INVOICES.filter(i => i.status === "current").reduce((a, i) => a + i.outstanding, 0);

  const STATUS_CFG = {
    current:    { label: "Current",    bg: "bg-emerald-500/20", text: "text-emerald-400" },
    overdue_30: { label: "1–30 Days",  bg: "bg-amber-500/20",   text: "text-amber-400"   },
    overdue_60: { label: "31–60 Days", bg: "bg-orange-500/20",  text: "text-orange-400"  },
    overdue_90: { label: "60+ Days",   bg: "bg-red-500/20",     text: "text-red-400"     },
    paid:       { label: "Paid",       bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
    disputed:   { label: "Disputed",   bg: "bg-purple-500/20",  text: "text-purple-400"  },
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Outstanding",  value: fmtAED(outstanding), color: "text-amber-400" },
          { label: "Current (not due)",  value: fmtAED(current),     color: "text-emerald-400" },
          { label: "Overdue",            value: fmtAED(overdue),     color: "text-red-400" },
          { label: "Invoices",           value: AR_INVOICES.length.toString(), color: "text-zinc-100" },
        ].map(k => (
          <div key={k.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <div className="text-xs text-zinc-500 mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Invoice Ref","Customer","Service","Issued","Due Date","Total","Paid","Outstanding","Status",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AR_INVOICES.map((inv, i) => {
              const cfg = STATUS_CFG[inv.status];
              return (
                <tr key={inv.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{inv.ref}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{inv.customer}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{inv.service}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.issuedAt}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.dueDate}</td>
                  <td className="px-4 py-3 font-mono text-zinc-200">{fmt(inv.amount)}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400">{inv.paid > 0 ? fmt(inv.paid) : "—"}</td>
                  <td className={`px-4 py-3 font-mono font-bold ${inv.outstanding > 0 ? "text-red-300" : "text-zinc-500"}`}>{inv.outstanding > 0 ? fmt(inv.outstanding) : "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3">
                    {inv.outstanding > 0 && (
                      <button className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">Remind</button>
                    )}
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

// ── AP Dashboard ──────────────────────────────────────────────────────────────
function APTab() {
  const outstanding = AP_INVOICES.filter(i => i.status !== "paid").reduce((a, i) => a + i.outstanding, 0);

  const STATUS_CFG = {
    pending:  { label: "Pending",  bg: "bg-blue-500/20",    text: "text-blue-400"    },
    approved: { label: "Approved", bg: "bg-amber-500/20",   text: "text-amber-400"   },
    overdue:  { label: "Overdue",  bg: "bg-red-500/20",     text: "text-red-400"     },
    paid:     { label: "Paid",     bg: "bg-emerald-500/20", text: "text-emerald-400" },
    disputed: { label: "Disputed", bg: "bg-purple-500/20",  text: "text-purple-400"  },
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Payable", value: fmtAED(outstanding), color: "text-red-400" },
          { label: "Invoices Pending Approval", value: AP_INVOICES.filter(i => i.status === "pending").length.toString(), color: "text-amber-400" },
          { label: "Approved — Awaiting Payment", value: AP_INVOICES.filter(i => i.status === "approved").length.toString(), color: "text-blue-400" },
        ].map(k => (
          <div key={k.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <div className="text-xs text-zinc-500 mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Invoice Ref","Vendor","Type","Issued","Due Date","Total","Paid","Outstanding","Status",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AP_INVOICES.map((inv, i) => {
              const cfg = STATUS_CFG[inv.status];
              return (
                <tr key={inv.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{inv.ref}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{inv.vendor}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{inv.vendorType}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.issuedAt}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{inv.dueDate}</td>
                  <td className="px-4 py-3 font-mono text-zinc-200">{fmt(inv.amount)}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400">{inv.paid > 0 ? fmt(inv.paid) : "—"}</td>
                  <td className={`px-4 py-3 font-mono font-bold ${inv.outstanding > 0 ? "text-amber-300" : "text-zinc-500"}`}>{inv.outstanding > 0 ? fmt(inv.outstanding) : "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3">
                    {inv.status === "pending" && <button className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">Approve</button>}
                    {inv.status === "approved" && <button className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/30 transition-colors">Pay</button>}
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

// ── Expenses ──────────────────────────────────────────────────────────────────
function ExpensesTab() {
  const STATUS_CFG = {
    draft:     { label: "Draft",     bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
    submitted: { label: "Submitted", bg: "bg-blue-500/20",    text: "text-blue-400"    },
    approved:  { label: "Approved",  bg: "bg-amber-500/20",   text: "text-amber-400"   },
    paid:      { label: "Paid",      bg: "bg-emerald-500/20", text: "text-emerald-400" },
    rejected:  { label: "Rejected",  bg: "bg-red-500/20",     text: "text-red-400"     },
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-zinc-400">{EXPENSES.length} expense claims</div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Plus size={14} /> New Expense
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Ref","Employee","Department","Category","Description","Amount","Date","Receipt","Status",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EXPENSES.map((e, i) => {
              const cfg = STATUS_CFG[e.status];
              return (
                <tr key={e.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{e.ref}</td>
                  <td className="px-4 py-3 text-zinc-200">{e.employee}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{e.department}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{e.category}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-xs truncate">{e.description}</td>
                  <td className="px-4 py-3 font-mono font-bold text-zinc-100">{fmtAED(e.amount)}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{e.date}</td>
                  <td className="px-4 py-3">
                    {e.receipt
                      ? <CheckCircle2 size={14} className="text-emerald-400" />
                      : <XCircle size={14} className="text-red-400" />}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span></td>
                  <td className="px-4 py-3">
                    {e.status === "submitted" && <button className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">Approve</button>}
                    {e.status === "approved" && <button className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/30 transition-colors">Pay</button>}
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

// ── Income ────────────────────────────────────────────────────────────────────
function IncomeTab() {
  const total = INCOME_RECORDS.reduce((a, r) => a + r.amount, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4 mb-2">
        {[
          { label: "Sales Revenue",  value: fmtAED(INCOME_RECORDS.filter(r => r.category === "Sales Revenue").reduce((a, r) => a + r.amount, 0)), color: "text-emerald-400" },
          { label: "Commission",     value: fmtAED(INCOME_RECORDS.filter(r => r.category === "Commission").reduce((a, r) => a + r.amount, 0)),     color: "text-blue-400"   },
          { label: "Total Income",   value: fmtAED(total),                                                                                            color: "text-amber-400"  },
          { label: "Entries",        value: INCOME_RECORDS.length.toString(),                                                                         color: "text-zinc-200"   },
        ].map(k => (
          <div key={k.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <div className="text-xs text-zinc-500 mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Ref","Source","Category","Description","Account","Amount","Date","Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INCOME_RECORDS.map((r, i) => (
              <tr key={r.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 font-mono text-xs text-amber-400">{r.ref}</td>
                <td className="px-4 py-3 text-zinc-200 font-medium">{r.source}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{r.category}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs max-w-xs truncate">{r.description}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{r.accountCode} — {r.accountName}</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">{fmtAED(r.amount)}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{r.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.status === "posted" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-600/40 text-zinc-400"}`}>
                    {r.status}
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

// ── VAT / Tax ─────────────────────────────────────────────────────────────────
function VATTab() {
  const [selected, setSelected] = useState(VAT_RETURNS[0]);

  const STATUS_CFG = {
    draft:   { label: "Draft",  bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
    filed:   { label: "Filed",  bg: "bg-amber-500/20",   text: "text-amber-400"   },
    paid:    { label: "Paid",   bg: "bg-emerald-500/20", text: "text-emerald-400" },
    amended: { label: "Amended",bg: "bg-blue-500/20",    text: "text-blue-400"    },
  };

  return (
    <div className="p-6 space-y-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 mb-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-sm font-semibold text-zinc-300">VAT Configuration</div>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">UAE VAT 5%</span>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          {[
            { label: "VAT Rate",         value: "5%" },
            { label: "TRN Number",       value: "100-XXX-XXX-XXXX" },
            { label: "Filing Frequency", value: "Quarterly" },
            { label: "Next Due Date",    value: "28 Apr 2025" },
          ].map(f => (
            <div key={f.label}>
              <div className="text-xs text-zinc-500 mb-0.5">{f.label}</div>
              <div className="text-zinc-200 font-medium">{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {VAT_RETURNS.map(vr => (
            <div key={vr.id} onClick={() => setSelected(vr)}
              className={`bg-zinc-900 rounded-xl border cursor-pointer transition-all p-4 hover:border-zinc-700
                ${selected?.id === vr.id ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800"}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-zinc-100">{vr.period}</div>
                  <div className="text-xs text-zinc-500">{vr.periodStart} — {vr.periodEnd}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CFG[vr.status].bg} ${STATUS_CFG[vr.status].text}`}>
                  {STATUS_CFG[vr.status].label}
                </span>
              </div>
              <div className="flex gap-6 mt-3 text-sm">
                <div><div className="text-xs text-zinc-500">Output VAT</div><div className="text-emerald-400 font-bold">{fmtAED(vr.outputVAT)}</div></div>
                <div><div className="text-xs text-zinc-500">Input VAT</div><div className="text-blue-400 font-bold">{fmtAED(vr.inputVAT)}</div></div>
                <div><div className="text-xs text-zinc-500">Net Payable</div><div className="text-amber-400 font-bold">{fmtAED(vr.netVAT)}</div></div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">VAT Return</div>
              <div className="text-lg font-bold text-white">{selected.period}</div>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <tbody className="space-y-2">
                  {[
                    ["Standard-Rated Sales", fmtAED(selected.standardRatedSales), "text-zinc-300"],
                    ["Output VAT (5%)", fmtAED(selected.outputVAT), "text-emerald-400"],
                    ["", "", ""],
                    ["Standard-Rated Purchases", fmtAED(selected.standardRatedPurchases), "text-zinc-300"],
                    ["Input VAT (recoverable)", fmtAED(selected.inputVAT), "text-blue-400"],
                    ["", "", ""],
                    ["NET VAT PAYABLE", fmtAED(selected.netVAT), "text-amber-400 font-bold text-base"],
                    ["Due Date", selected.dueDate, "text-zinc-300"],
                    ["Filed On", selected.filedAt ?? "—", "text-zinc-300"],
                  ].map(([k, v, cls], i) => k ? (
                    <tr key={i} className="border-b border-zinc-800/40">
                      <td className="py-2 text-zinc-500">{k}</td>
                      <td className={`py-2 text-right font-mono ${cls}`}>{v}</td>
                    </tr>
                  ) : <tr key={i}><td colSpan={2} className="py-1"><div className="border-t border-zinc-800" /></td></tr>)}
                </tbody>
              </table>
              {selected.status === "draft" && (
                <button className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 rounded-lg text-sm">
                  File Return
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bank Reconciliation ───────────────────────────────────────────────────────
function ReconciliationTab() {
  const matched = BANK_STATEMENT_ITEMS.filter(i => i.matched).length;
  const unmatched = BANK_STATEMENT_ITEMS.filter(i => !i.matched);
  const bankBalance = BANK_STATEMENT_ITEMS.reduce((a, i) => a + i.bankAmount, 0);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4 mb-2">
        {[
          { label: "Bank Statement Balance", value: fmtAED(bankBalance), color: "text-blue-400" },
          { label: "Book Balance",           value: fmtAED(285000),      color: "text-zinc-100" },
          { label: "Matched Items",          value: `${matched} / ${BANK_STATEMENT_ITEMS.length}`, color: "text-emerald-400" },
          { label: "Unmatched Items",        value: unmatched.length.toString(), color: "text-amber-400" },
        ].map(k => (
          <div key={k.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <div className="text-xs text-zinc-500 mb-1">{k.label}</div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {unmatched.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-300">
            {unmatched.length} unmatched item(s): {unmatched.map(u => u.description).join("; ")}. Post adjusting entries to reconcile.
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Date","Description","Type","Bank Amount","Book Amount","Matched",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BANK_STATEMENT_ITEMS.map((item, i) => (
              <tr key={item.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors
                ${item.matched ? "" : "bg-amber-500/5"}
                ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                <td className="px-4 py-3 text-zinc-400 text-xs">{item.date}</td>
                <td className="px-4 py-3 text-zinc-200">{item.description}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize
                    ${item.type === "deposit" ? "bg-emerald-500/20 text-emerald-400"
                    : item.type === "withdrawal" ? "bg-red-500/20 text-red-400"
                    : item.type === "charge" ? "bg-amber-500/20 text-amber-400"
                    : "bg-blue-500/20 text-blue-400"}`}>
                    {item.type}
                  </span>
                </td>
                <td className={`px-4 py-3 font-mono font-medium ${item.bankAmount < 0 ? "text-red-300" : "text-emerald-300"}`}>
                  {item.bankAmount < 0 ? `(${fmt(item.bankAmount)})` : fmt(item.bankAmount)}
                </td>
                <td className={`px-4 py-3 font-mono ${item.bookAmount === 0 ? "text-zinc-600" : item.bookAmount < 0 ? "text-red-300" : "text-zinc-300"}`}>
                  {item.bookAmount === 0 ? "—" : item.bookAmount < 0 ? `(${fmt(item.bookAmount)})` : fmt(item.bookAmount)}
                </td>
                <td className="px-4 py-3">
                  {item.matched
                    ? <CheckCircle2 size={14} className="text-emerald-400" />
                    : <XCircle size={14} className="text-amber-400" />}
                </td>
                <td className="px-4 py-3">
                  {!item.matched && (
                    <button className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/30 transition-colors">Post Entry</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Statement wrapper tabs ─────────────────────────────────────────────────────
function PnLTab() {
  return (
    <div className="p-6">
      <div className="flex justify-end mb-4 gap-2">
        <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
          <option>January 2025</option><option>December 2024</option><option>Q4 2024</option>
        </select>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Download size={14} /> Export PDF
        </button>
      </div>
      <FinancialTable lines={PNL_LINES} period="January 2025" title="Profit & Loss Statement" subtitle="All amounts in AED" />
    </div>
  );
}

function BalanceSheetTab() {
  return (
    <div className="p-6">
      <div className="flex justify-end mb-4 gap-2">
        <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
          <option>31 January 2025</option><option>31 December 2024</option>
        </select>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Download size={14} /> Export PDF
        </button>
      </div>
      <FinancialTable lines={BS_LINES} period="As at 31 January 2025" title="Balance Sheet" subtitle="All amounts in AED" />
    </div>
  );
}

function TrialBalanceTab() {
  const totalDebit = TB_LINES.reduce((a, l) => a + l.debit, 0);
  const totalCredit = TB_LINES.reduce((a, l) => a + l.credit, 0);
  const balanced = totalDebit === totalCredit;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 text-sm font-medium ${balanced ? "text-emerald-400" : "text-red-400"}`}>
          {balanced ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          Trial Balance is {balanced ? "BALANCED" : "OUT OF BALANCE"}
        </div>
        <div className="flex gap-2">
          <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
            <option>31 January 2025</option><option>31 December 2024</option>
          </select>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-4 flex justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">As at 31 January 2025</div>
            <div className="text-lg font-bold text-white">Trial Balance</div>
          </div>
          <div className="flex gap-8 text-right">
            <div><div className="text-xs text-slate-400">Total Debits</div><div className="text-white font-bold">{fmtAED(totalDebit)}</div></div>
            <div><div className="text-xs text-slate-400">Total Credits</div><div className="text-white font-bold">{fmtAED(totalCredit)}</div></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Code","Account Name","Debit","Credit"].map(h => (
                  <th key={h} className={`px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider ${h === "Debit" || h === "Credit" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TB_LINES.map((l, i) => (
                <tr key={l.code} className={`border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-6 py-2 font-mono text-xs text-zinc-500">{l.code}</td>
                  <td className="px-6 py-2 text-zinc-300">{l.name}</td>
                  <td className="px-6 py-2 text-right font-mono text-zinc-100">{l.debit > 0 ? fmt(l.debit) : "—"}</td>
                  <td className="px-6 py-2 text-right font-mono text-zinc-100">{l.credit > 0 ? fmt(l.credit) : "—"}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-zinc-600 bg-zinc-800/50 font-bold">
                <td colSpan={2} className="px-6 py-3 text-zinc-300">TOTALS</td>
                <td className="px-6 py-3 text-right font-mono text-emerald-400">{fmt(totalDebit)}</td>
                <td className="px-6 py-3 text-right font-mono text-emerald-400">{fmt(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CashFlowTab() {
  return (
    <div className="p-6">
      <div className="flex justify-end mb-4 gap-2">
        <select className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
          <option>January 2025</option><option>Q4 2024</option>
        </select>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Download size={14} /> Export PDF
        </button>
      </div>
      <FinancialTable lines={CF_LINES} period="January 2025" title="Cash Flow Statement" subtitle="Indirect Method · All amounts in AED" />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AccountingModule() {
  const [tab, setTab] = useState<AccTab>("accounts");

  return (
    <div className="flex flex-col h-full bg-[#0D1117]">
      <div className="flex-shrink-0 px-6 pt-6 pb-0 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold text-zinc-100">Accounting & Finance</h1>
          <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full ml-1">Jan 2025</span>
        </div>
        <div className="flex gap-0.5 overflow-x-auto pb-0">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === t.key ? "border-amber-500 text-amber-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "accounts"       && <AccountsTab />}
        {tab === "journal"        && <JournalTab />}
        {tab === "cash_bank"      && <CashBankTab />}
        {tab === "ledger"         && <LedgerTab />}
        {tab === "ar"             && <ARTab />}
        {tab === "ap"             && <APTab />}
        {tab === "expenses"       && <ExpensesTab />}
        {tab === "income"         && <IncomeTab />}
        {tab === "vat"            && <VATTab />}
        {tab === "reconciliation" && <ReconciliationTab />}
        {tab === "pnl"            && <PnLTab />}
        {tab === "balance_sheet"  && <BalanceSheetTab />}
        {tab === "trial_balance"  && <TrialBalanceTab />}
        {tab === "cash_flow"      && <CashFlowTab />}
      </div>
    </div>
  );
}
