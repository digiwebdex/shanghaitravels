import { useEffect, useState } from "react";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/corporatePortal";

export default function CorporateReportsPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void corporatePortalApi
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
          {data.travel && (
            <section className="bg-white border rounded-xl p-4 text-[11px]">
              <h2 className="text-[12px] font-bold mb-2">Travel</h2>
              <p>Total requests: {data.travel.totalRequests ?? 0}</p>
              <ul className="mt-2 space-y-1">
                {Object.entries(data.travel.byService || {}).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span>{String(v)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.approvals && (
            <section className="bg-white border rounded-xl p-4 text-[11px]">
              <h2 className="text-[12px] font-bold mb-2">Approvals</h2>
              <p>Approved: {data.approvals.approved ?? 0}</p>
              <p>Rejected: {data.approvals.rejected ?? 0}</p>
              <p>Pending: {data.approvals.pending ?? 0}</p>
            </section>
          )}
          {data.finance && (
            <section className="bg-white border rounded-xl p-4 text-[11px]">
              <h2 className="text-[12px] font-bold mb-2">Finance</h2>
              <p>Outstanding: {formatPoisha(data.finance.outstandingPoisha)}</p>
              <p>Invoiced: {formatPoisha(data.finance.invoicedPoisha)}</p>
              <p>Paid: {formatPoisha(data.finance.paidPoisha)}</p>
            </section>
          )}
          {data.bookings && (
            <section className="bg-white border rounded-xl p-4 text-[11px]">
              <h2 className="text-[12px] font-bold mb-2">Bookings</h2>
              <ul className="max-h-48 overflow-auto space-y-1">
                {(data.bookings.history || data.bookingHistory || []).map((b: any) => (
                  <li key={b.id}>
                    {b.referenceNo} · {b.serviceType} · {b.status}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!data.travel && !data.approvals && !data.finance && !data.bookings && (
            <section className="bg-white border rounded-xl p-4 text-[11px] col-span-2">
              <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto">{JSON.stringify(data, null, 2)}</pre>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
