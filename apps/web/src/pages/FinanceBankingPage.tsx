import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Landmark, RefreshCw } from "lucide-react";
import { bankingApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { BankAccountRow, BankMaster } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { ACCOUNT_KINDS } from "@/lib/banking";
import { formatBdt } from "@/lib/gl";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
} from "@/components/enterprise/Page";

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

  const stats = useMemo(() => {
    const bank = accounts.filter((a) => a.kind === "bank").length;
    const cash = accounts.filter((a) => a.kind === "cash" || a.kind === "petty_cash").length;
    const opening = accounts.reduce((s, a) => s + (a.openingBalancePoisha || 0), 0);
    return { bank, cash, opening };
  }, [accounts]);

  const columns: Column<BankAccountRow>[] = [
    { key: "name", header: "Name", render: (a) => <span className="font-semibold">{a.name}</span> },
    { key: "kind", header: "Kind", render: (a) => <Pill value={a.kind} tone={statusTone(a.kind)} /> },
    { key: "no", header: "Account No", render: (a) => a.accountNo || "—" },
    { key: "bank", header: "Bank", render: (a) => a.bankMaster?.name || "—" },
    {
      key: "gl",
      header: "GL",
      render: (a) => `${a.glAccount?.code || ""} ${a.glAccount?.name || ""}`.trim() || "—",
    },
    {
      key: "opening",
      header: "Opening",
      className: "text-right tabular-nums",
      render: (a) => formatBdt(a.openingBalancePoisha),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Landmark}
        title="Banking & cash"
        subtitle="Bank masters, cash/petty cash/bank accounts linked to GL — opening balances via C1 journals."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Banking" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="banking:manage">
              <button type="button" onClick={() => void bootstrap()} className={btnGhost}>
                Bootstrap defaults
              </button>
            </Can>
          </>
        }
      />
      <FinanceModuleNav />
      <StatStrip>
        <KpiCard label="Accounts" value={accounts.length} />
        <KpiCard label="Bank" value={stats.bank} tone="accent" />
        <KpiCard label="Cash" value={stats.cash} />
        <KpiCard label="Opening total" value={formatBdt(stats.opening)} />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="banking:manage">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Surface>
            <SurfaceHeader title="Bank master" />
            <form onSubmit={(e) => void createMaster(e)} className="space-y-2 p-4 sm:p-5">
              <input
                className={inputCls}
                placeholder="Code (e.g. DBBL)"
                value={masterCode}
                onChange={(e) => setMasterCode(e.target.value)}
                required
              />
              <input
                className={inputCls}
                placeholder="Name"
                value={masterName}
                onChange={(e) => setMasterName(e.target.value)}
                required
              />
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Add bank
              </button>
            </form>
          </Surface>
          <Surface>
            <SurfaceHeader title="Account" />
            <form onSubmit={(e) => void createAccount(e)} className="space-y-2 p-4 sm:p-5">
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                {ACCOUNT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                className={inputCls}
                placeholder="Account name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className={inputCls}
                placeholder="Account number"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
              />
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Create account
              </button>
            </form>
          </Surface>
        </div>
      </Can>

      <Surface>
        <SurfaceHeader title={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`} hint={`${masters.length} bank masters`} />
        <DataTable
          rows={accounts}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No bank accounts"
          emptyHint="Bootstrap defaults or create a cash/bank account."
        />
      </Surface>
    </PageShell>
  );
}
