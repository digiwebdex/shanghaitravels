import { useCallback, useEffect, useState } from "react";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { PackageCard } from "@/components/packages/PackageCard";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

export default function CorporatePackagesBrowsePage() {
  const [rows, setRows] = useState<PackageMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await corporatePortalApi.listPackages();
      setRows((Array.isArray(r) ? r : []) as PackageMaster[]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 max-w-6xl space-y-4">
      <h1 className="text-[18px] font-bold">Corporate packages</h1>
      <p className="text-[12px] text-[var(--muted-foreground)]">Approved packages for employee travel requests.</p>
      <ErrorBanner message={error} />
      {loading ? (
        <InlineSpinner />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {rows.map((p) => (
            <PackageCard
              key={p.id}
              pkg={p}
              variant="portal"
              bookPath={`/portal/corporate/packages/${p.slug}/request`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
