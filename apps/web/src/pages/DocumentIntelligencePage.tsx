import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Brain, FileSearch, RefreshCw } from "lucide-react";
import { applicationsApi, customersApi, ocrApi, passportsApi } from "@/lib/services";
import { ApiError, listOf, validateUploadFile } from "@/lib/api";
import type { Customer } from "@/lib/types";
import { passportExpiry } from "@/lib/types";
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
import {
  confidenceClass,
  docTypeToUploadCategory,
  type OcrScanResult,
} from "@/lib/documentIntelligence";

type Tab =
  | "dashboard"
  | "scan"
  | "queue"
  | "recent"
  | "duplicates"
  | "failed"
  | "logs"
  | "search"
  | "settings";

const TABS: Tab[] = [
  "dashboard",
  "scan",
  "queue",
  "recent",
  "duplicates",
  "failed",
  "logs",
  "search",
  "settings",
];

export default function DocumentIntelligencePage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "dashboard";

  const setTab = (id: Tab) => {
    const next = new URLSearchParams(params);
    if (id === "dashboard") next.delete("tab");
    else next.set("tab", id);
    setParams(next, { replace: true });
  };

  const [stats, setStats] = useState<Awaited<ReturnType<typeof ocrApi.stats>> | null>(null);
  const [recent, setRecent] = useState<Record<string, unknown>[]>([]);
  const [failed, setFailed] = useState<Record<string, unknown>[]>([]);
  const [passportHits, setPassportHits] = useState<
    { customerId: string; customerCode: string; customerName: string; passportNo: string; expiry: string }[]
  >([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState(params.get("q") || "");
  const [customerId, setCustomerId] = useState(params.get("customerId") || "");
  const [applicationId, setApplicationId] = useState(params.get("applicationId") || "");

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, r, f] = await Promise.all([ocrApi.stats(), ocrApi.recent(200), ocrApi.failed(80)]);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = listOf<Customer>(await customersApi.list({ limit: 200 }));
        const hits: typeof passportHits = [];
        for (const c of rows) {
          for (const p of c.passports || []) {
            hits.push({
              customerId: c.id,
              customerCode: c.code,
              customerName: c.fullName,
              passportNo: p.passportNo,
              expiry: passportExpiry(p),
            });
          }
        }
        if (!cancelled) setPassportHits(hits);
      } catch {
        if (!cancelled) setPassportHits([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const needle = q.trim().toLowerCase();

  const journalHits = useMemo(() => {
    if (!needle) return recent;
    return recent.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [recent, needle]);

  const savedPassportHits = useMemo(() => {
    if (!needle) return passportHits.slice(0, 40);
    return passportHits.filter(
      (p) =>
        p.passportNo.toLowerCase().includes(needle) ||
        p.customerName.toLowerCase().includes(needle) ||
        p.customerCode.toLowerCase().includes(needle),
    );
  }, [passportHits, needle]);

  const duplicateGroups = useMemo(() => {
    const map = new Map<string, typeof passportHits>();
    for (const p of passportHits) {
      const key = p.passportNo.trim().toUpperCase();
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(p);
      map.set(key, list);
    }
    return [...map.entries()]
      .filter(([, list]) => {
        const cust = new Set(list.map((x) => x.customerId));
        return cust.size > 1 || list.length > 1;
      })
      .map(([passportNo, list]) => ({ passportNo, list }))
      .slice(0, 50);
  }, [passportHits]);

  const journalSearchHits = useMemo(() => {
    if (!needle) return recent;
    return recent.filter((row) => {
      const blob = [
        row.passportNo,
        row.nidNumber,
        row.visaNumber,
        row.mrzLine1,
        row.mrzLine2,
        row.docType,
        row.status,
        JSON.stringify(row),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [recent, needle]);

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
            ["recent", "Recent Documents"],
            ["duplicates", "Duplicates"],
            ["failed", "Failed OCR"],
            ["logs", "Processing Logs"],
            ["search", "Global Search"],
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
            <FileSearch size={14} /> OCR queue
          </h2>
          <p className="mb-3 text-[11px] text-[var(--muted-foreground)]">
            In-memory session journal of scans awaiting review or recently processed (existing OCR service).
          </p>
          <JournalTable rows={recent.filter((r) => String(r.status || "").toLowerCase() !== "failed")} />
        </Surface>
      )}

      {tab === "recent" && (
        <Surface padded>
          <h2 className="mb-2 text-[12px] font-bold text-[var(--primary)]">Recent documents</h2>
          <JournalTable rows={recent} />
        </Surface>
      )}

      {tab === "duplicates" && (
        <Surface padded className="space-y-4">
          <h2 className="text-[12px] font-bold text-[var(--primary)]">Duplicate passports</h2>
          <p className="text-[11px] text-[var(--muted-foreground)]">
            Same passport number on more than one customer record — review before merging.
          </p>
          {!duplicateGroups.length ? (
            <p className="text-[11px] text-[var(--muted-foreground)]">No duplicate passport numbers in loaded customers.</p>
          ) : (
            <ul className="space-y-3">
              {duplicateGroups.map((g) => (
                <li key={g.passportNo} className="rounded-2xl border border-amber-200 bg-amber-50/50 px-3 py-2 text-[11px]">
                  <p className="font-mono font-bold text-[var(--primary)]">{g.passportNo}</p>
                  <ul className="mt-1 space-y-1">
                    {g.list.map((p) => (
                      <li key={`${p.customerId}-${p.passportNo}`} className="flex justify-between gap-2">
                        <span>
                          {p.customerName} ({p.customerCode}) · exp {p.expiry}
                        </span>
                        <Link className="font-bold text-[var(--accent)]" to={`/customers/${p.customerId}`}>
                          View
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <div>
            <label className={labelCls}>Check number before save</label>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              Upload flows call <code className="font-mono">POST /ocr/intelligence/check-duplicate</code> for passport /
              NID / visa.
            </p>
          </div>
        </Surface>
      )}

      {tab === "failed" && (
        <Surface padded>
          <h2 className="mb-2 text-[12px] font-bold text-[var(--primary)]">Failed OCR</h2>
          <JournalTable rows={failed} />
        </Surface>
      )}

      {tab === "logs" && (
        <Surface padded>
          <h2 className="mb-2 text-[12px] font-bold text-[var(--primary)]">Processing logs</h2>
          <p className="mb-3 text-[11px] text-[var(--muted-foreground)]">
            Timestamped OCR journal with confidence bands (memory-backed until staff Save).
          </p>
          <JournalTable rows={recent} showConfidenceTone />
        </Surface>
      )}

      {tab === "search" && (
        <Surface padded className="space-y-4">
          <div>
            <label className={labelCls}>Global document search</label>
            <input
              className={inputCls}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Passport / NID / visa number, customer name, or MRZ fragment"
            />
            <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
              Searches OCR journal (passport, NID, visa, MRZ) and saved customer passports.
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-[11px] font-bold text-[var(--primary)]">Saved passports</h3>
            {!savedPassportHits.length ? (
              <p className="text-[11px] text-[var(--muted-foreground)]">No passport matches.</p>
            ) : (
              <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">
                {savedPassportHits.slice(0, 30).map((p) => (
                  <li
                    key={`${p.customerId}-${p.passportNo}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[11px]"
                  >
                    <div>
                      <span className="font-mono font-semibold">{p.passportNo}</span>
                      <span className="text-[var(--muted-foreground)]"> · exp {p.expiry}</span>
                    </div>
                    <Link className="font-bold text-[var(--accent)]" to={`/customers/${p.customerId}`}>
                      {p.customerName} ({p.customerCode})
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-[11px] font-bold text-[var(--primary)]">OCR journal</h3>
            <JournalTable rows={needle ? journalSearchHits : journalHits} showConfidenceTone />
          </div>
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

function JournalTable({
  rows,
  showConfidenceTone,
}: {
  rows: Record<string, unknown>[];
  showConfidenceTone?: boolean;
}) {
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
          {rows.map((r) => {
            const conf =
              r.averageConfidence != null
                ? Number(r.averageConfidence)
                : r.confidence != null
                  ? Math.round(Number(r.confidence) * (Number(r.confidence) <= 1 ? 100 : 1))
                  : null;
            return (
              <tr key={String(r.id)} className="border-t border-[var(--border)]">
                <td className="py-2 font-mono text-[10px]">
                  {String(r.createdAt || "").replace("T", " ").slice(0, 19)}
                </td>
                <td className="py-2">{String(r.docType || "—")}</td>
                <td className="py-2">{String(r.status || "—")}</td>
                <td className="py-2">
                  {conf != null ? (
                    showConfidenceTone ? (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${confidenceClass(conf)}`}>
                        {conf}%
                      </span>
                    ) : (
                      `${conf}%`
                    )
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 font-mono text-[10px]">
                  {[r.passportNo, r.nidNumber, r.visaNumber, r.mrzLine1].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="py-2">{r.processingMs != null ? String(r.processingMs) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
