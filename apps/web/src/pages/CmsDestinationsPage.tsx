import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { destinationsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { DestinationMaster, DestinationShowcaseSettings } from "@/lib/destinations";
import { DEFAULT_SHOWCASE_SETTINGS, mergeShowcaseSettings } from "@/lib/destinations";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { DestinationShowcaseGrid } from "@/components/destinations/DestinationShowcaseGrid";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
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

  const stats = useMemo(
    () => ({
      home: rows.filter((d) => d.homepageFeatured).length,
      popular: rows.filter((d) => d.popular).length,
      featured: rows.filter((d) => d.featured).length,
    }),
    [rows],
  );

  const columns: Column<DestinationMaster>[] = [
    {
      key: "dest",
      header: "Destination",
      render: (d) => (
        <div>
          <span className="font-semibold">{d.name}</span>
          <span className="block font-mono text-[10px] text-[var(--muted-foreground)]">{d.code}</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (d) => <Pill value={d.status} tone={statusTone(d.status)} /> },
    {
      key: "home",
      header: "Home",
      render: (d) => (
        <Can perm="cms:manage">
          <button
            type="button"
            className="font-semibold text-[var(--accent)]"
            onClick={() => void toggleFlag(d, "homepageFeatured")}
          >
            {d.homepageFeatured ? "On" : "Off"}
          </button>
        </Can>
      ),
    },
    {
      key: "popular",
      header: "Popular",
      render: (d) => (
        <Can perm="cms:manage">
          <button type="button" className="font-semibold text-[var(--accent)]" onClick={() => void toggleFlag(d, "popular")}>
            {d.popular ? "On" : "Off"}
          </button>
        </Can>
      ),
    },
    {
      key: "featured",
      header: "Featured",
      render: (d) => (
        <Can perm="cms:manage">
          <button type="button" className="font-semibold text-[var(--accent)]" onClick={() => void toggleFlag(d, "featured")}>
            {d.featured ? "On" : "Off"}
          </button>
        </Can>
      ),
    },
    {
      key: "order",
      header: "Order",
      render: (d) => (
        <Can perm="cms:manage">
          <input
            type="number"
            className="w-16 rounded-lg border border-[var(--border)] px-1 py-0.5"
            defaultValue={d.displayOrder ?? d.sortOrder ?? 0}
            onBlur={(e) => void updateOrder(d, Number(e.target.value) || 0)}
          />
        </Can>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={MapPin}
        title="Popular Destinations (CMS)"
        subtitle="Control homepage showcase flags, card order, and display settings."
        breadcrumb={[{ label: "Website & CMS" }, { label: "Destinations" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CmsModuleNav />
      <StatStrip>
        <KpiCard label="Destinations" value={rows.length} />
        <KpiCard label="Homepage" value={stats.home} tone="accent" />
        <KpiCard label="Popular" value={stats.popular} />
        <KpiCard label="Featured" value={stats.featured} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="cms:manage">
        <Surface>
          <SurfaceHeader title="Showcase settings" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="inline-flex items-center gap-2 text-[11px]">
                <input type="checkbox" checked={settings.enabled} onChange={(e) => patchSetting("enabled", e.target.checked)} />
                Enabled on homepage
              </label>
              <label className="inline-flex items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={settings.showPackageCount}
                  onChange={(e) => patchSetting("showPackageCount", e.target.checked)}
                />
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
                <input
                  type="checkbox"
                  checked={settings.showHeroImage}
                  onChange={(e) => patchSetting("showHeroImage", e.target.checked)}
                />
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
            <button type="button" onClick={() => void saveSettings()} className={btnPrimary} style={btnPrimaryStyle}>
              Save settings
            </button>
          </div>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title="Destinations" />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No destinations" />
      </Surface>

      <Surface>
        <SurfaceHeader title="Homepage preview" />
        <div className="p-4 sm:p-5">
          <DestinationShowcaseGrid
            destinations={previewRows}
            settings={settings}
            variant="light"
            title="Popular Destinations"
            subtitle="Preview of homepageFeatured / popular destinations"
            browseHref="/site/destinations"
          />
        </div>
      </Surface>
    </PageShell>
  );
}
