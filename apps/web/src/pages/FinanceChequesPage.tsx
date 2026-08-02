import { FormEvent, useCallback, useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { bankingApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { BankAccountRow, ChequeRow } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { toPoishaBdt } from "@/lib/banking";
import { formatBdt } from "@/lib/gl";

export default function FinanceChequesPage() {
  const [rows, setRows] = useState<ChequeRow[]>([]);
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [direction, setDirection] = useState("outgoing");
  const [chequeNo, setChequeNo] = useState("");
  const [payee, setPayee] = useState("");
  const [amountBdt, setAmountBdt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        bankingApi.listCheques(),
        bankingApi.listAccounts({ kind: "bank", active: "true" }),
      ]);
      setRows(c);
      setAccounts(a);
      if (!bankAccountId && a[0]) setBankAccountId(a[0].id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load cheques");
    } finally {
      setLoading(false);
    }
  }, [bankAccountId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await bankingApi.createCheque({
        bankAccountId,
        direction,
        chequeNo: chequeNo.trim(),
        payeeOrDrawer: payee.trim(),
        amountPoisha: toPoishaBdt(amountBdt),
      });
      setOk("Cheque registered");
      setChequeNo("");
      setPayee("");
      setAmountBdt("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function print(id: string) {
    try {
      const r = await bankingApi.printCheque(id);
      setOk(`Printed cheque ${r.cheque.chequeNo} (configurable template)`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Print failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={ScrollText}
        title="Cheque register"
        subtitle="Incoming/outgoing cheques with status tracking and configurable print layout."
        breadcrumb={[{ label: "Finance ERP", to: "/finance" }, { label: "Cheque register" }]}
      />
      <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="cheque:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Bank account</label>
              <select className={inputCls} value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Direction</label>
              <select className={inputCls} value={direction} onChange={(e) => setDirection(e.target.value)}>
                <option value="outgoing">outgoing</option>
                <option value="incoming">incoming</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Cheque No</label>
              <input className={inputCls} value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Payee / Drawer</label>
              <input className={inputCls} value={payee} onChange={(e) => setPayee(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Amount (৳)</label>
              <input className={inputCls} value={amountBdt} onChange={(e) => setAmountBdt(e.target.value)} required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                Register
              </button>
            </div>
          </form>
        </Can>

        {loading ? (
          <div className="flex justify-center py-12">
            <InlineSpinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No cheques" hint="Register an outgoing or incoming cheque." />
        ) : (
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase text-[var(--muted-foreground)] border-b">
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Dir</th>
                  <th className="px-3 py-2">Bank</th>
                  <th className="px-3 py-2">Payee</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)]">
                    <td className="px-3 py-2 font-semibold">{r.chequeNo}</td>
                    <td className="px-3 py-2">{r.direction}</td>
                    <td className="px-3 py-2">{r.bankAccount?.name}</td>
                    <td className="px-3 py-2">{r.payeeOrDrawer || "—"}</td>
                    <td className="px-3 py-2">{formatBdt(r.amountPoisha)}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">
                      <Can perm="cheque:manage">
                        {r.direction === "outgoing" && r.status !== "printed" && r.status !== "cleared" && (
                          <button type="button" onClick={() => void print(r.id)} className="text-[var(--accent)] font-semibold hover:underline">
                            Print
                          </button>
                        )}
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </PageShell>
  );
}
