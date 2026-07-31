import { useEffect, useState } from "react";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/agentPortal";

export default function AgentReportsPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void agentPortalApi
      .reports()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Reports</h1>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {data && (
        <div className="grid md:grid-cols-2 gap-3">
          <section className="bg-white border rounded-xl p-4 text-[11px]">
            <h2 className="text-[12px] font-bold mb-2">Sales</h2>
            <p>Total bookings: {data.sales?.totalBookings ?? 0}</p>
            <ul className="mt-2 space-y-1">
              {Object.entries(data.sales?.byService || {}).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span>{String(v)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-white border rounded-xl p-4 text-[11px]">
            <h2 className="text-[12px] font-bold mb-2">Commissions</h2>
            <p>Pending: {formatPoisha(data.commissions?.pending)}</p>
            <p>Paid: {formatPoisha(data.commissions?.paid)}</p>
          </section>
          <section className="bg-white border rounded-xl p-4 text-[11px]">
            <h2 className="text-[12px] font-bold mb-2">Outstanding</h2>
            <p>{formatPoisha(data.outstanding?.outstandingPoisha)}</p>
          </section>
          <section className="bg-white border rounded-xl p-4 text-[11px]">
            <h2 className="text-[12px] font-bold mb-2">Booking history</h2>
            <ul className="max-h-48 overflow-auto space-y-1">
              {(data.bookingHistory || []).map((b: any) => (
                <li key={b.id}>
                  {b.referenceNo} · {b.serviceType} · {b.status}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
