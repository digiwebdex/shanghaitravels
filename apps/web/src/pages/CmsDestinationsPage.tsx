import { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { destinationsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { DestinationMaster, DestinationShowcaseSettings } from "@/lib/destinations";
import { DEFAULT_SHOWCASE_SETTINGS, mergeShowcaseSettings } from "@/lib/destinations";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { DestinationShowcaseGrid } from "@/components/destinations/DestinationShowcaseGrid";

export default function CmsDestinationsPage() {
  const [rows, setRows] = useState<DestinationMaster[]>([]);
  const [settings, setSettings] = useState<DestinationShowcaseSettings>(DEFAULT_SHOWCASE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, s] = await Promise.all([
        destinationsApi.list({ limit: 200 }),
        destinationsApi.getShowcaseSettings().catch(() => DEFAULT_SHOWCASE_SETTINGS),
      ]);
      setRows(listOf<DestinationMaster>(list));
      setSettings(mergeShowcaseSettings(s));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load destinations CMS");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleFlag(d: DestinationMaster, flag: "homepageFeatured" | "popular" | "featured") {
    try {
      await destinationsApi.update(d.id, { [flag]: !d[flag] });
      setOk(`${flag} updated for ${d.code}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function updateOrder(d: DestinationMaster, displayOrder: number) {
    try {
      await destinationsApi.update(d.id, { displayOrder, sortOrder: displayOrder });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Order update failed");
    }
  }

  async function saveSettings() {
    try {
      const saved = await destinationsApi.updateShowcaseSettings(settings);
      setSettings(mergeShowcaseSettings(saved));
      setOk("Showcase settings saved");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Settings save failed");
    }
  }

  function patchSetting<K extends keyof DestinationShowcaseSettings>(key: K, val: DestinationShowcaseSettings[K]) {
    setSettings((s) => ({ ...s, [key]: val }));
  }

  const previewRows = rows.filter((d) => d.homepageFeatured || d.popular);

  return (
    <div>
      <DemoBadge moduleKey="cms" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <MapPin size={16} className="text-amber-600" /> Popular Destinations (CMS)
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Control homepage showcase flags, card order, and display settings.
          </p>
        </div>
        <CmsModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        {loading ? (
          <InlineSpinner />
        ) : (
          <>
            <Can perm="cms:manage">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Showcase settings</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="inline-flex items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={settings.enabled} onChange={(e) => patchSetting("enabled", e.target.checked)} />
                    Enabled on homepage
                  </label>
                  <label className="inline-flex items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={settings.showPackageCount} onChange={(e) => patchSetting("showPackageCount", e.target.checked)} />
                    Show package count
                  </label>
                  <label className="inline-flex items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={settings.showRegion} onChange={(e) => patchSetting("showRegion", e.target.checked)} />
                    Show region
                  </label>
                  <label className="inline-flex items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={settings.showFlag} onChange={(e) => patchSetting("showFlag", e.target.checked)} />
                    Show flag
                  </label>
                  <label className="inline-flex items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={settings.showHeroImage} onChange={(e) => patchSetting("showHeroImage", e.target.checked)} />
                    Show hero image
                  </label>
                  <label className="inline-flex items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={settings.showCta} onChange={(e) => patchSetting("showCta", e.target.checked)} />
                    Show CTA
                  </label>
                  <div>
                    <label className={labelCls}>Max cards</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      className={inputCls}
                      value={settings.maxCards}
                      onChange={(e) => patchSetting("maxCards", Number(e.target.value) || 8)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>CTA label</label>
                    <input className={inputCls} value={settings.ctaLabel} onChange={(e) => patchSetting("ctaLabel", e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={() => void saveSettings()} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-[11px] font-bold">
                  Save settings
                </button>
              </div>
            </Can>

            <table className="w-full text-[11px] bg-white border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-2">Destination</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Home</th>
                  <th className="text-left p-2">Popular</th>
                  <th className="text-left p-2">Featured</th>
                  <th className="text-left p-2">Order</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <td className="p-2">
                      <span className="font-semibold">{d.name}</span>
                      <span className="text-slate-400 block font-mono text-[10px]">{d.code}</span>
                    </td>
                    <td className="p-2">{d.status}</td>
                    <td className="p-2">
                      <Can perm="cms:manage">
                        <button type="button" className="text-amber-700" onClick={() => void toggleFlag(d, "homepageFeatured")}>
                          {d.homepageFeatured ? "On" : "Off"}
                        </button>
                      </Can>
                    </td>
                    <td className="p-2">
                      <Can perm="cms:manage">
                        <button type="button" className="text-amber-700" onClick={() => void toggleFlag(d, "popular")}>
                          {d.popular ? "On" : "Off"}
                        </button>
                      </Can>
                    </td>
                    <td className="p-2">
                      <Can perm="cms:manage">
                        <button type="button" className="text-amber-700" onClick={() => void toggleFlag(d, "featured")}>
                          {d.featured ? "On" : "Off"}
                        </button>
                      </Can>
                    </td>
                    <td className="p-2">
                      <Can perm="cms:manage">
                        <input
                          type="number"
                          className="w-16 rounded border border-slate-200 px-1 py-0.5"
                          defaultValue={d.displayOrder ?? d.sortOrder ?? 0}
                          onBlur={(e) => void updateOrder(d, Number(e.target.value) || 0)}
                        />
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div>
              <p className="text-[11px] font-bold text-slate-700 mb-2">Homepage preview</p>
              <DestinationShowcaseGrid
                destinations={previewRows}
                settings={settings}
                variant="light"
                title="Popular Destinations"
                subtitle="Preview of homepageFeatured / popular destinations"
                browseHref="/site/destinations"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
