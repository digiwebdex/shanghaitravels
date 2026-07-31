import { FormEvent, useCallback, useEffect, useState } from "react";
import { Image } from "lucide-react";
import { cmsApi, type CmsMedia } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";

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

  return (
    <div>
      <DemoBadge moduleKey="cms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Image size={16} className="text-amber-600" /> Media library
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Register media storage keys / URLs for pages, banners, and content.</p>
        </div>
        <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="cms:manage">
          <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
                Add media
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {rows.map((m) => (
              <li key={m.id} className="bg-white border border-slate-200 rounded-xl p-3 text-[11px]">
                <div className="font-semibold">{m.fileName}</div>
                <div className="text-slate-500 break-all">{m.storageKey}</div>
                <div className="text-slate-400">{m.mimeType}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
