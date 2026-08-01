import { useCallback, useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
} from "@/components/enterprise/Page";
import { cmsApi, type CmsReports } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";

export default function CmsReportsPage() {
  const [data, setData] = useState<CmsReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await cmsApi.reports());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load CMS reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageShell wide>
      <PageHeader
        icon={BarChart2}
        title="CMS reports"
        subtitle="Page views, form submissions, lead generation by page, publishing metrics."
        breadcrumb={[{ label: "CMS", to: "/cms" }, { label: "CMS reports" }]}
      />
      <CmsModuleNav />
        <ErrorBanner message={error} />
        {loading || !data ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Publishing</h2>
              <ul className="text-[11px] space-y-1">
                <li className="flex justify-between">
                  <span>Published pages</span>
                  <span className="font-semibold">{data.publishing.publishedPages}</span>
                </li>
                <li className="flex justify-between">
                  <span>Published content</span>
                  <span className="font-semibold">{data.publishing.publishedContent}</span>
                </li>
                <li className="flex justify-between">
                  <span>Leads from forms</span>
                  <span className="font-semibold">{data.publishing.leadsFromForms}</span>
                </li>
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Form submissions</h2>
              <ul className="text-[11px] space-y-1">
                {data.formSubmissions.map((r) => (
                  <li key={r.formType} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.formType}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Page views</h2>
              <ul className="text-[11px] space-y-1 max-h-64 overflow-auto">
                {data.pageViews.map((r) => (
                  <li key={r.path} className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="truncate mr-2">{r.path}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold mb-2">Lead generation by page</h2>
              <ul className="text-[11px] space-y-1">
                {data.leadGenerationByPage.map((r) => (
                  <li key={r.pageSlug} className="flex justify-between border-b border-slate-50 pb-1">
                    <span>{r.pageSlug}</span>
                    <span className="font-semibold">{r.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
    </PageShell>
  );
}
