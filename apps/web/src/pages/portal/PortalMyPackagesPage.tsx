import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

export default function PortalMyPackagesPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await customerPortalApi.packageApplications());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <h1 className="text-[18px] font-bold">My packages</h1>
      <ErrorBanner message={error} />
      {loading ? (
        <InlineSpinner />
      ) : (
        <table className="w-full text-[12px] bg-white border rounded-xl overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Reference</th>
              <th className="text-left p-2">Package</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-t">
                <td className="p-2">
                  <Link to={`/portal/customer/applications/${r.id}`} className="text-amber-700 font-semibold">
                    {String(r.referenceNo || r.id)}
                  </Link>
                </td>
                <td className="p-2">{String(r.packageName || r.serviceType || "—")}</td>
                <td className="p-2">{String(r.status || "—")}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={3} className="p-4 text-slate-400">
                  No package applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
