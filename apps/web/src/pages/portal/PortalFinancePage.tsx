import { useEffect, useState } from "react";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/portal";

export default function PortalFinancePage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void customerPortalApi
      .finance()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Finance</h1>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {data && (
        <>
          <p className="text-[12px]">
            Outstanding balance: <span className="font-bold">{formatPoisha(data.outstandingPoisha)}</span>
          </p>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Invoices</h2>
            <ul className="text-[11px] space-y-1">
              {(data.invoices || []).map((i: any) => (
                <li key={i.id} className="flex justify-between border-b border-slate-50 py-1">
                  <span>
                    {i.invoiceNo} · {i.status}
                  </span>
                  <span>{formatPoisha(i.total, i.currency)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Payment / receipt history</h2>
            <ul className="text-[11px] space-y-1">
              {(data.payments || []).map((p: any) => (
                <li key={p.id} className="flex justify-between border-b border-slate-50 py-1">
                  <span>
                    {p.kind} · {p.method} · {p.reference || "—"}
                  </span>
                  <span>{formatPoisha(p.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
