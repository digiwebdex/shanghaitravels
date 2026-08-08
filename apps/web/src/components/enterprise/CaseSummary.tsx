import type { ReactNode } from "react";
import { Link } from "react-router";
import { Activity, FileText, HeartPulse, Layers } from "lucide-react";
import type { AppDocument, Application, Invoice, Journey } from "@/lib/types";
import { fmtBDTPlain } from "@/lib/money";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";

/**
 * V12+ shared 360-drawer chrome for service verticals (Tour, Hajj/Umrah, Student,
 * Manpower). Extracted so new verticals stop copying the identical health /
 * stage / timeline / checklist blocks — one implementation, reused. Frozen
 * verticals (Visa/Ticket/Hotel/Transport) keep their own headers untouched.
 */

export type Tone = "slate" | "green" | "amber" | "red" | "blue";

/** Bundle fetched by a queue page when its 360 drawer opens (existing endpoints only). */
export type CaseBundle = {
  app: Application;
  journey: Journey | null;
  invoices: Invoice[];
  documents: AppDocument[];
};

export const fmtD = (s?: string | null) => (s ? new Date(s).toLocaleDateString("en-GB") : "—");
export const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString("en-GB") : "—");
export const isToday = (s?: string | null) => !!s && new Date(s).toDateString() === new Date().toDateString();

export function priorityTone(p?: string | null): Tone {
  const v = (p || "").toLowerCase();
  if (v === "urgent") return "red";
  if (v === "high") return "amber";
  return "slate";
}
export function stageTone(s?: string | null): Tone {
  const v = (s || "").toLowerCase();
  if (["completed", "done", "approved", "confirmed", "issued", "enrolled", "deployed", "returned", "closed"].some((x) => v.includes(x))) return "green";
  if (["active", "in_progress", "current", "started", "pending", "assigned", "ready", "processing"].some((x) => v.includes(x))) return "amber";
  if (["blocked", "failed", "rejected"].some((x) => v.includes(x))) return "red";
  return "slate";
}

function dueOf(i: Invoice): number {
  return i.due ?? Math.max(0, (i.total || 0) - (i.paid || 0));
}
export function financeOf(invoices: Invoice[]) {
  return {
    due: invoices.reduce((s, i) => s + dueOf(i), 0),
    paid: invoices.reduce((s, i) => s + (i.paid || 0), 0),
    total: invoices.reduce((s, i) => s + (i.total || 0), 0),
  };
}

export type CaseHealth = { score: number; label: string; tone: Tone; reasons: string[] };

/** Base health from status/priority/finance/documents + vertical-specific extras. */
export function computeCaseHealth(
  app: Application,
  invoices: Invoice[],
  documents: AppDocument[],
  extras: { when: boolean; deduct: number; reason: string }[] = [],
): CaseHealth {
  let score = 100;
  const reasons: string[] = [];
  const st = (app.status || "").toLowerCase();
  if (["rejected", "cancelled"].includes(st)) { score -= 45; reasons.push(`Status: ${app.status}`); }
  else if (st === "on_hold") { score -= 20; reasons.push("On hold"); }
  else if (st === "docs_required") { score -= 15; reasons.push("Documents required"); }
  const pr = (app.priority || "").toLowerCase();
  if (pr === "urgent") { score -= 20; reasons.push("Urgent priority"); }
  else if (pr === "high") { score -= 10; reasons.push("High priority"); }
  const { due } = financeOf(invoices);
  if (due > 0) { score -= 15; reasons.push(`Outstanding ${fmtBDTPlain(due)}`); }
  if (!documents.length) { score -= 10; reasons.push("No documents uploaded"); }
  for (const e of extras) if (e.when) { score -= e.deduct; reasons.push(e.reason); }
  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? "Healthy" : score >= 55 ? "Watch" : "At Risk";
  const tone: Tone = score >= 80 ? "green" : score >= 55 ? "amber" : "red";
  return { score, label, tone, reasons };
}

/** Bucket journey events into Today / Yesterday / This Week / Earlier (newest first). */
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

export function Mini({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
      <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{icon} {title}</h4>
      {children}
    </section>
  );
}
export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5 text-[11px]">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="max-w-[60%] truncate text-right font-semibold text-[var(--primary)]">{value ?? "—"}</span>
    </div>
  );
}

/** Identity band: avatar · reference link · display name · health chip · badge pills. */
export function CaseIdentity({ app, name, extraBadges, health, refTo }: {
  app: Application; name?: string | null; extraBadges?: ReactNode; health: CaseHealth; refTo: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={name || app.customer?.fullName} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={refTo} className="truncate font-mono text-[14px] font-extrabold text-[var(--accent)] hover:underline">{app.referenceNo}</Link>
          <span className="text-[12px] font-semibold text-[var(--primary)]">{name || app.customer?.fullName || "—"}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              health.tone === "green" ? "bg-emerald-50 text-emerald-700" : health.tone === "amber" ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
            }`}
            title={health.reasons.join(" · ") || "No risk signals"}
          >
            <HeartPulse size={11} /> {health.label} · {health.score}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <Pill value={app.status} tone={statusTone(app.status)} />
          {app.priority && app.priority.toLowerCase() !== "normal" && <Pill value={app.priority} tone={priorityTone(app.priority)} />}
          {extraBadges}
        </div>
      </div>
    </div>
  );
}

export function StageProgress({ app, stages }: { app: Application; stages: { stageNo: number; name: string }[] }) {
  const pct = app.totalStages ? Math.round((Math.min(app.currentStage, app.totalStages) / app.totalStages) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
        <span>Stage {app.currentStage} of {app.totalStages}{stages[app.currentStage - 1] ? ` · ${stages[app.currentStage - 1].name}` : ""}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function DocChecklistCard({ docs, documents }: { docs: { label: string; key: string; ocr: boolean }[]; documents: AppDocument[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
      <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]"><FileText size={11} /> Document checklist</h4>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {docs.map((doc) => {
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
  );
}

export function StageStatusCard({ stages }: { stages: { id: string; stageNo: number; name: string; status?: string | null }[] }) {
  if (!stages.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
      <h4 className="mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]"><Layers size={11} /> Stage status</h4>
      <div className="flex flex-wrap gap-1">
        {stages.slice().sort((a, b) => a.stageNo - b.stageNo).map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1">
            <span className="text-[9px] font-semibold text-[var(--muted-foreground)]">{s.stageNo}.</span>
            <Pill value={s.name} tone={stageTone(s.status)} />
          </span>
        ))}
      </div>
    </div>
  );
}

export function TimelineCard({ events }: { events: Journey["events"] }) {
  const groups = groupEvents(events);
  if (!groups.length) return null;
  return (
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
  );
}

export function QuickActions({ links }: { links: { to: string; label: string; primary?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((l) => (
        <Link
          key={l.to + l.label}
          to={l.to}
          className={l.primary
            ? "rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-bold text-white"
            : "rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
