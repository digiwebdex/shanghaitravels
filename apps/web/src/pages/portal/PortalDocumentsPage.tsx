import { useEffect, useState } from "react";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError, validateUploadFile } from "@/lib/api";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import { docTypeToUploadCategory, type OcrScanResult } from "@/lib/documentIntelligence";

export default function PortalDocumentsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setRows(await customerPortalApi.documents());
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-5">
      <h1 className="text-[16px] font-bold">My Documents</h1>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {ok && <p className="text-[11px] text-emerald-700">{ok}</p>}

      <div className="rounded-xl border bg-white p-4">
        <DocumentUploadFlow
          scanFile={async (file, docType) => {
            const bad = validateUploadFile(file);
            if (bad) throw new Error(bad);
            return (await customerPortalApi.ocrScan(file, docType)) as OcrScanResult;
          }}
          onFields={async (fields) => {
            if (fields.passportNo) {
              try {
                await customerPortalApi.upsertPassport({
                  passportNo: fields.passportNo,
                  issuingCountry: fields.issuingCountry || undefined,
                  dateOfIssue: fields.dateOfIssue || undefined,
                  dateOfExpiry: fields.dateOfExpiry || undefined,
                });
              } catch {
                /* non-fatal autofill */
              }
            }
          }}
          onSave={async ({ file, docType, fields }) => {
            const form = new FormData();
            form.append("file", file);
            form.append("category", docTypeToUploadCategory(docType));
            try {
              await customerPortalApi.uploadDocument(form);
              if (fields.passportNo) {
                await customerPortalApi.upsertPassport({
                  passportNo: fields.passportNo,
                  issuingCountry: fields.issuingCountry || undefined,
                  dateOfIssue: fields.dateOfIssue || undefined,
                  dateOfExpiry: fields.dateOfExpiry || undefined,
                });
              }
              setOk("Uploaded");
              await load();
              return true;
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Upload failed");
              return false;
            }
          }}
        />
      </div>

      <ul className="divide-y rounded-xl border bg-white text-[11px]">
        {rows.map((r) => (
          <li key={String(r.id)} className="flex justify-between px-3 py-2">
            <span>{String(r.category || r.fileName || r.id)}</span>
            <a className="font-semibold text-[var(--accent)]" href={customerPortalApi.downloadUrl(String(r.id))}>
              Download
            </a>
          </li>
        ))}
        {!rows.length && <li className="px-3 py-4 text-[var(--muted-foreground)]">No documents yet.</li>}
      </ul>
    </div>
  );
}
