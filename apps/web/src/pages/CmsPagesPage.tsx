import { FormEvent, useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { cmsApi, type CmsPage } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { PAGE_STATUSES, validatePageInput } from "@/lib/cms";

export default function CmsPagesPage() {
  const [rows, setRows] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await cmsApi.bootstrap().catch(() => null);
      setRows(await cmsApi.listPages(statusFilter ? { status: statusFilter } : undefined));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validatePageInput({ title, slug });
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await cmsApi.upsertPage({
        title: title.trim(),
        slug: slug.trim() || title.trim(),
        body,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        blocks: [
          { type: "hero", props: { heading: title, text: body.slice(0, 160) } },
          { type: "richtext", props: { html: `<p>${body}</p>` } },
        ],
      });
      setOk("Page saved as draft");
      setTitle("");
      setSlug("");
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function act(id: string, kind: "review" | "publish" | "unpublish" | "delete") {
    try {
      if (kind === "review") await cmsApi.submitReview(id);
      if (kind === "publish") await cmsApi.publishPage(id);
      if (kind === "unpublish") await cmsApi.unpublishPage(id);
      if (kind === "delete") await cmsApi.deletePage(id);
      setOk(`Page ${kind} ok`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="cms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-amber-600" /> CMS pages
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Page builder, draft → review → publish workflow, SEO metadata, version history.
          </p>
        </div>
        <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <div className="flex gap-2 items-center">
          <label className={labelCls}>Status</label>
          <select className={inputCls + " max-w-[160px]"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {PAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Can perm="cms:manage">
          <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Body</label>
              <textarea className={inputCls} rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>SEO title</label>
              <input className={inputCls} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>SEO description</label>
              <input className={inputCls} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
                Save page
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Slug</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Branch</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="p-2 font-semibold">{r.title}</td>
                    <td className="p-2">{r.slug}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2">{r.branchId || "—"}</td>
                    <td className="p-2 text-right space-x-1">
                      <Can perm="cms:manage">
                        <button type="button" className="text-amber-700 underline" onClick={() => void act(r.id, "review")}>
                          Review
                        </button>
                      </Can>
                      <Can perm="cms:publish">
                        <button type="button" className="text-emerald-700 underline" onClick={() => void act(r.id, "publish")}>
                          Publish
                        </button>
                        <button type="button" className="text-slate-600 underline" onClick={() => void act(r.id, "unpublish")}>
                          Unpublish
                        </button>
                      </Can>
                      <Can perm="cms:manage">
                        <button type="button" className="text-red-600 underline" onClick={() => void act(r.id, "delete")}>
                          Delete
                        </button>
                      </Can>
                    </td>
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
