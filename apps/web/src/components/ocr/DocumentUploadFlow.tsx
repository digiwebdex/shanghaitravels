import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Crop,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { validateUploadFile } from "@/lib/api";
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
  onFields?: (fields: Record<string, string>, scan: OcrScanResult) => void;
  onSave?: (payload: {
    file: File;
    docType: string;
    fields: Record<string, string>;
    scan: OcrScanResult | null;
  }) => Promise<boolean>;
  scanFile: (file: File, docType: string) => Promise<OcrScanResult>;
  checkDuplicate?: (fields: Record<string, string>) => Promise<{
    duplicate: boolean;
    hits: { type: string; customerId: string; customerCode?: string; customerName?: string }[];
  }>;
  compact?: boolean;
};

/**
 * Central Document Intelligence: Upload → Type → OCR → Preview/Review → Save.
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
  const [dup, setDup] = useState<{ customerName?: string; customerCode?: string; customerId: string }[] | null>(
    null,
  );
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(false);

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

  const displayFields = useMemo(() => {
    if (fieldResults.length) {
      return fieldResults.filter((f) => f.key !== "docType" && f.key !== "classification" && f.key !== "note");
    }
    return Object.keys(form).map(
      (k) =>
        ({
          key: k,
          label: k,
          value: form[k],
          confidence: 80,
          source: "viz",
          mismatch: false,
          lowConfidence: true,
          mrzValue: null,
          vizValue: form[k] || null,
        }) as FieldResult,
    );
  }, [fieldResults, form]);

  const lowConf = displayFields.filter((f) => f.lowConfidence || (f.confidence > 0 && f.confidence < 80));
  const mismatches = displayFields.filter((f) => f.mismatch);
  const needsManual = lowConf.length > 0 || (report?.averageConfidence != null && report.averageConfidence < 80);
  const mrzLabel = report?.mrzValid
    ? "ICAO TD3 valid"
    : displayFields.some((f) => f.key.startsWith("mrz") || f.mrzValue)
      ? "Check digits / parse failed"
      : "N/A";

  async function runOcr(target?: File) {
    const f = target || file;
    if (!f) {
      setError("Choose a file first");
      return;
    }
    const bad = validateUploadFile(f, { maxMb: 20 });
    if (bad) {
      setError(bad);
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
      setEditing(false);
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
    if (needsManual && !editing) {
      setError("Low-confidence fields require Edit / manual review before Save");
      setEditing(true);
      return;
    }
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
          setEditing(false);
          setRotation(0);
        }, 1400);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function rotateAndBake() {
    if (!file || file.type === "application/pdf") {
      setRotation((r) => r + 90);
      return;
    }
    try {
      const next = await transformImageFile(file, { rotateDeg: 90 });
      setFile(next);
      setRotation(0);
    } catch {
      setRotation((r) => r + 90);
    }
  }

  async function cropCenter() {
    if (!file || file.type === "application/pdf") {
      setError("Crop works on images (JPG/PNG/WEBP). Reprocess after crop.");
      return;
    }
    try {
      const next = await transformImageFile(file, { centerCrop: 0.88 });
      setFile(next);
      setRotation(0);
      setError("");
    } catch {
      setError("Could not crop this image");
    }
  }

  return (
    <div className={`space-y-3 ${compact ? "" : "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"}`}>
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
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf"
              disabled={busy}
              className="text-[11px]"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (!f) {
                  setFile(null);
                  return;
                }
                const bad = validateUploadFile(f, { maxMb: 20 });
                if (bad) {
                  setError(bad);
                  setFile(null);
                  return;
                }
                setError("");
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
                <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <PreviewPane url={previewUrl} file={file} rotation={rotation} skeleton={busy} />
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
              <div className="mt-2 flex flex-wrap gap-3">
                <a className="font-semibold text-[var(--accent)]" href={`#/customers/${dup[0].customerId}`}>
                  View
                </a>
                <a
                  className="font-semibold text-[var(--accent)]"
                  href={`#/customers/${dup[0].customerId}?tab=documents`}
                >
                  Merge on Customer 360
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Mini label="Avg confidence" value={`${Math.round(report?.averageConfidence || 0)}%`} />
            <Mini label="MRZ" value={mrzLabel} />
            <Mini label="Validation" value={needsManual ? "Manual review" : "OK"} />
            <Mini label="Type" value={String(scan?.docType || docType)} />
            <Mini label="Time" value={report?.processingMs != null ? `${report.processingMs} ms` : "—"} />
          </div>

          {(lowConf.length > 0 || mismatches.length > 0) && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-[11px] text-rose-900">
              {lowConf.length > 0 && (
                <p>
                  <span className="font-bold">Low confidence (&lt;80%): </span>
                  {lowConf.map((f) => f.label || f.key).join(", ")}
                </p>
              )}
              {mismatches.length > 0 && (
                <p className="mt-1">
                  <span className="font-bold">MRZ / VIZ mismatches: </span>
                  {mismatches.map((f) => f.label || f.key).join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <PreviewPane url={previewUrl} file={file} rotation={rotation} />
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className={btnGhost} onClick={() => void rotateAndBake()}>
                  <RotateCw size={12} /> Rotate
                </button>
                <button type="button" className={btnGhost} onClick={() => void cropCenter()}>
                  <Crop size={12} /> Crop
                </button>
                <button type="button" className={btnGhost} disabled={busy} onClick={() => void runOcr()}>
                  <RefreshCw size={12} /> Reprocess
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setEditing((e) => !e);
                    setError("");
                  }}
                >
                  <Pencil size={12} /> {editing ? "Lock fields" : "Edit"}
                </button>
              </div>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {displayFields.map((fr) => (
                <div key={fr.key} className={`rounded-xl border p-2.5 ${confidenceClass(fr.confidence)}`}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide">{fr.label}</span>
                    <span className="text-[10px] font-bold">{fr.confidence ? `${fr.confidence}%` : "—"}</span>
                  </div>
                  <input
                    className={inputCls}
                    value={form[fr.key] ?? ""}
                    disabled={!editing}
                    onChange={(e) => setForm({ ...form, [fr.key]: e.target.value })}
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {fr.mrzValue && (
                      <button
                        type="button"
                        className="rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-semibold"
                        onClick={() => {
                          setForm({ ...form, [fr.key]: fr.mrzValue || "" });
                          setEditing(true);
                        }}
                      >
                        Use MRZ
                      </button>
                    )}
                    {fr.vizValue && (
                      <button
                        type="button"
                        className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-semibold"
                        onClick={() => {
                          setForm({ ...form, [fr.key]: fr.vizValue || "" });
                          setEditing(true);
                        }}
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
              <button
                type="button"
                disabled={busy || (!!dup && dup.length > 0)}
                className={btnPrimary}
                style={btnPrimaryStyle}
                onClick={() => void save()}
              >
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
        active ? "bg-[var(--accent)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
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
      <div className="text-[11px] font-bold text-[var(--primary)]">{value}</div>
    </div>
  );
}

function PreviewPane({
  url,
  file,
  rotation,
  skeleton,
}: {
  url: string | null;
  file: File | null;
  rotation: number;
  skeleton?: boolean;
}) {
  const isPdf = file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf");
  return (
    <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40">
      {skeleton && !url ? (
        <div className="h-40 w-3/4 animate-pulse rounded-lg bg-[var(--navy-100)]" />
      ) : url && isPdf ? (
        <object data={url} type="application/pdf" className="h-[360px] w-full" title="PDF preview">
          <p className="p-4 text-center text-[11px] text-[var(--muted-foreground)]">PDF selected — preview unavailable in this browser</p>
        </object>
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

async function transformImageFile(
  file: File,
  opts: { rotateDeg?: number; centerCrop?: number },
): Promise<File> {
  const bmp = await createImageBitmap(file);
  const rad = ((opts.rotateDeg || 0) * Math.PI) / 180;
  const swap = Math.abs(opts.rotateDeg || 0) % 180 === 90;
  const w = swap ? bmp.height : bmp.width;
  const h = swap ? bmp.width : bmp.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.translate(w / 2, h / 2);
  if (opts.rotateDeg) ctx.rotate(rad);
  ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
  bmp.close();

  if (opts.centerCrop && opts.centerCrop < 1) {
    const cw = Math.floor(canvas.width * opts.centerCrop);
    const ch = Math.floor(canvas.height * opts.centerCrop);
    const sx = Math.floor((canvas.width - cw) / 2);
    const sy = Math.floor((canvas.height - ch) / 2);
    const cropped = document.createElement("canvas");
    cropped.width = cw;
    cropped.height = ch;
    const cctx = cropped.getContext("2d");
    if (!cctx) throw new Error("canvas");
    cctx.drawImage(canvas, sx, sy, cw, ch, 0, 0, cw, ch);
    const blob = await new Promise<Blob | null>((res) => cropped.toBlob(res, "image/jpeg", 0.92));
    if (!blob) throw new Error("blob");
    return new File([blob], file.name.replace(/\.\w+$/, "") + "-crop.jpg", { type: "image/jpeg" });
  }

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
  if (!blob) throw new Error("blob");
  return new File([blob], file.name.replace(/\.\w+$/, "") + "-rot.jpg", { type: "image/jpeg" });
}
