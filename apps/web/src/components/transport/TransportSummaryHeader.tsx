import type { ReactNode } from "react";
import { Link } from "react-router";
import { Activity, CalendarClock, Car, FileText, HeartPulse, Layers, MapPin, ScanLine, UserRound, Users, Wallet } from "lucide-react";
import type { AppDocument, Application, Invoice, Journey } from "@/lib/types";
import { fmtBDTPlain } from "@/lib/money";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { bookingWorkspaceHref } from "@/lib/workflow";

type Tone = "slate" | "green" | "amber" | "red" | "blue";

/** Bundle fetched by the page when the drawer opens (existing endpoints). */
export type TransportDetailBundle = {
  app: Application; // list row: includes transport detail + customer.passports (expand=transport,passport)
  journey: Journey | null;
  invoices: Invoice[];
  documents: AppDocument[];
};

/** Phase 4 — transport document checklist (reuses Document Intelligence). */
const TRANSPORT_DOCS: { label: string; key: string; ocr: boolean }[] = [
  { label: "Passenger List", key: "passenger", ocr: false },
  { label: "Driver License", key: "license", ocr: true },
  { label: "Vehicle Registration", key: "registration", ocr: true },
  { label: "Insurance", key: "insurance", ocr: false },
  { label: "Permit", key: "permit", ocr: false },
  { label: "Route Sheet", key: "route", ocr: false },
];

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");
const fmtDateTime = (s?: string | null) => (s ? new Date(s).toLocaleString("en-GB") : "—");
function stageTone(s?: string | null): Tone {
  const v = (s || "").toLowerCase();
  if (["completed", "done", "approved", "confirmed", "delivered", "picked up"].some((x) => v.includes(x))) return "green";
  if (["active", "in_progress", "current", "assigned", "ready", "pending"].some((x) => v.includes(x))) return "amber";
  return "slate";
}
function dueOf(i: Invoice): number { return i.due ?? Math.max(0, (i.total || 0) - (i.paid || 0)); }
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
  const tr = app.transport || {};
  if (!tr.driverName && !["completed", "cancelled"].includes(st)) { score -= 8; reasons.push("No driver assigned"); }
  const sched = tr.scheduledAt;
  if (sched && new Date(sched).getTime() < Date.now() + 864e5 && !["completed", "cancelled"].includes(st)) { score -= 10; reasons.push("Pickup within 24h"); }
  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? "Healthy" : score >= 55 ? "Watch" : "At Risk";
  const tone: Tone = score >= 80 ? "green" : score >= 55 ? "amber" : "red";
  return { score, label, tone, reasons };
}
function groupEvents(events: Journey["events"]) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYest = startToday - 864e5;
  const startWeek = startToday - 6 * 864e5;
  const order = ["Today", "Yesterday", "This Week", "Earlier"] as const;
  const b: Record<string, Journey["events"]> = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };
  for (const e of events) {
    const ts = new Date(e.createdAt).getTime();
    if (ts >= startToday) b.Today.push(e);
    else if (ts >= startYest) b.Yesterday.push(e);
    else if (ts >= startWeek) b["This Week"].push(e);
    else b.Earlier.push(e);
  }
  for (const k of order) b[k].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
  return order.map((label) => ({ label, items: b[label] })).filter((g) => g.items.length > 0);
}

function Mini({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
      <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{icon} {title}</h4>
      {children}
    </section>
  );
}
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5 text-[11px]">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="max-w-[60%] truncate text-right font-semibold text-[var(--primary)]">{value ?? "—"}</span>
    </div>
  );
}

/**
 * Transport 360 header — reuses the Hotel/Ticket/Visa/Customer/Booking summary
 * pattern. All values from the already-fetched bundle (list row w/ transport detail
 * + passport, journey, invoices, documents). Drawer only; workspace stays separate.
 */
export function TransportSummaryHeader({ bundle, staffMap }: { bundle: TransportDetailBundle | null; staffMap: Record<string, string> }) {
  if (!bundle) return null;
  const { app, journey, invoices, documents } = bundle;
  const tr = app.transport || {};
  const stages = journey?.stages || app.stages || [];
  const events = journey?.events || app.events || [];
  const groups = groupEvents(events);
  const health = computeHealth(app, invoices, documents);
  const due = invoices.reduce((s, i) => s + dueOf(i), 0);
  const paid = invoices.reduce((s, i) => s + (i.paid || 0), 0);
  const pct = app.totalStages ? Math.round((Math.min(app.currentStage, app.totalStages) / app.totalStages) * 100) : 0;
  const assignedName = app.assignedTo ? staffMap[app.assignedTo] || "Assigned" : "Unassigned";
  const route = tr.routeName || [tr.pickupLocation, tr.dropLocation].filter(Boolean).join(" → ") || "—";
  const vehicle = [tr.vehicleType, tr.vehicleNo].filter(Boolean).join(" · ") || "—";
  const verifiedDocs = documents.filter((d) => (d.status || "").toLowerCase().includes("verif")).length;

  return (
    <div className="space-y-3 border-b border-[var(--border)] bg-[var(--muted)]/30 p-3">
      {/* Identity + health */}
      <div className="flex items-start gap-3">
        <Avatar name={app.customer?.fullName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={bookingWorkspaceHref(app.id)} className="truncate font-mono text-[14px] font-extrabold text-[var(--accent)] hover:underline">{app.referenceNo}</Link>
            <span className="text-[12px] font-semibold text-[var(--primary)]">{app.customer?.fullName || "—"}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${health.tone === "green" ? "bg-emerald-50 text-emerald-700" : health.tone === "amber" ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"}`} title={health.reasons.join(" · ") || "No risk signals"}>
              <HeartPulse size={11} /> {health.label} · {health.score}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Pill value="Transport" tone="blue" />
            <Pill value={app.status} tone={statusTone(app.status)} />
            {app.priority && app.priority.toLowerCase() !== "normal" && <Pill value={app.priority} tone={app.priority.toLowerCase() === "urgent" ? "red" : "amber"} />}
            {tr.serviceKind && <Pill value={tr.serviceKind} tone="slate" />}
          </div>
        </div>
      </div>

      {/* Stage progress */}
      <div>
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
          <span>Stage {app.currentStage} of {app.totalStages}{stages[app.currentStage - 1] ? ` · ${stages[app.currentStage - 1].name}` : ""}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Mini icon={<UserRound size={11} />} title="Customer">
          <Row label="Name" value={app.customer?.fullName} />
          <Row label="Code" value={app.customer?.code} />
          <Row label="Phone" value={app.customer?.phone} />
        </Mini>
        <Mini icon={<Car size={11} />} title="Vehicle">
          <Row label="Type" value={tr.vehicleType} />
          <Row label="Vehicle no." value={tr.vehicleNo} />
          <Row label="Confirmation" value={tr.confirmationNo} />
        </Mini>
        <Mini icon={<Car size={11} />} title="Transport type">
          <Row label="Service" value={tr.serviceKind} />
          <Row label="Assigned" value={assignedName} />
          <Row label="Passengers" value={tr.passengers != null ? tr.passengers : "—"} />
        </Mini>
        <Mini icon={<MapPin size={11} />} title="Pickup / Drop">
          <Row label="Pickup" value={tr.pickupLocation} />
          <Row label="Drop" value={tr.dropLocation} />
          <Row label="Route" value={route} />
        </Mini>
        <Mini icon={<UserRound size={11} />} title="Driver">
          <Row label="Driver" value={tr.driverName} />
          <Row label="Vehicle" value={vehicle} />
        </Mini>
        <Mini icon={<CalendarClock size={11} />} title="Travel date">
          <Row label="Scheduled" value={fmtDateTime(tr.scheduledAt)} />
          <Row label="Created" value={fmtDate(app.createdAt)} />
          <Row label="Completed" value={fmtDate(app.completedAt)} />
        </Mini>
        <Mini icon={<Users size={11} />} title="Passengers">
          <Row label="Passengers" value={tr.passengers != null ? tr.passengers : "—"} />
          <Row label="Route" value={route} />
        </Mini>
        <Mini icon={<Wallet size={11} />} title="Financial summary">
          <Row label="Outstanding" value={<span className={due > 0 ? "text-red-600" : "text-emerald-600"}>{fmtBDTPlain(due)}</span>} />
          <Row label="Paid" value={fmtBDTPlain(paid)} />
          <Row label="Invoices" value={invoices.length} />
        </Mini>
        <Mini icon={<ScanLine size={11} />} title="Documents / OCR">
          <Row label="Uploaded" value={documents.length} />
          <Row label="Verified" value={verifiedDocs || "—"} />
        </Mini>
      </div>

      {/* Document checklist (Phase 4) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
        <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]"><FileText size={11} /> Document checklist</h4>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {TRANSPORT_DOCS.map((doc) => {
            const have = documents.some((d) => `${d.category || ""} ${d.fileName || ""}`.toLowerCase().includes(doc.key));
            return (
              <div key={doc.label} className="flex items-center gap-1.5 text-[11px]">
                <span className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${have ? "bg-emerald-500" : "bg-[var(--border)]"}`} />
                <span className={have ? "font-semibold text-[var(--primary)]" : "text-[var(--muted-foreground)]"}>{doc.label}</span>
                {doc.ocr && <span className="text-[8px] font-bold uppercase text-[var(--accent)]">OCR</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage status */}
      {stages.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
          <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]"><Layers size={11} /> Stage status</h4>
          <div className="flex flex-wrap gap-1">
            {stages.slice().sort((a, b) => a.stageNo - b.stageNo).map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1"><span className="text-[9px] font-semibold text-[var(--muted-foreground)]">{s.stageNo}.</span><Pill value={s.name} tone={stageTone(s.status)} /></span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline + audit */}
      {groups.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
          <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]"><Activity size={11} /> Timeline &amp; audit</h4>
          <div className="space-y-2">
            {groups.map((g) => (
              <div key={g.label}>
                <div className="mb-1 text-[9px] font-bold uppercase tracking-wide text-[var(--accent)]">{g.label}</div>
                <ol className="space-y-1 border-l border-[var(--border)] pl-3">
                  {g.items.slice(0, 6).map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[15px] top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <div className="text-[11px] font-semibold text-[var(--primary)]">{e.message || e.type}</div>
                      <div className="text-[9px] text-[var(--muted-foreground)]">{new Date(e.createdAt).toLocaleString()}{e.type ? ` · ${e.type}` : ""}</div>
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
        <Link to={`/transport/${app.id}`} className="rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-bold text-white">Open workspace</Link>
        {app.customer?.id && <Link to={`/customers/${app.customer.id}`} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">Customer 360</Link>}
        <Link to="/bookings/new?service=transport" className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">New transport</Link>
      </div>
    </div>
  );
}
