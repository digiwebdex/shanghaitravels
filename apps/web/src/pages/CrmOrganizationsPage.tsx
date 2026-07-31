import { FormEvent, useCallback, useEffect, useState } from "react";
import { Building } from "lucide-react";
import { crmApi, type CrmOrganization } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CrmModuleNav } from "@/components/crm/CrmModuleNav";
import { ORG_TYPES } from "@/lib/crm";

export default function CrmOrganizationsPage() {
  const [rows, setRows] = useState<CrmOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("corporate");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await crmApi.listOrganizations());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load organizations");
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
      await crmApi.createOrganization({ name: name.trim(), type, phone });
      setOk("Organization created");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="crm" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Building size={16} className="text-amber-600" /> Organizations
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Corporate customers, travel agents, partner agencies.</p>
        </div>
        <CrmModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="corporate:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Create organization
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            {rows.map((o) => (
              <li key={o.id} className="text-[11px] flex flex-wrap gap-x-3 border-b border-slate-50 pb-2">
                <span className="font-bold">{o.code}</span>
                <span>{o.name}</span>
                <span className="text-slate-500">{o.type}</span>
                <span className="text-slate-400">{o.isActive ? "active" : "inactive"}</span>
              </li>
            ))}
            {rows.length === 0 && <p className="text-[11px] text-slate-400">No organizations.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}
