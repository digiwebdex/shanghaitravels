import { Link } from "react-router";
import { applicationsApi, ocrApi, passportsApi } from "@/lib/services";
import { ApiError, validateUploadFile } from "@/lib/api";
import type { AppDocument } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import { docTypeToUploadCategory, type OcrScanResult } from "@/lib/documentIntelligence";

export function CaseDocumentsCard({
  appId,
  docs,
  onSaved,
  setError,
  setOk,
  customerId,
  autofill,
}: {
  appId: string;
  docs: AppDocument[];
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
  customerId?: string;
  /** Optional: push OCR fields into parent case form */
  autofill?: (fields: Record<string, string>) => void;
}) {
  const { can } = useAuth();

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[12px] font-bold text-[var(--primary)]">Document collection</h2>
        <Link
          to="/operations/document-intelligence"
          className="text-[10px] font-bold text-[var(--accent)]"
        >
          Open Document Intelligence →
        </Link>
      </div>

      <Can perm="ocr:use">
        <div className="mb-4">
          <DocumentUploadFlow
            compact
            customerId={customerId}
            applicationId={appId}
            onFields={(fields) => autofill?.(fields)}
            scanFile={async (file, docType) => {
              const bad = validateUploadFile(file);
              if (bad) throw new Error(bad);
              return (await ocrApi.scan(file, {
                docType,
                customerId,
                applicationId: appId,
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
                await applicationsApi.uploadDocument(appId, file, docTypeToUploadCategory(docType));
                if (customerId && fields.passportNo && (docType === "passport" || fields.mrzLine1)) {
                  if (can("ocr:apply")) {
                    await passportsApi.create({
                      customerId,
                      passportNo: fields.passportNo,
                      issuingCountry: fields.issuingCountry || undefined,
                      dateOfIssue: fields.dateOfIssue || undefined,
                      dateOfExpiry: fields.dateOfExpiry || undefined,
                      isPrimary: true,
                    });
                  }
                }
                setOk("Document saved");
                await onSaved();
                return true;
              } catch (e) {
                setError(e instanceof ApiError ? e.message : "Save failed");
                return false;
              }
            }}
          />
        </div>
      </Can>

      {!can("ocr:use") && (
        <p className="mb-3 text-[11px] text-[var(--muted-foreground)]">
          OCR requires <code className="font-mono">ocr:use</code>. You can still view uploaded files below.
        </p>
      )}

      {docs.length === 0 ? (
        <p className="text-[11px] text-[var(--muted-foreground)]">No documents uploaded yet.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-[9.5px] uppercase text-[var(--muted-foreground)]">
              <th className="py-1 font-bold">Type</th>
              <th className="py-1 font-bold">File</th>
              <th className="py-1 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-[var(--border)] text-[11px]">
                <td className="py-2">{(d.category || "").replace(/_/g, " ")}</td>
                <td className="py-2">{d.fileName || "—"}</td>
                <td className="py-2">
                  <span className="rounded bg-[var(--background)] px-1.5 py-0.5 text-[9px] font-bold">
                    {d.status || "uploaded"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!can("document:upload") && !can("document:read") && !can("ocr:use") && (
        <p className="text-[11px] text-[var(--muted-foreground)]">No document permission.</p>
      )}
    </section>
  );
}
