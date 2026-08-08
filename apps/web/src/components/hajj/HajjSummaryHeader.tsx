import { BadgeCheck, Building2, CalendarClock, FileText, Moon, Plane, ScanLine, UserRound, Users, Wallet } from "lucide-react";
import { fmtBDTPlain } from "@/lib/money";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  CaseBundle, CaseIdentity, DocChecklistCard, Mini, QuickActions, Row,
  StageProgress, StageStatusCard, TimelineCard, computeCaseHealth, financeOf, fmtD,
} from "@/components/enterprise/CaseSummary";
import { bookingWorkspaceHref } from "@/lib/workflow";

/** Phase 4 — Hajj/Umrah document checklist (reuses Document Intelligence). */
const HAJJ_DOCS: { label: string; key: string; ocr: boolean }[] = [
  { label: "Passport", key: "passport", ocr: true },
  { label: "NID", key: "nid", ocr: true },
  { label: "Photo", key: "photo", ocr: false },
  { label: "Vaccination Card", key: "vaccin", ocr: false },
  { label: "Mahram Proof", key: "mahram", ocr: false },
  { label: "Package Agreement", key: "agreement", ocr: false },
  { label: "Payment Receipt", key: "receipt", ocr: true },
  { label: "Visa", key: "visa", ocr: true },
];

/**
 * Hajj/Umrah 360 header — reuses the shared CaseSummary chrome exactly like the
 * frozen verticals. Drawer only; the hajj workspace stays a separate page.
 */
export function HajjSummaryHeader({ bundle, staffMap }: { bundle: CaseBundle | null; staffMap: Record<string, string> }) {
  if (!bundle) return null;
  const { app, journey, invoices, documents } = bundle;
  const h = app.hajjUmrah || {};
  const stages = journey?.stages || app.stages || [];
  const events = journey?.events || app.events || [];
  const { due, paid } = financeOf(invoices);
  const health = computeCaseHealth(app, invoices, documents, [
    {
      when: !!h.departureDate && new Date(h.departureDate).getTime() < Date.now() + 7 * 864e5 && !["completed", "cancelled"].includes((app.status || "").toLowerCase()),
      deduct: 10, reason: "Departure within 7 days",
    },
    { when: (h.visaStatus || "").toLowerCase() === "rejected", deduct: 25, reason: "Visa rejected" },
    { when: (h.passportStatus || "").toLowerCase() === "expired", deduct: 20, reason: "Passport expired" },
  ]);
  const assignedName = app.assignedTo ? staffMap[app.assignedTo] || "Assigned" : "Unassigned";
  const verifiedDocs = documents.filter((d) => (d.status || "").toLowerCase().includes("verif")).length;

  return (
    <div className="space-y-3 border-b border-[var(--border)] bg-[var(--muted)]/30 p-3">
      <CaseIdentity
        app={app}
        name={h.pilgrimName || app.customer?.fullName}
        health={health}
        refTo={bookingWorkspaceHref(app.id)}
        extraBadges={
          <>
            <Pill value={app.serviceType === "umrah" ? "Umrah" : "Hajj"} tone="blue" />
            {h.packageCategory && <Pill value={h.packageCategory} tone="slate" />}
            {h.visaStatus && <Pill value={`visa: ${h.visaStatus}`} tone={statusTone(h.visaStatus)} />}
          </>
        }
      />
      <StageProgress app={app} stages={stages} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Mini icon={<Moon size={11} />} title="Package">
          <Row label="Package" value={h.packageName} />
          <Row label="Category" value={h.packageCategory} />
          <Row label="Year" value={h.year} />
          <Row label="Confirmation" value={h.confirmationNo} />
        </Mini>
        <Mini icon={<Users size={11} />} title="Pilgrim & Group">
          <Row label="Pilgrim" value={h.pilgrimName || app.customer?.fullName} />
          <Row label="Passport" value={h.passportNo} />
          <Row label="Mahram" value={h.mahramName} />
          <Row label="Group" value={h.groupName || h.groupCode} />
        </Mini>
        <Mini icon={<CalendarClock size={11} />} title="Journey dates">
          <Row label="Departure" value={fmtD(h.departureDate)} />
          <Row label="Return" value={fmtD(h.returnDate)} />
          <Row label="Assigned" value={assignedName} />
        </Mini>
        <Mini icon={<Plane size={11} />} title="Flight & Visa">
          <Row label="Airline" value={h.airline} />
          <Row label="Flight" value={h.flightNo} />
          <Row label="Visa status" value={h.visaStatus} />
          <Row label="Visa no." value={h.visaNo} />
        </Mini>
        <Mini icon={<Building2 size={11} />} title="Hotels">
          <Row label="Makkah" value={h.hotelMakkah} />
          <Row label="Madinah" value={h.hotelMadinah} />
          <Row label="Room type" value={h.roomType} />
        </Mini>
        <Mini icon={<UserRound size={11} />} title="Customer">
          <Row label="Name" value={app.customer?.fullName} />
          <Row label="Code" value={app.customer?.code} />
          <Row label="Phone" value={h.phone || app.customer?.phone} />
        </Mini>
        <Mini icon={<Wallet size={11} />} title="Financial summary">
          <Row label="Outstanding" value={<span className={due > 0 ? "text-red-600" : "text-emerald-600"}>{fmtBDTPlain(due)}</span>} />
          <Row label="Paid" value={fmtBDTPlain(paid)} />
          <Row label="Package price" value={h.sellingPricePoisha != null ? fmtBDTPlain(h.sellingPricePoisha) : "—"} />
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
        <Mini icon={<BadgeCheck size={11} />} title="Status">
          <Row label="Passport" value={h.passportStatus} />
          <Row label="Created" value={fmtD(app.createdAt)} />
          <Row label="Completed" value={fmtD(app.completedAt)} />
        </Mini>
      </div>

      <DocChecklistCard docs={HAJJ_DOCS} documents={documents} />
      <StageStatusCard stages={stages} />
      <TimelineCard events={events} />
      <QuickActions
        links={[
          { to: `/hajj/${app.id}`, label: "Open workspace", primary: true },
          ...(app.customer?.id ? [{ to: `/customers/${app.customer.id}`, label: "Customer 360" }] : []),
          { to: "/hajj/groups", label: "Groups" },
          { to: "/bookings/new?service=hajj", label: "New booking" },
        ]}
      />
    </div>
  );
}
