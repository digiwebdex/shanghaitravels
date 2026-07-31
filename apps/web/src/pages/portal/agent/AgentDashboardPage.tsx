import { useEffect, useState } from "react";
import { Link } from "react-router";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/agentPortal";
import { InlineSpinner } from "@/components/FullPageSpinner";

export default function AgentDashboardPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void agentPortalApi
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
            <Stat label="Active bookings" value={data.bookings?.open ?? 0} />
            <Stat label="Pending quotes" value={data.pendingQuotations ?? 0} />
            <Stat label="Wallet" value={formatPoisha(data.walletBalance)} />
            <Stat label="Outstanding" value={formatPoisha(data.outstandingPoisha)} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <section className="bg-white border rounded-xl p-4 text-[11px]">
              <h2 className="text-[12px] font-bold mb-2">Sales summary</h2>
              <p>Bookings this month: <span className="font-semibold">{data.salesSummary?.bookingsThisMonth ?? 0}</span></p>
              <p className="mt-1">Commission rate: {((data.agent?.commissionRateBps || 0) / 100).toFixed(2)}%</p>
              <Link className="text-amber-700 underline mt-2 inline-block" to="/portal/agent/bookings">
                Manage bookings
              </Link>
            </section>
            <section className="bg-white border rounded-xl p-4 text-[11px]">
              <h2 className="text-[12px] font-bold mb-2">Notifications</h2>
              <ul className="space-y-1">
                {(data.notifications || []).map((n: any) => (
                  <li key={n.id} className="truncate">
                    {n.subject || n.body}
                  </li>
                ))}
                {!data.notifications?.length && <li className="text-slate-400">No notifications</li>}
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
