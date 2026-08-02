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
import { btnGhost, btnPrimary, btnPrimaryStyle } from "@/components/enterprise/Page";

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

/** Global shell modal — Scan Document quick action. */
export function ScanDocumentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 p-4 pt-[8vh]" role="dialog" aria-modal>
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[var(--primary)]">Scan Document</h2>
          <button type="button" className={btnGhost} onClick={onClose}>
            <X size={14} /> Close
          </button>
        </div>
        <p className="mb-3 text-[11px] text-[var(--muted-foreground)]">
          Upload → OCR → review confidence → copy fields into your open form, or open{" "}
          <a href="#/operations/document-intelligence" className="font-semibold text-[var(--accent)]" onClick={onClose}>
            Document Intelligence
          </a>{" "}
          to save.
        </p>
        <DocumentUploadFlow
          defaultDocType="auto"
          scanFile={async (file, docType) => {
            const bad = validateUploadFile(file);
            if (bad) throw new Error(bad);
            return (await ocrApi.scan(file, { docType })) as OcrScanResult;
          }}
          checkDuplicate={async (fields) =>
            ocrApi.checkDuplicate({
              passportNo: fields.passportNo,
              nidNumber: fields.nidNumber,
              visaNumber: fields.visaNumber,
            })
          }
          onSave={async ({ fields }) => {
            try {
              sessionStorage.setItem("st-ocr-last-fields", JSON.stringify(fields));
              onClose();
              return true;
            } catch {
              return false;
            }
          }}
        />
        <div className="mt-3 flex justify-end">
          <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={onClose}>
            Done
          </button>
        </div>
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
