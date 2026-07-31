import { useEffect, useState } from "react";
import { Link } from "react-router";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/corporatePortal";
import { InlineSpinner } from "@/components/FullPageSpinner";

export default function CorporateDashboardPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void corporatePortalApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  if (!data && !error) {
    return (
      <div className="flex justify-center py-20">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Dashboard</h1>
      {error && <p className="text-red-600 text-[12px]">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Open requests" value={data.requests?.open ?? data.openRequests ?? 0} />
            <Stat label="Pending approvals" value={data.approvals?.pending ?? data.pendingApprovals ?? 0} />
            <Stat label="Active bookings" value={data.bookings?.active ?? data.activeBookings ?? 0} />
            <Stat label="Outstanding" value={formatPoisha(data.outstandingPoisha ?? data.finance?.outstandingPoisha)} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <section className="bg-white border rounded-xl p-4 text-[11px]">
              <h2 className="text-[12px] font-bold mb-2">Credit utilization</h2>
              <p>
                Used: <span className="font-semibold">{formatPoisha(data.credit?.usedPoisha ?? data.creditUtilization?.used)}</span>
              </p>
              <p className="mt-1">
                Limit: <span className="font-semibold">{formatPoisha(data.credit?.limitPoisha ?? data.creditUtilization?.limit)}</span>
              </p>
              <Link className="text-teal-700 underline mt-2 inline-block" to="/portal/corporate/finance">
                View finance
              </Link>
            </section>
            <section className="bg-white border rounded-xl p-4 text-[11px]">
              <h2 className="text-[12px] font-bold mb-2">Announcements</h2>
              <ul className="space-y-1">
                {(data.announcements || data.notifications || []).map((n: any) => (
                  <li key={n.id} className="truncate">
                    {n.title || n.subject || n.body}
                  </li>
                ))}
                {!data.announcements?.length && !data.notifications?.length && (
                  <li className="text-slate-400">No announcements</li>
                )}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-[16px] font-bold mt-1">{value}</div>
    </div>
  );
}
