import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { packagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { DEFAULT_COLLECTIONS, PACKAGE_COLLECTIONS } from "@/lib/packages";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { CmsModuleNav } from "@/components/cms/CmsModuleNav";
import { PackageCard } from "@/components/packages/PackageCard";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  selectClassName,
} from "@/components/enterprise/Page";

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

  const stats = useMemo(
    () => ({
      home: rows.filter((p) => p.homeFeatured).length,
      popular: rows.filter((p) => p.popular).length,
      recommended: rows.filter((p) => p.recommended).length,
    }),
    [rows],
  );

  const columns: Column<PackageMaster>[] = [
    {
      key: "pkg",
      header: "Package",
      render: (p) => (
        <div>
          <span className="font-semibold">{p.name}</span>
          <span className="block font-mono text-[10px] text-[var(--muted-foreground)]">{p.code}</span>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (p) => <Pill value={p.status} tone={statusTone(p.status)} /> },
    {
      key: "home",
      header: "Home",
      render: (p) => (
        <Can perm="cms:manage">
          <button
            type="button"
            className="font-semibold text-[var(--accent)]"
            onClick={() => void toggleFlag(p, "homeFeatured")}
          >
            {p.homeFeatured ? "On" : "Off"}
          </button>
        </Can>
      ),
    },
    {
      key: "popular",
      header: "Popular",
      render: (p) => (
        <Can perm="cms:manage">
          <button type="button" className="font-semibold text-[var(--accent)]" onClick={() => void toggleFlag(p, "popular")}>
            {p.popular ? "On" : "Off"}
          </button>
        </Can>
      ),
    },
    {
      key: "recommended",
      header: "Recommended",
      render: (p) => (
        <Can perm="cms:manage">
          <button
            type="button"
            className="font-semibold text-[var(--accent)]"
            onClick={() => void toggleFlag(p, "recommended")}
          >
            {p.recommended ? "On" : "Off"}
          </button>
        </Can>
      ),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={Sparkles}
        title="Featured packages (CMS)"
        subtitle="Toggle homepage and collection flags on published packages."
        breadcrumb={[{ label: "Website & CMS" }, { label: "Packages" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <CmsModuleNav />
      <StatStrip>
        <KpiCard label="Packages" value={rows.length} />
        <KpiCard label="Home featured" value={stats.home} tone="accent" />
        <KpiCard label="Popular" value={stats.popular} />
        <KpiCard label="Recommended" value={stats.recommended} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Surface>
        <SurfaceHeader title="Collection flags" />
        <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} loading={loading} emptyTitle="No packages" />
      </Surface>

      <Surface>
        <SurfaceHeader title="Collection preview" />
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {PACKAGE_COLLECTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPreview(c)}
                className={`${selectClassName} ${
                  preview === c ? "!border-[var(--accent)] !bg-[var(--orange-50)] font-bold text-[var(--accent)]" : ""
                }`}
              >
                {DEFAULT_COLLECTIONS[c]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {previewRows.slice(0, 6).map((p) => (
              <PackageCard key={p.id} pkg={p} variant="portal" detailPath={`/site/packages/${p.slug}`} />
            ))}
            {!previewRows.length && (
              <p className="text-[12px] text-[var(--muted-foreground)]">No packages in this collection.</p>
            )}
          </div>
        </div>
      </Surface>
    </PageShell>
  );
}
