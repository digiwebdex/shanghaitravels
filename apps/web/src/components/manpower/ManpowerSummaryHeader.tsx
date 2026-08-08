import { BadgeCheck, Briefcase, CalendarClock, FileText, Globe, HardHat, UserRound, Wallet } from "lucide-react";
import { fmtBDTPlain } from "@/lib/money";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  CaseBundle, CaseIdentity, DocChecklistCard, Mini, QuickActions, Row,
  StageProgress, StageStatusCard, TimelineCard, computeCaseHealth, financeOf, fmtD,
} from "@/components/enterprise/CaseSummary";
import { bookingWorkspaceHref } from "@/lib/workflow";

/** Phase 4 — manpower document checklist (reuses Document Intelligence). */
const MANPOWER_DOCS: { label: string; key: string; ocr: boolean }[] = [
  { label: "Passport", key: "passport", ocr: true },
  { label: "NID", key: "nid", ocr: true },
  { label: "Photo", key: "photo", ocr: false },
  { label: "Employment Contract", key: "contract", ocr: false },
  { label: "Medical Report", key: "medical", ocr: false },
  { label: "Training Certificate", key: "training", ocr: false },
  { label: "BMET Card", key: "bmet", ocr: true },
  { label: "Work Visa / Permit", key: "visa", ocr: true },
];

/**
 * Manpower 360 header (serviceType "work") — reuses the shared CaseSummary chrome
 * exactly like the frozen verticals. Drawer only; deep work happens in the generic
 * booking workspace.
 */
export function ManpowerSummaryHeader({ bundle, staffMap }: { bundle: CaseBundle | null; staffMap: Record<string, string> }) {
  if (!bundle) return null;
  const { app, journey, invoices, documents } = bundle;
  const w = app.work || {};
  const stages = journey?.stages || app.stages || [];
  const events = journey?.events || app.events || [];
  const { due, paid } = financeOf(invoices);
  const health = computeCaseHealth(app, invoices, documents, [
    { when: (w.medicalStatus || "").toLowerCase() === "unfit", deduct: 25, reason: "Medical unfit" },
    {
      when: !!w.departureDate && new Date(w.departureDate).getTime() < Date.now() + 7 * 864e5 && !w.bmetClearance && !["completed", "cancelled"].includes((app.status || "").toLowerCase()),
      deduct: 15, reason: "Departure <7d without BMET clearance",
    },
  ]);
  const assignedName = app.assignedTo ? staffMap[app.assignedTo] || "Assigned" : "Unassigned";
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
            <Pill value="Manpower" tone="blue" />
            {w.country && <Pill value={w.country} tone="slate" />}
            {w.medicalStatus && <Pill value={`medical: ${w.medicalStatus}`} tone={statusTone(w.medicalStatus)} />}
          </>
        }
      />
      <StageProgress app={app} stages={stages} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Mini icon={<Briefcase size={11} />} title="Employer">
          <Row label="Employer" value={w.employerName} />
          <Row label="Job title" value={w.jobTitle} />
          <Row label="Agency ref" value={w.agencyRef} />
        </Mini>
        <Mini icon={<Globe size={11} />} title="Destination & Visa">
          <Row label="Country" value={w.country} />
          <Row label="Visa type" value={w.visaType} />
          <Row label="Permit no." value={w.workPermitNo} />
        </Mini>
        <Mini icon={<HardHat size={11} />} title="Clearance">
          <Row label="BMET" value={w.bmetClearance} />
          <Row label="Medical" value={w.medicalStatus} />
          <Row label="Contract" value={w.contractMonths != null ? `${w.contractMonths} months` : "—"} />
        </Mini>
        <Mini icon={<UserRound size={11} />} title="Worker">
          <Row label="Name" value={app.customer?.fullName} />
          <Row label="Code" value={app.customer?.code} />
          <Row label="Phone" value={app.customer?.phone} />
        </Mini>
        <Mini icon={<Wallet size={11} />} title="Financial summary">
          <Row label="Outstanding" value={<span className={due > 0 ? "text-red-600" : "text-emerald-600"}>{fmtBDTPlain(due)}</span>} />
          <Row label="Paid" value={fmtBDTPlain(paid)} />
          <Row label="Invoices" value={invoices.length} />
        </Mini>
        <Mini icon={<FileText size={11} />} title="Documents / OCR">
          <Row label="Uploaded" value={documents.length} />
          <Row label="Verified" value={verifiedDocs || "—"} />
          <Row label="Passport scans" value={documents.filter((d) => d.isPassport || (d.category || "").toLowerCase().includes("passport")).length || "—"} />
        </Mini>
        <Mini icon={<CalendarClock size={11} />} title="Deployment">
          <Row label="Departure" value={fmtD(w.departureDate)} />
          <Row label="Assigned" value={assignedName} />
          <Row label="Created" value={fmtD(app.createdAt)} />
        </Mini>
        <Mini icon={<BadgeCheck size={11} />} title="Case">
          <Row label="Status" value={app.status} />
          <Row label="Completed" value={fmtD(app.completedAt)} />
        </Mini>
      </div>

      <DocChecklistCard docs={MANPOWER_DOCS} documents={documents} />
      <StageStatusCard stages={stages} />
      <TimelineCard events={events} />
      <QuickActions
        links={[
          { to: bookingWorkspaceHref(app.id), label: "Open workspace", primary: true },
          ...(app.customer?.id ? [{ to: `/customers/${app.customer.id}`, label: "Customer 360" }] : []),
          { to: "/manpower/new", label: "New manpower case" },
        ]}
      />
    </div>
  );
}
