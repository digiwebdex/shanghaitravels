import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import { Newspaper } from "lucide-react";
import { cmsApi, type CmsContent } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { PageHeader, PageShell, Surface, SurfaceHeader } from "@/components/enterprise/Page";
import { Pill, statusTone } from "@/components/enterprise/DataTable";

const LABELS: Record<string, string> = {
  blog: "Blog",
  faq: "FAQ",
  testimonial: "Testimonials",
};

/**
 * Thin typed view over CmsContent — same API as /cms/content, filtered by type.
 */
export default function CmsTypedContentPage() {
  const { type = "blog" } = useParams<{ type: string }>();
  const [rows, setRows] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const all = await cmsApi.listContent({ type });
      setRows(all.filter((r) => r.type === type));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageShell>
      <PageHeader
        icon={Newspaper}
        title={LABELS[type] || type}
        subtitle={`CMS content filtered to type=${type}.`}
        breadcrumb={[{ label: "Website & CMS" }, { label: LABELS[type] || type }]}
      />
      <CmsModuleNav />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />
      <Surface>
        <SurfaceHeader title={`${rows.length} item${rows.length === 1 ? "" : "s"}`} />
        {loading ? (
          <div className="flex justify-center py-16"><InlineSpinner /></div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-[11.5px] text-slate-400">No {type} content yet</p>
        ) : (
          <table className="w-full text-[11.5px]">
            <thead className="bg-slate-50 text-[9.5px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{r.title}</td>
                  <td className="px-4 py-2.5"><Pill value={r.status} tone={statusTone(r.status)} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <Can perm="cms:publish">
                      {r.status !== "published" && (
                        <button
                          type="button"
                          className="font-semibold text-emerald-700 hover:underline"
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
      </Surface>
    </PageShell>
  );
}
