import { FormEvent, useCallback, useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { cmsApi, type CmsContent } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { CONTENT_TYPES, validateContentInput } from "@/lib/cms";

export default function CmsContentPage() {
  const [rows, setRows] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [type, setType] = useState<string>("blog");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listContent());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateContentInput({ type, title });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await cmsApi.createContent({ type, title: title.trim(), summary, body });
      setOk("Content created");
      setTitle("");
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="cms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Newspaper size={16} className="text-amber-600" /> Content library
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Blog, announcements, FAQs, testimonials, galleries, downloads.
          </p>
        </div>
        <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="cms:manage">
          <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Summary</label>
              <input className={inputCls} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Body</label>
              <textarea className={inputCls} rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
                Create content
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <table className="w-full text-[11px] bg-white border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-2">{r.type}</td>
                  <td className="p-2 font-semibold">{r.title}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2 text-right">
                    <Can perm="cms:publish">
                      {r.status !== "published" && (
                        <button
                          type="button"
                          className="text-emerald-700 underline"
                          onClick={() =>
                            void cmsApi
                              .publishContent(r.id)
                              .then(() => {
                                setOk("Published");
                                return load();
                              })
                              .catch((err) => setError(err instanceof ApiError ? err.message : "Publish failed"))
                          }
                        >
                          Publish
                        </button>
                      )}
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
