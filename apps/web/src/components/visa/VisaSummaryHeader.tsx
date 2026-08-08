import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  Activity, BadgeCheck, CalendarClock, FileText, HeartPulse, Landmark, Layers, ScanLine, Stamp, UserRound, Wallet,
} from "lucide-react";
import type { AppDocument, Application, Invoice, Journey } from "@/lib/types";
import { fmtBDTPlain } from "@/lib/money";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { bookingWorkspaceHref } from "@/lib/workflow";

type Tone = "slate" | "green" | "amber" | "red" | "blue";

/** Bundle fetched by the page when the drawer opens (existing endpoints). */
export type VisaDetailBundle = {
  app: Application; // list row: includes visa detail + customer.passports (expand=visa)
  journey: Journey | null;
  invoices: Invoice[];
  documents: AppDocument[];
};

/** Phase 4 — visa document checklist (reuses Document Intelligence upload/OCR). */
const VISA_DOCS: { label: string; key: string; ocr: boolean }[] = [
  { label: "Passport", key: "passport", ocr: true },
  { label: "Photo", key: "photo", ocr: false },
  { label: "NID", key: "nid", ocr: true },
  { label: "Bank Statement", key: "bank", ocr: true },
  { label: "Invitation", key: "invit", ocr: false },
  { label: "Trade License", key: "trade", ocr: true },
  { label: "Marriage Certificate", key: "marriage", ocr: false },
  { label: "Employment Letter", key: "employ", ocr: false },
  { label: "Birth Certificate", key: "birth", ocr: true },
  { label: "Embassy Checklist", key: "embassy checklist", ocr: false },
];

const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");
function stageTone(s?: string | null): Tone {
  const v = (s || "").toLowerCase();
  if (["completed", "done", "approved"].some((x) => v.includes(x))) return "green";
  if (["active", "in_progress", "current", "started"].some((x) => v.includes(x))) return "amber";
  return "slate";
}
function dueOf(i: Invoice): number {
  return i.due ?? Math.max(0, (i.total || 0) - (i.paid || 0));
}
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
  const exp = app.customer?.passports?.[0]?.expiryDate;
  if (exp && new Date(exp).getTime() < Date.now() + 180 * 864e5) { score -= 15; reasons.push("Passport expiring / expired"); }
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
 * Visa 360 header — reuses the Customer/Booking summary pattern. All values from
 * the already-fetched bundle (list row w/ visa detail + passport, journey, invoices,
 * documents). No workspace embedded; the workspace stays a separate page.
 */
export function VisaSummaryHeader({ bundle, staffMap }: { bundle: VisaDetailBundle | null; staffMap: Record<string, string> }) {
  if (!bundle) return null;
  const { app, journey, invoices, documents } = bundle;
  const v = app.visa || {};
  const pp = app.customer?.passports?.[0];
  const stages = journey?.stages || app.stages || [];
  const events = journey?.events || app.events || [];
  const groups = groupEvents(events);
  const health = computeHealth(app, invoices, documents);
  const due = invoices.reduce((s, i) => s + dueOf(i), 0);
  const paid = invoices.reduce((s, i) => s + (i.paid || 0), 0);
  const pct = app.totalStages ? Math.round((Math.min(app.currentStage, app.totalStages) / app.totalStages) * 100) : 0;
  const assignedName = app.assignedTo ? staffMap[app.assignedTo] || "Assigned" : "Unassigned";
  const collectedStage = stages.find((s) => (s.name || "").toLowerCase() === "collected");
  const deliveredStage = stages.find((s) => (s.name || "").toLowerCase() === "delivered");
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
            <Pill value="Visa" tone="blue" />
            <Pill value={app.status} tone={statusTone(app.status)} />
            {app.priority && app.priority.toLowerCase() !== "normal" && <Pill value={app.priority} tone={app.priority.toLowerCase() === "urgent" ? "red" : "amber"} />}
            {v.outcome && <Pill value={v.outcome} tone={statusTone(v.outcome)} />}
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
        <Mini icon={<BadgeCheck size={11} />} title="Visa summary">
          <Row label="Visa no." value={v.visaNumber} />
          <Row label="Application no." value={v.applicationNo} />
          <Row label="Outcome" value={v.outcome} />
          <Row label="Assigned" value={assignedName} />
        </Mini>
        <Mini icon={<UserRound size={11} />} title="Customer">
          <Row label="Name" value={app.customer?.fullName} />
          <Row label="Code" value={app.customer?.code} />
          <Row label="Phone" value={app.customer?.phone} />
        </Mini>
        <Mini icon={<FileText size={11} />} title="Passport">
          <Row label="Passport no." value={pp?.passportNo} />
          <Row label="Issuing" value={pp?.issuingCountry} />
          <Row label="Expiry" value={fmtDate(pp?.expiryDate)} />
        </Mini>
        <Mini icon={<Landmark size={11} />} title="Embassy">
          <Row label="Embassy" value={v.embassy} />
          <Row label="Destination" value={v.destination} />
        </Mini>
        <Mini icon={<Stamp size={11} />} title="Visa type">
          <Row label="Type" value={v.visaType} />
          <Row label="Entry" value={v.entryType} />
          <Row label="Duration" value={v.durationDays != null ? `${v.durationDays} days` : "—"} />
        </Mini>
        <Mini icon={<Wallet size={11} />} title="Financial">
          <Row label="Outstanding" value={<span className={due > 0 ? "text-red-600" : "text-emerald-600"}>{fmtBDTPlain(due)}</span>} />
          <Row label="Paid" value={fmtBDTPlain(paid)} />
          <Row label="Invoices" value={invoices.length} />
        </Mini>
        <Mini icon={<FileText size={11} />} title="Documents">
          <Row label="Uploaded" value={documents.length} />
          <Row label="Verified" value={verifiedDocs || "—"} />
        </Mini>
        <Mini icon={<ScanLine size={11} />} title="OCR summary">
          <Row label="Scanned" value={documents.filter((d) => (d.category || "").toLowerCase().includes("passport") || d.isPassport).length || "—"} />
          <Row label="Verified" value={verifiedDocs || "—"} />
        </Mini>
        <Mini icon={<CalendarClock size={11} />} title="Interview / Submission / Collection">
          <Row label="Interview" value={fmtDate(v.appointmentAt)} />
          <Row label="Submitted" value={fmtDate(v.submittedAt)} />
          <Row label="Decision" value={fmtDate(v.decisionAt)} />
          <Row label="Collected" value={fmtDate(collectedStage?.completedAt)} />
          <Row label="Delivered" value={fmtDate(deliveredStage?.completedAt)} />
        </Mini>
      </div>

      {/* Document checklist (Phase 4 — reuses Document Intelligence categories) */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
        <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]"><FileText size={11} /> Document checklist</h4>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {VISA_DOCS.map((doc) => {
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

      {/* Timeline + Audit (ApplicationEvent = audit trail) */}
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
        <Link to={`/visa/${app.id}`} className="rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-bold text-white">Open workspace</Link>
        {app.customer?.id && <Link to={`/customers/${app.customer.id}`} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">Customer 360</Link>}
        <Link to="/bookings/new?service=visa" className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">New visa</Link>
      </div>
    </div>
  );
}
