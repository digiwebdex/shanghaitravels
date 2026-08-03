import type { ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Printer,
  UserRound,
} from "lucide-react";
import { Link } from "react-router";
import type { IntelligenceProfile } from "@/lib/services";
import { fmtBDTPlain } from "@/lib/money";
import { bookingWorkspaceHref, customerWorkspaceHref, serviceLabel } from "@/lib/workflow";

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)] ${className}`}
    >
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="mt-0.5 text-[12px] font-semibold text-[var(--primary)]">{value || "—"}</div>
    </div>
  );
}

function statusTone(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (["approved", "completed", "paid", "issued", "active", "verified"].some((x) => v.includes(x)))
    return "text-[var(--success)]";
  if (["pending", "processing", "submitted", "partial"].some((x) => v.includes(x)))
    return "text-[var(--warning)]";
  if (["rejected", "failed", "cancelled", "expired", "overdue"].some((x) => v.includes(x)))
    return "text-[var(--error)]";
  return "text-[var(--primary)]";
}

export function CustomerIntelligencePanel({
  profile,
  loading,
}: {
  profile: IntelligenceProfile | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-[12px] text-[var(--muted-foreground)]">
        Loading 360° profile…
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <UserRound size={28} className="text-[var(--muted-foreground)]" />
        <p className="text-[13px] font-semibold text-[var(--primary)]">Customer intelligence</p>
        <p className="max-w-xs text-[11px] text-[var(--muted-foreground)]">
          Search by passport, NID, booking ID, mobile, or name to open a complete 360° profile.
        </p>
      </div>
    );
  }

  const c = profile.customer;
  const b = profile.bookings;
  const phone = c.mobile || "";
  const wa = (c.whatsapp || c.mobile || "").replace(/\D/g, "");
  const email = c.email || "";

  const printSummary = () => {
    const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${c.fullName} — Summary</title>
<style>body{font-family:system-ui;padding:24px;color:#0f172a}h1{font-size:18px}h2{font-size:13px;margin-top:18px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}p,li{font-size:12px;line-height:1.5}</style></head><body>
<h1>${c.fullName} (${c.code})</h1>
<p>Passport: ${c.passportNo || "—"} · Mobile: ${c.mobile || "—"} · Email: ${c.email || "—"}</p>
<p>Status: ${c.status || "—"} · Tier: ${c.tier}</p>
<h2>Bookings</h2><p>Total ${b.total}${b.current ? ` · Current ${b.current.referenceNo} (${b.current.status})` : ""}</p>
${
  profile.finance
    ? `<h2>Finance</h2><p>Outstanding: ${fmtBDTPlain(profile.finance.outstandingDue)} · Paid: ${fmtBDTPlain(profile.finance.paidAmount)}</p>`
    : ""
}
<h2>Timeline</h2><ul>${profile.timeline
      .slice(-20)
      .map((t) => `<li>${new Date(t.at).toLocaleString()} — ${t.title}</li>`)
      .join("")}</ul>
</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="intelligence-print space-y-3 overflow-y-auto p-3" id="customer-intelligence-panel">
      {profile.duplicate.passportCount > 1 && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--warning)]/40 bg-[var(--orange-50)] px-3 py-2 text-[11px] text-[var(--primary)]">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[var(--warning)]" />
          <div>
            <strong>Existing passport records ({profile.duplicate.passportCount}).</strong> Do not create a
            duplicate customer — open this profile instead.
            <div className="mt-0.5 text-[var(--muted-foreground)]">
              Bookings: {profile.duplicate.bookingCount} · Documents: {profile.duplicate.documentCount}
            </div>
          </div>
        </div>
      )}

      <Card title="Customer summary">
        <div className="flex gap-3">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)]">
            <UserRound size={22} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <div className="truncate text-[14px] font-extrabold text-[var(--primary)]">{c.fullName}</div>
              <div className="text-[10px] text-[var(--muted-foreground)]">
                {c.code} · {c.tier === "vip" || c.tier === "VIP" ? "VIP" : "Regular"} · {c.status || "—"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Passport" value={c.passportNo} />
              <Stat label="Nationality" value={c.nationality} />
              <Stat label="DOB" value={c.dob ? String(c.dob).slice(0, 10) : null} />
              <Stat label="Gender" value={c.gender} />
              <Stat label="Mobile" value={c.mobile} />
              <Stat label="Email" value={c.email} />
            </div>
            {c.address && (
              <p className="text-[11px] text-[var(--muted-foreground)]">
                <span className="font-semibold text-[var(--primary)]">Address:</span> {c.address}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--muted)] px-2 py-1 text-[10px] font-semibold text-[var(--primary)]"
                >
                  <Phone size={11} /> Call
                </a>
              )}
              {wa && (
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--muted)] px-2 py-1 text-[10px] font-semibold text-[var(--primary)]"
                >
                  <MessageCircle size={11} /> WhatsApp
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--muted)] px-2 py-1 text-[10px] font-semibold text-[var(--primary)]"
                >
                  <Mail size={11} /> Email
                </a>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Booking information">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Total bookings" value={b.total} />
          <Stat
            label="Current"
            value={
              b.current ? (
                <Link className="text-[var(--accent)] underline-offset-2 hover:underline" to={bookingWorkspaceHref(b.current.id)}>
                  {b.current.referenceNo}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Stat label="Booking status" value={<span className={statusTone(b.current?.status)}>{b.current?.status || "—"}</span>} />
          <Stat label="Visa" value={<span className={statusTone(b.visaStatus)}>{b.visaStatus || "—"}</span>} />
          <Stat label="Ticket" value={<span className={statusTone(b.ticketStatus)}>{b.ticketStatus || "—"}</span>} />
          <Stat label="Hotel" value={<span className={statusTone(b.hotelStatus)}>{b.hotelStatus || "—"}</span>} />
          <Stat label="Tour" value={<span className={statusTone(b.tourStatus)}>{b.tourStatus || "—"}</span>} />
          <Stat label="Transport" value={<span className={statusTone(b.transportStatus)}>{b.transportStatus || "—"}</span>} />
          <Stat label="Hajj" value={<span className={statusTone(b.hajjStatus)}>{b.hajjStatus || "—"}</span>} />
          <Stat label="Student" value={<span className={statusTone(b.studentStatus)}>{b.studentStatus || "—"}</span>} />
          <Stat label="Manpower" value={<span className={statusTone(b.manpowerStatus)}>{b.manpowerStatus || "—"}</span>} />
        </div>
        {(b.upcoming.length > 0 || b.history.length > 0) && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Upcoming travel</div>
              {b.upcoming.length ? (
                b.upcoming.slice(0, 4).map((x) => (
                  <Link
                    key={x.id}
                    to={bookingWorkspaceHref(x.id)}
                    className="block truncate text-[11px] text-[var(--accent)] hover:underline"
                  >
                    {x.referenceNo} · {serviceLabel(x.serviceType)}
                  </Link>
                ))
              ) : (
                <p className="text-[11px] text-[var(--muted-foreground)]">None</p>
              )}
            </div>
            <div>
              <div className="mb-1 text-[9px] font-bold uppercase text-[var(--muted-foreground)]">Travel history</div>
              {b.history.length ? (
                b.history.slice(0, 4).map((x) => (
                  <Link
                    key={x.id}
                    to={bookingWorkspaceHref(x.id)}
                    className="block truncate text-[11px] text-[var(--muted-foreground)] hover:text-[var(--accent)]"
                  >
                    {x.referenceNo} · {serviceLabel(x.serviceType)} · {x.status}
                  </Link>
                ))
              ) : (
                <p className="text-[11px] text-[var(--muted-foreground)]">None</p>
              )}
            </div>
          </div>
        )}
      </Card>

      {profile.finance && (
        <Card title="Finance">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Outstanding due" value={fmtBDTPlain(profile.finance.outstandingDue)} />
            <Stat label="Paid amount" value={fmtBDTPlain(profile.finance.paidAmount)} />
            <Stat label="Refund" value={fmtBDTPlain(profile.finance.refundAmount)} />
            <Stat label="Invoices" value={profile.finance.invoices.length} />
          </div>
          {profile.finance.invoices.slice(0, 4).length > 0 && (
            <ul className="mt-2 space-y-1">
              {profile.finance.invoices.slice(0, 4).map((inv) => (
                <li key={inv.id} className="flex justify-between gap-2 text-[11px]">
                  <Link to="/finance/invoices" className="font-semibold text-[var(--accent)] hover:underline">
                    {inv.invoiceNo}
                  </Link>
                  <span className={statusTone(inv.status)}>
                    {inv.status} · {fmtBDTPlain(inv.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {profile.documents && (
        <Card title="Documents">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {["passport", "nid", "visa", "ticket", "hotel", "insurance"].map((cat) => {
              const n = profile.documents!.items.filter((d) =>
                `${d.category || ""} ${d.fileName || ""} ${d.isPassport ? "passport" : ""}`
                  .toLowerCase()
                  .includes(cat),
              ).length;
              return <Stat key={cat} label={cat} value={n || "—"} />;
            })}
            <Stat label="Other" value={profile.documents.items.length} />
            <Stat
              label="OCR confidence"
              value={
                profile.documents.ocr[0]?.confidence != null
                  ? `${Math.round(Number(profile.documents.ocr[0].confidence))}%`
                  : "—"
              }
            />
            <Stat
              label="Verification"
              value={
                <span className={statusTone(profile.documents.ocr[0]?.status || profile.documents.items[0]?.status)}>
                  {profile.documents.ocr[0]?.status || profile.documents.items[0]?.status || "—"}
                </span>
              }
            />
          </div>
        </Card>
      )}

      {profile.crm && (
        <Card title="CRM">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Leads" value={profile.crm.leads.length} />
            <Stat label="Opportunities" value={profile.crm.opportunities.length} />
            <Stat label="Sales executive" value={profile.crm.salesExecutive} />
            <Stat
              label="Last contact"
              value={profile.crm.lastContact ? new Date(profile.crm.lastContact).toLocaleDateString() : "—"}
            />
            <Stat label="Lead status" value={profile.crm.leads[0]?.status} />
            <Stat label="Opportunity" value={profile.crm.opportunities[0]?.stage || profile.crm.opportunities[0]?.title} />
          </div>
        </Card>
      )}

      <Card title="Operations">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat
            label="Current stage"
            value={
              profile.operations.stageName ||
              (profile.operations.currentStage != null ? `Stage ${profile.operations.currentStage}` : "—")
            }
          />
          <Stat label="Assigned officer" value={profile.operations.assignedOfficer} />
          <Stat label="Pending tasks" value={profile.operations.pendingTasks.length} />
          <Stat
            label="Urgent"
            value={profile.operations.urgent ? <span className="text-[var(--error)]">Yes</span> : "No"}
          />
        </div>
        {profile.operations.workflow.length > 0 && (
          <ol className="mt-2 flex flex-wrap gap-1">
            {profile.operations.workflow.slice(0, 8).map((s) => (
              <li
                key={s.stageNo}
                className="rounded-md bg-[var(--muted)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--primary)]"
              >
                {s.stageNo}. {s.name}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {(profile.agent || profile.corporate) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.agent && (
            <Card title="Agent">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Agent" value={profile.agent.name} />
                <Stat label="Agency / code" value={profile.agent.code} />
                <Stat
                  label="Commission"
                  value={
                    profile.agent.commissionRateBps != null
                      ? `${(profile.agent.commissionRateBps / 100).toFixed(2)}%`
                      : "—"
                  }
                />
                <Stat label="Branch" value={profile.agent.branchId} />
              </div>
            </Card>
          )}
          {profile.corporate && (
            <Card title="Corporate">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Company" value={profile.corporate.companyName} />
                <Stat label="Contact / employee" value={profile.corporate.contactPerson} />
                <Stat label="Phone" value={profile.corporate.phone} />
                <Stat label="Email" value={profile.corporate.email} />
              </div>
            </Card>
          )}
        </div>
      )}

      <Card title="Communication">
        {profile.communications.length ? (
          <ul className="space-y-1.5">
            {profile.communications.slice(0, 6).map((m) => (
              <li key={m.id} className="flex gap-2 text-[11px]">
                <span className="w-16 flex-shrink-0 font-bold uppercase text-[var(--muted-foreground)]">
                  {m.channel || "note"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[var(--primary)]">{m.summary || "—"}</span>
                <span className="flex-shrink-0 text-[var(--muted-foreground)]">
                  {new Date(m.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-[var(--muted-foreground)]">No recent communications</p>
        )}
      </Card>

      <Card title="Timeline">
        <ol className="relative space-y-0 border-l border-[var(--border)] pl-3">
          {profile.timeline.length ? (
            profile.timeline
              .slice()
              .reverse()
              .slice(0, 16)
              .map((t, i) => (
                <li key={`${t.at}-${i}`} className="relative pb-3 last:pb-0">
                  <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-[var(--accent)]" />
                  <div className="text-[11px] font-semibold text-[var(--primary)]">{t.title}</div>
                  <div className="text-[9px] text-[var(--muted-foreground)]">
                    {new Date(t.at).toLocaleString()}
                    {t.meta ? ` · ${t.meta}` : ""}
                  </div>
                </li>
              ))
          ) : (
            <li className="text-[11px] text-[var(--muted-foreground)]">No timeline events</li>
          )}
        </ol>
      </Card>

      <Card title="Quick actions">
        <div className="flex flex-wrap gap-1.5">
          <Link
            to={customerWorkspaceHref(c.id)}
            className="rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-bold text-white"
          >
            Open customer
          </Link>
          {b.current && (
            <Link
              to={bookingWorkspaceHref(b.current.id)}
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
            >
              Open booking
            </Link>
          )}
          {profile.permissions.finance && (
            <Link
              to="/finance/invoices"
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
            >
              Open invoices
            </Link>
          )}
          {profile.permissions.documents && (
            <>
              <Link
                to={customerWorkspaceHref(c.id, "documents")}
                className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
              >
                Open passport / docs
              </Link>
              <Link
                to="/operations/document-intelligence"
                className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
              >
                Upload document
              </Link>
            </>
          )}
          {profile.permissions.applications && (
            <Link
              to="/bookings/new"
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
            >
              Create booking
            </Link>
          )}
          {profile.permissions.finance && (
            <Link
              to="/finance/invoices"
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
            >
              Create invoice
            </Link>
          )}
          <Link
            to="/sales/tasks"
            className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
          >
            Create task
          </Link>
          {b.current && (
            <Link
              to={bookingWorkspaceHref(b.current.id)}
              className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
            >
              Assign officer
            </Link>
          )}
          <button
            type="button"
            onClick={printSummary}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--primary)]"
          >
            <Printer size={11} /> Print summary
          </button>
          {!profile.agent && !profile.corporate && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
              <Building2 size={11} /> No agent / corporate link
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
            <FileText size={11} /> {profile.duplicate.documentCount} docs indexed
          </span>
        </div>
      </Card>
    </div>
  );
}
