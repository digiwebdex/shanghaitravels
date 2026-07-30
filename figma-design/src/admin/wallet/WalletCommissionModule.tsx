import { useState } from "react";
import {
  Wallet, Plus, Search, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownLeft, DollarSign, Users, CheckCircle2, Clock, XCircle,
  AlertTriangle, RefreshCw, ChevronRight, Eye, BarChart2,
} from "lucide-react";
import {
  AGENT_WALLETS, WALLET_TRANSACTIONS, COMMISSION_RULES,
  AGENT_COMMISSIONS, SUPPLIER_COMMISSIONS, PAYOUT_REQUESTS,
  AgentWallet, WalletTransaction, CommissionRule, PayoutRequest,
  WalletTxType, PayoutStatus,
  fmtAED,
} from "./data";

type WalTab = "wallets" | "transactions" | "rules" | "agent_commission" | "supplier_commission" | "payouts";

const TABS: { key: WalTab; label: string }[] = [
  { key: "wallets",            label: "Agent Wallets" },
  { key: "transactions",       label: "Transaction History" },
  { key: "rules",              label: "Commission Rules" },
  { key: "agent_commission",   label: "Agent Commission" },
  { key: "supplier_commission",label: "Supplier Commission" },
  { key: "payouts",            label: "Payout Management" },
];

const TX_CFG: Record<WalletTxType, { label: string; bg: string; text: string; sign: "+" | "-" }> = {
  top_up:           { label: "Top-up",     bg: "bg-emerald-500/20", text: "text-emerald-400", sign: "+" },
  commission_credit:{ label: "Commission", bg: "bg-blue-500/20",    text: "text-blue-400",    sign: "+" },
  payout:           { label: "Payout",     bg: "bg-purple-500/20",  text: "text-purple-400",  sign: "-" },
  adjustment:       { label: "Adjustment", bg: "bg-amber-500/20",   text: "text-amber-400",   sign: "-" },
  debit:            { label: "Debit",      bg: "bg-red-500/20",     text: "text-red-400",     sign: "-" },
  reversal:         { label: "Reversal",   bg: "bg-zinc-600/40",    text: "text-zinc-400",    sign: "+" },
};

const PAYOUT_CFG: Record<PayoutStatus, { label: string; bg: string; text: string }> = {
  pending:    { label: "Pending",    bg: "bg-blue-500/20",    text: "text-blue-400"    },
  approved:   { label: "Approved",   bg: "bg-amber-500/20",   text: "text-amber-400"   },
  processing: { label: "Processing", bg: "bg-purple-500/20",  text: "text-purple-400"  },
  completed:  { label: "Completed",  bg: "bg-emerald-500/20", text: "text-emerald-400" },
  failed:     { label: "Failed",     bg: "bg-red-500/20",     text: "text-red-400"     },
  cancelled:  { label: "Cancelled",  bg: "bg-zinc-600/40",    text: "text-zinc-400"    },
};

function TxBadge({ type }: { type: WalletTxType }) {
  const cfg = TX_CFG[type];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function PayoutBadge({ status }: { status: PayoutStatus }) {
  const cfg = PAYOUT_CFG[status];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function CreditBar({ balance, limit }: { balance: number; limit: number }) {
  if (limit === 0) return null;
  const pct = Math.min((balance / limit) * 100, 100);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-600">Credit utilization</span>
        <span className="text-zinc-500">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-zinc-700 rounded-full">
        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Agent Wallets ─────────────────────────────────────────────────────────────
function WalletsTab() {
  const [selected, setSelected] = useState<AgentWallet | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  const totalBalance = AGENT_WALLETS.reduce((a, w) => a + w.balance, 0);
  const activeWallets = AGENT_WALLETS.filter(w => w.status === "active").length;

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "Total Wallet Balance", value: fmtAED(totalBalance), color: "text-amber-400", icon: Wallet },
            { label: "Active Wallets",        value: activeWallets.toString(), color: "text-emerald-400", icon: Users },
            { label: "Total Commissions YTD", value: fmtAED(AGENT_WALLETS.reduce((a, w) => a + w.totalCommissions, 0)), color: "text-blue-400", icon: TrendingUp },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500">{k.label}</span>
                  <Icon size={14} className={k.color} />
                </div>
                <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {AGENT_WALLETS.map(w => (
            <div key={w.id} onClick={() => setSelected(w)}
              className={`bg-zinc-900 rounded-xl border cursor-pointer transition-all p-5 hover:border-zinc-700
                ${selected?.id === w.id ? "border-amber-500/50 bg-amber-500/5" : "border-zinc-800"}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {w.agentCode.split("-")[1]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-zinc-100">{w.agentName}</span>
                    <span className="font-mono text-xs text-zinc-500">{w.agentCode}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${w.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {w.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">AM: {w.accountManager} · Last activity: {w.lastActivity}</div>
                  {w.creditLimit > 0 && <CreditBar balance={w.balance} limit={w.creditLimit} />}
                </div>
                <div className="flex gap-8 text-center flex-shrink-0">
                  <div>
                    <div className="text-lg font-bold text-amber-400">{fmtAED(w.balance)}</div>
                    <div className="text-xs text-zinc-500">Balance</div>
                  </div>
                  {w.pendingBalance > 0 && (
                    <div>
                      <div className="text-sm font-bold text-zinc-400">{fmtAED(w.pendingBalance)}</div>
                      <div className="text-xs text-zinc-500">Pending</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-blue-400">{fmtAED(w.totalCommissions)}</div>
                    <div className="text-xs text-zinc-500">Total Comm.</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div>
            <div className="font-semibold text-zinc-100">{selected.agentName}</div>
            <div className="text-xs text-zinc-500 mt-0.5">{selected.agentCode}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-600/20 to-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-xs text-zinc-500 mb-1">Current Balance</div>
            <div className="text-3xl font-bold text-amber-400">{fmtAED(selected.balance)}</div>
            {selected.pendingBalance > 0 && (
              <div className="text-xs text-zinc-500 mt-1">+ {fmtAED(selected.pendingBalance)} pending</div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Credit Limit", fmtAED(selected.creditLimit)],
              ["Total Top-ups", fmtAED(selected.totalTopUps)],
              ["Total Payouts", fmtAED(selected.totalPayouts)],
              ["Total Commissions", fmtAED(selected.totalCommissions)],
              ["Account Manager", selected.accountManager],
              ["Last Activity", selected.lastActivity],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-zinc-500">{k}</span>
                <span className="text-zinc-300 text-right">{v}</span>
              </div>
            ))}
          </div>

          {!showTopUp ? (
            <div className="flex gap-2">
              <button onClick={() => setShowTopUp(true)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold py-2 rounded-lg">
                Top-up
              </button>
              <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 rounded-lg">
                Adjust
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Top-up Amount (AED)</label>
                <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
                  placeholder="Enter amount" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Payment Method</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
                  <option>Bank Transfer</option><option>Cheque</option><option>Cash</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold py-2 rounded-lg">Confirm</button>
                <button onClick={() => setShowTopUp(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Transaction History ───────────────────────────────────────────────────────
function TransactionsTab() {
  const [agentFilter, setAgentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<WalletTxType | "all">("all");

  const filtered = WALLET_TRANSACTIONS.filter(t =>
    (agentFilter === "all" || t.agentId === agentFilter) &&
    (typeFilter === "all" || t.type === typeFilter)
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500">
          <option value="all">All Agents</option>
          {AGENT_WALLETS.map(w => <option key={w.agentId} value={w.agentId}>{w.agentName}</option>)}
        </select>
        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
          {(["all","top_up","commission_credit","debit","payout","adjustment"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${typeFilter === t ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"}`}>
              {t === "all" ? "All" : TX_CFG[t]?.label ?? t}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-zinc-500">{filtered.length} transactions</div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Date","Ref","Agent","Type","Description","Amount","Balance After","Processed By"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const cfg = TX_CFG[t.type];
              return (
                <tr key={t.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{t.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{t.ref}</td>
                  <td className="px-4 py-3 text-zinc-200">{t.agentName}</td>
                  <td className="px-4 py-3"><TxBadge type={t.type} /></td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-xs truncate">{t.description}</td>
                  <td className={`px-4 py-3 font-mono font-bold ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {cfg.sign}{fmtAED(t.amount)}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{fmtAED(t.balanceAfter)}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{t.processedBy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Commission Rules ──────────────────────────────────────────────────────────
function RulesTab() {
  const [selected, setSelected] = useState<CommissionRule | null>(null);

  const ENTITY_CFG = {
    agent:    { label: "Agent",    bg: "bg-amber-500/20",   text: "text-amber-400"   },
    supplier: { label: "Supplier", bg: "bg-blue-500/20",    text: "text-blue-400"    },
    both:     { label: "Both",     bg: "bg-purple-500/20",  text: "text-purple-400"  },
  };
  const RULE_TYPE_LABEL: Record<string, string> = {
    percentage: "% of Gross",
    fixed_per_booking: "Fixed / Booking",
    tiered: "Tiered",
    override: "Override %",
  };

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-zinc-400">{COMMISSION_RULES.length} rules configured</div>
          <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Plus size={14} /> Add Rule
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Rule Name","Service","Type","Entity","Value","Applies To","Valid From","Valid To","Priority","Active"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMMISSION_RULES.map((r, i) => {
                const ec = ENTITY_CFG[r.entity];
                return (
                  <tr key={r.id} onClick={() => setSelected(r)}
                    className={`border-b border-zinc-800/60 cursor-pointer transition-colors hover:bg-zinc-800/40
                      ${selected?.id === r.id ? "bg-amber-500/5 border-l-2 border-l-amber-500" : i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                    <td className="px-4 py-3 text-zinc-200 font-medium">{r.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{r.service}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{RULE_TYPE_LABEL[r.ruleType]}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ec.bg} ${ec.text}`}>{ec.label}</span></td>
                    <td className="px-4 py-3 font-bold text-amber-400">
                      {r.ruleType === "fixed_per_booking" ? `AED ${r.value}` : `${r.value}%`}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-xs truncate">{r.appliesTo}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{r.validFrom}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{r.validTo}</td>
                    <td className="px-4 py-3 text-zinc-400">{r.priority}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-600/40 text-zinc-400"}`}>
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div>
            <div className="font-semibold text-zinc-100">{selected.name}</div>
            <div className="text-xs text-zinc-500 mt-0.5">Priority {selected.priority}</div>
          </div>
          <div className="text-4xl font-bold text-amber-400 text-center py-4">
            {selected.ruleType === "fixed_per_booking" ? `AED ${selected.value}` : `${selected.value}%`}
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["Service", selected.service],
              ["Type", RULE_TYPE_LABEL[selected.ruleType]],
              ["Entity", selected.entity],
              ["Applies To", selected.appliesTo],
              ["Valid From", selected.validFrom],
              ["Valid To", selected.validTo],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-zinc-500 flex-shrink-0">{k}</span>
                <span className="text-zinc-300 text-right text-xs">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold py-2 rounded-lg">Edit Rule</button>
            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 rounded-lg">
              {selected.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Agent Commission Report ───────────────────────────────────────────────────
function AgentCommissionTab() {
  const totalCommission = AGENT_COMMISSIONS.reduce((a, c) => a + c.commissionAED, 0);
  const pending = AGENT_COMMISSIONS.filter(c => c.status === "pending").reduce((a, c) => a + c.commissionAED, 0);
  const credited = AGENT_COMMISSIONS.filter(c => c.status === "credited").reduce((a, c) => a + c.commissionAED, 0);

  const STATUS_CFG = {
    pending:  { label: "Pending",  bg: "bg-amber-500/20",   text: "text-amber-400"   },
    credited: { label: "Credited", bg: "bg-emerald-500/20", text: "text-emerald-400" },
    reversed: { label: "Reversed", bg: "bg-red-500/20",     text: "text-red-400"     },
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Commission",  value: fmtAED(totalCommission), color: "text-amber-400"   },
          { label: "Credited",          value: fmtAED(credited),        color: "text-emerald-400" },
          { label: "Pending Credit",    value: fmtAED(pending),         color: "text-blue-400"    },
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
              {["Agent","Code","Service","Booking Ref","Customer","Date","Gross Amount","Comm %","Commission","Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGENT_COMMISSIONS.map((c, i) => {
              const cfg = STATUS_CFG[c.status];
              return (
                <tr key={c.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{c.agentName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{c.agentCode}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{c.service}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{c.transactionRef}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.customerName}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{c.transactionDate}</td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{fmtAED(c.grossAmountAED)}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.commissionPct > 0 ? `${c.commissionPct}%` : "Fixed"}</td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-400">{fmtAED(c.commissionAED)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-700 bg-zinc-800/40">
              <td colSpan={8} className="px-4 py-3 text-xs font-bold text-zinc-400">TOTAL</td>
              <td className="px-4 py-3 font-mono font-bold text-amber-400">{fmtAED(totalCommission)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Supplier Commission Report ────────────────────────────────────────────────
function SupplierCommissionTab() {
  const total = SUPPLIER_COMMISSIONS.reduce((a, c) => a + c.commissionAED, 0);

  const STATUS_CFG = {
    accrued:  { label: "Accrued",  bg: "bg-blue-500/20",    text: "text-blue-400"    },
    invoiced: { label: "Invoiced", bg: "bg-amber-500/20",   text: "text-amber-400"   },
    received: { label: "Received", bg: "bg-emerald-500/20", text: "text-emerald-400" },
    disputed: { label: "Disputed", bg: "bg-red-500/20",     text: "text-red-400"     },
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Supplier Commission", value: fmtAED(total), color: "text-amber-400" },
          { label: "Received",                  value: fmtAED(SUPPLIER_COMMISSIONS.filter(c => c.status === "received").reduce((a, c) => a + c.commissionAED, 0)), color: "text-emerald-400" },
          { label: "Accrued / Invoiced",        value: fmtAED(SUPPLIER_COMMISSIONS.filter(c => c.status !== "received").reduce((a, c) => a + c.commissionAED, 0)), color: "text-blue-400" },
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
              {["Supplier","Type","Service","Invoice Ref","Period","Volume (AED)","Comm %","Commission (AED)","Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUPPLIER_COMMISSIONS.map((c, i) => {
              const cfg = STATUS_CFG[c.status];
              return (
                <tr key={c.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{c.supplierName}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{c.supplierType}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{c.service}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{c.invoiceRef}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.period}</td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{fmtAED(c.volumeAED)}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.commissionPct}%</td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-400">{fmtAED(c.commissionAED)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-700 bg-zinc-800/40">
              <td colSpan={7} className="px-4 py-3 text-xs font-bold text-zinc-400">TOTAL</td>
              <td className="px-4 py-3 font-mono font-bold text-amber-400">{fmtAED(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Payout Management ─────────────────────────────────────────────────────────
function PayoutsTab() {
  const [selected, setSelected] = useState<PayoutRequest | null>(null);
  const pendingTotal = PAYOUT_REQUESTS.filter(p => p.status === "pending").reduce((a, p) => a + p.amount, 0);
  const pendingCount = PAYOUT_REQUESTS.filter(p => p.status === "pending").length;

  return (
    <div className="p-6 flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Pending Payouts",    value: fmtAED(pendingTotal), color: "text-amber-400", sub: `${pendingCount} requests` },
            { label: "Completed (month)",  value: fmtAED(PAYOUT_REQUESTS.filter(p => p.status === "completed").reduce((a, p) => a + p.amount, 0)), color: "text-emerald-400", sub: `${PAYOUT_REQUESTS.filter(p => p.status === "completed").length} processed` },
            { label: "Approved — Queue",   value: PAYOUT_REQUESTS.filter(p => p.status === "approved").length.toString(), color: "text-blue-400", sub: "ready to process" },
          ].map(k => (
            <div key={k.label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <div className="text-xs text-zinc-500 mb-1">{k.label}</div>
              <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-zinc-600 mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Ref","Entity","Type","Amount","Method","Requested","Approved By","Processed","Status","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYOUT_REQUESTS.map((p, i) => (
                <tr key={p.id} onClick={() => setSelected(p)}
                  className={`border-b border-zinc-800/60 cursor-pointer transition-colors hover:bg-zinc-800/40
                    ${selected?.id === p.id ? "bg-amber-500/5 border-l-2 border-l-amber-500" : i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-amber-400">{p.ref}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{p.entityName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.entityType === "agent" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {p.entityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-zinc-100">{fmtAED(p.amount)}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs capitalize">{p.method.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{p.requestedAt}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{p.approvedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{p.processedAt ?? "—"}</td>
                  <td className="px-4 py-3"><PayoutBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.status === "pending" && (
                        <button className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/30 transition-colors">Approve</button>
                      )}
                      {p.status === "approved" && (
                        <button className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-500/30 transition-colors">Process</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
          <div>
            <div className="font-mono text-sm text-amber-400">{selected.ref}</div>
            <div className="font-bold text-zinc-100 mt-0.5">{selected.entityName}</div>
            <div className="text-xs text-zinc-500 capitalize">{selected.entityType}</div>
          </div>
          <div className="text-3xl font-bold text-zinc-100 text-center py-3 bg-zinc-800 rounded-xl">{fmtAED(selected.amount)}</div>
          <PayoutBadge status={selected.status} />
          <div className="space-y-2 text-sm">
            {[
              ["Method", selected.method.replace(/_/g, " ")],
              ["Bank Details", selected.bankDetails ?? "—"],
              ["Requested By", selected.requestedBy],
              ["Requested At", selected.requestedAt],
              ["Approved By", selected.approvedBy ?? "—"],
              ["Processed At", selected.processedAt ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-zinc-500 flex-shrink-0">{k}</span>
                <span className="text-zinc-300 text-right text-xs capitalize">{v}</span>
              </div>
            ))}
          </div>
          {selected.notes && (
            <div className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-400">{selected.notes}</div>
          )}
          {selected.status === "pending" && (
            <div className="flex gap-2">
              <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold py-2 rounded-lg">Approve</button>
              <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 rounded-lg">Reject</button>
            </div>
          )}
          {selected.status === "approved" && (
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2 rounded-lg">Process Payout</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function WalletCommissionModule() {
  const [tab, setTab] = useState<WalTab>("wallets");

  return (
    <div className="flex flex-col h-full bg-[#0D1117]">
      <div className="flex-shrink-0 px-6 pt-6 pb-0 border-b border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center">
            <Wallet size={16} className="text-amber-400" />
          </div>
          <h1 className="text-lg font-bold text-zinc-100">Wallet & Commission</h1>
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
        {tab === "wallets"             && <WalletsTab />}
        {tab === "transactions"        && <TransactionsTab />}
        {tab === "rules"               && <RulesTab />}
        {tab === "agent_commission"    && <AgentCommissionTab />}
        {tab === "supplier_commission" && <SupplierCommissionTab />}
        {tab === "payouts"             && <PayoutsTab />}
      </div>
    </div>
  );
}
