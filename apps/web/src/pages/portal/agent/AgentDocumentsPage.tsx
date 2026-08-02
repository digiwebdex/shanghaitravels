import { useEffect, useState } from "react";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError, validateUploadFile } from "@/lib/api";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import { docTypeToUploadCategory, type OcrScanResult } from "@/lib/documentIntelligence";
import { PortalPage } from "@/layouts/portalChrome";

export default function AgentDocumentsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [cases, setCases] = useState<Record<string, any>[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    const [docs, bookings] = await Promise.all([agentPortalApi.documents(), agentPortalApi.cases()]);
    setRows(docs);
    setCases(bookings);
    if (!applicationId && bookings[0]) setApplicationId(String(bookings[0].id));
  }

  useEffect(() => {
    void Promise.all([agentPortalApi.documents(), agentPortalApi.cases()])
      .then(([docs, bookings]) => {
        setRows(docs);
        setCases(bookings);
        setApplicationId((prev) => prev || (bookings[0] ? String(bookings[0].id) : ""));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  const selected = cases.find((c) => String(c.id) === applicationId);

  return (
    <PortalPage
      title="Customer Documents"
      description="Attach traveler documents to a booking with OCR review before upload."
    >
      {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
      {ok && <p className="text-[11px] text-[var(--success)]">{ok}</p>}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
        <label className="mb-1 block text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Booking</label>
        <select
          className="mb-3 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-[12px]"
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
        >
          {cases.map((c) => (
            <option key={String(c.id)} value={String(c.id)}>
              {String(c.referenceNo)}
              {c.customer?.fullName ? ` · ${c.customer.fullName}` : ""}
            </option>
          ))}
        </select>

        <DocumentUploadFlow
          applicationId={applicationId}
          scanFile={async (file, docType) => {
            const bad = validateUploadFile(file);
            if (bad) throw new Error(bad);
            return (await agentPortalApi.ocrScan(file, docType)) as OcrScanResult;
          }}
          checkDuplicate={async (fields) => {
            const no = (fields.passportNo || "").trim().toUpperCase();
            if (!no || !selected?.customer) return { duplicate: false, hits: [] };
            const existing = String(selected.customer.passportNo || selected.passportNo || "")
              .trim()
              .toUpperCase();
            if (existing && existing === no) {
              return {
                duplicate: true,
                hits: [
                  {
                    type: "passport",
                    customerId: String(selected.customerId || selected.customer.id || ""),
                    customerCode: String(selected.customer.code || ""),
                    customerName: String(selected.customer.fullName || "Customer"),
                  },
                ],
              };
            }
            return { duplicate: false, hits: [] };
          }}
          onFields={(fields) => {
            if (fields.passportNo || fields.fullName) {
              setOk(
                `OCR ready for ${String(selected?.referenceNo || "booking")}: ${
                  fields.fullName || fields.passportNo || "fields"
                }`,
              );
            }
          }}
          onSave={async ({ file, docType }) => {
            if (!applicationId) {
              setError("Choose a booking");
              return false;
            }
            const form = new FormData();
            form.append("file", file);
            form.append("applicationId", applicationId);
            form.append("category", docTypeToUploadCategory(docType));
            try {
              await agentPortalApi.uploadDocument(form);
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
            <a className="font-semibold text-[var(--accent)]" href={agentPortalApi.downloadUrl(String(r.id))}>
              Download
            </a>
          </li>
        ))}
        {!rows.length && <li className="px-3 py-4 text-[var(--muted-foreground)]">No documents yet.</li>}
      </ul>
    </PortalPage>
  );
}
