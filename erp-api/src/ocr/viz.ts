/**
 * Visual Zone (VIZ) heuristics — extract passport fields from OCR text labels.
 * Used to cross-check MRZ and to fill dateOfIssue (not present in TD3 MRZ).
 */
export type VizFields = {
  passportNo?: string | null;
  surname?: string | null;
  givenNames?: string | null;
  fullName?: string | null;
  nationality?: string | null;
  gender?: string | null;
  sex?: string | null;
  dateOfBirth?: string | null;
  dateOfIssue?: string | null;
  dateOfExpiry?: string | null;
  passportType?: string | null;
  issuingCountry?: string | null;
  placeOfBirth?: string | null;
};

function normalizeDate(raw: string): string | null {
  const s = raw.trim().replace(/[./]/g, "-");
  // YYYY-MM-DD
  let m = s.match(/\b(19|20)\d{2}-(\d{2})-(\d{2})\b/);
  if (m) return `${m[0]}`;
  // DD-MM-YYYY / DD MM YYYY
  m = s.match(/\b(\d{2})[-\s](\d{2})[-\s]((?:19|20)\d{2})\b/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // DD MMM YYYY
  m = s.match(
    /\b(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+((?:19|20)\d{2})\b/i,
  );
  if (m) {
    const months: Record<string, string> = {
      JAN: "01",
      FEB: "02",
      MAR: "03",
      APR: "04",
      MAY: "05",
      JUN: "06",
      JUL: "07",
      AUG: "08",
      SEP: "09",
      OCT: "10",
      NOV: "11",
      DEC: "12",
    };
    const mm = months[m[2].slice(0, 3).toUpperCase()];
    const dd = m[1].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  return null;
}

function afterLabel(text: string, labels: RegExp[]): string | null {
  for (const re of labels) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim().split(/\n/)[0].trim();
  }
  return null;
}

const COUNTRY_HINTS: [RegExp, string][] = [
  [/BANGLADESH|PEOPLE.?S REPUBLIC OF BANGLADESH|\bBGD\b/i, "BGD"],
  [/REPUBLIC OF INDIA|\bINDIA\b|\bIND\b/i, "IND"],
  [/UNITED KINGDOM|GREAT BRITAIN|\bGBR\b|\bUK\b/i, "GBR"],
  [/UNITED STATES|USA|U\.S\.A/i, "USA"],
  [/CANADA|\bCAN\b/i, "CAN"],
  [/UNITED ARAB EMIRATES|\bUAE\b|\bARE\b/i, "ARE"],
  [/SAUDI ARABIA|\bSAU\b/i, "SAU"],
  [/MALAYSIA|\bMYS\b/i, "MYS"],
  [/SINGAPORE|\bSGP\b/i, "SGP"],
];

export function parseViz(rawText: string): VizFields {
  if (!rawText?.trim()) return {};
  const text = rawText.replace(/\r/g, "");
  const upper = text.toUpperCase();

  const passportNo = afterLabel(upper, [
    /PASSPORT\s*(?:NO|NUMBER|N[O°]|#)\s*[:.]?\s*([A-Z0-9]{6,12})/,
    /DOCUMENT\s*(?:NO|NUMBER)\s*[:.]?\s*([A-Z0-9]{6,12})/,
  ]);

  const surname = afterLabel(text, [
    /(?:SURNAME|FAMILY\s*NAME|NOM)\s*[:.]?\s*([A-Za-z][A-Za-z' -]{1,40})/i,
  ]);
  const givenNames = afterLabel(text, [
    /(?:GIVEN\s*NAMES?|FIRST\s*NAMES?|FORENAMES?|PRENOM)\s*[:.]?\s*([A-Za-z][A-Za-z' -]{1,60})/i,
  ]);

  let nationality = afterLabel(upper, [
    /NATIONALITY\s*[:.]?\s*([A-Z][A-Z -]{1,30})/,
  ]);
  let issuingCountry: string | null = null;
  for (const [re, code] of COUNTRY_HINTS) {
    if (re.test(upper)) {
      issuingCountry = code;
      if (!nationality) nationality = code;
      break;
    }
  }

  const sexRaw = afterLabel(upper, [
    /(?:SEX|GENDER)\s*[:.]?\s*([MF]|MALE|FEMALE)/,
  ]);
  let sex: string | null = null;
  if (sexRaw) {
    if (sexRaw.startsWith("M")) sex = "M";
    else if (sexRaw.startsWith("F")) sex = "F";
  }

  const dobRaw = afterLabel(upper, [
    /(?:DATE\s*OF\s*BIRTH|BIRTH\s*DATE|DOB|NÉ\(E\)\s*LE)\s*[:.]?\s*([0-9A-Z/\-. ]{6,20})/,
  ]);
  const issueRaw = afterLabel(upper, [
    /(?:DATE\s*OF\s*ISSUE|DATE\s*OF\s*ISSUANCE|ISSUED|ISSUE\s*DATE)\s*[:.]?\s*([0-9A-Z/\-. ]{6,20})/,
  ]);
  const expRaw = afterLabel(upper, [
    /(?:DATE\s*OF\s*EXPIR(?:Y|ATION)|EXPIR(?:Y|ES)|VALID\s*UNTIL)\s*[:.]?\s*([0-9A-Z/\-. ]{6,20})/,
  ]);
  const pob = afterLabel(text, [
    /(?:PLACE\s*OF\s*BIRTH|BIRTH\s*PLACE)\s*[:.]?\s*([A-Za-z][A-Za-z ,-]{1,40})/i,
  ]);

  const passportType = afterLabel(upper, [
    /(?:TYPE|PASSPORT\s*TYPE)\s*[:.]?\s*(P|PM|PD|[A-Z])\b/,
  ]);

  const fullName =
    surname || givenNames
      ? [givenNames, surname].filter(Boolean).join(" ")
      : afterLabel(text, [/NAME\s*[:.]?\s*([A-Za-z][A-Za-z' -]{3,60})/i]);

  return {
    passportNo: passportNo || null,
    surname: surname?.toUpperCase() || null,
    givenNames: givenNames?.toUpperCase() || null,
    fullName: fullName?.toUpperCase() || null,
    nationality: nationality || null,
    gender: sex,
    sex,
    dateOfBirth: dobRaw ? normalizeDate(dobRaw) : null,
    dateOfIssue: issueRaw ? normalizeDate(issueRaw) : null,
    dateOfExpiry: expRaw ? normalizeDate(expRaw) : null,
    passportType: passportType || null,
    issuingCountry,
    placeOfBirth: pob || null,
  };
}
