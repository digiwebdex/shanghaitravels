import type { ReactNode } from "react";
import { Link } from "react-router";
import { Activity, CalendarClock, FileText, HeartPulse, MessageCircle, Printer, Wallet } from "lucide-react";
import type { IntelligenceProfile } from "@/lib/services";
import { fmtBDTPlain } from "@/lib/money";
import { Pill } from "@/components/enterprise/DataTable";
import { Avatar } from "@/components/enterprise/Avatar";
import { bookingWorkspaceHref, customerWorkspaceHref, serviceLabel } from "@/lib/workflow";

type Tone = "slate" | "green" | "amber" | "red" | "blue";

/** Map a free-form status string onto a Pill tone. */
function statusTone(s?: string | null): Tone {
  const v = (s || "").toLowerCase();
  if (["approved", "completed", "paid", "issued", "active", "verified", "done", "confirmed"].some((x) => v.includes(x))) return "green";
  if (["pending", "processing", "submitted", "partial", "progress", "review", "hold", "draft"].some((x) => v.includes(x))) return "amber";
  if (["rejected", "failed", "cancelled", "expired", "overdue", "void"].some((x) => v.includes(x))) return "red";
  return "slate";
}

/** Derived Customer Health from finance, operations, passport and status signals. */
function computeHealth(p: IntelligenceProfile) {
  let score = 100;
  const reasons: string[] = [];
  const fin = p.finance;
  if (fin) {
    if (fin.outstandingDue > 0) { score -= 20; reasons.push(`Outstanding ${fmtBDTPlain(fin.outstandingDue)}`); }
    const overdue = fin.invoices.filter((i) => {
      const s = (i.status || "").toLowerCase();
      return s.includes("overdue") || (i.dueAt != null && new Date(i.dueAt).getTime() < Date.now() && !s.includes("paid"));
    }).length;
    if (overdue) { score -= 20; reasons.push(`${overdue} overdue invoice${overdue > 1 ? "s" : ""}`); }
  }
  if (p.operations?.urgent) { score -= 20; reasons.push("Urgent operations flag"); }
  const pending = p.operations?.pendingTasks?.length || 0;
  if (pending > 3) { score -= 10; reasons.push(`${pending} pending tasks`); }
  if ((p.duplicate?.passportCount ?? 0) > 1) { score -= 10; reasons.push("Duplicate passport records"); }
  const st = (p.customer.status || "").toLowerCase();
  if (st && st !== "active") { score -= 30; reasons.push(`Status: ${p.customer.status}`); }
  const soon = Date.now() + 90 * 864e5;
  const expiring = (p.customer.passports || []).some((pp) => {
    const e = (pp as { expiryDate?: string | null }).expiryDate;
    return e != null && new Date(e).getTime() < soon;
  });
  if (expiring) { score -= 15; reasons.push("Passport expiring / expired"); }
  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? "Healthy" : score >= 55 ? "Watch" : "At Risk";
  const tone: Tone = score >= 80 ? "green" : score >= 55 ? "amber" : "red";
  return { score, label, tone, reasons };
}

/** Bucket timeline events into Today / Yesterday / This Week / Earlier (newest first). */
function groupTimeline(items: IntelligenceProfile["timeline"]) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYest = startToday - 864e5;
  const startWeek = startToday - 6 * 864e5;
  const order = ["Today", "Yesterday", "This Week", "Earlier"] as const;
  const buckets: Record<string, IntelligenceProfile["timeline"]> = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };
  for (const t of items) {
    const ts = new Date(t.at).getTime();
    if (ts >= startToday) buckets.Today.push(t);
    else if (ts >= startYest) buckets.Yesterday.push(t);
    else if (ts >= startWeek) buckets["This Week"].push(t);
    else buckets.Earlier.push(t);
  }
  for (const k of order) buckets[k].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return order.map((label) => ({ label, items: buckets[label] })).filter((g) => g.items.length > 0);
}

/** Richer customer-type / segment badges (derived from the profile). */
function typeBadges(p: IntelligenceProfile): { label: string; tone: Tone }[] {
  const c = p.customer;
  const out: { label: string; tone: Tone }[] = [];
  out.push(c.type === "corporate" ? { label: "Corporate", tone: "blue" } : { label: "Individual", tone: "slate" });
  if ((c.tier || "").toLowerCase() === "vip") out.push({ label: "VIP", tone: "amber" });
  if (p.bookings.total >= 3) out.push({ label: "Repeat client", tone: "green" });
  else if (p.bookings.total === 0) out.push({ label: "Prospect", tone: "slate" });
  if (p.agent) out.push({ label: "Agent-Owned", tone: "amber" });
  if (p.corporate) out.push({ label: p.corporate.companyName, tone: "blue" });
  if ((c.status || "").toLowerCase() && (c.status || "").toLowerCase() !== "active") out.push({ label: c.status!, tone: "red" });
  return out;
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
 * Enterprise "executive 360" header for the customer drawer. Every value is
 * derived from the already-fetched IntelligenceProfile — no extra API calls,
 * no new endpoints. Renders above the existing CustomerIntelligencePanel.
 */
export function CustomerSummaryHeader({ profile }: { profile: IntelligenceProfile | null }) {
  if (!profile) return null;
  const c = profile.customer;
  const b = profile.bookings;
  const fin = profile.finance;
  const docs = profile.documents;
  const comms = profile.communications;
  const health = computeHealth(profile);
  const groups = groupTimeline(profile.timeline);
  const services = ([
    ["Visa", b.visaStatus], ["Ticket", b.ticketStatus], ["Hotel", b.hotelStatus], ["Tour", b.tourStatus],
    ["Transport", b.transportStatus], ["Hajj", b.hajjStatus], ["Student", b.studentStatus], ["Manpower", b.manpowerStatus],
  ] as [string, string | null][]).filter(([, v]) => !!v);
  const lastBooking = b.current || b.history[0] || b.upcoming[0] || null;
  const verifiedDocs = docs ? docs.items.filter((d) => (d.status || "").toLowerCase().includes("verif")).length : 0;
  const ocrConf = docs?.ocr[0]?.confidence != null ? `${Math.round(Number(docs.ocr[0].confidence))}%` : "—";

  return (
    <div className="space-y-3 border-b border-[var(--border)] bg-[var(--muted)]/30 p-3">
      {/* Identity + Health */}
      <div className="flex items-start gap-3">
        <Avatar name={c.fullName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[15px] font-extrabold text-[var(--primary)]">{c.fullName}</span>
            <span className="font-mono text-[10.5px] text-[var(--muted-foreground)]">{c.code}</span>
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
            {typeBadges(profile).map((t) => <Pill key={t.label} value={t.label} tone={t.tone} />)}
          </div>
        </div>
      </div>

      {/* Service status */}
      {services.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            <Activity size={11} /> Services
          </span>
          {services.map(([label, v]) => (
            <span key={label} className="inline-flex items-center gap-1">
              <span className="text-[9px] font-semibold uppercase text-[var(--muted-foreground)]">{label}</span>
              <Pill value={v || "—"} tone={statusTone(v)} />
            </span>
          ))}
        </div>
      )}

      {/* Summary mini-cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Mini icon={<Wallet size={11} />} title="Financial summary">
          <Row label="Outstanding" value={<span className={fin && fin.outstandingDue > 0 ? "text-red-600" : "text-emerald-600"}>{fmtBDTPlain(fin?.outstandingDue ?? 0)}</span>} />
          <Row label="Paid" value={fmtBDTPlain(fin?.paidAmount ?? 0)} />
          <Row label="Refund" value={fmtBDTPlain(fin?.refundAmount ?? 0)} />
          <Row label="Invoices" value={fin?.invoices.length ?? 0} />
        </Mini>
        <Mini icon={<CalendarClock size={11} />} title="Booking summary">
          <Row label="Total" value={b.total} />
          <Row label="Upcoming" value={b.upcoming.length} />
          <Row label="History" value={b.history.length} />
          <Row
            label="Last booking"
            value={lastBooking ? (
              <Link to={bookingWorkspaceHref(lastBooking.id)} className="text-[var(--accent)] hover:underline">
                {lastBooking.referenceNo}
              </Link>
            ) : "—"}
          />
        </Mini>
        <Mini icon={<FileText size={11} />} title="Document summary">
          <Row label="Documents" value={docs?.items.length ?? 0} />
          <Row label="Verified" value={verifiedDocs || "—"} />
          <Row label="OCR confidence" value={ocrConf} />
          <Row label="Passports" value={c.passports?.length ?? (c.passportNo ? 1 : 0)} />
        </Mini>
        <Mini icon={<MessageCircle size={11} />} title="Communication summary">
          <Row label="Messages" value={comms.length} />
          <Row label="Last channel" value={comms[0]?.channel || "—"} />
          <Row label="Last contact" value={comms[0] ? new Date(comms[0].createdAt).toLocaleDateString() : "—"} />
          <Row label="Sales exec" value={profile.crm?.salesExecutive || "—"} />
        </Mini>
      </div>

      {/* Last booking detail */}
      {lastBooking && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[11px]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Last booking</span>
          <Link to={bookingWorkspaceHref(lastBooking.id)} className="font-bold text-[var(--accent)] hover:underline">{lastBooking.referenceNo}</Link>
          <span className="text-[var(--muted-foreground)]">{serviceLabel(lastBooking.serviceType)}</span>
          <Pill value={lastBooking.status} tone={statusTone(lastBooking.status)} />
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
                  {g.items.slice(0, 6).map((t, i) => (
                    <li key={`${t.at}-${i}`} className="relative">
                      <span className="absolute -left-[15px] top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <div className="text-[11px] font-semibold text-[var(--primary)]">{t.title}</div>
                      <div className="text-[9px] text-[var(--muted-foreground)]">
                        {new Date(t.at).toLocaleString()}{t.meta ? ` · ${t.meta}` : ""}
                      </div>
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
        <Link to={customerWorkspaceHref(c.id)} className="rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-bold text-white">Open customer</Link>
        {lastBooking && (
          <Link to={bookingWorkspaceHref(lastBooking.id)} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">Open booking</Link>
        )}
        {profile.permissions.documents && (
          <Link to={customerWorkspaceHref(c.id, "documents")} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">Documents</Link>
        )}
        {profile.permissions.applications && (
          <Link to="/bookings/new" className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]">New booking</Link>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
        >
          <Printer size={11} /> Print
        </button>
      </div>
    </div>
  );
}
