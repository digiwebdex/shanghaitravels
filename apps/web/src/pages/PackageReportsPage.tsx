import { useCallback, useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { packagesApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { PackageReportSummary } from "@/lib/packages";
import { formatPrice } from "@/lib/packages";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { PackageModuleNav } from "@/components/packages/PackageModuleNav";

export default function PackageReportsPage() {
  const [report, setReport] = useState<PackageReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await packagesApi.reports());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <DemoBadge moduleKey="products" />
      <div className="p-5 max-w-[1000px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 size={16} className="text-amber-600" /> Package reports
          </h1>
        </div>
        <PackageModuleNav />
        <ErrorBanner message={error} />

        {loading ? (
          <InlineSpinner />
        ) : report ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                ["Total", report.totalPackages],
                ["Published", report.published],
                ["Draft", report.draft],
                ["Scheduled", report.scheduled],
                ["Home featured", report.homeFeatured],
                ["Popular", report.popular],
                ["Enquiries", report.totalEnquiries],
                ["Bookings", report.totalBookings],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase">{label}</p>
                <p className="text-[20px] font-bold text-slate-800">{val}</p>
              </div>
            ))}
            <div className="col-span-2 md:col-span-4 bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Revenue (listed packages)</p>
              <p className="text-[24px] font-bold text-amber-700">{formatPrice(report.revenuePoisha)}</p>
            </div>
            {report.topPackages?.length > 0 && (
              <div className="col-span-2 md:col-span-4 bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-slate-700 mb-2">Top packages</p>
                <ul className="text-[11px] space-y-1">
                  {report.topPackages.map((p) => (
                    <li key={p.id} className="flex justify-between">
                      <span>{p.name}</span>
                      <span className="text-slate-500">
                        {p.enquiries} enquiries · {p.bookings} bookings
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
