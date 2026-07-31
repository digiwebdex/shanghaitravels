import { FormEvent, useCallback, useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { cmsApi, type CmsContent } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import {
  DEFAULT_HERO_SERVICES,
  HERO_ICON_OPTIONS,
  HERO_SERVICE_MAX,
  HERO_SERVICE_TYPE,
  parseHeroServiceFromCms,
  type HeroServiceItem,
} from "@/lib/heroServices";
import { slugify } from "@/lib/cms";

export default function CmsHeroServicesPage() {
  const [rows, setRows] = useState<CmsContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HeroServiceItem>({
    enabled: true,
    icon: "passport",
    title: "",
    description: "",
    buttonText: "Learn more",
    url: "/inquiry",
    sortOrder: 10,
    slug: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await cmsApi.listContent({ type: HERO_SERVICE_TYPE }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load hero services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publishedCount = rows.filter((r) => r.status === "published").length;

  function resetForm() {
    setEditingId(null);
    setForm({
      enabled: true,
      icon: "passport",
      title: "",
      description: "",
      buttonText: "Learn more",
      url: "/inquiry",
      sortOrder: (rows.length + 1) * 10,
      slug: "",
    });
  }

  function editRow(row: CmsContent) {
    const parsed = parseHeroServiceFromCms(row as CmsContent & { coverUrl?: string | null; meta?: unknown; sortOrder?: number });
    setEditingId(row.id);
    setForm({ ...parsed, slug: row.slug });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (form.enabled && !editingId && publishedCount >= HERO_SERVICE_MAX) {
      setError(`Maximum ${HERO_SERVICE_MAX} enabled services`);
      return;
    }
    const payload = {
      type: HERO_SERVICE_TYPE,
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      summary: form.description.trim(),
      body: form.buttonText.trim() || "Learn more",
      coverUrl: form.icon,
      meta: { url: form.url.trim() || "/inquiry", icon: form.icon, buttonText: form.buttonText.trim() },
      sortOrder: Number(form.sortOrder) || 0,
      status: form.enabled ? "published" : "draft",
    };
    try {
      if (editingId) {
        await cmsApi.updateContent(editingId, payload);
        setOk("Hero service updated");
      } else {
        await cmsApi.createContent(payload);
        setOk("Hero service created");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function toggle(row: CmsContent) {
    setError("");
    try {
      if (row.status === "published") {
        await cmsApi.unpublishContent(row.id);
        setOk("Service disabled");
      } else {
        if (publishedCount >= HERO_SERVICE_MAX) {
          setError(`Maximum ${HERO_SERVICE_MAX} enabled services`);
          return;
        }
        await cmsApi.publishContent(row.id);
        setOk("Service enabled");
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function seedDefaults() {
    setError("");
    try {
      for (const item of DEFAULT_HERO_SERVICES) {
        const exists = rows.some((r) => r.slug === item.slug);
        if (exists) continue;
        await cmsApi.createContent({
          type: HERO_SERVICE_TYPE,
          title: item.title,
          slug: item.slug,
          summary: item.description,
          body: item.buttonText,
          coverUrl: item.icon,
          meta: { url: item.url, icon: item.icon, buttonText: item.buttonText },
          sortOrder: item.sortOrder,
          status: "published",
        });
      }
      setOk("Default hero services seeded");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Seed failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="cms" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid size={16} className="text-amber-600" /> Home · Hero Services
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Featured service cards on the homepage hero. Enable up to {HERO_SERVICE_MAX} services.
          </p>
        </div>
        <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="cms:manage">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void seedDefaults()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:border-slate-300"
            >
              Seed default 4 services
            </button>
            <span className="text-[11px] text-slate-500 self-center">
              Enabled: {publishedCount}/{HERO_SERVICE_MAX}
            </span>
          </div>

          <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 text-[11px] font-semibold text-slate-700">
              {editingId ? "Edit service" : "Add service"}
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Icon</label>
              <select
                className={inputCls}
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              >
                {HERO_ICON_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Short description</label>
              <input
                className={inputCls}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>Button text</label>
              <input
                className={inputCls}
                value={form.buttonText}
                onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelCls}>URL</label>
              <input
                className={inputCls}
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="/inquiry?service=visa"
              />
            </div>
            <div>
              <label className={labelCls}>Display order</label>
              <input
                type="number"
                className={inputCls}
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                />
                Enabled
              </label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-semibold">
                {editingId ? "Update" : "Add"} service
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Can>

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <ul className="space-y-2">
            {rows
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((row) => {
                const item = parseHeroServiceFromCms(row as CmsContent & { coverUrl?: string | null; meta?: unknown; sortOrder?: number });
                return (
                  <li key={row.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-800">
                        {item.title}{" "}
                        <span className="text-slate-400 font-medium">
                          · {item.icon} · order {item.sortOrder}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{item.description}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {item.buttonText} → {item.url}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.enabled ? "Enabled" : "Disabled"}
                      </span>
                      <Can perm="cms:manage">
                        <button
                          type="button"
                          onClick={() => editRow(row)}
                          className="px-2 py-1 rounded-md border border-slate-200 text-[10px] font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggle(row)}
                          className="px-2 py-1 rounded-md border border-slate-200 text-[10px] font-semibold"
                        >
                          {item.enabled ? "Disable" : "Enable"}
                        </button>
                      </Can>
                    </div>
                  </li>
                );
              })}
            {!rows.length && (
              <li className="text-[12px] text-slate-500 py-8 text-center border border-dashed border-slate-200 rounded-xl">
                No hero services yet. Seed defaults or add a service above.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
