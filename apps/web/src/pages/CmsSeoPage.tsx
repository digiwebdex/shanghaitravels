import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { cmsApi, type CmsRedirect } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { validateRedirectInput } from "@/lib/cms";
import { ERP } from "@/config/env";

export default function CmsSeoPage() {
  const [rows, setRows] = useState<CmsRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [fromPath, setFromPath] = useState("");
  const [toPath, setToPath] = useState("");
  const [statusCode, setStatusCode] = useState("301");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listRedirects());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load redirects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateRedirectInput({ fromPath, toPath });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await cmsApi.createRedirect({
        fromPath: fromPath.trim(),
        toPath: toPath.trim(),
        statusCode: Number(statusCode) || 301,
      });
      setOk("Redirect saved");
      setFromPath("");
      setToPath("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Link2}
        title="SEO & redirects"
        subtitle="Redirect manager plus links to public sitemap and robots.txt."
        breadcrumb={[{ label: "CMS", to: "/cms" }, { label: "SEO & redirects" }]}
      />
      <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-[11px] space-y-1">
          <div>
            Sitemap:{" "}
            <a className="text-amber-700 underline" href={`${ERP}/site/sitemap.xml`} target="_blank" rel="noreferrer">
              {ERP}/site/sitemap.xml
            </a>
          </div>
          <div>
            Robots:{" "}
            <a className="text-amber-700 underline" href={`${ERP}/site/robots.txt`} target="_blank" rel="noreferrer">
              {ERP}/site/robots.txt
            </a>
          </div>
          <p className="text-slate-500 mt-2">
            Page SEO fields (canonical, Open Graph, structured data) are edited on each CMS page.
          </p>
        </div>
        <Can perm="cms:manage">
          <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>From path</label>
              <input className={inputCls} value={fromPath} onChange={(e) => setFromPath(e.target.value)} placeholder="/p/old" />
            </div>
            <div>
              <label className={labelCls}>To path</label>
              <input className={inputCls} value={toPath} onChange={(e) => setToPath(e.target.value)} placeholder="/#/site/p/new" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={statusCode} onChange={(e) => setStatusCode(e.target.value)}>
                <option value="301">301</option>
                <option value="302">302</option>
              </select>
            </div>
            <div>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
                Add redirect
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="space-y-1 text-[11px]">
            {rows.map((r) => (
              <li key={r.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                {r.statusCode} {r.fromPath} → {r.toPath} {r.isActive ? "" : "(inactive)"}
              </li>
            ))}
          </ul>
        )}
    </PageShell>
  );
}
