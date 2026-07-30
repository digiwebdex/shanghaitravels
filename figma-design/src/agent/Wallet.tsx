import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, AlertCircle, CreditCard, Building2, Banknote, CheckCircle2 } from "lucide-react";
import { AGENT_PROFILE, WALLET_TXS, fmtAED } from "./data";

export default function Wallet() {
  const [method, setMethod] = useState<"bank"|"card">("bank");
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const secPct = Math.round((AGENT_PROFILE.securityDeposit / AGENT_PROFILE.securityLimit) * 100);
  const credits = WALLET_TXS.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const debits  = WALLET_TXS.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-slate-800 text-[20px] font-bold">Wallet & Security Deposit</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">{AGENT_PROFILE.name} · {AGENT_PROFILE.agentId}</p>
      </div>

      {AGENT_PROFILE.walletBalance < 30000 && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-700">
            Wallet balance is low ({fmtAED(AGENT_PROFILE.walletBalance)}). Some bookings require a minimum of AED 10,000.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {/* Hero balance */}
          <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E3A5F 60%,#14213D 100%)" }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5" style={{ background: "radial-gradient(circle,white,transparent)", transform: "translate(30%,-30%)" }} />
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Available Balance</p>
            <p className="text-[42px] font-bold leading-none mb-1 font-mono text-emerald-400">{fmtAED(AGENT_PROFILE.walletBalance)}</p>
            <p className="text-white/40 text-[11px] mb-6">{AGENT_PROFILE.name} · {AGENT_PROFILE.agentId}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Credits", value: fmtAED(credits),                    color: "text-emerald-400" },
                { label: "Total Debits",  value: fmtAED(debits),                     color: "text-red-400" },
                { label: "Credit Limit",  value: fmtAED(AGENT_PROFILE.creditLimit), color: "text-white/80" },
              ].map(c => (
                <div key={c.label} className="bg-white/8 rounded-xl p-3">
                  <p className="text-white/35 text-[9px] font-bold uppercase tracking-wide mb-1">{c.label}</p>
                  <p className={`text-[13px] font-bold font-mono ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security deposit */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-bold text-slate-800">Security Deposit</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Required to maintain credit facility</p>
              </div>
              <div className="text-right">
                <p className="text-[20px] font-bold font-mono text-slate-800">{fmtAED(AGENT_PROFILE.securityDeposit)}</p>
                <p className="text-[10px] text-slate-400">of {fmtAED(AGENT_PROFILE.securityLimit)} required</p>
              </div>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#14213D] transition-all" style={{ width: `${secPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <span>{secPct}% of required deposit held</span>
              <span>Shortfall: {fmtAED(AGENT_PROFILE.securityLimit - AGENT_PROFILE.securityDeposit)}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Held",     value: fmtAED(AGENT_PROFILE.securityDeposit), color: "text-[#14213D]" },
                { label: "Required", value: fmtAED(AGENT_PROFILE.securityLimit),   color: "text-slate-600" },
                { label: "Credit",   value: fmtAED(AGENT_PROFILE.creditLimit),     color: "text-emerald-600" },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-1">{s.label}</p>
                  <p className={`text-[12px] font-bold font-mono ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ledger */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-[13px] font-bold text-slate-800">Transaction History</p>
              <button className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Date","Description","Reference","Amount","Balance"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {WALLET_TXS.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">{tx.date}</td>
                      <td className="px-5 py-3.5 text-[12px] text-slate-700">{tx.description}</td>
                      <td className="px-5 py-3.5 text-[11px] font-mono text-slate-400">{tx.ref}</td>
                      <td className="px-5 py-3.5">
                        <div className={`flex items-center gap-1 text-[12px] font-bold font-mono ${tx.type === "credit" ? "text-emerald-600" : "text-slate-800"}`}>
                          {tx.type === "credit" ? <ArrowDownLeft size={11} className="text-emerald-500" /> : <ArrowUpRight size={11} className="text-slate-400" />}
                          {tx.type === "credit" ? "+" : "−"}{fmtAED(tx.amount)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] font-mono font-semibold text-slate-700">{fmtAED(tx.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top-up panel */}
        <div className="space-y-4">
          {success ? (
            <div className="bg-white rounded-xl border border-emerald-200 p-6 text-center">
              <div className="size-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={26} className="text-emerald-600" />
              </div>
              <p className="font-bold text-slate-800 mb-1">Top-up Requested</p>
              <p className="text-[11px] text-slate-400 mb-5">
                Payment of {fmtAED(Number(amount))} is being processed and will reflect within 1 business day.
              </p>
              <button onClick={() => { setSuccess(false); setAmount(""); }} className="w-full py-2.5 rounded-lg bg-[#14213D] text-white text-[12px] font-bold hover:bg-[#1a2d54] transition-colors">
                Top-up Again
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[13px] font-bold text-slate-800 mb-5">Top-up Wallet</p>
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-5">
                {([["bank","Bank",Building2],["card","Card",CreditCard]] as const).map(([key, label, Icon]) => (
                  <button key={key} onClick={() => setMethod(key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-semibold transition-all ${method === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Quick Select</p>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {[10000, 25000, 50000, 75000, 100000, 200000].map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} className={`py-2 rounded-lg text-[11px] font-semibold transition-all ${Number(amount) === a ? "bg-[#14213D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    {a >= 1000 ? `${a/1000}k` : a}
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Amount (AED)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold">AED</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-10 pr-3 py-2.5 text-[13px] font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#14213D]" />
                </div>
              </div>
              {method === "bank" && (
                <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Bank Transfer Details</p>
                  {[["Bank","Emirates NBD"],["IBAN","AE07 0336 0012 3456 7890 001"],["Account","0101234567890"],["Ref",`${AGENT_PROFILE.agentId}-TOP`]].map(([k,v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-mono font-semibold text-slate-700">{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {method === "card" && (
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Card Number</label>
                    <input placeholder="1234 5678 9012 3456" className="w-full px-3 py-2.5 text-[12px] font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Expiry</label>
                      <input placeholder="MM / YY" className="w-full px-3 py-2.5 text-[12px] font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">CVV</label>
                      <input placeholder="•••" className="w-full px-3 py-2.5 text-[12px] font-mono border border-slate-200 rounded-lg bg-slate-50 focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}
              <button onClick={() => amount && setSuccess(true)} disabled={!amount || Number(amount) < 100} className="w-full py-3 rounded-xl bg-[#14213D] text-white text-[13px] font-bold hover:bg-[#1a2d54] transition-colors disabled:opacity-40">
                {method === "bank" ? "Confirm Transfer" : `Pay ${amount ? fmtAED(Number(amount)) : "—"}`}
              </button>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Banknote size={14} className="text-slate-500" />
              <p className="text-[12px] font-bold text-slate-700">Increase Security Deposit</p>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Increasing your deposit unlocks higher credit limits. Shortfall: {fmtAED(AGENT_PROFILE.securityLimit - AGENT_PROFILE.securityDeposit)}.
            </p>
            <button className="w-full py-2.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-white transition-colors">
              Request Deposit Top-up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
