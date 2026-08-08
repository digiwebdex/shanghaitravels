import { CalendarClock, Compass, FileText, Map, ScanLine, UserRound, Users, Wallet } from "lucide-react";
import { fmtBDTPlain } from "@/lib/money";
import { Pill } from "@/components/enterprise/DataTable";
import {
  CaseBundle, CaseIdentity, DocChecklistCard, Mini, QuickActions, Row,
  StageProgress, StageStatusCard, TimelineCard, computeCaseHealth, financeOf, fmtD,
} from "@/components/enterprise/CaseSummary";
import { bookingWorkspaceHref } from "@/lib/workflow";

/** Phase 4 — tour document checklist (reuses Document Intelligence). */
const TOUR_DOCS: { label: string; key: string; ocr: boolean }[] = [
  { label: "Passport", key: "passport", ocr: true },
  { label: "Visa", key: "visa", ocr: true },
  { label: "NID", key: "nid", ocr: true },
  { label: "Itinerary", key: "itinerar", ocr: false },
  { label: "Hotel Voucher", key: "voucher", ocr: false },
  { label: "Air Ticket", key: "ticket", ocr: true },
  { label: "Insurance", key: "insurance", ocr: false },
  { label: "Payment Receipt", key: "receipt", ocr: true },
];

/**
 * Tour 360 header — reuses the shared CaseSummary chrome (identity/health/stage/
 * checklist/timeline) exactly like the frozen Visa/Ticket/Hotel/Transport 360s.
 * Drawer only; the tour workspace stays a separate page.
 */
export function TourSummaryHeader({ bundle, staffMap }: { bundle: CaseBundle | null; staffMap: Record<string, string> }) {
  if (!bundle) return null;
  const { app, journey, invoices, documents } = bundle;
  const t = app.tour || {};
  const stages = journey?.stages || app.stages || [];
  const events = journey?.events || app.events || [];
  const { due, paid } = financeOf(invoices);
  const health = computeCaseHealth(app, invoices, documents, [
    {
      when: !!t.startDate && new Date(t.startDate).getTime() < Date.now() + 3 * 864e5 && !["completed", "cancelled"].includes((app.status || "").toLowerCase()),
      deduct: 10, reason: "Departure within 72h",
    },
  ]);
  const assignedName = app.assignedTo ? staffMap[app.assignedTo] || "Assigned" : "Unassigned";
  const nights = t.startDate && t.endDate ? Math.max(0, Math.round((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / 864e5)) : null;
  const verifiedDocs = documents.filter((d) => (d.status || "").toLowerCase().includes("verif")).length;

  return (
    <div className="space-y-3 border-b border-[var(--border)] bg-[var(--muted)]/30 p-3">
      <CaseIdentity
        app={app}
        name={app.customer?.fullName}
        health={health}
        refTo={bookingWorkspaceHref(app.id)}
        extraBadges={
          <>
            <Pill value="Tour" tone="blue" />
            {t.packageType && <Pill value={t.packageType} tone="slate" />}
            {t.category && <Pill value={t.category} tone="slate" />}
          </>
        }
      />
      <StageProgress app={app} stages={stages} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Mini icon={<Compass size={11} />} title="Package">
          <Row label="Package" value={t.packageName} />
          <Row label="Code" value={t.packageCode} />
          <Row label="Confirmation" value={t.confirmationNo} />
        </Mini>
        <Mini icon={<Map size={11} />} title="Destination">
          <Row label="Destination" value={t.destination} />
          <Row label="Season" value={t.season} />
          <Row label="Type" value={t.packageType} />
        </Mini>
        <Mini icon={<CalendarClock size={11} />} title="Travel dates">
          <Row label="Start" value={fmtD(t.startDate)} />
          <Row label="End" value={fmtD(t.endDate)} />
          <Row label="Nights" value={nights != null ? nights : "—"} />
        </Mini>
        <Mini icon={<Users size={11} />} title="Travellers">
          <Row label="Pax" value={t.pax != null ? t.pax : "—"} />
          <Row label="Assigned" value={assignedName} />
        </Mini>
        <Mini icon={<UserRound size={11} />} title="Customer">
          <Row label="Name" value={app.customer?.fullName} />
          <Row label="Code" value={app.customer?.code} />
          <Row label="Phone" value={app.customer?.phone} />
        </Mini>
        <Mini icon={<Wallet size={11} />} title="Financial summary">
          <Row label="Outstanding" value={<span className={due > 0 ? "text-red-600" : "text-emerald-600"}>{fmtBDTPlain(due)}</span>} />
          <Row label="Paid" value={fmtBDTPlain(paid)} />
          <Row label="Selling price" value={t.sellingPricePoisha != null ? fmtBDTPlain(t.sellingPricePoisha) : "—"} />
          <Row label="Invoices" value={invoices.length} />
        </Mini>
        <Mini icon={<FileText size={11} />} title="Documents">
          <Row label="Uploaded" value={documents.length} />
          <Row label="Verified" value={verifiedDocs || "—"} />
        </Mini>
        <Mini icon={<ScanLine size={11} />} title="OCR summary">
          <Row label="Scanned" value={documents.filter((d) => d.isPassport || (d.category || "").toLowerCase().includes("passport")).length || "—"} />
          <Row label="Verified" value={verifiedDocs || "—"} />
        </Mini>
        <Mini icon={<CalendarClock size={11} />} title="Case">
          <Row label="Created" value={fmtD(app.createdAt)} />
          <Row label="Completed" value={fmtD(app.completedAt)} />
        </Mini>
      </div>

      <DocChecklistCard docs={TOUR_DOCS} documents={documents} />
      <StageStatusCard stages={stages} />
      <TimelineCard events={events} />
      <QuickActions
        links={[
          { to: `/tours/${app.id}`, label: "Open workspace", primary: true },
          ...(app.customer?.id ? [{ to: `/customers/${app.customer.id}`, label: "Customer 360" }] : []),
          { to: "/bookings/new?service=tour", label: "New tour" },
        ]}
      />
    </div>
  );
}
