import { useCallback, useEffect, useState } from "react";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { PackageCard } from "@/components/packages/PackageCard";
import { PackageQuickView } from "@/components/packages/PackageQuickView";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

function mapPackage(row: Record<string, unknown>): PackageMaster {
  return row as unknown as PackageMaster;
}

export default function PortalCustomerPackagesPage() {
  const [rows, setRows] = useState<PackageMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quick, setQuick] = useState<PackageMaster | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await customerPortalApi.listPackages();
      setRows((Array.isArray(r) ? r : []).map(mapPackage));
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
      <h1 className="text-[18px] font-bold text-slate-900">Browse packages</h1>
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
              detailPath={`/portal/customer/packages/${p.slug}`}
              bookPath={`/portal/customer/packages/${p.slug}/book`}
              onQuickView={setQuick}
            />
          ))}
        </div>
      )}
      <PackageQuickView
        pkg={quick}
        onClose={() => setQuick(null)}
        detailPath={quick ? `/portal/customer/packages/${quick.slug}` : undefined}
        bookPath={quick ? `/portal/customer/packages/${quick.slug}/book` : undefined}
      />
    </div>
  );
}
