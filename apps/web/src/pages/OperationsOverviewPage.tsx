import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  Files,
  Hotel,
  Moon,
  Plane,
  Route,
  Truck,
  Workflow,
} from "lucide-react";
import { applicationsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Application } from "@/lib/types";
import { PageHeader, PageShell, Surface, btnGhost } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { OcrOpsWidget } from "@/components/ocr/OcrOpsWidget";
import { EntityTabs } from "@/components/workflow/EntityTabs";
import { MasterJourneyStrip, NextStepBanner } from "@/components/workflow/MasterJourney";
import { bookingWorkspaceHref, serviceCaseHref, serviceLabel } from "@/lib/workflow";
import { InlineSpinner } from "@/components/FullPageSpinner";

const QUEUE_TABS = [
  { id: "queue", label: "Queue" },
  { id: "today", label: "Today's Tasks" },
  { id: "visa", label: "Visa" },
  { id: "ticket", label: "Ticket" },
  { id: "hotel", label: "Hotel" },
  { id: "transport", label: "Transport" },
  { id: "hajj", label: "Hajj" },
  { id: "documents", label: "Documents" },
  { id: "urgent", label: "Urgent Cases" },
  { id: "completed", label: "Completed" },
] as const;

const HUB_CARDS = [
  { label: "Document Intelligence", to: "/operations/document-intelligence", icon: Brain },
  { label: "Passports", to: "/passports", icon: BookOpen },
  { label: "Documents", to: "/operations/documents", icon: Files },
  { label: "Case Journey", to: "/case-journey", icon: Route },
  { label: "Workflow", to: "/operations/workflow", icon: Workflow },
  { label: "Calendar", to: "/operations/calendar", icon: CalendarDays },
  { label: "Notifications", to: "/operations/notifications", icon: Bell },
  { label: "New booking", to: "/bookings/new", icon: ClipboardList },
];

export default function OperationsOverviewPage() {
  const workspace = workspaceById("operations")!;
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "queue";
  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === "queue") next.delete("tab");
    else next.set("tab", id);
    setParams(next, { replace: true });
  };

  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf<Application>(await applicationsApi.list({ limit: 100 })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    switch (tab) {
      case "visa":
        return rows.filter((r) => r.serviceType === "visa");
      case "ticket":
        return rows.filter((r) => r.serviceType === "air_ticket");
      case "hotel":
        return rows.filter((r) => r.serviceType === "hotel");
      case "transport":
        return rows.filter((r) => r.serviceType === "transport");
      case "hajj":
        return rows.filter((r) => r.serviceType === "hajj" || r.serviceType === "umrah");
      case "documents":
        return rows.filter((r) => r.status === "docs_required");
      case "urgent":
        return rows.filter((r) => r.priority === "urgent" || r.priority === "high");
      case "completed":
        return rows.filter((r) => r.status === "completed");
      case "today":
        return rows.filter((r) => (r.createdAt || "").startsWith(today) || r.status === "in_progress");
      default:
        return rows.filter((r) => !["completed", "cancelled", "rejected"].includes(r.status));
    }
  }, [rows, tab]);

  return (
    <PageShell wide>
      <PageHeader
        title="Operations Workspace"
        subtitle="One queue for every booking — stay here instead of jumping between service modules."
        breadcrumb={[{ label: "Operations" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      <MasterJourneyStrip active="operations" compact />
      <WorkspaceTabsCompact workspace={workspace} />

      <NextStepBanner
        title="Work the queue, not the menus"
        body="Open Booking 360 for documents, OCR, finance and audit. Use the service desk only for deep visa/ticket/hotel processing."
        actions={[
          { label: "Unified booking", to: "/bookings/new", primary: true },
          { label: "Document Intelligence", to: "/operations/document-intelligence" },
          { label: "Urgent cases", to: "/operations?tab=urgent" },
        ]}
      />

      <div className="mb-4">
        <OcrOpsWidget />
      </div>

      <EntityTabs tabs={[...QUEUE_TABS]} active={tab} onChange={setTab} />

      <Surface padded className="mt-3">
        {error && <p className="mb-2 text-[11px] text-[var(--error)]">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-10">
            <InlineSpinner />
          </div>
        ) : !filtered.length ? (
          <p className="py-8 text-center text-[12px] text-[var(--muted-foreground)]">No cases in this queue.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {filtered.slice(0, 40).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[12px]">
                <div className="flex items-start gap-2">
                  <ServiceIcon type={a.serviceType} />
                  <div>
                    <Link to={bookingWorkspaceHref(a.id)} className="font-mono font-bold text-[var(--accent)]">
                      {a.referenceNo}
                    </Link>
                    <span className="ml-2 text-[var(--muted-foreground)]">
                      {serviceLabel(a.serviceType)} · {a.status}
                    </span>
                    {(a.priority === "urgent" || a.priority === "high") && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700">
                        <AlertTriangle size={10} /> {a.priority}
                      </span>
                    )}
                    <p className="text-[11px] text-[var(--primary)]">{a.title || a.customer?.fullName || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={bookingWorkspaceHref(a.id)} className="text-[11px] font-bold text-[var(--accent)]">
                    Booking 360
                  </Link>
                  <Link to={serviceCaseHref(a.serviceType, a.id)} className="text-[11px] font-semibold text-slate-500">
                    Desk →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {HUB_CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-sm"
          >
            <c.icon size={18} className="text-amber-600" />
            <p className="mt-3 text-[14px] font-bold text-slate-900">{c.label}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}

function ServiceIcon({ type }: { type: string }) {
  const cls = "mt-0.5 text-slate-400";
  if (type === "visa") return <FileCheck size={14} className={cls} />;
  if (type === "air_ticket") return <Plane size={14} className={cls} />;
  if (type === "hotel") return <Hotel size={14} className={cls} />;
  if (type === "transport") return <Truck size={14} className={cls} />;
  if (type === "hajj" || type === "umrah") return <Moon size={14} className={cls} />;
  return <CheckCircle2 size={14} className={cls} />;
}
