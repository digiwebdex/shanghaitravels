import { FormEvent, useCallback, useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { destinationsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { DestinationMaster } from "@/lib/destinations";
import {
  DESTINATION_CATEGORIES,
  DESTINATION_CATEGORY_LABELS,
  DESTINATION_REGIONS,
  emptyDestinationForm,
  destinationFormPayload,
  destinationToForm,
  slugifyDestination,
  validateDestinationForm,
} from "@/lib/destinations";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { PackageModuleNav } from "@/components/packages/PackageModuleNav";

export default function DestinationsListPage() {
  const [rows, setRows] = useState<DestinationMaster[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDestinationForm());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf<DestinationMaster>(await destinationsApi.list({ q: q || undefined, limit: 200 })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditId(null);
    setForm(emptyDestinationForm());
  }

  function loadEdit(d: DestinationMaster) {
    setEditId(d.id);
    setForm(destinationToForm(d));
    setOk(`Editing ${d.code}`);
  }

  function patchForm<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function toggleCategory(cat: (typeof DESTINATION_CATEGORIES)[number]) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateDestinationForm(form);
    if (bad) {
      setError(bad);
      return;
    }
    setError("");
    setOk("");
    const body = destinationFormPayload(form);
    try {
      if (editId) {
        await destinationsApi.update(editId, body);
        setOk("Destination updated");
      } else {
        await destinationsApi.create(body);
        setOk("Destination created");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function act(id: string, action: "publish" | "unpublish" | "archive") {
    setError("");
    try {
      if (action === "publish") await destinationsApi.publish(id);
      else if (action === "unpublish") await destinationsApi.unpublish(id);
      else await destinationsApi.archive(id);
      setOk(`Destination ${action}${action.endsWith("e") ? "d" : "ed"}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Globe2}
        title="Destination Master"
        subtitle="Country/region catalog for homepage showcase, browse pages, and package grouping."
        breadcrumb={[{ label: "Products", to: "/packages" }, { label: "Destination Master" }]}
      />
      <PackageModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={labelCls} htmlFor="dest-q">
              Search
            </label>
            <input
              id="dest-q"
              className={inputCls}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Code, country, region…"
            />
          </div>
        </div>

        <Can perm="application:write">
          <form onSubmit={(e) => void save(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">
              {editId ? "Edit destination" : "Create destination"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Internal code</label>
                <input className={inputCls} value={form.code} onChange={(e) => patchForm("code", e.target.value)} placeholder="Optional" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Destination name *</label>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => {
                    patchForm("name", e.target.value);
                    if (!form.slug) patchForm("slug", slugifyDestination(e.target.value));
                    if (!form.countryName) patchForm("countryName", e.target.value);
                  }}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Slug *</label>
                <input className={inputCls} value={form.slug} onChange={(e) => patchForm("slug", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Country code</label>
                <input className={inputCls} value={form.countryCode} onChange={(e) => patchForm("countryCode", e.target.value.toUpperCase())} placeholder="BD" />
              </div>
              <div>
                <label className={labelCls}>Region</label>
                <select className={inputCls} value={form.region} onChange={(e) => patchForm("region", e.target.value)}>
                  <option value="">—</option>
                  {DESTINATION_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Flag emoji</label>
                <input className={inputCls} value={form.flagEmoji} onChange={(e) => patchForm("flagEmoji", e.target.value)} placeholder="🇧🇩" />
              </div>
              <div>
                <label className={labelCls}>Flag URL</label>
                <input className={inputCls} value={form.flagUrl} onChange={(e) => patchForm("flagUrl", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Hero image URL</label>
                <input className={inputCls} value={form.heroImageUrl} onChange={(e) => patchForm("heroImageUrl", e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls}>Summary</label>
                <input className={inputCls} value={form.summary} onChange={(e) => patchForm("summary", e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls}>Description</label>
                <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => patchForm("description", e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls}>Map embed URL</label>
                <input className={inputCls} value={form.mapEmbedUrl} onChange={(e) => patchForm("mapEmbedUrl", e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <span className={labelCls}>Categories</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DESTINATION_CATEGORIES.map((c) => (
                    <label key={c} className="inline-flex items-center gap-1.5 text-[11px]">
                      <input type="checkbox" checked={form.categories.includes(c)} onChange={() => toggleCategory(c)} />
                      {DESTINATION_CATEGORY_LABELS[c]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="px-4 py-2 rounded-lg bg-amber-600 text-white text-[11px] font-bold">
                {editId ? "Update" : "Create"}
              </button>
              {editId && (
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold">
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </Can>

        {loading ? (
          <InlineSpinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No destinations yet" hint="Create a destination master record above." />
        ) : (
          <table className="w-full text-[11px] bg-white border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2">Destination</th>
                <th className="text-left p-2">Region</th>
                <th className="text-left p-2">Packages</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Flags</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="p-2">
                    <span className="font-semibold">{d.name}</span>
                    <span className="text-slate-400 block font-mono text-[10px]">{d.code}</span>
                  </td>
                  <td className="p-2">{d.region || "—"}</td>
                  <td className="p-2">{d.packageCount ?? 0}</td>
                  <td className="p-2">{d.status}</td>
                  <td className="p-2 text-[10px]">
                    {d.homepageFeatured && <span className="text-amber-700">Home </span>}
                    {d.popular && <span className="text-orange-700">Popular </span>}
                    {d.featured && <span className="text-emerald-700">Featured</span>}
                  </td>
                  <td className="p-2">
                    <Can perm="application:write">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className="text-amber-700" onClick={() => loadEdit(d)}>
                          Edit
                        </button>
                        {d.status !== "published" && (
                          <button type="button" className="text-emerald-700" onClick={() => void act(d.id, "publish")}>
                            Publish
                          </button>
                        )}
                        {d.status === "published" && (
                          <button type="button" className="text-slate-600" onClick={() => void act(d.id, "unpublish")}>
                            Unpublish
                          </button>
                        )}
                        {d.status !== "archived" && (
                          <button type="button" className="text-red-600" onClick={() => void act(d.id, "archive")}>
                            Archive
                          </button>
                        )}
                      </div>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </PageShell>
  );
}
