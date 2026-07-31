import { useEffect, useState } from "react";
import { Link } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/portal";
import { InlineSpinner } from "@/components/FullPageSpinner";

export default function PortalDashboardPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void customerPortalApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
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
      <h1 className="text-[16px] font-bold text-slate-800">Dashboard</h1>
      {error && <p className="text-red-600 text-[12px]">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Active applications" value={data.applications?.active ?? 0} />
            <Stat label="Outstanding" value={formatPoisha(data.invoices?.outstandingPoisha)} />
            <Stat label="Open support" value={data.supportOpen ?? 0} />
            <Stat label="Notifications" value={(data.notifications || []).length} />
          </div>
          <section className="bg-white border rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-[12px] font-bold">Applications</h2>
              <Link className="text-[11px] text-amber-700 underline" to="/portal/customer/applications">
                View all
              </Link>
            </div>
            <ul className="text-[11px] space-y-1">
              {(data.applications?.recent || []).map((a: any) => (
                <li key={a.id} className="flex justify-between border-b border-slate-50 py-1">
                  <span>
                    {a.referenceNo} · {a.serviceType}
                  </span>
                  <span className="text-slate-500">{a.status}</span>
                </li>
              ))}
            </ul>
          </section>
          <div className="grid md:grid-cols-2 gap-3">
            <section className="bg-white border rounded-xl p-4">
              <h2 className="text-[12px] font-bold mb-2">Recent invoices</h2>
              <ul className="text-[11px] space-y-1">
                {(data.invoices?.recent || []).map((i: any) => (
                  <li key={i.id} className="flex justify-between">
                    <span>{i.invoiceNo}</span>
                    <span>{formatPoisha(i.total, i.currency)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="bg-white border rounded-xl p-4">
              <h2 className="text-[12px] font-bold mb-2">Recent communications</h2>
              <ul className="text-[11px] space-y-1">
                {(data.communications?.recent || []).map((c: any) => (
                  <li key={c.id} className="truncate">
                    {c.subject || c.summary || c.channel}
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-[16px] font-bold mt-1">{value}</div>
    </div>
  );
}
