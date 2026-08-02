import { useEffect, useState } from "react";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/agentPortal";

export default function AgentFinancePage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void agentPortalApi
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
            <Box label="Wallet" value={formatPoisha(data.wallet?.balance)} />
            <Box label="Outstanding" value={formatPoisha(data.outstandingPoisha)} />
            <Box label="Comm. pending" value={formatPoisha(data.statement?.commissionPending)} />
            <Box label="Comm. paid" value={formatPoisha(data.statement?.commissionPaid)} />
          </div>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Commission ledger</h2>
            <ul className="text-[11px] space-y-1 max-h-48 overflow-auto">
              {(data.commissions || []).map((c: any) => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.status}</span>
                  <span>{formatPoisha(c.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
          <div className="grid md:grid-cols-2 gap-3">
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
              </ul>
            </section>
            <section className="bg-white border rounded-xl p-4">
              <h2 className="text-[12px] font-bold mb-2">Payments</h2>
              <ul className="text-[11px] space-y-1 max-h-48 overflow-auto">
                {(data.payments || []).map((p: any) => (
                  <li key={p.id} className="flex justify-between">
                    <span>
                      {p.method} · {p.kind}
                    </span>
                    <span>{formatPoisha(p.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="text-[10px] text-[var(--muted-foreground)] uppercase">{label}</div>
      <div className="font-bold mt-1">{value}</div>
    </div>
  );
}
