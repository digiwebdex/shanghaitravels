import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Briefcase } from "lucide-react";
import { applicationsApi, financeApi, usersApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Account, AppDocument, Application, Invoice, Journey, StaffUser } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import {
  KpiCard,
  PageHeader,
  PageShell,
  SkeletonRows,
  StatStrip,
  Surface,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
} from "@/components/enterprise/Page";
import { EntityTabPanel, EntityTabs } from "@/components/workflow/EntityTabs";
import { JourneyContinuity, NextStepBanner } from "@/components/workflow/MasterJourney";
import { CaseAssignCard } from "@/components/cases/CaseAssignCard";
import { CaseDocumentsCard } from "@/components/cases/CaseDocumentsCard";
import { CaseFinanceCard } from "@/components/cases/CaseFinanceCard";
import CaseTimeline from "@/admin/shared/CaseTimeline";
import { ScanDocumentPanel, ocrFullName } from "@/components/ocr/ScanDocumentPanel";
import {
  BOOKING_TIMELINE,
  bookingWorkspaceHref,
  customerWorkspaceHref,
  inferMasterStep,
  serviceCaseHref,
  serviceLabel,
  serviceListHref,
} from "@/lib/workflow";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "traveler", label: "Traveler" },
  { id: "package", label: "Package" },
  { id: "supplier", label: "Supplier" },
  { id: "documents", label: "Documents" },
  { id: "ocr", label: "OCR" },
  { id: "visa", label: "Visa" },
  { id: "ticket", label: "Air Ticket" },
  { id: "hotel", label: "Hotel" },
  { id: "transport", label: "Transport" },
  { id: "finance", label: "Finance" },
  { id: "payments", label: "Payments" },
  { id: "invoices", label: "Invoices" },
  { id: "timeline", label: "Timeline" },
  { id: "tasks", label: "Tasks" },
  { id: "communications", label: "Communications" },
  { id: "audit", label: "Audit Log" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function BookingWorkspacePage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as TabId) || "overview";
  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    if (t === "overview") next.delete("tab");
    else next.set("tab", t);
    setParams(next, { replace: true });
  };

  const { can } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [docs, setDocs] = useState<AppDocument[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [a, j] = await Promise.all([applicationsApi.get(id), applicationsApi.journey(id)]);
      setApp(a);
      setJourney(j);
      try {
        setDocs(await applicationsApi.documents(id));
      } catch {
        setDocs([]);
      }
      if (can("invoice:amount:read") && a.customerId) {
        try {
          const inv = await financeApi.listInvoices({ customerId: a.customerId, limit: 50 });
          setInvoices(listOf<Invoice>(inv).filter((i) => i.applicationId === a.id));
        } catch {
          setInvoices([]);
        }
      }
      if (can("bank:read")) {
        try {
          setAccounts(await financeApi.accounts());
        } catch {
          setAccounts([]);
        }
      }
      if (can("application:assign")) {
        try {
          setStaff(await usersApi.assignable());
        } catch {
          setStaff([]);
        }
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Booking not found");
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [id, can]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stages = useMemo(() => {
    const s = (journey?.stages || app?.stages || []).slice().sort((a, b) => a.stageNo - b.stageNo);
    return s;
  }, [app, journey]);

  const timelineStages = useMemo(
    () => stages.map((s) => ({ id: String(s.stageNo), label: s.name, sublabel: s.status })),
    [stages],
  );

  const currentIdx = useMemo(() => {
    const active = stages.findIndex((s) => s.status === "active");
    if (active >= 0) return active;
    const done = stages.filter((s) => s.status === "done").length;
    return Math.max(0, done - 1);
  }, [stages]);

  const tabs = useMemo(() => {
    const st = app?.serviceType || "";
    return TABS.map((t) => {
      if (t.id === "visa") return { ...t, show: st === "visa" || true };
      if (t.id === "ticket") return { ...t, show: st === "air_ticket" || true };
      if (t.id === "hotel") return { ...t, show: st === "hotel" || true };
      if (t.id === "transport") return { ...t, show: st === "transport" || true };
      return { ...t, show: true };
    });
  }, [app?.serviceType]);

  async function advance() {
    if (!app) return;
    setBusy(true);
    setError("");
    try {
      await applicationsApi.advance(app.id);
      setOk("Stage advanced");
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Advance failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell wide>
        <SkeletonRows rows={8} />
      </PageShell>
    );
  }

  if (!app) {
    return (
      <PageShell>
        <ErrorBanner message={error || "Booking not found"} />
        <Link to="/bookings/new" className="text-[12px] font-bold text-[var(--accent)]">
          Start booking wizard →
        </Link>
      </PageShell>
    );
  }

  const desk = serviceCaseHref(app.serviceType, app.id);
  const master = inferMasterStep(app);

  return (
    <PageShell wide>
      <PageHeader
        icon={Briefcase}
        title={app.referenceNo}
        subtitle={`${serviceLabel(app.serviceType)} · ${app.title || "Booking 360"} — everything for this booking in one workspace.`}
        breadcrumb={[
          { label: "Bookings", to: serviceListHref(app.serviceType) },
          { label: app.referenceNo },
        ]}
        actions={
          <>
            <Link to={desk} className={btnPrimary} style={btnPrimaryStyle}>
              Open service desk
            </Link>
            {app.customerId && (
              <Link to={customerWorkspaceHref(app.customerId)} className={btnGhost}>
                Customer 360
              </Link>
            )}
          </>
        }
      />

      <JourneyContinuity
        active={master}
        previousHint={docs.length ? "Documents / OCR in progress" : "Booking created"}
        nextHint={
          !docs.length
            ? "Upload & OCR traveler documents"
            : !invoices.length
              ? "Invoice from this booking"
              : "Complete operations → travel"
        }
      />

      <BookingLifecycleStrip status={app.status} hasDocs={docs.length > 0} hasInvoice={invoices.length > 0} />

      <NextStepBanner
        title={
          !docs.length
            ? "Upload traveler documents"
            : !invoices.length
              ? "Create invoice from this booking"
              : app.status !== "completed"
                ? "Advance operations on the service desk"
                : "Capture after-sales feedback on the customer"
        }
        body="Everything for this booking stays here. Deep visa/ticket/hotel processing opens the service desk — same journey, not another module."
        actions={
          !docs.length
            ? [
                { label: "Documents & OCR", to: bookingWorkspaceHref(app.id, "ocr"), primary: true },
                { label: "Service desk", to: desk },
              ]
            : !invoices.length
              ? [
                  { label: "Finance", to: bookingWorkspaceHref(app.id, "finance"), primary: true },
                  { label: "Service desk", to: desk },
                ]
              : [
                  { label: "Advance stage", to: desk, primary: true },
                  { label: "Customer 360", to: customerWorkspaceHref(app.customerId) },
                ]
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <StatStrip>
        <KpiCard label="Status" value={app.status} />
        <KpiCard label="Stage" value={`${app.currentStage}/${app.totalStages}`} />
        <KpiCard label="Documents" value={String(docs.length)} />
        <KpiCard label="Invoices" value={String(invoices.length)} />
      </StatStrip>

      <EntityTabs tabs={tabs} active={tab} onChange={setTab} />

      <EntityTabPanel when="overview" active={tab}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Surface padded className="space-y-2 text-[12px]">
            <h2 className="text-[13px] font-bold text-[var(--primary)]">Booking summary</h2>
            <p>
              <span className="text-[var(--muted-foreground)]">Service</span> · {serviceLabel(app.serviceType)}
            </p>
            <p>
              <span className="text-[var(--muted-foreground)]">Priority</span> · {app.priority}
            </p>
            <p>
              <span className="text-[var(--muted-foreground)]">Customer</span> ·{" "}
              {app.customerId ? (
                <Link className="font-bold text-[var(--accent)]" to={customerWorkspaceHref(app.customerId)}>
                  {app.customer?.fullName || app.customerId.slice(0, 8)}
                </Link>
              ) : (
                "—"
              )}
            </p>
            <Can perm="application:update">
              <button type="button" disabled={busy} className={btnGhost} onClick={() => void advance()}>
                Advance workflow stage
              </button>
            </Can>
          </Surface>
          <CaseAssignCard app={app} staff={staff} onSaved={reload} setError={setError} setOk={setOk} />
        </div>
        <Surface padded className="mt-4">
          <CaseTimeline stages={timelineStages} currentStage={currentIdx} variant="staff" showSublabel compact />
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="traveler" active={tab}>
        <Surface padded className="space-y-3">
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Traveler identity is the linked customer. Scan passport to autofill; edit demographics on Customer 360.
          </p>
          <ScanDocumentPanel
            customerId={app.customerId}
            applicationId={app.id}
            defaultDocType="passport"
            title="Scan traveler passport"
            onAutofill={(fields) => {
              const name = ocrFullName(fields);
              setOk(
                name || fields.passportNo
                  ? `OCR: ${name || fields.passportNo} — confirm Save, then open Customer 360 to edit demographics`
                  : "OCR complete — review before save",
              );
            }}
          />
          {app.customerId && (
            <Link to={customerWorkspaceHref(app.customerId, "passport")} className="text-[11px] font-bold text-[var(--accent)]">
              Open traveler profile →
            </Link>
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="package" active={tab}>
        <Surface padded>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Package / product details are edited on the service desk (tour, hajj, hotel catalogs).
          </p>
          <Link to={desk} className="text-[11px] font-bold text-[var(--accent)]">
            Configure package on service desk →
          </Link>
          <Link to="/products/packages" className="ml-3 text-[11px] font-bold text-[var(--accent)]">
            Package catalog →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="supplier" active={tab}>
        <Surface padded>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Suppliers are managed in Business Partners. Link them from the service desk for this booking.
          </p>
          <Link to="/suppliers" className="text-[11px] font-bold text-[var(--accent)]">
            Supplier center →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="documents" active={tab}>
        <CaseDocumentsCard
          appId={app.id}
          customerId={app.customerId}
          docs={docs}
          onSaved={reload}
          setError={setError}
          setOk={setOk}
        />
      </EntityTabPanel>

      <EntityTabPanel when="ocr" active={tab}>
        <Surface padded>
          <ScanDocumentPanel
            customerId={app.customerId}
            applicationId={app.id}
            defaultOpen
            compact={false}
            defaultDocType="auto"
            title="Booking document OCR"
            onAutofill={() => setOk("OCR complete — review confidence then Save")}
          />
        </Surface>
      </EntityTabPanel>

      {(["visa", "ticket", "hotel", "transport"] as const).map((key) => (
        <EntityTabPanel key={key} when={key} active={tab}>
          <Surface padded className="space-y-2">
            <p className="text-[12px] text-[var(--muted-foreground)]">
              Deep {key === "ticket" ? "air ticket" : key} operations stay on the dedicated service desk so workflow
              templates and calculations are unchanged.
            </p>
            <Link to={desk} className={btnPrimary} style={btnPrimaryStyle}>
              Open {serviceLabel(app.serviceType)} desk →
            </Link>
          </Surface>
        </EntityTabPanel>
      ))}

      <EntityTabPanel when="finance" active={tab}>
        <CaseFinanceCard
          app={app}
          invoices={invoices}
          accounts={accounts}
          onSaved={reload}
          setError={setError}
          setOk={setOk}
          defaultDescription={`${app.title || app.referenceNo} — service fee`}
        />
      </EntityTabPanel>

      <EntityTabPanel when="payments" active={tab}>
        <Surface padded className="space-y-2">
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Record customer payments against invoices — finance math stays in the existing payment APIs.
          </p>
          <Link to="/finance/payments" className="text-[11px] font-bold text-[var(--accent)]">
            Payments desk →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="invoices" active={tab}>
        <Surface padded>
          {!invoices.length ? (
            <p className="text-[12px] text-[var(--muted-foreground)]">No invoices yet — create from Finance tab.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex justify-between py-2 text-[12px]">
                  <span className="font-mono font-bold">{inv.invoiceNo}</span>
                  <span>{inv.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="timeline" active={tab}>
        <Surface padded>
          <CaseTimeline stages={timelineStages} currentStage={currentIdx} variant="staff" showSublabel compact />
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {(journey?.events || app.events || []).map((ev) => (
              <li key={ev.id} className="border-b border-[var(--border)] pb-2 text-[11px]">
                <span className="font-bold text-[var(--primary)]">{ev.type}</span>
                <span className="ml-2 text-[var(--muted-foreground)]">{new Date(ev.createdAt).toLocaleString("en-BD")}</span>
                <p className="text-[var(--muted-foreground)]">{ev.message}</p>
              </li>
            ))}
          </ul>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="tasks" active={tab}>
        <Surface padded>
          <Link to="/sales/tasks" className="text-[11px] font-bold text-[var(--accent)]">
            Sales tasks →
          </Link>
          <Link to="/operations/calendar" className="ml-3 text-[11px] font-bold text-[var(--accent)]">
            Operations calendar →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="communications" active={tab}>
        <Surface padded>
          <Link to="/comms" className="text-[11px] font-bold text-[var(--accent)]">
            Communications hub →
          </Link>
        </Surface>
      </EntityTabPanel>

      <EntityTabPanel when="audit" active={tab}>
        <Surface padded>
          <h2 className="mb-2 text-[13px] font-bold">Audit log</h2>
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {(journey?.events || app.events || []).map((ev) => (
              <li key={ev.id} className="rounded-xl border border-[var(--border)] px-3 py-2 text-[11px]">
                <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{ev.createdAt}</span>
                <p className="font-bold">{ev.type}</p>
                <p>{ev.message}</p>
              </li>
            ))}
            {!(journey?.events || app.events || []).length && (
              <p className="text-[12px] text-[var(--muted-foreground)]">No audit events yet.</p>
            )}
          </ul>
        </Surface>
      </EntityTabPanel>
    </PageShell>
  );
}

function BookingLifecycleStrip({
  status,
  hasDocs,
  hasInvoice,
}: {
  status: string;
  hasDocs: boolean;
  hasInvoice: boolean;
}) {
  const st = status.toLowerCase();
  let idx = 0;
  if (hasDocs) idx = Math.max(idx, 1);
  if (hasDocs) idx = Math.max(idx, 2);
  if (st === "in_progress" || st === "approved") idx = Math.max(idx, 4);
  if (hasInvoice) idx = Math.max(idx, 7);
  if (st === "completed") idx = BOOKING_TIMELINE.length - 1;

  return (
    <ol className="flex flex-wrap gap-1" aria-label="Booking lifecycle">
      {BOOKING_TIMELINE.map((s, i) => (
        <li
          key={s.id}
          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${
            i <= idx
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-[var(--border)] bg-white text-[var(--muted-foreground)]"
          }`}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}
