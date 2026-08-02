import { useEffect, useState } from "react";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { ApiError, validateUploadFile } from "@/lib/api";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import { docTypeToUploadCategory, type OcrScanResult } from "@/lib/documentIntelligence";

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

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-5">
      <h1 className="text-[16px] font-bold">Customer Documents</h1>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {ok && <p className="text-[11px] text-emerald-700">{ok}</p>}

      <div className="rounded-xl border bg-white p-4">
        <label className="mb-1 block text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Booking</label>
        <select
          className="mb-3 w-full rounded-lg border px-3 py-2 text-[12px]"
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
        >
          {cases.map((c) => (
            <option key={String(c.id)} value={String(c.id)}>
              {String(c.referenceNo)}
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

      <ul className="divide-y rounded-xl border bg-white text-[11px]">
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
    </div>
  );
}
