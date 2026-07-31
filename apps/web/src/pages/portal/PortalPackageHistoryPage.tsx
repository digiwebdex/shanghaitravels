import { useCallback, useEffect, useState } from "react";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

export default function PortalPackageHistoryPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await customerPortalApi.packageHistory());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <h1 className="text-[18px] font-bold">Package history</h1>
      <ErrorBanner message={error} />
      {loading ? (
        <InlineSpinner />
      ) : (
        <ul className="space-y-2 text-[12px]">
          {rows.map((r, i) => (
            <li key={String(r.id || i)} className="bg-white border rounded-lg p-3">
              <span className="font-semibold">{String(r.packageName || r.action || "Event")}</span>
              <span className="text-slate-500 block">{String(r.createdAt || r.date || "")}</span>
            </li>
          ))}
          {!rows.length && <li className="text-slate-400">No history yet.</li>}
        </ul>
      )}
    </div>
  );
}
