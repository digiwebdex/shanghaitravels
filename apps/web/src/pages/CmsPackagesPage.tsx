import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { packagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { DEFAULT_COLLECTIONS, PACKAGE_COLLECTIONS } from "@/lib/packages";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { PackageCard } from "@/components/packages/PackageCard";

export default function CmsPackagesPage() {
  const [rows, setRows] = useState<PackageMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [preview, setPreview] = useState<(typeof PACKAGE_COLLECTIONS)[number]>("home");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf<PackageMaster>(await packagesApi.list({ limit: 200 })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleFlag(p: PackageMaster, flag: "homeFeatured" | "popular" | "recommended") {
    try {
      await packagesApi.update(p.id, { [flag]: !p[flag] });
      setOk(`${flag} updated for ${p.code}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  const previewRows = rows.filter((p) => {
    if (preview === "home") return p.homeFeatured;
    if (preview === "featured") return p.homeFeatured || p.recommended;
    if (preview === "popular") return p.popular;
    if (preview === "recommended") return p.recommended;
    if (preview === "agent") return p.agentEnabled;
    if (preview === "corporate") return p.corporateEnabled;
    return p.status === "published";
  });

  return (
    <div>
      <DemoBadge moduleKey="cms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-600" /> Featured packages (CMS)
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Toggle homepage and collection flags on published packages.
          </p>
        </div>
        <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        {loading ? (
          <InlineSpinner />
        ) : (
          <>
            <table className="w-full text-[11px] bg-white border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-2">Package</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Home</th>
                  <th className="text-left p-2">Popular</th>
                  <th className="text-left p-2">Recommended</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="p-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-slate-400 block font-mono text-[10px]">{p.code}</span>
                    </td>
                    <td className="p-2">{p.status}</td>
                    <td className="p-2">
                      <Can perm="cms:manage">
                        <button type="button" className="text-amber-700" onClick={() => void toggleFlag(p, "homeFeatured")}>
                          {p.homeFeatured ? "On" : "Off"}
                        </button>
                      </Can>
                    </td>
                    <td className="p-2">
                      <Can perm="cms:manage">
                        <button type="button" className="text-amber-700" onClick={() => void toggleFlag(p, "popular")}>
                          {p.popular ? "On" : "Off"}
                        </button>
                      </Can>
                    </td>
                    <td className="p-2">
                      <Can perm="cms:manage">
                        <button type="button" className="text-amber-700" onClick={() => void toggleFlag(p, "recommended")}>
                          {p.recommended ? "On" : "Off"}
                        </button>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div>
              <p className="text-[11px] font-bold text-slate-700 mb-2">Collection preview</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PACKAGE_COLLECTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPreview(c)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
                      preview === c ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200"
                    }`}
                  >
                    {DEFAULT_COLLECTIONS[c]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {previewRows.slice(0, 6).map((p) => (
                  <PackageCard key={p.id} pkg={p} variant="portal" detailPath={`/site/packages/${p.slug}`} />
                ))}
                {!previewRows.length && <p className="text-[11px] text-slate-400">No packages in this collection.</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
