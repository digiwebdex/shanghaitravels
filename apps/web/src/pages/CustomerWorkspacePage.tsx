import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  BarChart3,
  FileText,
  Heart,
  History,
  MessageSquare,
  ScanLine,
  StickyNote,
  UserRound,
} from "lucide-react";
import { applicationsApi, commsApi, customersApi, financeApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Application, Customer, Invoice } from "@/lib/types";
import { passportExpiry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import {
  EmptyPanel,
  KpiCard,
  PageHeader,
  PageShell,
  SkeletonRows,
  StatStrip,
  Surface,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { EntityTabPanel, EntityTabs } from "@/components/workflow/EntityTabs";
import { JourneyContinuity, NextStepBanner } from "@/components/workflow/MasterJourney";
import { ScanDocumentPanel, ocrFullName, ocrGenderToForm } from "@/components/ocr/ScanDocumentPanel";
import { CustomerDocumentTimeline } from "@/components/ocr/OcrOpsWidget";
import {
  bookingWorkspaceHref,
  customerWorkspaceHref,
  serviceCaseHref,
  serviceLabel,
} from "@/lib/workflow";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "bookings", label: "Bookings" },
  { id: "documents", label: "Documents" },
  { id: "passport", label: "Passport" },
  { id: "visa", label: "Visa" },
  { id: "ocr", label: "OCR" },
  { id: "invoices", label: "Invoices" },
  { id: "payments", label: "Payments" },
  { id: "communications", label: "Communications" },
  { id: "tasks", label: "Tasks" },
  { id: "travel", label: "Travel History" },
  { id: "feedback", label: "Feedback" },
  { id: "loyalty", label: "Loyalty" },
  { id: "notes", label: "Notes" },
  { id: "analytics", label: "Analytics" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CustomerWorkspacePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as TabId) || "overview";
  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    if (t === "overview") next.delete("tab");
    else next.set("tab", t);
    setParams(next, { replace: true });
  };

  const { can } = useAuth();
  const [c, setC] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Application[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [comms, setComms] = useState<{ id?: string; channel?: string; subject?: string; createdAt?: string; body?: string }[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    whatsapp: "",
    nationality: "",
    gender: "",
    dob: "",
    address: "",
    notes: "",
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const cust = await customersApi.get(id);
      setC(cust);
      setForm({
        fullName: cust.fullName || "",
        phone: cust.phone || "",
        email: cust.email || "",
        whatsapp: cust.whatsapp || "",
        nationality: cust.nationality || "",
        gender: cust.gender || "",
        dob: cust.dob || "",
        address: cust.address || "",
        notes: cust.notes || "",
      });
      try {
        const apps = listOf<Application>(await applicationsApi.list({ q: cust.code, limit: 100 }));
        setBookings(apps.filter((a) => a.customerId === id || a.customer?.id === id));
      } catch {
        /* list may not filter by customer — fallback below */
        try {
          const all = listOf<Application>(await applicationsApi.list({ limit: 100 }));
          setBookings(all.filter((a) => a.customerId === id));
        } catch {
          setBookings([]);
        }
      }
      if (can("invoice:amount:read")) {
        try {
          setInvoices(listOf<Invoice>(await financeApi.listInvoices({ customerId: id, limit: 50 })));
        } catch {
          setInvoices([]);
        }
      }
      try {
        const tl = await commsApi.timeline("customer", id);
        setComms((tl.items || []) as typeof comms);
      } catch {
        setComms([]);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Customer not found");
      setC(null);
    } finally {
      setLoading(false);
    }
  }, [id, can]);

  useEffect(() => {
    void load();
  }, [load]);

  const visaBookings = useMemo(() => bookings.filter((b) => b.serviceType === "visa"), [bookings]);
  const completed = useMemo(() => bookings.filter((b) => b.status === "completed"), [bookings]);
  const openBookings = useMemo(
    () => bookings.filter((b) => !["completed", "cancelled", "rejected"].includes(b.status)),
    [bookings],
  );

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      await customersApi.update(id, form);
      setOk("Customer saved");
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  if (loading) {
    return (
      <PageShell wide>
        <SkeletonRows rows={8} />
      </PageShell>
    );
  }

  if (!c) {
    return (
      <PageShell>
        <ErrorBanner message={error || "Customer not found"} />
        <Link to="/customers" className="text-[12px] font-bold text-[var(--accent)]">
          ← Back to customers
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={UserRound}
        title={c.fullName}
        subtitle={`${c.code} · Customer 360 workspace — single source of truth across bookings, documents, finance and communications.`}
        breadcrumb={[
          { label: "Partners", to: "/partners" },
          { label: "Customers", to: "/customers" },
          { label: c.code },
        ]}
        actions={
          <>
            <Can perm="application:create">
              <Link to={`/bookings/new?customerId=${c.id}`} className={btnPrimary} style={btnPrimaryStyle}>
                New booking
              </Link>
            </Can>
            <button type="button" className={btnGhost} onClick={() => setEditing((v) => !v)}>
              {editing ? "Cancel edit" : "Edit profile"}
            </button>
          </>
        }
      />

      <JourneyContinuity
        active={openBookings.length ? "operations" : completed.length ? "repeat" : "customer"}
        previousHint={c.passports?.length ? "Profile & passport on file" : "Customer created"}
        nextHint={
          !c.passports?.length
            ? "Scan passport with OCR"
            : openBookings.length
              ? "Continue Booking 360"
              : "Start unified booking"
        }
      />

      <NextStepBanner
        title={
          !c.passports?.length
            ? "Capture passport with Document Intelligence"
            : openBookings.length
              ? "Continue open bookings"
              : "Start a booking from this customer"
        }
        body="Never create a duplicate customer. Stay in Customer 360 — upload → OCR → booking → operations → finance."
        actions={
          !c.passports?.length
            ? [
                { label: "Scan passport", to: customerWorkspaceHref(c.id, "ocr"), primary: true },
                { label: "New booking", to: `/bookings/new?customerId=${c.id}` },
              ]
            : openBookings[0]
              ? [
                  {
                    label: `Open ${openBookings[0].referenceNo}`,
                    to: bookingWorkspaceHref(openBookings[0].id),
                    primary: true,
                  },
                  { label: "New booking", to: `/bookings/new?customerId=${c.id}` },
                ]
              : [
                  { label: "Unified booking wizard", to: `/bookings/new?customerId=${c.id}`, primary: true },
                  { label: "CRM follow-up", to: "/crm" },
                ]
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <StatStrip>
        <KpiCard label="Bookings" value={String(bookings.length)} />
        <KpiCard label="Open" value={String(openBookings.length)} />
        <KpiCard label="Passports" value={String(c.passports?.length ?? 0)} />
        <KpiCard label="Invoices" value={String(invoices.length)} />
      </StatStrip>

      <EntityTabs tabs={[...TABS]} active={tab} onChange={setTab} />

      <EntityTabPanel when="overview" active={tab}>
        <Surface padded className="space-y-4">
          {editing && can("customer:update") ? (
            <form onSubmit={(e) => void save(e)} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(
                [
                  ["fullName", "Full name"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["whatsapp", "WhatsApp"],
                  ["nationality", "Nationality"],
                  ["dob", "Date of birth"],
                  ["address", "Address"],
                ] as const
              ).map(([k, label]) => (
                <div key={k}>
                  <label className={labelCls}>{label}</label>
                  <input
                    className={inputCls}
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className={labelCls}>Gender</label>
                <select className={inputCls} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">—</option>
                  <option value="male">male</option>
                  <option value="female">female</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className={labelCls}>Notes</label>
                <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="sm:col-span-3">
                <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                  Save profile
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-[12px] sm:grid-cols-4">
              {[
                ["Phone", c.phone],
                ["Email", c.email],
                ["WhatsApp", c.whatsapp],
                ["Nationality", c.nationality],
                ["Gender", c.gender],
                ["DOB", c.dob],
                ["Address", c.address],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className={labelCls}>{k}</p>
                  <p className="font-semibold text-[var(--primary)]">{v || "—"}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
            <Link to={customerWorkspaceHref(c.id, "bookings")} className="text-[11px] font-bold text-[var(--accent)]">
              Bookings →
            </Link>
            <Link to={customerWorkspaceHref(c.id, "documents")} className="text-[11px] font-bold text-[var(--accent)]">
              Documents →
            </Link>
            <Link to={customerWorkspaceHref(c.id, "invoices")} className="text-[11px] font-bold text-[var(--accent)]">
              Invoices →
            </Link>
            <Link to={`/finance/customer-ledger?customerId=${c.id}`} className="text-[11px] font-bold text-[var(--accent)]">
              Ledger →
            </Link>
          </div>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="timeline" active={tab}>
        <Surface padded>
          <CustomerDocumentTimeline customerId={c.id} passports={c.passports} />
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="bookings" active={tab}>
        <Surface padded className="space-y-2">
          <div className="mb-2 flex justify-between">
            <h2 className="text-[13px] font-bold text-[var(--primary)]">All bookings</h2>
            <Link to={`/bookings/new?customerId=${c.id}`} className="text-[11px] font-bold text-[var(--accent)]">
              + New booking
            </Link>
          </div>
          {!bookings.length ? (
            <EmptyPanel
              title="No bookings yet"
              hint="Start the unified booking wizard — do not create a duplicate customer."
              action={
                <Link to={`/bookings/new?customerId=${c.id}`} className={btnPrimary} style={btnPrimaryStyle}>
                  New booking
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[12px]">
                  <div>
                    <Link className="font-mono font-bold text-[var(--accent)]" to={bookingWorkspaceHref(b.id)}>
                      {b.referenceNo}
                    </Link>
                    <span className="ml-2 text-[var(--muted-foreground)]">
                      {serviceLabel(b.serviceType)} · {b.status}
                    </span>
                    <p className="text-[11px] text-[var(--primary)]">{b.title || "—"}</p>
                  </div>
                  <Link to={serviceCaseHref(b.serviceType, b.id)} className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                    Service desk →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="documents" active={tab}>
        <Surface padded className="space-y-3">
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Case documents live on each booking. Use OCR here for identity documents, then open a booking for case files.
          </p>
          <ScanDocumentPanel
            customerId={c.id}
            defaultDocType="auto"
            title="Upload & OCR document"
            onAutofill={(fields) => {
              setForm((f) => ({
                ...f,
                fullName: ocrFullName(fields) || f.fullName,
                nationality: fields.nationality || f.nationality,
                gender: ocrGenderToForm(fields.gender) || f.gender,
                dob: fields.dateOfBirth || f.dob,
              }));
              setOk("OCR applied to profile fields — save profile if demographics changed");
            }}
          />
          <Link to="/operations/document-intelligence?tab=search" className="text-[11px] font-bold text-[var(--accent)]">
            Global document search →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="passport" active={tab}>
        <Surface padded className="space-y-3">
          <ScanDocumentPanel
            customerId={c.id}
            defaultDocType="passport"
            title="Scan passport"
            onAutofill={(fields) => {
              setForm((f) => ({
                ...f,
                fullName: ocrFullName(fields) || f.fullName,
                nationality: fields.nationality || f.nationality,
                gender: ocrGenderToForm(fields.gender) || f.gender,
                dob: fields.dateOfBirth || f.dob,
              }));
              setOk("OCR applied — save profile if demographics changed");
              void load();
            }}
          />
          <ul className="space-y-2">
            {(c.passports || []).map((p) => (
              <li key={p.id} className="flex justify-between rounded-xl border border-[var(--border)] px-3 py-2 text-[12px]">
                <span className="font-mono font-bold">{p.passportNo}</span>
                <span className="text-[var(--muted-foreground)]">
                  {p.issuingCountry || "—"} · exp {passportExpiry(p)}
                </span>
              </li>
            ))}
            {!c.passports?.length && <p className="text-[12px] text-[var(--muted-foreground)]">No passports saved.</p>}
          </ul>
          <Link to={`/passports?customerId=${c.id}`} className="text-[11px] font-bold text-[var(--accent)]">
            Passport management →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="visa" active={tab}>
        <Surface padded>
          {!visaBookings.length ? (
            <p className="text-[12px] text-[var(--muted-foreground)]">
              No visa cases.{" "}
              <Link className="font-bold text-[var(--accent)]" to={`/bookings/new?customerId=${c.id}&service=visa`}>
                Start visa booking →
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {visaBookings.map((b) => (
                <li key={b.id} className="py-2 text-[12px]">
                  <Link to={bookingWorkspaceHref(b.id, "visa")} className="font-mono font-bold text-[var(--accent)]">
                    {b.referenceNo}
                  </Link>
                  <span className="ml-2 text-[var(--muted-foreground)]">{b.status}</span>
                  <p>{b.visa?.destination || b.title}</p>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="ocr" active={tab}>
        <Surface padded className="space-y-3">
          <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--primary)]">
            <ScanLine size={16} className="text-[var(--accent)]" /> Document Intelligence
          </div>
          <ScanDocumentPanel
            customerId={c.id}
            defaultOpen
            compact={false}
            defaultDocType="auto"
            title="Scan any travel document"
            onAutofill={(fields) => {
              setForm((f) => ({
                ...f,
                fullName: ocrFullName(fields) || f.fullName,
                nationality: fields.nationality || f.nationality,
                gender: ocrGenderToForm(fields.gender) || f.gender,
                dob: fields.dateOfBirth || f.dob,
              }));
              setOk("Fields ready — confirm Save in scanner, then save profile if needed");
            }}
          />
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="invoices" active={tab}>
        <Surface padded>
          {!invoices.length ? (
            <p className="text-[12px] text-[var(--muted-foreground)]">No invoices linked.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex justify-between py-2 text-[12px]">
                  <Link to="/finance/invoices" className="font-mono font-bold text-[var(--accent)]">
                    {inv.invoiceNo || inv.id.slice(0, 8)}
                  </Link>
                  <span>{inv.status}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/finance/invoices" className="mt-3 inline-block text-[11px] font-bold text-[var(--accent)]">
            Finance invoices →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="payments" active={tab}>
        <Surface padded className="space-y-2">
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Payments are recorded against invoices from the booking or finance desk — no duplicate entry.
          </p>
          <Link to="/finance/payments" className="text-[11px] font-bold text-[var(--accent)]">
            Receive payment →
          </Link>
          <Link to={`/finance/customer-ledger?customerId=${c.id}`} className="ml-3 text-[11px] font-bold text-[var(--accent)]">
            Customer ledger →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="communications" active={tab}>
        <Surface padded>
          {!comms.length ? (
            <p className="text-[12px] text-[var(--muted-foreground)]">No logged communications yet.</p>
          ) : (
            <ul className="space-y-2">
              {comms.slice(0, 30).map((m, i) => (
                <li key={String(m.id || i)} className="rounded-xl border border-[var(--border)] px-3 py-2 text-[11px]">
                  <span className="font-bold uppercase text-[var(--muted-foreground)]">{m.channel || "note"}</span>
                  <p className="font-semibold text-[var(--primary)]">{m.subject || m.body || "—"}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/comms" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent)]">
            <MessageSquare size={12} /> Communications hub →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="tasks" active={tab}>
        <Surface padded>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Sales and operations tasks are managed in CRM Activities and Sales Tasks — linked by customer name/phone.
          </p>
          <div className="mt-2 flex gap-3">
            <Link to="/crm/activities" className="text-[11px] font-bold text-[var(--accent)]">
              CRM activities →
            </Link>
            <Link to="/sales/tasks" className="text-[11px] font-bold text-[var(--accent)]">
              Sales tasks →
            </Link>
          </div>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="travel" active={tab}>
        <Surface padded>
          <div className="mb-2 flex items-center gap-2 text-[13px] font-bold">
            <History size={14} /> Completed travel
          </div>
          {!completed.length ? (
            <p className="text-[12px] text-[var(--muted-foreground)]">No completed bookings yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {completed.map((b) => (
                <li key={b.id} className="py-2 text-[12px]">
                  <Link to={bookingWorkspaceHref(b.id)} className="font-mono font-bold text-[var(--accent)]">
                    {b.referenceNo}
                  </Link>
                  <span className="ml-2">{serviceLabel(b.serviceType)}</span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="feedback" active={tab}>
        <Surface padded>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            After-sales feedback is captured as booking notes until a dedicated feedback API is available.
          </p>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setEditing(true);
              setTab("notes");
            }}
          >
            Add note / feedback
          </button>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="loyalty" active={tab}>
        <Surface padded className="space-y-2">
          <div className="flex items-center gap-2 text-[13px] font-bold">
            <Heart size={14} className="text-[var(--accent)]" /> Loyalty snapshot
          </div>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Repeat score based on completed bookings (no separate loyalty schema).
          </p>
          <p className="text-[28px] font-extrabold text-[var(--primary)]">{completed.length}</p>
          <p className="text-[11px] text-[var(--muted-foreground)]">completed journeys · treat as VIP when ≥ 3</p>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="notes" active={tab}>
        <Surface padded>
          <form
            onSubmit={(e) => void save(e)}
            className="space-y-3"
          >
            <label className={labelCls}>
              <StickyNote size={12} className="inline" /> Customer notes
            </label>
            <textarea
              className={inputCls}
              rows={5}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              disabled={!can("customer:update")}
            />
            <Can perm="customer:update">
              <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
                Save notes
              </button>
            </Can>
          </form>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="analytics" active={tab}>
        <Surface padded className="space-y-3">
          <div className="flex items-center gap-2 text-[13px] font-bold">
            <BarChart3 size={14} /> Customer analytics
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Lifetime bookings" value={String(bookings.length)} />
            <KpiCard label="Completed" value={String(completed.length)} />
            <KpiCard label="Open" value={String(openBookings.length)} />
            <KpiCard label="Invoices" value={String(invoices.length)} />
          </div>
          <Link to="/analytics/customers" className="text-[11px] font-bold text-[var(--accent)]">
            Company customer analytics →
          </Link>
        </Surface>
      </EntityTabPanel>

      <div className="flex gap-2 pt-2">
        <button type="button" className={btnGhost} onClick={() => navigate("/customers")}>
          ← Customer list
        </button>
        <Link to="/operations/document-intelligence" className={`${btnGhost} inline-flex items-center gap-1`}>
          <FileText size={12} /> Document Intelligence
        </Link>
      </div>
    </PageShell>
  );
}
