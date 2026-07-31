import { FormEvent, useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { cmsApi, type CmsMenu } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";

export default function CmsMenusPage() {
  const [rows, setRows] = useState<CmsMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("main");
  const [name, setName] = useState("Main navigation");
  const [itemsJson, setItemsJson] = useState(
    '[{"label":"Home","href":"/#/site","sortOrder":10},{"label":"Contact","href":"/#/site/enquire","sortOrder":90}]',
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listMenus());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load menus");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const items = JSON.parse(itemsJson) as { label: string; href: string; sortOrder?: number }[];
      await cmsApi.upsertMenu({ code: code.trim(), name: name.trim(), items });
      setOk("Menu saved");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid menu JSON or save failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="cms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Menu size={16} className="text-amber-600" /> Menu manager
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Named menus with ordered items for the public site.</p>
        </div>
        <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="cms:manage">
          <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Code</label>
                <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Name</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Items JSON</label>
              <textarea className={inputCls} rows={4} value={itemsJson} onChange={(e) => setItemsJson(e.target.value)} />
            </div>
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
              Save menu
            </button>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((m) => (
              <li key={m.id} className="bg-white border border-slate-200 rounded-xl p-3 text-[11px]">
                <div className="font-bold">
                  {m.name} <span className="text-slate-400">({m.code})</span>
                </div>
                <ul className="mt-1 text-slate-600">
                  {(m.items || []).map((i) => (
                    <li key={i.id}>
                      {i.sortOrder}. {i.label} → {i.href}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
