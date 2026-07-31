import { FormEvent, useCallback, useEffect, useState } from "react";
import { FolderTree } from "lucide-react";
import { packagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { PackageCategory } from "@/lib/packages";
import { slugifyPackage } from "@/lib/packages";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { PackageModuleNav } from "@/components/packages/PackageModuleNav";

export default function PackageCategoriesPage() {
  const [rows, setRows] = useState<PackageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf<PackageCategory>(await packagesApi.listCategories()));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Code and name required");
      return;
    }
    try {
      await packagesApi.createCategory({
        code: code.trim(),
        name: name.trim(),
        slug: slug.trim() || slugifyPackage(name),
        description: description.trim() || undefined,
        active: true,
      });
      setOk("Category created");
      setCode("");
      setName("");
      setSlug("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function toggle(c: PackageCategory) {
    try {
      await packagesApi.updateCategory(c.id, { active: !c.active });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="products" />
      <div className="p-5 max-w-[900px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <FolderTree size={16} className="text-amber-600" /> Package categories
          </h1>
        </div>
        <PackageModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="application:write">
          <form onSubmit={(e) => void save(e)} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Code *</label>
              <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Name *</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(slugifyPackage(e.target.value));
                }}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold">
                Add category
              </button>
            </div>
          </form>
        </Can>

        {loading ? (
          <InlineSpinner />
        ) : !rows.length ? (
          <EmptyState title="No categories" hint="Add categories to organize packages." />
        ) : (
          <table className="w-full text-[11px] bg-white border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2">Code</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Slug</th>
                <th className="text-left p-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="p-2 font-mono">{c.code}</td>
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.slug}</td>
                  <td className="p-2">
                    <button type="button" onClick={() => void toggle(c)} className="text-amber-700 font-semibold">
                      {c.active !== false ? "Yes" : "No"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
