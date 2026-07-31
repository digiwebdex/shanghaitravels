import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { bankingApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { BankAccountRow, BankMovement } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { MOVEMENT_TYPES, toPoishaBdt, validateMovement } from "@/lib/banking";
import { formatBdt } from "@/lib/gl";

export default function FinanceBankMovementsPage() {
  const [rows, setRows] = useState<BankMovement[]>([]);
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [type, setType] = useState("transfer");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amountBdt, setAmountBdt] = useState("");
  const [memo, setMemo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        bankingApi.listMovements({ limit: 100 }),
        bankingApi.listAccounts({ active: "true" }),
      ]);
      setRows(m);
      setAccounts(a);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load movements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateMovement({ type, amountBdt, fromBankAccountId: fromId, toBankAccountId: toId });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      const mov = await bankingApi.createMovement({
        type,
        fromBankAccountId: fromId || undefined,
        toBankAccountId: toId || undefined,
        amountPoisha: toPoishaBdt(amountBdt),
        memo: memo.trim() || undefined,
        postImmediately: true,
      });
      setOk(`${mov.movementNo} posted`);
      setAmountBdt("");
      setMemo("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-amber-600" /> Bank & cash movements
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Deposits, withdrawals, transfers, charges, interest — posted through Phase C1 GL.
          </p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="banking:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {MOVEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>From</label>
              <select className={inputCls} value={fromId} onChange={(e) => setFromId(e.target.value)}>
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.kind}: {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>To</label>
              <select className={inputCls} value={toId} onChange={(e) => setToId(e.target.value)}>
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.kind}: {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Amount (৳)</label>
              <input className={inputCls} value={amountBdt} onChange={(e) => setAmountBdt(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Memo</label>
              <input className={inputCls} value={memo} onChange={(e) => setMemo(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Create & post
              </button>
            </div>
          </form>
        </Can>

        {loading ? (
          <div className="flex justify-center py-12">
            <InlineSpinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No movements" hint="Post a transfer or deposit to begin the bank book." />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 border-b">
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">From</th>
                  <th className="px-3 py-2">To</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Journal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="px-3 py-2 font-semibold">{r.movementNo}</td>
                    <td className="px-3 py-2">{r.type}</td>
                    <td className="px-3 py-2">{r.fromBankAccount?.name || "—"}</td>
                    <td className="px-3 py-2">{r.toBankAccount?.name || "—"}</td>
                    <td className="px-3 py-2">{formatBdt(r.amountPoisha)}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.journal?.journalNo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
