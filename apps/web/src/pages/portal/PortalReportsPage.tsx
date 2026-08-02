import { useEffect, useState } from "react";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/portal";

export default function PortalReportsPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void customerPortalApi
      .reports()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Reports</h1>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {data && (
        <div className="grid md:grid-cols-3 gap-3">
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Booking history</h2>
            <ul className="text-[11px] space-y-1 max-h-80 overflow-auto">
              {(data.bookingHistory || []).map((b: any) => (
                <li key={b.id}>
                  {b.referenceNo} · {b.serviceType} · {b.status}
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Payment history</h2>
            <ul className="text-[11px] space-y-1 max-h-80 overflow-auto">
              {(data.paymentHistory || []).map((p: any) => (
                <li key={p.id}>
                  {formatPoisha(p.amount)} · {p.method} · {new Date(p.receivedAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Downloadable documents</h2>
            <ul className="text-[11px] space-y-1 max-h-80 overflow-auto">
              {(data.downloadableDocuments || []).map((d: any) => (
                <li key={d.id}>
                  <a className="text-[var(--accent)] underline" href={customerPortalApi.downloadUrl(d.id)} target="_blank" rel="noreferrer">
                    {d.fileName}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
