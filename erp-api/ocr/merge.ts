/**
 * Merge VIZ OCR + validated MRZ into final passport fields with per-field confidence.
 * Rule: when MRZ check digits pass for a field, prefer MRZ and flag VIZ mismatch.
 */
import { MrzResult, COUNTRY_NAMES } from "./mrz";
import { VizFields } from "./viz";

export type FieldSource = "mrz" | "viz" | "merged" | "none";

export type FieldResult = {
  key: string;
  label: string;
  value: string | null;
  confidence: number; // 0..100
  source: FieldSource;
  mrzValue?: string | null;
  vizValue?: string | null;
  mismatch: boolean;
  checkDigitOk?: boolean;
  lowConfidence: boolean; // < 90
};

export type MergeReport = {
  fields: FieldResult[];
  fieldMap: Record<string, string | null>;
  averageConfidence: number;
  extractionRate: number;
  failedFields: string[];
  mismatches: string[];
  mrzValid: boolean;
  processingMs?: number;
};

const LABELS: Record<string, string> = {
  passportNo: "Passport Number",
  surname: "Surname",
  givenNames: "Given Name",
  fullName: "Full Name",
  nationality: "Nationality",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  dateOfIssue: "Date of Issue",
  dateOfExpiry: "Date of Expiry",
  passportType: "Passport Type",
  issuingCountry: "Issuing Country",
  mrzLine1: "MRZ Line 1",
  mrzLine2: "MRZ Line 2",
};

function norm(v: string | null | undefined): string {
  return (v || "").toString().trim().toUpperCase().replace(/\s+/g, " ");
}

function eq(a?: string | null, b?: string | null): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return true;
  return x === y;
}

function countryDisplay(code?: string | null): string | null {
  if (!code) return null;
  const c = code.toUpperCase();
  return COUNTRY_NAMES[c] || c;
}

type WordConf = { text: string; confidence: number };

/** Best Vision word confidence overlapping the value (0..1). */
export function wordConfidenceFor(value: string | null | undefined, words: WordConf[]): number | null {
  if (!value || !words.length) return null;
  const tokens = norm(value).split(/[\s<]+/).filter((t) => t.length >= 2);
  if (!tokens.length) return null;
  let sum = 0;
  let n = 0;
  for (const t of tokens) {
    const hit = words.find((w) => norm(w.text).includes(t) || t.includes(norm(w.text)));
    if (hit) {
      sum += hit.confidence;
      n++;
    }
  }
  return n ? sum / n : null;
}

function pushField(
  out: FieldResult[],
  key: string,
  value: string | null,
  confidence: number,
  source: FieldSource,
  extra?: Partial<FieldResult>,
) {
  const conf = Math.max(0, Math.min(100, Math.round(confidence)));
  out.push({
    key,
    label: LABELS[key] || key,
    value,
    confidence: conf,
    source,
    mismatch: false,
    lowConfidence: conf < 90,
    ...extra,
  });
}

/**
 * Build final fields: prefer validated MRZ over VIZ; dateOfIssue from VIZ only.
 */
export function mergePassportFields(
  mrz: MrzResult,
  viz: VizFields,
  words: WordConf[] = [],
): MergeReport {
  const fields: FieldResult[] = [];
  const mismatches: string[] = [];

  const prefer = (
    key: string,
    mrzVal: string | null | undefined,
    vizVal: string | null | undefined,
    checkOk?: boolean,
  ) => {
    const wv = wordConfidenceFor(vizVal || mrzVal, words);
    const vizConf = wv != null ? wv * 100 : 55;
    let value: string | null = null;
    let source: FieldSource = "none";
    let confidence = 0;
    let mismatch = false;

    if (mrz.ok && mrzVal) {
      value = mrzVal;
      source = "mrz";
      // MRZ with passing check digit → high confidence
      if (checkOk === true) confidence = 98;
      else if (checkOk === false) confidence = 72;
      else confidence = 90 + (mrz.checkScore || 0) * 8;

      if (vizVal && !eq(mrzVal, vizVal)) {
        mismatch = true;
        mismatches.push(key);
        confidence = Math.min(confidence, 92);
      }
      if (wv != null && eq(mrzVal, vizVal)) {
        confidence = Math.max(confidence, Math.min(99, wv * 100));
      }
    } else if (vizVal) {
      value = vizVal;
      source = "viz";
      confidence = vizConf;
    }

    pushField(fields, key, value, confidence, source, {
      mrzValue: mrzVal || null,
      vizValue: vizVal || null,
      mismatch,
      checkDigitOk: checkOk,
    });
  };

  prefer("passportNo", mrz.passportNo, viz.passportNo, mrz.checks?.passportNo);
  prefer("surname", mrz.surname, viz.surname);
  prefer("givenNames", mrz.givenNames, viz.givenNames);

  const fullMrz = mrz.fullName || [mrz.givenNames, mrz.surname].filter(Boolean).join(" ") || null;
  const fullViz = viz.fullName || [viz.givenNames, viz.surname].filter(Boolean).join(" ") || null;
  prefer("fullName", fullMrz, fullViz);

  prefer("nationality", mrz.nationality, viz.nationality);
  prefer("gender", mrz.gender || mrz.sex, viz.gender || viz.sex);

  prefer("dateOfBirth", mrz.dateOfBirth, viz.dateOfBirth, mrz.checks?.dateOfBirth);
  prefer("dateOfExpiry", mrz.dateOfExpiry, viz.dateOfExpiry, mrz.checks?.dateOfExpiry);

  // Issue date + place of birth: VIZ only
  {
    const v = viz.dateOfIssue || null;
    const wv = wordConfidenceFor(v, words);
    pushField(fields, "dateOfIssue", v, v ? (wv != null ? wv * 100 : 62) : 0, v ? "viz" : "none", {
      vizValue: v,
      mrzValue: null,
    });
  }
  {
    const v = viz.placeOfBirth || null;
    const wv = wordConfidenceFor(v, words);
    pushField(fields, "placeOfBirth", v, v ? (wv != null ? wv * 100 : 70) : 0, v ? "viz" : "none", {
      vizValue: v,
      mrzValue: null,
    });
  }

  prefer("passportType", mrz.passportType || "P", viz.passportType);
  prefer(
    "issuingCountry",
    countryDisplay(mrz.issuingCountry) || mrz.issuingCountry,
    countryDisplay(viz.issuingCountry) || viz.issuingCountry,
  );

  // MRZ lines
  pushField(fields, "mrzLine1", mrz.mrzLine1 || null, mrz.mrzLine1 ? 95 : 0, mrz.mrzLine1 ? "mrz" : "none");
  pushField(fields, "mrzLine2", mrz.mrzLine2 || null, mrz.mrzLine2 ? 95 : 0, mrz.mrzLine2 ? "mrz" : "none");

  const extracted = fields.filter((f) => f.value);
  const averageConfidence = extracted.length
    ? extracted.reduce((a, f) => a + f.confidence, 0) / extracted.length
    : 0;
  const required = [
    "passportNo",
    "surname",
    "givenNames",
    "nationality",
    "gender",
    "dateOfBirth",
    "dateOfExpiry",
    "issuingCountry",
    "mrzLine1",
    "mrzLine2",
  ];
  const failedFields = required.filter((k) => !fields.find((f) => f.key === k)?.value);
  const extractionRate = (required.length - failedFields.length) / required.length;

  const fieldMap: Record<string, string | null> = {};
  for (const f of fields) fieldMap[f.key] = f.value;
  // aliases for existing clients
  fieldMap.sex = fieldMap.gender;
  fieldMap.docType = "passport";

  return {
    fields,
    fieldMap,
    averageConfidence: Math.round(averageConfidence * 10) / 10,
    extractionRate: Math.round(extractionRate * 1000) / 1000,
    failedFields,
    mismatches,
    mrzValid: !!mrz.ok,
  };
}
