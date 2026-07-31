import { useEffect, useState } from "react";
import { Link } from "react-router";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";

export default function CorporateBookingsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void corporatePortalApi
      .bookings()
      .then(setRows)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Bookings</h1>
      <p className="text-[11px] text-slate-500">ERP bookings linked to approved corporate travel requests.</p>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      <table className="w-full text-[11px] bg-white border rounded-xl overflow-hidden">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left p-2">Reference</th>
            <th className="text-left p-2">Service</th>
            <th className="text-left p-2">Traveller</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-t">
              <td className="p-2">
                <Link className="text-teal-700 underline font-semibold" to={`/portal/corporate/bookings/${r.id}`}>
                  {String(r.referenceNo)}
                </Link>
              </td>
              <td className="p-2">{String(r.serviceType)}</td>
              <td className="p-2">{String(r.employee?.fullName || r.customer?.fullName || "—")}</td>
              <td className="p-2">{String(r.status)}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={4} className="p-4 text-slate-400 text-center">
                No bookings yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
