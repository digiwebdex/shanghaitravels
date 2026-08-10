import { useState } from "react";
import { ScanLine, X } from "lucide-react";
import { ocrApi, passportsApi, applicationsApi } from "@/lib/services";
import { ApiError, validateUploadFile } from "@/lib/api";
import { Can } from "@/auth/Can";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import {
  docTypeToUploadCategory,
  type DocIntelType,
  type OcrScanResult,
} from "@/lib/documentIntelligence";
import { btnGhost } from "@/components/enterprise/Page";
import { PassportScanForm } from "@/components/ocr/PassportScanForm";

export type ScanDocumentPanelProps = {
  customerId?: string;
  applicationId?: string;
  defaultDocType?: DocIntelType;
  /** Called when OCR returns fields — parent autofills its form. */
  onAutofill: (fields: Record<string, string>, scan: OcrScanResult) => void;
  /** If true, start expanded. */
  defaultOpen?: boolean;
  title?: string;
  compact?: boolean;
  /** Also persist passport when passportNo present and customerId set. */
  savePassportOnConfirm?: boolean;
};

/**
 * Reusable Document Intelligence embed — wraps DocumentUploadFlow with ocrApi.
 * Does not duplicate OCR logic.
 */
export function ScanDocumentPanel({
  customerId,
  applicationId,
  defaultDocType = "auto",
  onAutofill,
  defaultOpen = false,
  title = "Scan document",
  compact = true,
  savePassportOnConfirm = true,
}: ScanDocumentPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <Can perm="ocr:use">
        <button
          type="button"
          className={`${btnGhost} text-[11px]`}
          onClick={() => setOpen(true)}
        >
          <ScanLine size={13} /> {title}
        </button>
      </Can>
    );
  }

  return (
    <Can perm="ocr:use">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold text-[var(--primary)]">{title}</p>
          <button type="button" className="rounded p-1 text-[var(--muted-foreground)] hover:bg-white" onClick={() => setOpen(false)} aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <DocumentUploadFlow
          compact={compact}
          customerId={customerId}
          applicationId={applicationId}
          defaultDocType={defaultDocType}
          onFields={(fields, scan) => onAutofill(fields, scan)}
          scanFile={async (file, docType) => {
            const bad = validateUploadFile(file);
            if (bad) throw new Error(bad);
            return (await ocrApi.scan(file, {
              docType,
              customerId,
              applicationId,
            })) as OcrScanResult;
          }}
          checkDuplicate={async (fields) =>
            ocrApi.checkDuplicate({
              passportNo: fields.passportNo,
              nidNumber: fields.nidNumber,
              visaNumber: fields.visaNumber,
              customerId,
            })
          }
          onSave={async ({ file, docType, fields }) => {
            try {
              if (applicationId) {
                await applicationsApi.uploadDocument(applicationId, file, docTypeToUploadCategory(docType));
              }
              if (
                savePassportOnConfirm &&
                customerId &&
                fields.passportNo &&
                (docType === "passport" || fields.mrzLine1)
              ) {
                await passportsApi.create({
                  customerId,
                  passportNo: fields.passportNo,
                  issuingCountry: fields.issuingCountry || undefined,
                  dateOfIssue: fields.dateOfIssue || undefined,
                  dateOfExpiry: fields.dateOfExpiry || undefined,
                  isPrimary: true,
                });
              }
              onAutofill(fields, { fields } as OcrScanResult);
              setOpen(false);
              return true;
            } catch (e) {
              throw new Error(e instanceof ApiError ? e.message : "Save failed");
            }
          }}
        />
      </div>
    </Can>
  );
}

/**
 * Global shell modal — "Document Scanner" quick action, in the owner-approved
 * reference format (image left · EXTRACTED DATA right · green CONFIRM).
 * With no customer context, CONFIRM copies the verified fields into
 * sessionStorage exactly as before, so forms can keep autofilling from it.
 */
export function ScanDocumentModal({
  open,
  onClose,
  customerId,
}: {
  open: boolean;
  onClose: () => void;
  /** Optional — when launched from a customer context, CONFIRM also saves the passport. */
  customerId?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 p-4 pt-[6vh]" role="dialog" aria-modal aria-label="Document Scanner">
      <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h2 className="flex items-center gap-2 text-[16px] font-bold text-[var(--foreground)]">
            <ScanLine size={18} className="text-emerald-500" /> Document Scanner
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X size={18} />
          </button>
        </div>
        <PassportScanForm
          customerId={customerId}
          onConfirm={(fields) => {
            try {
              sessionStorage.setItem("st-ocr-last-fields", JSON.stringify(fields));
            } catch {
              /* copy-through is best-effort */
            }
            onClose();
          }}
        />
      </div>
    </div>
  );
}

/** Map OCR fields onto common identity shapes. */
export function ocrFullName(fields: Record<string, string>): string {
  return (
    fields.fullName ||
    [fields.givenNames, fields.surname].filter(Boolean).join(" ").trim() ||
    ""
  );
}

export function ocrGenderToForm(g?: string): string {
  if (!g) return "";
  const u = g.toUpperCase();
  if (u === "M" || u === "MALE") return "male";
  if (u === "F" || u === "FEMALE") return "female";
  return g.toLowerCase();
}
