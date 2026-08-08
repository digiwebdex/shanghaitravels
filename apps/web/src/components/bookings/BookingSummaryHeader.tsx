import type { ReactNode } from "react";
import { Link } from "react-router";
import { Activity, CalendarClock, FileText, HeartPulse, Layers, Wallet } from "lucide-react";
import type { AppDocument, Application, Invoice, Journey } from "@/lib/types";
import { fmtBDTPlain } from "@/lib/money";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { bookingWorkspaceHref, serviceCaseHref, serviceLabel } from "@/lib/workflow";

type Tone = "slate" | "green" | "amber" | "red" | "blue";

/** Bundle fetched by the page when the drawer opens (parallel, existing endpoints). */
export type BookingDetail = {
  app: Application;
  journey: Journey | null;
  invoices: Invoice[];
  documents: AppDocument[];
};

function stageTone(s?: string | null): Tone {
  const v = (s || "").toLowerCase();
  if (["completed", "done", "approved", "passed"].some((x) => v.includes(x))) return "green";
  if (["in_progress", "active", "current", "started", "processing"].some((x) => v.includes(x))) return "amber";
  if (["blocked", "failed", "rejected"].some((x) => v.includes(x))) return "red";
  return "slate";
}
function priorityTone(p?: string | null): Tone {
  const v = (p || "").toLowerCase();
  if (v === "urgent") return "red";
  if (v === "high") return "amber";
  return "slate";
}
function dueOf(i: Invoice): number {
  return i.due ?? Math.max(0, (i.total || 0) - (i.paid || 0));
}

/** Derived Booking Health from status, priority, finance and documents. */
function computeHealth(app: Application, invoices: Invoice[], documents: AppDocument[]) {
  let score = 100;
  const reasons: string[] = [];
  const st = (app.status || "").toLowerCase();
  if (["rejected", "cancelled"].includes(st)) { score -= 45; reasons.push(`Status: ${app.status}`); }
  else if (st === "on_hold") { score -= 20; reasons.push("On hold"); }
  else if (st === "docs_required") { score -= 15; reasons.push("Documents required"); }
  const pr = (app.priority || "").toLowerCase();
  if (pr === "urgent") { score -= 20; reasons.push("Urgent priority"); }
  else if (pr === "high") { score -= 10; reasons.push("High priority"); }
  const due = invoices.reduce((s, i) => s + dueOf(i), 0);
  if (due > 0) { score -= 15; reasons.push(`Outstanding ${fmtBDTPlain(due)}`); }
  if (!documents.length) { score -= 10; reasons.push("No documents uploaded"); }
  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? "Healthy" : score >= 55 ? "Watch" : "At Risk";
  const tone: Tone = score >= 80 ? "green" : score >= 55 ? "amber" : "red";
  return { score, label, tone, reasons };
}

/** Bucket events into Today / Yesterday / This Week / Earlier (newest first). */
function groupEvents(events: Journey["events"]) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYest = startToday - 864e5;
  const startWeek = startToday - 6 * 864e5;
  const order = ["Today", "Yesterday", "This Week", "Earlier"] as const;
  const buckets: Record<string, Journey["events"]> = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };
  for (const e of events) {
    const ts = new Date(e.createdAt).getTime();
    if (ts >= startToday) buckets.Today.push(e);
    else if (ts >= startYest) buckets.Yesterday.push(e);
    else if (ts >= startWeek) buckets["This Week"].push(e);
    else buckets.Earlier.push(e);
  }
  for (const k of order) buckets[k].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return order.map((label) => ({ label, items: buckets[label] })).filter((g) => g.items.length > 0);
}

function Mini({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
      <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
        {icon} {title}
      </h4>
      {children}
    </section>
  );
}
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5 text-[11px]">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="font-semibold text-[var(--primary)]">{value ?? "—"}</span>
    </div>
  );
}

/**
 * Enterprise "booking 360" header for the operations drawer — parallels
 * CustomerSummaryHeader. Every value derived from the already-fetched booking
 * bundle (get + journey + invoices + documents); no new endpoints.
 */
export function BookingSummaryHeader({ detail, staffMap }: { detail: BookingDetail | null; staffMap: Record<string, string> }) {
  if (!detail) return null;
  const { app, journey, invoices, documents } = detail;
  const health = computeHealth(app, invoices, documents);
  const stages = journey?.stages || app.stages || [];
  const events = journey?.events || app.events || [];
  const groups = groupEvents(events);
  const total = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const paid = invoices.reduce((s, i) => s + (i.paid || 0), 0);
  const due = invoices.reduce((s, i) => s + dueOf(i), 0);
  const verifiedDocs = documents.filter((d) => (d.status || "").toLowerCase().includes("verif")).length;
  const pct = app.totalStages ? Math.round((Math.min(app.currentStage, app.totalStages) / app.totalStages) * 100) : 0;
  const assignedName = app.assignedTo ? staffMap[app.assignedTo] || "Assigned" : "Unassigned";

  return (
    <div className="space-y-3 border-b border-[var(--border)] bg-[var(--muted)]/30 p-3">
      {/* Identity + health */}
      <div className="flex items-start gap-3">
        <Avatar name={app.customer?.fullName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={bookingWorkspaceHref(app.id)} className="truncate font-mono text-[14px] font-extrabold text-[var(--accent)] hover:underline">
              {app.referenceNo}
            </Link>
            <span className="text-[12px] font-semibold text-[var(--primary)]">{app.customer?.fullName || app.title || "—"}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                health.tone === "green" ? "bg-emerald-50 text-emerald-700" : health.tone === "amber" ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
              }`}
              title={health.reasons.length ? health.reasons.join(" · ") : "No risk signals"}
            >
              <HeartPulse size={11} /> {health.label} · {health.score}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Pill value={serviceLabel(app.serviceType)} tone="blue" />
            <Pill value={app.status} tone={statusTone(app.status)} />
            {app.priority && app.priority.toLowerCase() !== "normal" && <Pill value={app.priority} tone={priorityTone(app.priority)} />}
            {app.direction && <Pill value={app.direction} tone="slate" />}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
          <span>Stage {app.currentStage} of {app.totalStages}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Summary mini-cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Mini icon={<Wallet size={11} />} title="Financial summary">
          <Row label="Outstanding" value={<span className={due > 0 ? "text-red-600" : "text-emerald-600"}>{fmtBDTPlain(due)}</span>} />
          <Row label="Paid" value={fmtBDTPlain(paid)} />
          <Row label="Invoiced" value={fmtBDTPlain(total)} />
          <Row label="Invoices" value={invoices.length} />
        </Mini>
        <Mini icon={<CalendarClock size={11} />} title="Booking summary">
          <Row label="Service" value={serviceLabel(app.serviceType)} />
          <Row label="Assigned" value={assignedName} />
          <Row label="Created" value={app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "—"} />
          <Row label="Completed" value={app.completedAt ? new Date(app.completedAt).toLocaleDateString() : "—"} />
        </Mini>
        <Mini icon={<FileText size={11} />} title="Document summary">
          <Row label="Documents" value={documents.length} />
          <Row label="Verified" value={verifiedDocs || "—"} />
          <Row label="Stages" value={`${stages.filter((s) => (s.status || "").toLowerCase().includes("complet")).length}/${stages.length || app.totalStages}`} />
          <Row label="Priority" value={app.priority || "normal"} />
        </Mini>
      </div>

      {/* Service / stage status */}
      {stages.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
          <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            <Layers size={11} /> Stage status
          </h4>
          <div className="flex flex-wrap gap-1">
            {stages.slice().sort((a, b) => a.stageNo - b.stageNo).map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1">
                <span className="text-[9px] font-semibold text-[var(--muted-foreground)]">{s.stageNo}.</span>
                <Pill value={s.name} tone={stageTone(s.status)} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grouped timeline */}
      {groups.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
          <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            <Activity size={11} /> Activity timeline
          </h4>
          <div className="space-y-2">
            {groups.map((g) => (
              <div key={g.label}>
                <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[var(--accent)]">{g.label}</div>
                <ol className="space-y-1 border-l border-[var(--border)] pl-3">
                  {g.items.slice(0, 6).map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[15px] top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <div className="text-[11px] font-semibold text-[var(--primary)]">{e.message || e.type}</div>
                      <div className="text-[9px] text-[var(--muted-foreground)]">{new Date(e.createdAt).toLocaleString()}</div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5">
        <Link to={bookingWorkspaceHref(app.id)} className="rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-bold text-white">Open workspace</Link>
        <Link to={serviceCaseHref(app.serviceType, app.id)} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">Service desk</Link>
        {app.customer?.id && (
          <Link to={`/customers/${app.customer.id}`} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">Customer</Link>
        )}
        <Link to="/bookings/new" className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">New booking</Link>
      </div>
    </div>
  );
}
