import { useMemo, useState } from "react";
import { inputCls, labelCls } from "@/components/enterprise/Page";

export type OcrFieldResult = {
  key: string;
  label: string;
  value: string | null;
  confidence: number;
  source: string;
  mrzValue?: string | null;
  vizValue?: string | null;
  mismatch: boolean;
  lowConfidence: boolean;
  checkDigitOk?: boolean;
};

export type OcrScanResult = {
  id?: string;
  confidence?: number | null;
  fields?: Record<string, unknown> | null;
  report?: {
    extractionRate?: number;
    averageConfidence?: number;
    failedFields?: string[];
    mismatches?: string[];
    mrzValid?: boolean;
    processingMs?: number;
    fieldAccuracyHint?: number;
  };
};

const EDITABLE_KEYS = [
  "passportNo",
  "surname",
  "givenNames",
  "fullName",
  "nationality",
  "gender",
  "dateOfBirth",
  "dateOfIssue",
  "dateOfExpiry",
  "passportType",
  "issuingCountry",
  "mrzLine1",
  "mrzLine2",
] as const;

type EditableKey = (typeof EDITABLE_KEYS)[number];

export type PassportFormFields = {
  passportNo: string;
  surname: string;
  givenNames: string;
  fullName: string;
  nationality: string;
  gender: string;
  dateOfBirth: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  passportType: string;
  issuingCountry: string;
  mrzLine1: string;
  mrzLine2: string;
};

export function emptyPassportForm(): PassportFormFields {
  return {
    passportNo: "",
    surname: "",
    givenNames: "",
    fullName: "",
    nationality: "",
    gender: "",
    dateOfBirth: "",
    dateOfIssue: "",
    dateOfExpiry: "",
    passportType: "",
    issuingCountry: "",
    mrzLine1: "",
    mrzLine2: "",
  };
}

export function formFromOcrScan(scan: OcrScanResult): PassportFormFields {
  const f = (scan.fields || {}) as Record<string, string | null | undefined>;
  return {
    passportNo: f.passportNo || "",
    surname: f.surname || "",
    givenNames: f.givenNames || "",
    fullName: f.fullName || "",
    nationality: f.nationality || "",
    gender: f.gender || f.sex || "",
    dateOfBirth: f.dateOfBirth || "",
    dateOfIssue: f.dateOfIssue || "",
    dateOfExpiry: f.dateOfExpiry || "",
    passportType: f.passportType || "",
    issuingCountry: f.issuingCountry || "",
    mrzLine1: f.mrzLine1 || "",
    mrzLine2: f.mrzLine2 || "",
  };
}

function confColor(c: number, low: boolean) {
  if (low || c < 90) return "border-amber-400 bg-amber-50";
  if (c >= 95) return "border-emerald-300 bg-emerald-50/40";
  return "border-[var(--border)] bg-white";
}

/**
 * Review panel: per-field confidence, <90% highlight, one-click accept MRZ / clear / edit.
 */
export function PassportOcrReview({
  scan,
  form,
  onChange,
  message,
}: {
  scan: OcrScanResult | null;
  form: PassportFormFields;
  onChange: (next: PassportFormFields) => void;
  message?: string;
}) {
  const [editing, setEditing] = useState<EditableKey | null>(null);

  const fieldResults: OcrFieldResult[] = useMemo(() => {
    const raw = scan?.fields?.fieldResults;
    return Array.isArray(raw) ? (raw as OcrFieldResult[]) : [];
  }, [scan]);

  const report = scan?.report || (scan?.fields?.report as OcrScanResult["report"]) || undefined;

  function setKey(key: EditableKey, value: string) {
    onChange({ ...form, [key]: value });
  }

  function acceptMrz(fr: OcrFieldResult) {
    if (fr.key in form && fr.mrzValue) {
      setKey(fr.key as EditableKey, fr.mrzValue);
    }
  }

  return (
    <div className="space-y-3">
      {message && <p className="text-[11px] text-[var(--muted-foreground)]">{message}</p>}

      {report && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat
            label="Extraction"
            value={`${Math.round((report.extractionRate || 0) * 100)}%`}
          />
          <MiniStat label="Avg confidence" value={`${Math.round(report.averageConfidence || 0)}%`} />
          <MiniStat label="MRZ" value={report.mrzValid ? "Valid" : "Weak / missing"} warn={!report.mrzValid} />
          <MiniStat
            label="Time"
            value={report.processingMs != null ? `${report.processingMs} ms` : "—"}
          />
        </div>
      )}

      {!!report?.mismatches?.length && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          OCR vs MRZ mismatch on: <strong>{report.mismatches.join(", ")}</strong> — validated MRZ values were
          preferred. Review highlighted fields.
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EDITABLE_KEYS.map((key) => {
          const fr = fieldResults.find((r) => r.key === key);
          const conf = fr?.confidence ?? (form[key] ? 80 : 0);
          const low = fr?.lowConfidence ?? conf < 90;
          const isEdit = editing === key;
          return (
            <div key={key} className={`rounded-xl border p-2.5 ${confColor(conf, low)}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className={labelCls}>{fr?.label || key}</label>
                <span className={`text-[10px] font-bold ${low ? "text-amber-700" : "text-emerald-700"}`}>
                  {conf ? `${conf}%` : "—"}
                  {fr?.mismatch ? " · mismatch" : ""}
                  {fr?.source ? ` · ${fr.source}` : ""}
                </span>
              </div>
              {isEdit || !fr ? (
                <input
                  className={inputCls}
                  value={form[key]}
                  onChange={(e) => setKey(key, e.target.value)}
                  onBlur={() => setEditing(null)}
                  autoFocus={isEdit}
                  type={key.startsWith("date") ? "date" : "text"}
                />
              ) : (
                <button
                  type="button"
                  className="w-full rounded-lg border border-transparent bg-white/80 px-2 py-2 text-left font-mono text-[12px] font-semibold text-[var(--primary)] hover:border-[var(--border)]"
                  onClick={() => setEditing(key)}
                  title="Click to edit"
                >
                  {form[key] || <span className="font-sans font-normal text-[var(--muted-foreground)]">— empty —</span>}
                </button>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1">
                <button
                  type="button"
                  className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-semibold"
                  onClick={() => setEditing(key)}
                >
                  Edit
                </button>
                {fr?.mrzValue && fr.mismatch && (
                  <button
                    type="button"
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800"
                    onClick={() => acceptMrz(fr)}
                  >
                    Use MRZ
                  </button>
                )}
                {fr?.vizValue && (
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-semibold"
                    onClick={() => setKey(key, fr.vizValue || "")}
                  >
                    Use OCR
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${warn ? "border-amber-300 bg-amber-50" : "border-[var(--border)] bg-white"}`}>
      <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-0.5 text-[12px] font-bold text-[var(--primary)]">{value}</div>
    </div>
  );
}
