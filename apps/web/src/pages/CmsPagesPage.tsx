import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { cmsApi, type CmsPage } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { PAGE_STATUSES, validatePageInput } from "@/lib/cms";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  ListToolbar,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  selectClassName,
} from "@/components/enterprise/Page";

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

  const stats = useMemo(() => {
    const published = rows.filter((r) => r.status === "published").length;
    const draft = rows.filter((r) => r.status === "draft").length;
    return { published, draft };
  }, [rows]);

  const columns: Column<CmsPage>[] = [
    { key: "title", header: "Title", render: (r) => <span className="font-semibold">{r.title}</span> },
    { key: "slug", header: "Slug", render: (r) => r.slug },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status} tone={statusTone(r.status)} /> },
    { key: "branch", header: "Branch", render: (r) => r.branchId || "—" },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Can perm="cms:manage">
            <button
              type="button"
              className="text-[11px] font-semibold text-[var(--accent)] hover:underline"
              onClick={() => void act(r.id, "review")}
            >
              Review
            </button>
          </Can>
          <Can perm="cms:publish">
            <button
              type="button"
              className="text-[11px] font-semibold text-emerald-700 hover:underline"
              onClick={() => void act(r.id, "publish")}
            >
              Publish
            </button>
            <button
              type="button"
              className="text-[11px] font-semibold text-[var(--muted-foreground)] hover:underline"
              onClick={() => void act(r.id, "unpublish")}
            >
              Unpublish
            </button>
          </Can>
          <Can perm="cms:manage">
            <button
              type="button"
              className="text-[11px] font-semibold text-rose-600 hover:underline"
              onClick={() => void act(r.id, "delete")}
            >
              Delete
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={FileText}
        title="CMS pages"
        subtitle="Page builder, draft → review → publish workflow, SEO metadata, version history."
        breadcrumb={[{ label: "Website & CMS" }, { label: "Pages" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CmsModuleNav />
      <StatStrip>
        <KpiCard label="Pages" value={rows.length} />
        <KpiCard label="Draft" value={stats.draft} tone="warning" />
        <KpiCard label="Published" value={stats.published} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="cms:manage">
        <Surface>
          <SurfaceHeader title="Save page" />
          <form onSubmit={save} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 sm:p-5">
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
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Save page
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <ListToolbar>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClassName}>
            <option value="">All statuses</option>
            {PAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </ListToolbar>
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No pages" />
      </Surface>
    </PageShell>
  );
}
