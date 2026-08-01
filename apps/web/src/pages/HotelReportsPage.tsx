import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BarChart2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
} from "@/components/enterprise/Page";
import { applicationsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Application } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { HotelModuleNav } from "@/components/hotels/HotelModuleNav";

export default function HotelReportsPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await applicationsApi.list({ serviceType: "hotel", limit: 100 });
      setRows(listOf<Application>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load hotel report");
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

  return (
    <PageShell wide>
      <PageHeader
        icon={BarChart2}
        title="Hotel reports"
        subtitle="Ops snapshot from hotel Application cases (BDT finance stays on each case)."
        breadcrumb={[{ label: "Hotels", to: "/hotels" }, { label: "Hotel reports" }]}
      />
      <HotelModuleNav />
        <ErrorBanner message={error} />

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total bookings", value: rows.length },
                { label: "Open pipeline", value: open },
                { label: "Cancelled", value: cancelled },
                { label: "Statuses tracked", value: byStatus.length },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</p>
                  <p className="text-[22px] font-bold text-slate-800 mt-1">{c.value}</p>
                </div>
              ))}
            </div>

            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">By status</h2>
              {byStatus.length === 0 ? (
                <p className="text-[11px] text-slate-400">No hotel cases yet.</p>
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
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">Recent bookings</h2>
              <ul className="space-y-2">
                {rows.slice(0, 15).map((a) => (
                  <li key={a.id} className="text-[11px] flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-50 pb-2">
                    <Link to={`/hotels/${a.id}`} className="font-bold text-amber-700 hover:underline">
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
