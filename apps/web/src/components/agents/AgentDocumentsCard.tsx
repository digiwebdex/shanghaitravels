import { useCallback, useEffect, useState } from "react";
import { FileCheck2 } from "lucide-react";
import { agentsApi, ocrApi, type AgentDocument } from "@/lib/services";
import { ApiError, validateUploadFile } from "@/lib/api";
import type { DocIntelType, OcrScanResult } from "@/lib/documentIntelligence";
import { Can } from "@/auth/Can";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import { Surface, SurfaceHeader, labelCls, selectClassName } from "@/components/enterprise/Page";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { ErrorBanner } from "@/components/Feedback";

// The 9 onboarding document slots → { persist category, OCR/Document-Intelligence type }.
const SLOTS: { key: string; label: string; docType: DocIntelType }[] = [
  { key: "agent_photo", label: "Agent Photo", docType: "other" },
  { key: "trade_license", label: "Trade License", docType: "trade_license" },
  { key: "nid_front", label: "NID Front", docType: "national_id" },
  { key: "nid_back", label: "NID Back", docType: "national_id" },
  { key: "passport_copy", label: "Passport Copy", docType: "passport" },
  { key: "tin", label: "TIN Certificate", docType: "other" },
  { key: "office_photo", label: "Office Photo", docType: "other" },
  { key: "business_card", label: "Business Card", docType: "other" },
  { key: "other", label: "Other Documents", docType: "other" },
];

/**
 * Agent onboarding documents. Reuses the existing DocumentUploadFlow (scan → OCR
 * → review → save): scanning routes through ocrApi.scan so every upload appears
 * in Document Intelligence, and persistence reuses agentsApi.uploadDocument
 * (generic Document store, ownerType=agent). No OCR/upload logic is duplicated.
 */
export function AgentDocumentsCard({ agentId }: { agentId: string }) {
  const [slot, setSlot] = useState(SLOTS[0].key);
  const [docs, setDocs] = useState<AgentDocument[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setDocs(await agentsApi.listDocuments(agentId));
    } catch {
      setDocs([]);
    }
  }, [agentId]);
  useEffect(() => {
    void load();
  }, [load]);

  const current = SLOTS.find((s) => s.key === slot) ?? SLOTS[0];
  const filled = new Set(docs.map((d) => d.category));

  return (
    <Surface padded className="space-y-3">
      <SurfaceHeader title="Images & Documents" hint="Every upload also appears in Document Intelligence. JPG/PNG/WEBP/PDF, ≤15MB." />
      <ErrorBanner message={error} />

      {/* 9 labeled slots — click to select which document you're uploading */}
      <div className="flex flex-wrap gap-1.5">
        {SLOTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSlot(s.key)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10.5px] font-semibold ${
              s.key === slot ? "border-[var(--accent)] bg-[var(--orange-50,#fff4ec)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted-foreground)]"
            }`}
          >
            {filled.has(s.key) && <FileCheck2 size={11} className="text-emerald-600" />}
            {s.label}
          </button>
        ))}
      </div>

      <Can perm="document:upload">
        <div>
          <label className={labelCls}>Uploading: {current.label}</label>
          <select className={selectClassName} value={slot} onChange={(e) => setSlot(e.target.value)}>
            {SLOTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <div className="mt-2">
            <DocumentUploadFlow
              key={slot}
              compact
              defaultDocType={current.docType}
              scanFile={async (file, docType) => {
                const bad = validateUploadFile(file);
                if (bad) throw new Error(bad);
                return (await ocrApi.scan(file, { docType })) as OcrScanResult;
              }}
              onSave={async ({ file }) => {
                setError("");
                try {
                  await agentsApi.uploadDocument(agentId, file, current.key);
                  await load();
                  return true;
                } catch (e) {
                  setError(e instanceof ApiError ? e.message : "Upload failed");
                  return false;
                }
              }}
            />
          </div>
        </div>
      </Can>

      <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)] pt-1 text-[11px]">
        {docs.length === 0 ? (
          <li className="py-2 text-[var(--muted-foreground)]">No documents uploaded yet.</li>
        ) : (
          docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-[var(--foreground)]">{SLOTS.find((s) => s.key === d.category)?.label ?? d.category}</span>
                <span className="text-[var(--muted-foreground)]">· {d.fileName}</span>
              </span>
              <Pill value={d.status} tone={statusTone(d.status)} />
            </li>
          ))
        )}
      </ul>
    </Surface>
  );
}
