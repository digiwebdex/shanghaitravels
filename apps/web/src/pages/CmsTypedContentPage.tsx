import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Newspaper, RefreshCw } from "lucide-react";
import { cmsApi, type CmsContent } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { SuccessBanner } from "@/components/Feedback";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  ListPageShell,
  StatStrip,
  btnGhost,
} from "@/components/enterprise/Page";

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

  const stats = useMemo(() => {
    const published = rows.filter((r) => r.status === "published").length;
    return { published, draft: rows.length - published };
  }, [rows]);

  const columns: Column<CmsContent>[] = [
    { key: "title", header: "Title", render: (r) => <span className="font-semibold text-[var(--primary)]">{r.title}</span> },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status} tone={statusTone(r.status)} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
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
      ),
    },
  ];

  return (
    <ListPageShell
      wide
      icon={Newspaper}
      title={LABELS[type] || type}
      subtitle={`CMS content filtered to type=${type}.`}
      breadcrumb={[{ label: "Website & CMS" }, { label: LABELS[type] || type }]}
      moduleNav={<CmsModuleNav />}
      actions={
        <button type="button" className={btnGhost} onClick={() => void load()}>
          <RefreshCw size={12} /> Refresh
        </button>
      }
      stats={
        <StatStrip>
          <KpiCard label="Items" value={rows.length} />
          <KpiCard label="Draft / other" value={stats.draft} tone="warning" />
          <KpiCard label="Published" value={stats.published} tone="success" />
        </StatStrip>
      }
      error={error}
    >
      <SuccessBanner message={ok} />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle={`No ${type} content yet`}
      />
    </ListPageShell>
  );
}
