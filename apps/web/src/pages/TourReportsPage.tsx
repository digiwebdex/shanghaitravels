import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BarChart2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
} from "@/components/enterprise/Page";
import { applicationsApi, tourPackagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Application, TourPackageProduct } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { TourModuleNav } from "@/components/tours/TourModuleNav";
import { PACKAGE_TYPE_LABELS, fromPoisha } from "@/lib/tour";

export default function TourReportsPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [packages, setPackages] = useState<TourPackageProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, p] = await Promise.all([
        applicationsApi.list({ serviceType: "tour", limit: 100 }),
        tourPackagesApi.list({ limit: 200 }),
      ]);
      setRows(listOf<Application>(a));
      setPackages(listOf<TourPackageProduct>(p));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load tour report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of rows) m.set(a.status, (m.get(a.status) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const open = rows.filter((a) => !["cancelled", "completed", "approved", "rejected"].includes(a.status)).length;
  const cancelled = rows.filter((a) => a.status === "cancelled").length;

  const salesPoisha = useMemo(
    () =>
      packages.reduce((sum, p) => sum + (p.sellingPricePoisha || 0), 0),
    [packages],
  );
  const costPoisha = useMemo(
    () => packages.reduce((sum, p) => sum + (p.supplierCostPoisha || 0), 0),
    [packages],
  );
  const profitPoisha = salesPoisha - costPoisha;

  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of packages) m.set(p.packageType, (m.get(p.packageType) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [packages]);

  return (
    <PageShell wide>
      <PageHeader
        icon={BarChart2}
        title="Tour reports"
        subtitle="Bookings, package performance, supplier cost vs sell (catalog)."
        breadcrumb={[{ label: "Tours", to: "/tours" }, { label: "Tour reports" }]}
      />
      <TourModuleNav />
        <ErrorBanner message={error} />

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Bookings", value: String(rows.length) },
                { label: "Open pipeline", value: String(open) },
                { label: "Cancelled", value: String(cancelled) },
                { label: "Active products", value: String(packages.filter((p) => p.isActive !== false).length) },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</p>
                  <p className="text-[22px] font-bold text-slate-800 mt-1">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Catalog sell (sum)", value: `৳${fromPoisha(salesPoisha) || "0.00"}` },
                { label: "Supplier cost (sum)", value: `৳${fromPoisha(costPoisha) || "0.00"}` },
                { label: "Catalog margin", value: `৳${fromPoisha(profitPoisha) || "0.00"}` },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</p>
                  <p className="text-[18px] font-bold text-slate-800 mt-1">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="text-[12px] font-bold text-slate-800 mb-3">Bookings by status</h2>
                {byStatus.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No tour cases yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {byStatus.map(([status, n]) => (
                      <li key={status} className="flex justify-between text-[11px] border-b border-slate-50 pb-1.5">
                        <span className="font-semibold text-slate-700">{status}</span>
                        <span className="text-slate-500">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="text-[12px] font-bold text-slate-800 mb-3">Package performance by type</h2>
                {byType.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No package products yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {byType.map(([type, n]) => (
                      <li key={type} className="flex justify-between text-[11px] border-b border-slate-50 pb-1.5">
                        <span className="font-semibold text-slate-700">
                          {PACKAGE_TYPE_LABELS[type as keyof typeof PACKAGE_TYPE_LABELS] || type}
                        </span>
                        <span className="text-slate-500">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">Recent bookings</h2>
              <ul className="space-y-2">
                {rows.slice(0, 15).map((a) => (
                  <li key={a.id} className="text-[11px] flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-50 pb-2">
                    <Link to={`/tours/${a.id}`} className="font-bold text-amber-700 hover:underline">
                      {a.referenceNo}
                    </Link>
                    <span className="text-slate-600">{a.customer?.fullName || "—"}</span>
                    <span className="text-slate-400">
                      stage {a.currentStage}/{a.totalStages}
                    </span>
                    <span className="text-slate-500">{a.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
    </PageShell>
  );
}
