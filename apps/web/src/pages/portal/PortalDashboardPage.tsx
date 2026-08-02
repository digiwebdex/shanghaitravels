import { useEffect, useState } from "react";
import { Link } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/portal";
import {
  PortalLoading,
  PortalPage,
  PortalSection,
  PortalStat,
} from "@/layouts/portalChrome";

export default function PortalDashboardPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void customerPortalApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load"));
  }, []);

  if (!data && !error) return <PortalLoading />;

  return (
    <PortalPage
      title="Your travel dashboard"
      description="Profile → documents → bookings → payments — one continuous journey."
    >
      {error && <p className="text-[12px] text-[var(--error)]">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <PortalStat label="Active applications" value={data.applications?.active ?? 0} />
            <PortalStat label="Outstanding" value={formatPoisha(data.invoices?.outstandingPoisha)} />
            <PortalStat label="Open support" value={data.supportOpen ?? 0} />
            <PortalStat label="Notifications" value={(data.notifications || []).length} />
          </div>
          <PortalSection
            title="Applications"
            action={
              <Link className="text-[11px] font-bold text-[var(--accent)]" to="/portal/customer/applications">
                View all
              </Link>
            }
          >
            <ul className="space-y-1 text-[11px]">
              {(data.applications?.recent || []).map((a: any) => (
                <li
                  key={a.id}
                  className="flex justify-between border-b border-[var(--border)] py-1.5 last:border-0"
                >
                  <span className="font-semibold text-[var(--primary)]">
                    {a.referenceNo} · {a.serviceType}
                  </span>
                  <span className="text-[var(--muted-foreground)]">{a.status}</span>
                </li>
              ))}
            </ul>
          </PortalSection>
          <div className="grid gap-3 md:grid-cols-2">
            <PortalSection title="Recent invoices">
              <ul className="space-y-1 text-[11px]">
                {(data.invoices?.recent || []).map((i: any) => (
                  <li key={i.id} className="flex justify-between">
                    <span>{i.invoiceNo}</span>
                    <span className="font-semibold tabular-nums">{formatPoisha(i.total, i.currency)}</span>
                  </li>
                ))}
              </ul>
            </PortalSection>
            <PortalSection title="Recent communications">
              <ul className="space-y-1 text-[11px] text-[var(--muted-foreground)]">
                {(data.communications?.recent || []).map((c: any) => (
                  <li key={c.id} className="truncate">
                    {c.subject || c.summary || c.channel}
                  </li>
                ))}
              </ul>
            </PortalSection>
          </div>
        </>
      )}
    </PortalPage>
  );
}
