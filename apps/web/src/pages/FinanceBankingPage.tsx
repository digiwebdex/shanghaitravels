import { FormEvent, useCallback, useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { bankingApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { BankAccountRow, BankMaster } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { ACCOUNT_KINDS } from "@/lib/banking";
import { formatBdt } from "@/lib/gl";

export default function FinanceBankingPage() {
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [masters, setMasters] = useState<BankMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("bank");
  const [accountNo, setAccountNo] = useState("");
  const [masterCode, setMasterCode] = useState("");
  const [masterName, setMasterName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, m] = await Promise.all([bankingApi.listAccounts({ active: "true" }), bankingApi.listMasters()]);
      setAccounts(a);
      setMasters(m);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load banking");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function bootstrap() {
    try {
      const r = await bankingApi.bootstrap();
      setOk(r.bootstrapped ? "Banking foundation seeded" : r.message || "Already bootstrapped");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Bootstrap failed");
    }
  }

  async function createMaster(e: FormEvent) {
    e.preventDefault();
    try {
      await bankingApi.createMaster({ code: masterCode.trim(), name: masterName.trim() });
      setOk("Bank master created");
      setMasterCode("");
      setMasterName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Master create failed");
    }
  }

  async function createAccount(e: FormEvent) {
    e.preventDefault();
    try {
      await bankingApi.createAccount({
        name: name.trim(),
        kind,
        accountNo: accountNo.trim() || undefined,
        bankMasterId: masters[0]?.id,
      });
      setOk("Bank/cash account created");
      setName("");
      setAccountNo("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Account create failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <Landmark size={16} className="text-amber-600" /> Banking & cash
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Bank masters, cash/petty cash/bank accounts linked to GL — opening balances via C1 journals.
            </p>
          </div>
          <Can perm="banking:manage">
            <button type="button" onClick={() => void bootstrap()} className="px-3 py-1.5 rounded-lg border text-[10.5px] font-semibold">
              Bootstrap defaults
            </button>
          </Can>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="banking:manage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <form onSubmit={(e) => void createMaster(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Bank master</p>
              <input className={inputCls} placeholder="Code (e.g. DBBL)" value={masterCode} onChange={(e) => setMasterCode(e.target.value)} required />
              <input className={inputCls} placeholder="Name" value={masterName} onChange={(e) => setMasterName(e.target.value)} required />
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Add bank
              </button>
            </form>
            <form onSubmit={(e) => void createAccount(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Account</p>
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                {ACCOUNT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input className={inputCls} placeholder="Account name" value={name} onChange={(e) => setName(e.target.value)} required />
              <input className={inputCls} placeholder="Account number" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} />
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Create account
              </button>
            </form>
          </div>
        </Can>

        {loading ? (
          <div className="flex justify-center py-12">
            <InlineSpinner />
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState title="No bank accounts" hint="Bootstrap defaults or create a cash/bank account." />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 border-b">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Kind</th>
                  <th className="px-3 py-2">Account No</th>
                  <th className="px-3 py-2">Bank</th>
                  <th className="px-3 py-2">GL</th>
                  <th className="px-3 py-2">Opening</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="px-3 py-2 font-semibold">{a.name}</td>
                    <td className="px-3 py-2">{a.kind}</td>
                    <td className="px-3 py-2">{a.accountNo || "—"}</td>
                    <td className="px-3 py-2">{a.bankMaster?.name || "—"}</td>
                    <td className="px-3 py-2">
                      {a.glAccount?.code} {a.glAccount?.name}
                    </td>
                    <td className="px-3 py-2">{formatBdt(a.openingBalancePoisha)}</td>
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
