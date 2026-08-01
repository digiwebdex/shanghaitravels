import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Landmark, RefreshCw, Search } from "lucide-react";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { GlAccount, GlAccountGroup } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { GL_TYPES } from "@/lib/gl";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  ListToolbar,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  searchInputClassName,
} from "@/components/enterprise/Page";

export default function FinanceAccountsPage() {
  const [rows, setRows] = useState<GlAccount[]>([]);
  const [groups, setGroups] = useState<GlAccountGroup[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("asset");
  const [groupId, setGroupId] = useState("");
  const [isHeader, setIsHeader] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, g] = await Promise.all([
        glApi.listAccounts({ q: q || undefined, active: "true" }),
        glApi.listGroups(),
      ]);
      setRows(Array.isArray(a) ? a : []);
      setGroups(Array.isArray(g) ? g : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load chart of accounts");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function bootstrap() {
    setError("");
    setOk("");
    try {
      const r = await glApi.bootstrap();
      setOk(r.bootstrapped ? "GL foundation seeded (BDT, CoA, FY periods)" : r.message || "Already bootstrapped");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Bootstrap failed");
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Code and name required");
      return;
    }
    setError("");
    setOk("");
    try {
      await glApi.createAccount({
        code: code.trim(),
        name: name.trim(),
        type,
        groupId: groupId || undefined,
        isHeader,
        isPostable: !isHeader,
      });
      setOk("Account created");
      setCode("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  const stats = useMemo(() => {
    const postable = rows.filter((a) => a.isPostable !== false && !a.isHeader).length;
    const byType = new Set(rows.map((a) => a.type)).size;
    return { postable, byType };
  }, [rows]);

  const columns: Column<GlAccount>[] = [
    { key: "code", header: "Code", render: (a) => <span className="font-semibold text-[var(--primary)]">{a.code}</span> },
    { key: "name", header: "Name", render: (a) => a.name },
    { key: "type", header: "Type", render: (a) => <Pill value={a.type} tone={statusTone(a.type)} /> },
    { key: "group", header: "Group", render: (a) => a.group?.name || "—" },
    {
      key: "postable",
      header: "Postable",
      render: (a) => (a.isPostable === false || a.isHeader ? "no" : "yes"),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Landmark}
        title="Chart of Accounts"
        subtitle="Configurable GL accounts — Assets, Liabilities, Equity, Income, Expenses. No hard-coded IDs."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Chart of Accounts" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="gl:manage">
              <button type="button" onClick={() => void bootstrap()} className={btnGhost}>
                Bootstrap foundation
              </button>
            </Can>
          </>
        }
      />
      <FinanceModuleNav />
      <StatStrip>
        <KpiCard label="Accounts" value={rows.length} />
        <KpiCard label="Postable" value={stats.postable} tone="accent" />
        <KpiCard label="Types in view" value={stats.byType} />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="gl:manage">
        <Surface>
          <SurfaceHeader title="Add GL account" />
          <form onSubmit={(e) => void create(e)} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-4 sm:p-5">
            <div>
              <label className={labelCls}>Code *</label>
              <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {GL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Group</label>
              <select className={inputCls} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                <option value="">— optional —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code} · {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                <input type="checkbox" checked={isHeader} onChange={(e) => setIsHeader(e.target.checked)} />
                Header (non-postable)
              </label>
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Save account
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <ListToolbar>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              className={searchInputClassName}
              placeholder="Search code / name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search chart of accounts"
            />
          </div>
          <button type="button" onClick={() => void load()} className={btnGhost}>
            Search
          </button>
        </ListToolbar>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No GL accounts"
          emptyHint="Click Bootstrap foundation or add an account."
        />
      </Surface>
    </PageShell>
  );
}
