import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Image, RefreshCw } from "lucide-react";
import { cmsApi, type CmsMedia } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { Column, DataTable } from "@/components/enterprise/DataTable";
import {
  KpiCard,
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
} from "@/components/enterprise/Page";

export default function CmsMediaPage() {
  const [rows, setRows] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [fileName, setFileName] = useState("");
  const [storageKey, setStorageKey] = useState("");
  const [altText, setAltText] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listMedia());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!fileName.trim() || !storageKey.trim()) {
      setError("File name and storage key / URL required");
      return;
    }
    try {
      await cmsApi.createMedia({
        fileName: fileName.trim(),
        storageKey: storageKey.trim(),
        altText: altText || undefined,
        mimeType,
      });
      setOk("Media registered");
      setFileName("");
      setStorageKey("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  const stats = useMemo(() => {
    const images = rows.filter((m) => (m.mimeType || "").startsWith("image/")).length;
    return { images };
  }, [rows]);

  const columns: Column<CmsMedia>[] = [
    { key: "file", header: "File", render: (m) => <span className="font-semibold">{m.fileName}</span> },
    {
      key: "key",
      header: "Storage key / URL",
      className: "max-w-[320px] break-all",
      render: (m) => <span className="text-[var(--muted-foreground)]">{m.storageKey}</span>,
    },
    { key: "mime", header: "MIME", render: (m) => m.mimeType || "—" },
    { key: "alt", header: "Alt", render: (m) => m.altText || "—" },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Image}
        title="Media library"
        subtitle="Register media storage keys / URLs for pages, banners, and content."
        breadcrumb={[{ label: "Website & CMS" }, { label: "Media" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CmsModuleNav />
      <StatStrip>
        <KpiCard label="Assets" value={rows.length} />
        <KpiCard label="Images" value={stats.images} tone="accent" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="cms:manage">
        <Surface>
          <SurfaceHeader title="Add media" />
          <form onSubmit={save} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 sm:p-5">
            <div>
              <label className={labelCls}>File name</label>
              <input className={inputCls} value={fileName} onChange={(e) => setFileName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>MIME type</label>
              <input className={inputCls} value={mimeType} onChange={(e) => setMimeType(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Storage key / URL</label>
              <input className={inputCls} value={storageKey} onChange={(e) => setStorageKey(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Alt text</label>
              <input className={inputCls} value={altText} onChange={(e) => setAltText(e.target.value)} />
            </div>
            <div>
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Add media
              </button>
            </div>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} asset${rows.length === 1 ? "" : "s"}`} />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No media" />
      </Surface>
    </PageShell>
  );
}
