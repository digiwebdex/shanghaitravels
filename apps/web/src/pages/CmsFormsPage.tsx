import { useCallback, useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import {
  PageHeader,
  PageShell,
} from "@/components/enterprise/Page";
import { Link } from "react-router";
import { cmsApi, type CmsFormSubmission } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { createsCrmLead } from "@/lib/cms";

export default function CmsFormsPage() {
  const [rows, setRows] = useState<CmsFormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listForms());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load forms");
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
        icon={Inbox}
        title="Form submissions"
        subtitle="Website intake inbox. Enquiry forms create CRM leads where applicable."
        breadcrumb={[{ label: "CMS", to: "/cms" }, { label: "Form submissions" }]}
      />
      <CmsModuleNav />
        <ErrorBanner message={error} />
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <table className="w-full text-[11px] bg-white border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Contact</th>
                <th className="text-left p-2">Page</th>
                <th className="text-left p-2">Lead</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-2">{r.formType}</td>
                  <td className="p-2 font-semibold">{r.name}</td>
                  <td className="p-2">
                    {r.phone || "—"}
                    <br />
                    {r.email || ""}
                  </td>
                  <td className="p-2">{r.pageSlug || "—"}</td>
                  <td className="p-2">
                    {r.leadId ? (
                      <Link className="text-amber-700 underline" to="/crm">
                        Lead
                      </Link>
                    ) : createsCrmLead(r.formType) ? (
                      "—"
                    ) : (
                      <span className="text-slate-400">n/a</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </PageShell>
  );
}
