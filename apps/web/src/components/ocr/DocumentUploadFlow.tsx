import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Crop,
  Loader2,
  RefreshCw,
  RotateCw,
  Sparkles,
} from "lucide-react";
import {
  confidenceClass,
  DOC_INTEL_OPTIONS,
  fieldsToFormMap,
  type DocIntelType,
  type FieldResult,
  type OcrScanResult,
} from "@/lib/documentIntelligence";
import { btnGhost, btnPrimary, btnPrimaryStyle, inputCls, labelCls } from "@/components/enterprise/Page";

type Step = "upload" | "ocr" | "review" | "done";

export type DocumentUploadFlowProps = {
  customerId?: string;
  applicationId?: string;
  defaultDocType?: DocIntelType;
  /** Called after OCR with editable field map — parent may auto-fill forms. */
  onFields?: (fields: Record<string, string>, scan: OcrScanResult) => void;
  /** Persist document + fields. Return true on success. */
  onSave?: (payload: {
    file: File;
    docType: string;
    fields: Record<string, string>;
    scan: OcrScanResult | null;
  }) => Promise<boolean>;
  /** Run OCR — typically ocrApi.scan */
  scanFile: (file: File, docType: string) => Promise<OcrScanResult>;
  checkDuplicate?: (fields: Record<string, string>) => Promise<{
    duplicate: boolean;
    hits: { type: string; customerId: string; customerCode?: string; customerName?: string }[];
  }>;
  compact?: boolean;
};

/**
 * Central Document Intelligence upload → type → OCR → review → save.
 */
export function DocumentUploadFlow({
  defaultDocType = "auto",
  onFields,
  onSave,
  scanFile,
  checkDuplicate,
  compact,
}: DocumentUploadFlowProps) {
  const [step, setStep] = useState<Step>("upload");
  const [docType, setDocType] = useState<DocIntelType>(defaultDocType);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [scan, setScan] = useState<OcrScanResult | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dup, setDup] = useState<{ customerName?: string; customerCode?: string; customerId: string }[] | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const fieldResults: FieldResult[] = useMemo(() => {
    const raw = scan?.fields?.fieldResults;
    return Array.isArray(raw) ? (raw as FieldResult[]) : [];
  }, [scan]);

  const report = scan?.report || (scan?.fields?.report as OcrScanResult["report"]);

  async function runOcr(target?: File) {
    const f = target || file;
    if (!f) {
      setError("Choose a file first");
      return;
    }
    setError("");
    setBusy(true);
    setStep("ocr");
    setProgress(12);
    const tick = window.setInterval(() => setProgress((p) => Math.min(92, p + 7)), 280);
    try {
      const result = await scanFile(f, docType);
      setScan(result);
      const map = fieldsToFormMap(result);
      setForm(map);
      onFields?.(map, result);
      if (checkDuplicate) {
        const d = await checkDuplicate(map);
        setDup(d.duplicate ? d.hits : null);
      } else setDup(null);
      setStep("review");
      setProgress(100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OCR failed");
      setStep("upload");
    } finally {
      window.clearInterval(tick);
      setBusy(false);
    }
  }

  async function save() {
    if (!file || !onSave) return;
    setBusy(true);
    setError("");
    try {
      const ok = await onSave({ file, docType: String(scan?.docType || docType), fields: form, scan });
      if (ok) {
        setStep("done");
        window.setTimeout(() => {
          setStep("upload");
          setFile(null);
          setScan(null);
          setForm({});
          setDup(null);
          setProgress(0);
        }, 1400);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`space-y-3 ${compact ? "" : "rounded-2xl border border-[var(--border)] bg-white p-4"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles size={14} className="text-[var(--accent)]" />
        <h3 className="text-[12px] font-bold text-[var(--primary)]">Document Intelligence</h3>
        <StepPill active={step === "upload"} label="Upload" />
        <StepPill active={step === "ocr"} label="OCR" />
        <StepPill active={step === "review"} label="Review" />
        <StepPill active={step === "done"} label="Save" />
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{error}</p>
      )}

      {step === "done" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-emerald-800">
          <CheckCircle2 className="animate-pulse" size={22} />
          <div>
            <p className="text-[13px] font-bold">Saved</p>
            <p className="text-[11px]">Document confirmed and stored.</p>
          </div>
        </div>
      )}

      {(step === "upload" || step === "ocr") && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls}>Document type</label>
            <select
              className={inputCls}
              value={docType}
              disabled={busy}
              onChange={(e) => setDocType(e.target.value as DocIntelType)}
            >
              {DOC_INTEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className={labelCls}>File (JPG / PNG / WEBP / HEIC / PDF · ≤20MB)</label>
            <input
              type="file"
              accept="image/*,.heic,application/pdf"
              disabled={busy}
              className="text-[11px]"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setRotation(0);
              }}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={!file || busy}
                className={btnPrimary}
                style={btnPrimaryStyle}
                onClick={() => void runOcr()}
              >
                {busy ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Sparkles size={13} /> Run OCR
                  </>
                )}
              </button>
            </div>
            {step === "ocr" && (
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-[10px] font-semibold text-[var(--muted-foreground)]">
                  <span>Reading document…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <PreviewPane url={previewUrl} rotation={rotation} skeleton={busy} />
        </div>
      )}

      {step === "review" && (
        <div className="space-y-3">
          {dup && dup.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
              <p className="font-bold">Possible duplicate</p>
              <p>
                This document already belongs to{" "}
                <strong>
                  {dup[0].customerName || "Customer"} {dup[0].customerCode ? `(${dup[0].customerCode})` : ""}
                </strong>
              </p>
              <div className="mt-2 flex gap-2">
                <a className="font-semibold text-[var(--accent)]" href={`#/customers/${dup[0].customerId}`}>
                  View
                </a>
                <button type="button" className="font-semibold" onClick={() => setDup(null)}>
                  Continue anyway
                </button>
                <button
                  type="button"
                  className="font-semibold text-rose-700"
                  onClick={() => {
                    setStep("upload");
                    setDup(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Mini label="Avg confidence" value={`${Math.round(report?.averageConfidence || 0)}%`} />
            <Mini label="MRZ" value={report?.mrzValid ? "Valid" : "N/A"} />
            <Mini label="Type" value={String(scan?.docType || docType)} />
            <Mini label="Time" value={report?.processingMs != null ? `${report.processingMs} ms` : "—"} />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <PreviewPane url={previewUrl} rotation={rotation} />
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className={btnGhost} onClick={() => setRotation((r) => r + 90)}>
                  <RotateCw size={12} /> Rotate
                </button>
                <button type="button" className={btnGhost} disabled title="Crop in next iteration">
                  <Crop size={12} /> Crop
                </button>
                <button type="button" className={btnGhost} disabled={busy} onClick={() => void runOcr()}>
                  <RefreshCw size={12} /> Reprocess
                </button>
              </div>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {(fieldResults.length
                ? fieldResults.filter((f) => f.key !== "docType" && f.key !== "classification" && f.key !== "note")
                : (Object.keys(form).map((k) => ({
                    key: k,
                    label: k,
                    value: form[k],
                    confidence: 80,
                    source: "viz",
                    mismatch: false,
                    lowConfidence: true,
                    mrzValue: null as string | null,
                    vizValue: form[k] || null,
                  })) as FieldResult[])
              ).map((fr) => (
                <div key={fr.key} className={`rounded-xl border p-2.5 ${confidenceClass(fr.confidence)}`}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide">{fr.label}</span>
                    <span className="text-[10px] font-bold">{fr.confidence ? `${fr.confidence}%` : "—"}</span>
                  </div>
                  <input
                    className={inputCls}
                    value={form[fr.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [fr.key]: e.target.value })}
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {fr.mrzValue && (
                      <button
                        type="button"
                        className="rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-semibold"
                        onClick={() => setForm({ ...form, [fr.key]: fr.mrzValue || "" })}
                      >
                        Use MRZ
                      </button>
                    )}
                    {fr.vizValue && (
                      <button
                        type="button"
                        className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-semibold"
                        onClick={() => setForm({ ...form, [fr.key]: fr.vizValue || "" })}
                      >
                        Use OCR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onSave && (
              <button type="button" disabled={busy || (!!dup && dup.length > 0)} className={btnPrimary} style={btnPrimaryStyle} onClick={() => void save()}>
                Save
              </button>
            )}
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setStep("upload");
                setScan(null);
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
        active ? "bg-[var(--accent)] text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}
    </span>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-2.5 py-2">
      <div className="text-[9px] font-bold uppercase text-[var(--muted-foreground)]">{label}</div>
      <div className="text-[12px] font-bold text-[var(--primary)]">{value}</div>
    </div>
  );
}

function PreviewPane({ url, rotation, skeleton }: { url: string | null; rotation: number; skeleton?: boolean }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40">
      {skeleton && !url ? (
        <div className="h-40 w-3/4 animate-pulse rounded-lg bg-slate-200" />
      ) : url ? (
        <img
          src={url}
          alt="Document preview"
          className="max-h-[360px] max-w-full object-contain transition-transform duration-300"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      ) : (
        <p className="text-[11px] text-[var(--muted-foreground)]">Preview appears after file select</p>
      )}
    </div>
  );
}
