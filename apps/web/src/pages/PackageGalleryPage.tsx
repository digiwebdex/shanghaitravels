import { FormEvent, useCallback, useEffect, useState } from "react";
import { Images } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { packagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { PackageGalleryItem, PackageMaster } from "@/lib/packages";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { PackageModuleNav } from "@/components/packages/PackageModuleNav";
import { PackagePicker } from "@/components/packages/PackagePicker";

export default function PackageGalleryPage() {
  const [packages, setPackages] = useState<PackageMaster[]>([]);
  const [packageId, setPackageId] = useState("");
  const [items, setItems] = useState<PackageGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      setPackages(listOf<PackageMaster>(await packagesApi.list({ limit: 200 })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGallery = useCallback(async () => {
    if (!packageId) {
      setItems([]);
      return;
    }
    try {
      setItems(listOf<PackageGalleryItem>(await packagesApi.listGallery(packageId)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load gallery");
    }
  }, [packageId]);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!packageId || !url.trim()) {
      setError("Package and image URL required");
      return;
    }
    try {
      await packagesApi.addGalleryItem(packageId, { url: url.trim(), caption: caption.trim() || undefined });
      setOk("Gallery item added");
      setUrl("");
      setCaption("");
      await loadGallery();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Add failed");
    }
  }

  async function removeItem(itemId: string) {
    if (!packageId) return;
    try {
      await packagesApi.removeGalleryItem(packageId, itemId);
      await loadGallery();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Remove failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Images}
        title="Package gallery"
        breadcrumb={[{ label: "Products", to: "/packages" }, { label: "Package gallery" }]}
      />
      <PackageModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <PackagePicker value={packageId} onChange={(id) => setPackageId(id)} label="Package" required />

        {packageId && (
          <form onSubmit={(e) => void addItem(e)} className="bg-white border border-[var(--border)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Image URL *</label>
              <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Caption</label>
              <input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
            <div>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold">
                Add image
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <InlineSpinner />
        ) : !packageId ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {packages.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPackageId(p.id)}
                className="text-left p-3 rounded-xl border border-[var(--border)] bg-white hover:border-[var(--accent)] text-[11px]"
              >
                <span className="font-bold">{p.name}</span>
                <span className="text-[var(--muted-foreground)] block">{p.code}</span>
              </button>
            ))}
          </div>
        ) : !items.length ? (
          <EmptyState title="No gallery items" hint="Add images for this package." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <figure key={item.id} className="rounded-xl border border-[var(--border)] overflow-hidden bg-white">
                <img src={item.url} alt={item.caption || ""} className="h-32 w-full object-cover" loading="lazy" />
                <figcaption className="p-2 text-[10px] flex justify-between gap-1">
                  <span className="truncate">{item.caption || "—"}</span>
                  <button type="button" className="text-red-600 shrink-0" onClick={() => void removeItem(item.id)}>
                    ×
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
    </PageShell>
  );
}
