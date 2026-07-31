import { FormEvent, useCallback, useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { GlAccountGroup } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { GL_TYPES } from "@/lib/gl";

export default function FinanceGroupsPage() {
  const [rows, setRows] = useState<GlAccountGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("asset");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await glApi.listGroups());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await glApi.createGroup({ code: code.trim(), name: name.trim(), type });
      setOk("Group created");
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
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Layers size={16} className="text-amber-600" /> Account groups
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Assets, Liabilities, Equity, Income, Expenses — configurable hierarchy.</p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="gl:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
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
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Save group
              </button>
            </div>
          </form>
        </Can>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No groups" hint="Bootstrap foundation or add a group." />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-2 font-bold">Code</th>
                  <th className="px-4 py-2 font-bold">Name</th>
                  <th className="px-4 py-2 font-bold">Type</th>
                  <th className="px-4 py-2 font-bold">Accounts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id} className="border-b border-slate-50 text-[11px]">
                    <td className="px-4 py-2.5 font-semibold">{g.code}</td>
                    <td className="px-4 py-2.5">{g.name}</td>
                    <td className="px-4 py-2.5">{g.type}</td>
                    <td className="px-4 py-2.5">{g._count?.accounts ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
