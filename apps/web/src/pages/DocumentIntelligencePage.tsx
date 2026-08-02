import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Brain, FileSearch, RefreshCw } from "lucide-react";
import { applicationsApi, ocrApi, passportsApi } from "@/lib/services";
import { ApiError, validateUploadFile } from "@/lib/api";
import { Can } from "@/auth/Can";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { DocumentUploadFlow } from "@/components/ocr/DocumentUploadFlow";
import { docTypeToUploadCategory, type OcrScanResult } from "@/lib/documentIntelligence";

type Tab = "dashboard" | "scan" | "queue" | "failed" | "search" | "settings";

export default function DocumentIntelligencePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Awaited<ReturnType<typeof ocrApi.stats>> | null>(null);
  const [recent, setRecent] = useState<Record<string, unknown>[]>([]);
  const [failed, setFailed] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [applicationId, setApplicationId] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, r, f] = await Promise.all([ocrApi.stats(), ocrApi.recent(40), ocrApi.failed(40)]);
      setStats(s);
      setRecent(Array.isArray(r) ? r : []);
      setFailed(Array.isArray(f) ? f : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load Document Intelligence");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const searchHits = recent.filter((row) => {
    if (!q.trim()) return true;
    const hay = JSON.stringify(row).toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <PageShell>
      <PageHeader
        icon={Brain}
        title="Document Intelligence"
        subtitle="Central OCR for passports, NID, visas, tickets and more — review before save."
        breadcrumb={[
          { label: "Operations", to: "/operations/documents" },
          { label: "Document Intelligence" },
        ]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ["dashboard", "Dashboard"],
            ["scan", "Scan"],
            ["queue", "OCR Queue"],
            ["failed", "Failed OCR"],
            ["search", "Search"],
            ["settings", "Settings"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
              tab === id ? "bg-[var(--primary)] text-white" : "bg-white text-[var(--primary)] border border-[var(--border)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          <StatStrip>
            <KpiCard label="Scanned today" value={String(stats?.scannedToday ?? 0)} />
            <KpiCard label="Passport OCR" value={String(stats?.byType?.passport ?? 0)} />
            <KpiCard label="NID OCR" value={String(stats?.byType?.national_id ?? 0)} />
            <KpiCard label="Visa OCR" value={String(stats?.byType?.visa ?? 0)} />
            <KpiCard label="Failures" value={String(stats?.failures ?? 0)} tone="danger" />
            <KpiCard
              label="Avg confidence"
              value={stats?.averageConfidence != null ? `${stats.averageConfidence}%` : "—"}
            />
            <KpiCard
              label="Avg time"
              value={stats?.averageProcessingMs != null ? `${stats.averageProcessingMs} ms` : "—"}
            />
          </StatStrip>
          <div className="mb-4" />
          <Surface padded>
            <h2 className="mb-2 text-[12px] font-bold text-[var(--primary)]">Recent documents</h2>
            <JournalTable rows={recent.slice(0, 15)} />
          </Surface>
        </>
      )}

      {tab === "scan" && (
        <Surface padded className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Customer ID (optional autofill target)</label>
              <input className={inputCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="UUID" />
            </div>
            <div>
              <label className={labelCls}>Application ID (optional)</label>
              <input className={inputCls} value={applicationId} onChange={(e) => setApplicationId(e.target.value)} placeholder="UUID" />
            </div>
          </div>
          <Can perm="ocr:use">
            <DocumentUploadFlow
              customerId={customerId || undefined}
              applicationId={applicationId || undefined}
              scanFile={async (file, docType) => {
                const bad = validateUploadFile(file, { maxMb: 20 });
                if (bad) throw new Error(bad);
                return (await ocrApi.scan(file, {
                  docType,
                  customerId: customerId || undefined,
                  applicationId: applicationId || undefined,
                })) as OcrScanResult;
              }}
              checkDuplicate={async (fields) =>
                ocrApi.checkDuplicate({
                  passportNo: fields.passportNo,
                  nidNumber: fields.nidNumber,
                  visaNumber: fields.visaNumber,
                  customerId: customerId || undefined,
                })
              }
              onSave={async ({ file, docType, fields }) => {
                if (applicationId) {
                  await applicationsApi.uploadDocument(applicationId, file, docTypeToUploadCategory(docType));
                }
                if (customerId && fields.passportNo && (docType === "passport" || fields.mrzLine1)) {
                  await passportsApi.create({
                    customerId,
                    passportNo: fields.passportNo,
                    issuingCountry: fields.issuingCountry || undefined,
                    dateOfIssue: fields.dateOfIssue || undefined,
                    dateOfExpiry: fields.dateOfExpiry || undefined,
                    isPrimary: true,
                  });
                }
                setOk("Document processed and saved where applicable");
                await load();
                return true;
              }}
            />
          </Can>
        </Surface>
      )}

      {tab === "queue" && (
          <Surface padded>
            <h2 className="mb-2 flex items-center gap-2 text-[12px] font-bold text-[var(--primary)]">
              <FileSearch size={14} /> OCR queue (session journal)
            </h2>
            <JournalTable rows={recent} />
          </Surface>
      )}

      {tab === "failed" && (
        <Surface padded>
          <h2 className="mb-2 text-[12px] font-bold text-[var(--primary)]">Failed OCR</h2>
          <JournalTable rows={failed} />
        </Surface>
      )}

      {tab === "search" && (
        <Surface padded className="space-y-3">
          <div>
            <label className={labelCls}>Search passport / NID / visa / MRZ</label>
            <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. BX0123456" />
          </div>
          <JournalTable rows={searchHits} />
        </Surface>
      )}

      {tab === "settings" && (
        <Surface padded className="space-y-2 text-[12px] text-[var(--muted-foreground)]">
          <p>OCR uses Google Vision + ICAO MRZ validation. Images are memory-only until staff confirm Save.</p>
          <p>Requires env <code className="font-mono">OCR_APPROVED=true</code> and Vision API key.</p>
          <p>
            Related: <Link className="font-semibold text-[var(--accent)]" to="/passports">Passports</Link> ·{" "}
            <Link className="font-semibold text-[var(--accent)]" to="/operations/documents">Operations Documents</Link>
          </p>
          <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setTab("scan")}>
            Open scanner
          </button>
        </Surface>
      )}
    </PageShell>
  );
}

function JournalTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-[11px] text-[var(--muted-foreground)]">No entries yet — run a scan.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="text-[9.5px] uppercase text-[var(--muted-foreground)]">
            <th className="py-1 font-bold">When</th>
            <th className="py-1 font-bold">Type</th>
            <th className="py-1 font-bold">Status</th>
            <th className="py-1 font-bold">Confidence</th>
            <th className="py-1 font-bold">Keys</th>
            <th className="py-1 font-bold">ms</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-t border-[var(--border)]">
              <td className="py-2 font-mono text-[10px]">{String(r.createdAt || "").replace("T", " ").slice(0, 19)}</td>
              <td className="py-2">{String(r.docType || "—")}</td>
              <td className="py-2">{String(r.status || "—")}</td>
              <td className="py-2">
                {r.averageConfidence != null ? `${r.averageConfidence}%` : r.confidence != null ? `${Math.round(Number(r.confidence) * 100)}%` : "—"}
              </td>
              <td className="py-2 font-mono text-[10px]">
                {[r.passportNo, r.nidNumber, r.visaNumber].filter(Boolean).join(" · ") || "—"}
              </td>
              <td className="py-2">{r.processingMs != null ? String(r.processingMs) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
