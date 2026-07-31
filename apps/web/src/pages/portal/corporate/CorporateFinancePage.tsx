import { useEffect, useState } from "react";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/corporatePortal";

export default function CorporateFinancePage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void corporatePortalApi
      .finance()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  const creditUsed = data?.creditUtilization?.usedPoisha ?? data?.credit?.usedPoisha ?? 0;
  const creditLimit = data?.creditUtilization?.limitPoisha ?? data?.credit?.limitPoisha ?? 0;
  const utilizationPct = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Finance</h1>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
            <Box label="Outstanding" value={formatPoisha(data.outstandingPoisha)} />
            <Box label="Credit limit" value={formatPoisha(creditLimit)} />
            <Box label="Credit used" value={formatPoisha(creditUsed)} />
            <Box label="Utilization" value={`${utilizationPct}%`} />
          </div>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Invoices</h2>
            <ul className="text-[11px] space-y-1 max-h-48 overflow-auto">
              {(data.invoices || []).map((i: any) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    {i.invoiceNo} · {i.status}
                  </span>
                  <span>{formatPoisha(i.total, i.currency)}</span>
                </li>
              ))}
              {!data.invoices?.length && <li className="text-slate-400">No invoices</li>}
            </ul>
          </section>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Statements</h2>
            <ul className="text-[11px] space-y-1 max-h-48 overflow-auto">
              {(data.statements || []).map((s: any) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.period || s.referenceNo || s.id}</span>
                  <span>{formatPoisha(s.balance ?? s.total)}</span>
                </li>
              ))}
              {!data.statements?.length && <li className="text-slate-400">No statements</li>}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
      <div className="font-bold mt-1">{value}</div>
    </div>
  );
}
