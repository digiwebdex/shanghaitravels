import { useEffect, useState } from "react";
import { Link } from "react-router";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";
import { formatPoisha } from "@/lib/corporatePortal";
import {
  PortalLoading,
  PortalPage,
  PortalSection,
  PortalStat,
} from "@/layouts/portalChrome";

export default function CorporateDashboardPage() {
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void corporatePortalApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  if (!data && !error) return <PortalLoading />;

  return (
    <PortalPage
      title="Corporate dashboard"
      description="Employees → travel requests → approvals → bookings → invoices — one company journey."
      actions={
        <Link
          to="/portal/corporate/finance"
          className="rounded-xl px-3 py-2 text-[11px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
        >
          View finance
        </Link>
      }
    >
      {error && <p className="text-[12px] text-[var(--error)]">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <PortalStat label="Open requests" value={data.requests?.open ?? data.openRequests ?? 0} />
            <PortalStat
              label="Pending approvals"
              value={data.approvals?.pending ?? data.pendingApprovals ?? 0}
            />
            <PortalStat
              label="Active bookings"
              value={data.bookings?.active ?? data.activeBookings ?? 0}
            />
            <PortalStat
              label="Outstanding"
              value={formatPoisha(data.outstandingPoisha ?? data.finance?.outstandingPoisha)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <PortalSection title="Credit utilization">
              <p className="text-[11px] text-[var(--primary)]">
                Used:{" "}
                <span className="font-bold">
                  {formatPoisha(data.credit?.usedPoisha ?? data.creditUtilization?.used)}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                Limit:{" "}
                <span className="font-semibold text-[var(--primary)]">
                  {formatPoisha(data.credit?.limitPoisha ?? data.creditUtilization?.limit)}
                </span>
              </p>
            </PortalSection>
            <PortalSection title="Announcements">
              <ul className="space-y-1 text-[11px]">
                {(data.announcements || data.notifications || []).map((n: any) => (
                  <li key={n.id} className="truncate text-[var(--primary)]">
                    {n.title || n.subject || n.body}
                  </li>
                ))}
                {!data.announcements?.length && !data.notifications?.length && (
                  <li className="text-[var(--muted-foreground)]">No announcements</li>
                )}
              </ul>
            </PortalSection>
          </div>
        </>
      )}
    </PortalPage>
  );
}
