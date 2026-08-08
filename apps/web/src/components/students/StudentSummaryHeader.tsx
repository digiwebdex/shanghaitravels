import { CalendarClock, FileText, GraduationCap, Landmark, UserRound, Wallet } from "lucide-react";
import { fmtBDTPlain } from "@/lib/money";
import { Pill } from "@/components/enterprise/DataTable";
import {
  CaseBundle, CaseIdentity, DocChecklistCard, Mini, QuickActions, Row,
  StageProgress, StageStatusCard, TimelineCard, computeCaseHealth, financeOf, fmtD,
} from "@/components/enterprise/CaseSummary";
import { bookingWorkspaceHref } from "@/lib/workflow";

/** Phase 4 — student consultancy document checklist (reuses Document Intelligence). */
const STUDENT_DOCS: { label: string; key: string; ocr: boolean }[] = [
  { label: "Passport", key: "passport", ocr: true },
  { label: "NID / Birth Certificate", key: "nid", ocr: true },
  { label: "Academic Transcripts", key: "transcript", ocr: false },
  { label: "Certificates", key: "certificate", ocr: false },
  { label: "IELTS / Language", key: "ielts", ocr: false },
  { label: "SOP", key: "sop", ocr: false },
  { label: "Offer Letter", key: "offer", ocr: false },
  { label: "Bank Statement", key: "bank", ocr: true },
  { label: "Visa", key: "visa", ocr: true },
];

/**
 * Student 360 header — reuses the shared CaseSummary chrome exactly like the
 * frozen verticals. Drawer only; deep work happens in the generic booking workspace.
 */
export function StudentSummaryHeader({ bundle, staffMap }: { bundle: CaseBundle | null; staffMap: Record<string, string> }) {
  if (!bundle) return null;
  const { app, journey, invoices, documents } = bundle;
  const s = app.student || {};
  const stages = journey?.stages || app.stages || [];
  const events = journey?.events || app.events || [];
  const { due, paid } = financeOf(invoices);
  const health = computeCaseHealth(app, invoices, documents);
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
            <Pill value="Student" tone="blue" />
            {s.degreeLevel && <Pill value={s.degreeLevel} tone="slate" />}
            {s.country && <Pill value={s.country} tone="slate" />}
          </>
        }
      />
      <StageProgress app={app} stages={stages} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Mini icon={<Landmark size={11} />} title="Institution">
          <Row label="Institution" value={s.institution} />
          <Row label="Country" value={s.country} />
          <Row label="Application ref" value={s.applicationRef} />
        </Mini>
        <Mini icon={<GraduationCap size={11} />} title="Program">
          <Row label="Course" value={s.courseName} />
          <Row label="Degree level" value={s.degreeLevel} />
          <Row label="Intake" value={s.intakeTerm} />
        </Mini>
        <Mini icon={<UserRound size={11} />} title="Student">
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
        <Mini icon={<CalendarClock size={11} />} title="Case">
          <Row label="Assigned" value={assignedName} />
          <Row label="Created" value={fmtD(app.createdAt)} />
          <Row label="Completed" value={fmtD(app.completedAt)} />
        </Mini>
      </div>

      <DocChecklistCard docs={STUDENT_DOCS} documents={documents} />
      <StageStatusCard stages={stages} />
      <TimelineCard events={events} />
      <QuickActions
        links={[
          { to: bookingWorkspaceHref(app.id), label: "Open workspace", primary: true },
          ...(app.customer?.id ? [{ to: `/customers/${app.customer.id}`, label: "Customer 360" }] : []),
          { to: "/students/new", label: "New student case" },
        ]}
      />
    </div>
  );
}
