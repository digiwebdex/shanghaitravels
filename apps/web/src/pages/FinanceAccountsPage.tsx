import { FormEvent, useCallback, useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { GlAccount, GlAccountGroup } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { GL_TYPES } from "@/lib/gl";

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

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <Landmark size={16} className="text-amber-600" /> Chart of Accounts
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configurable GL accounts — Assets, Liabilities, Equity, Income, Expenses. No hard-coded IDs.
            </p>
          </div>
          <Can perm="gl:manage">
            <button
              type="button"
              onClick={() => void bootstrap()}
              className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold"
            >
              Bootstrap foundation
            </button>
          </Can>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="gl:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Add GL account</p>
            </div>
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
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <input type="checkbox" checked={isHeader} onChange={(e) => setIsHeader(e.target.checked)} />
                Header (non-postable)
              </label>
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Save account
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-[11px]"
              placeholder="Search code / name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search chart of accounts"
            />
            <button type="button" onClick={() => void load()} className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold">
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No GL accounts" hint="Click Bootstrap foundation or add an account." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Code</th>
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Type</th>
                    <th className="px-4 py-2 font-bold">Group</th>
                    <th className="px-4 py-2 font-bold">Postable</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{a.code}</td>
                      <td className="px-4 py-2.5 text-slate-700">{a.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.type}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.group?.name || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{a.isPostable === false || a.isHeader ? "no" : "yes"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
