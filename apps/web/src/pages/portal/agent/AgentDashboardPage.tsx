import { useEffect, useState } from "react";
import { Link } from "react-router";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/agentPortal";
import {
  PortalLoading,
  PortalPage,
  PortalSection,
  PortalStat,
} from "@/layouts/portalChrome";

export default function AgentDashboardPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void agentPortalApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  if (!data && !error) return <PortalLoading />;

  return (
    <PortalPage
      title="Agent dashboard"
      description="Packages → customers → OCR → booking request → commission — stay in this portal."
      actions={
        <Link
          to="/portal/agent/bookings"
          className="rounded-xl px-3 py-2 text-[11px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
        >
          Manage bookings
        </Link>
      }
    >
      {error && <p className="text-[12px] text-[var(--error)]">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <PortalStat label="Active bookings" value={data.bookings?.open ?? 0} />
            <PortalStat label="Pending quotes" value={data.pendingQuotations ?? 0} />
            <PortalStat label="Wallet" value={formatPoisha(data.walletBalance)} />
            <PortalStat label="Outstanding" value={formatPoisha(data.outstandingPoisha)} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <PortalSection title="Sales summary">
              <p className="text-[11px] text-[var(--primary)]">
                Bookings this month:{" "}
                <span className="font-bold">{data.salesSummary?.bookingsThisMonth ?? 0}</span>
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                Commission rate: {((data.agent?.commissionRateBps || 0) / 100).toFixed(2)}%
              </p>
            </PortalSection>
            <PortalSection title="Notifications">
              <ul className="space-y-1 text-[11px]">
                {(data.notifications || []).map((n: any) => (
                  <li key={n.id} className="truncate text-[var(--primary)]">
                    {n.subject || n.body}
                  </li>
                ))}
                {!data.notifications?.length && (
                  <li className="text-[var(--muted-foreground)]">No notifications</li>
                )}
              </ul>
            </PortalSection>
          </div>
        </>
      )}
    </PortalPage>
  );
}
