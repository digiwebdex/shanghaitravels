/** Shared Document Intelligence types & helpers (frontend). */

export type DocIntelType =
  | "passport"
  | "national_id"
  | "visa"
  | "air_ticket"
  | "driving_license"
  | "birth_certificate"
  | "trade_license"
  | "bank_statement"
  | "other"
  | "auto";

export const DOC_INTEL_OPTIONS: { value: DocIntelType; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
  { value: "visa", label: "Visa" },
  { value: "air_ticket", label: "Ticket" },
  { value: "driving_license", label: "Driving License" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "trade_license", label: "Trade License" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "other", label: "Other" },
];

export type FieldResult = {
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
  status?: string;
  docType?: string;
  confidence?: number | null;
  fields?: Record<string, unknown> | null;
  report?: {
    extractionRate?: number;
    averageConfidence?: number;
    failedFields?: string[];
    mismatches?: string[];
    mrzValid?: boolean;
    processingMs?: number;
    docType?: string;
    classificationConfidence?: number;
  };
};

export function confidenceTone(c: number): "green" | "blue" | "amber" | "red" | "muted" {
  if (!c) return "muted";
  if (c >= 95) return "green";
  if (c >= 90) return "blue";
  if (c >= 80) return "amber";
  return "red";
}

export function confidenceClass(c: number): string {
  const t = confidenceTone(c);
  if (t === "green") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (t === "blue") return "border-sky-300 bg-sky-50 text-sky-800";
  if (t === "amber") return "border-amber-300 bg-amber-50 text-amber-900";
  if (t === "red") return "border-rose-300 bg-rose-50 text-rose-900";
  return "border-[var(--border)] bg-white text-[var(--muted-foreground)]";
}

export function docTypeToUploadCategory(docType: string): string {
  const map: Record<string, string> = {
    passport: "passport",
    national_id: "other",
    visa: "invitation_letter",
    air_ticket: "return_ticket",
    driving_license: "other",
    birth_certificate: "other",
    trade_license: "other",
    bank_statement: "bank_statement",
    other: "other",
  };
  return map[docType] || "other";
}

export function fieldsToFormMap(scan: OcrScanResult | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!scan?.fields) return out;
  const fr = scan.fields.fieldResults;
  if (Array.isArray(fr)) {
    for (const f of fr as FieldResult[]) {
      if (f.key && f.key !== "docType") out[f.key] = f.value || "";
    }
  }
  for (const [k, v] of Object.entries(scan.fields)) {
    if (typeof v === "string" && !(k in out) && !["validation", "mrzParsed", "viz", "preprocess", "report", "classification", "fieldResults", "mismatches"].includes(k)) {
      out[k] = v;
    }
  }
  return out;
}
