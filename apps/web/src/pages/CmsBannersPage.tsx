import { FormEvent, useCallback, useEffect, useState } from "react";
import { PanelsTopLeft } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { cmsApi, type CmsBanner } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";

export default function CmsBannersPage() {
  const [rows, setRows] = useState<CmsBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkHref, setLinkHref] = useState("/#/site/enquire");
  const [placement, setPlacement] = useState("hero");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listBanners());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      setError("Code and title required");
      return;
    }
    try {
      await cmsApi.createBanner({
        code: code.trim(),
        title: title.trim(),
        subtitle: subtitle || undefined,
        linkHref,
        placement,
        sortOrder: 10,
      });
      setOk("Banner saved");
      setCode("");
      setTitle("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={PanelsTopLeft}
        title="Banners & sliders"
        subtitle="Hero and placement-based banners for the public site."
        breadcrumb={[{ label: "CMS", to: "/cms" }, { label: "Banners & sliders" }]}
      />
      <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="cms:manage">
          <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Code</label>
              <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Placement</label>
              <input className={inputCls} value={placement} onChange={(e) => setPlacement(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <input className={inputCls} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Link</label>
              <input className={inputCls} value={linkHref} onChange={(e) => setLinkHref(e.target.value)} />
            </div>
            <div>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
                Add banner
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((b) => (
              <li key={b.id} className="bg-white border border-slate-200 rounded-xl p-3 text-[11px]">
                <div className="font-bold">
                  {b.title} <span className="text-slate-400">· {b.placement}</span>
                </div>
                <div className="text-slate-600">{b.subtitle}</div>
              </li>
            ))}
          </ul>
        )}
    </PageShell>
  );
}
