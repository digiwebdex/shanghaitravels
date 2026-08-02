import { useEffect, useState } from "react";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError, validateUploadFile } from "@/lib/api";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import { docTypeToUploadCategory, type OcrScanResult } from "@/lib/documentIntelligence";
import { PortalPage } from "@/layouts/portalChrome";

export default function PortalDocumentsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [passports, setPassports] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    const [docs, pps] = await Promise.all([
      customerPortalApi.documents(),
      customerPortalApi.passports().catch(() => []),
    ]);
    setRows(docs);
    setPassports(pps);
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  return (
    <PortalPage
      title="My Documents"
      description="Upload → choose type → OCR → review → save. Identity documents update your travel profile."
    >
      {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
      {ok && <p className="text-[11px] text-[var(--success)]">{ok}</p>}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
        <DocumentUploadFlow
          scanFile={async (file, docType) => {
            const bad = validateUploadFile(file);
            if (bad) throw new Error(bad);
            return (await customerPortalApi.ocrScan(file, docType)) as OcrScanResult;
          }}
          checkDuplicate={async (fields) => {
            const no = (fields.passportNo || "").trim().toUpperCase();
            if (!no) return { duplicate: false, hits: [] };
            const hits = passports
              .filter((p) => String(p.passportNo || "").trim().toUpperCase() === no)
              .map((p) => ({
                type: "passport",
                customerId: String(p.customerId || "me"),
                customerCode: "YOU",
                customerName: "Your profile",
              }));
            return { duplicate: hits.length > 0, hits };
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

      <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[11px]">
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
    </PortalPage>
  );
}
