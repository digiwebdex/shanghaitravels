import { useCallback, useEffect, useState } from "react";
import { Wallet, ArrowDownCircle, ArrowUpCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { agentsApi, walletRequestsApi, type WalletTxnRow, type WalletRequest } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { Surface, SurfaceHeader, btnGhost, btnPrimary, btnPrimaryStyle, inputCls, labelCls } from "@/components/enterprise/Page";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { ErrorBanner } from "@/components/Feedback";
import { fmtBDTPlain } from "@/lib/money";

/** V6 Wave 1 — agent wallet: balance, immutable ledger, reconcile, top-up/withdrawal requests + approvals. */
export function AgentWalletCard({ agentId }: { agentId: string }) {
  const { can } = useAuth();
  const canManage = can("commission:manage");
  const [ledger, setLedger] = useState<WalletTxnRow[]>([]);
  const [recon, setRecon] = useState<{ cachedBalance: number; ledgerSum: number; drift: number; reconciled: boolean } | null>(null);
  const [topups, setTopups] = useState<WalletRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletRequest[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [l, r, reqs] = await Promise.all([
        agentsApi.walletLedger(agentId),
        agentsApi.walletReconcile(agentId),
        agentsApi.walletRequests(agentId),
      ]);
      setLedger(l);
      setRecon(r);
      setTopups(reqs.topups);
      setWithdrawals(reqs.withdrawals);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load wallet");
    }
  }, [agentId]);
  useEffect(() => {
    void load();
  }, [load]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setAmount("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const pending = [
    ...topups.filter((t) => t.status === "requested").map((t) => ({ ...t, kind: "topup" as const })),
    ...withdrawals.filter((w) => w.status === "requested").map((w) => ({ ...w, kind: "withdrawal" as const })),
  ];

  return (
    <Surface padded className="space-y-3">
      <SurfaceHeader title="Wallet" hint="Immutable ledger — balance = Σ ledger. Top-ups and withdrawals require approval." />
      <ErrorBanner message={error} />
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-[var(--accent)]" />
          <span className="text-lg font-bold tabular-nums text-[var(--foreground)]">{fmtBDTPlain(recon?.cachedBalance ?? 0)}</span>
        </div>
        {recon && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${recon.reconciled ? "text-emerald-600" : "text-red-600"}`}>
            {recon.reconciled ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
            {recon.reconciled ? "Reconciled" : `Drift ${fmtBDTPlain(recon.drift)}`}
          </span>
        )}
      </div>

      {canManage && (
        <div className="flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-3">
          <div>
            <label className={labelCls} htmlFor="wl-amt">Amount (৳)</label>
            <input id="wl-amt" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1000" />
          </div>
          <button
            type="button"
            className={btnPrimary}
            style={btnPrimaryStyle}
            disabled={busy || !Number(amount)}
            onClick={() => void act(() => agentsApi.walletTopup(agentId, { amount: Math.round(Number(amount) * 100) }))}
          >
            <ArrowUpCircle size={13} /> Request top-up
          </button>
          <button
            type="button"
            className={btnGhost}
            disabled={busy || !Number(amount)}
            onClick={() => void act(() => agentsApi.walletWithdraw(agentId, { amount: Math.round(Number(amount) * 100) }))}
          >
            <ArrowDownCircle size={13} /> Request withdrawal
          </button>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-1 border-t border-[var(--border)] pt-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Pending approvals</div>
          {pending.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 text-[11.5px]">
              <span className="font-semibold text-[var(--foreground)]">{p.kind} · {fmtBDTPlain(p.amount)}</span>
              {canManage && (
                <span className="flex gap-1">
                  <button type="button" className={btnPrimary} style={btnPrimaryStyle} disabled={busy}
                    onClick={() => void act(() => (p.kind === "topup" ? walletRequestsApi.decideTopup(p.id, "approve") : walletRequestsApi.decideWithdrawal(p.id, "approve")))}>
                    Approve
                  </button>
                  <button type="button" className={btnGhost} disabled={busy}
                    onClick={() => void act(() => (p.kind === "topup" ? walletRequestsApi.decideTopup(p.id, "reject") : walletRequestsApi.decideWithdrawal(p.id, "reject")))}>
                    Reject
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)] pt-1 text-[11px]">
        {ledger.length === 0 ? (
          <li className="py-2 text-[var(--muted-foreground)]">No wallet transactions.</li>
        ) : (
          ledger.slice(0, 8).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="flex items-center gap-2">
                <Pill value={t.type} tone={statusTone(t.type)} />
                <span className={`font-semibold tabular-nums ${t.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmtBDTPlain(t.amount)}</span>
              </span>
              <span className="tabular-nums text-[var(--muted-foreground)]">bal {fmtBDTPlain(t.runningBalance ?? 0)}</span>
            </li>
          ))
        )}
      </ul>
    </Surface>
  );
}
