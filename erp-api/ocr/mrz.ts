/**
 * ICAO 9303 TD3 passport MRZ parser + check digits.
 * Supports common OCR confusion repair for BD / IN / GB / US / CA / AE / SA / MY / SG.
 */
export type MrzChecks = {
  passportNo: boolean;
  dateOfBirth: boolean;
  dateOfExpiry: boolean;
  optionalData: boolean;
  composite: boolean;
};

export interface MrzResult {
  ok: boolean;
  docType?: string;
  passportType?: string;
  issuingCountry?: string;
  surname?: string;
  givenNames?: string;
  fullName?: string;
  passportNo?: string;
  nationality?: string;
  dateOfBirth?: string | null;
  sex?: string;
  gender?: string;
  dateOfExpiry?: string | null;
  mrzLine1?: string;
  mrzLine2?: string;
  optionalData?: string;
  checks: MrzChecks;
  /** Fraction of primary checks that pass (0..1). */
  checkScore: number;
}

const VAL = (c: string): number => {
  if (c === "<") return 0;
  if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
  if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 55;
  return 0;
};

export const icaoCheckDigit = (s: string): number => {
  const w = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += VAL(s[i]) * w[i % 3];
  return sum % 10;
};

const toDate = (yymmdd: string, kind: "dob" | "expiry"): string | null => {
  if (!/^\d{6}$/.test(yymmdd)) return null;
  const yy = +yymmdd.slice(0, 2);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) return null;
  const nowYY = new Date().getUTCFullYear() % 100;
  let century: number;
  if (kind === "dob") century = yy > nowYY + 1 ? 1900 : 2000;
  else century = yy < 70 ? 2000 : 1900;
  return `${century + yy}-${mm}-${dd}`;
};

const cleanName = (s: string) => s.replace(/</g, " ").trim().replace(/\s+/g, " ");

/** OCR confusions — digit-only zones (DOB / expiry / checks). */
const DIGIT_ONLY_FIX: Record<string, string> = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  Z: "2",
  S: "5",
  B: "8",
  G: "6",
};
/** Safer fixes for alphanumeric passport numbers (never map B→8). */
const PASSPORT_NO_FIX: Record<string, string> = {
  O: "0",
  Q: "0",
  I: "1",
  L: "1",
};
const ALPHA_FIX: Record<string, string> = {
  "0": "O",
  "1": "I",
  "5": "S",
  "8": "B",
  "6": "G",
};

function fixDigitOnly(s: string): string {
  return s
    .split("")
    .map((c) => DIGIT_ONLY_FIX[c] || c)
    .join("");
}
function fixPassportNo(s: string): string {
  return s
    .split("")
    .map((c) => PASSPORT_NO_FIX[c] || c)
    .join("");
}
function fixAlpha(s: string): string {
  return s
    .split("")
    .map((c) => ALPHA_FIX[c] || c)
    .join("");
}

/** Try candidates until ICAO check digit matches. */
function repairChecked(raw: string, checkChar: string, mutators: ((s: string) => string)[]): { value: string; check: string; ok: boolean } {
  const checkCands = [checkChar, fixDigitOnly(checkChar)];
  for (const mut of mutators) {
    const value = mut(raw).padEnd(raw.length, "<").slice(0, raw.length);
    for (const ch of checkCands) {
      if (/^\d$/.test(ch) && icaoCheckDigit(value) === +ch) {
        return { value, check: ch, ok: true };
      }
    }
  }
  const fallback = mutators[0](raw);
  return { value: fallback, check: fixDigitOnly(checkChar), ok: false };
}

function normalizeLine(s: string): string {
  return s
    .toUpperCase()
    .replace(/[\u00AB\u00BB\u2039\u203A]/g, "<")
    .replace(/[^A-Z0-9<]/g, "")
    .padEnd(44, "<")
    .slice(0, 44);
}

/** Supported issuing / nationality alpha-3 codes we explicitly test. */
export const SUPPORTED_PASSPORT_COUNTRIES = [
  "BGD",
  "IND",
  "GBR",
  "USA",
  "CAN",
  "ARE",
  "SAU",
  "MYS",
  "SGP",
] as const;

export const COUNTRY_NAMES: Record<string, string> = {
  BGD: "Bangladesh",
  IND: "India",
  GBR: "United Kingdom",
  USA: "United States",
  CAN: "Canada",
  ARE: "United Arab Emirates",
  SAU: "Saudi Arabia",
  MYS: "Malaysia",
  SGP: "Singapore",
};

function emptyChecks(): MrzChecks {
  return {
    passportNo: false,
    dateOfBirth: false,
    dateOfExpiry: false,
    optionalData: false,
    composite: false,
  };
}

function scoreChecks(c: MrzChecks): number {
  const keys: (keyof MrzChecks)[] = ["passportNo", "dateOfBirth", "dateOfExpiry", "composite"];
  const pass = keys.filter((k) => c[k]).length;
  return pass / keys.length;
}

function parseTd3(l1raw: string, l2raw: string): MrzResult {
  let l1 = normalizeLine(l1raw);
  let l2 = normalizeLine(l2raw);

  // Line 1: P[type][issuing][names]
  if (l1[0] !== "P") {
    return { ok: false, checks: emptyChecks(), checkScore: 0 };
  }

  // Repair nationality / issuing (alpha)
  const issuingFixed = fixAlpha(l1.slice(2, 5));
  l1 = l1.slice(0, 2) + issuingFixed + l1.slice(5);

  // Repair digit-heavy zones on line 2 (passport no is alphanumeric — safer map)
  const pnRep = repairChecked(l2.slice(0, 9), l2[9] || "", [
    (s) => s,
    fixPassportNo,
    fixDigitOnly,
  ]);
  const pn = pnRep.value;
  const pnCheck = pnRep.check;
  const nat = fixAlpha(l2.slice(10, 13));
  const dobRep = repairChecked(l2.slice(13, 19), l2[19] || "", [(s) => fixDigitOnly(s), (s) => s]);
  const dob = dobRep.value;
  const dobCheck = dobRep.check;
  let sex = l2[20] || "<";
  if (sex !== "M" && sex !== "F" && sex !== "<") sex = "<";
  const expRep = repairChecked(l2.slice(21, 27), l2[27] || "", [(s) => fixDigitOnly(s), (s) => s]);
  const expiry = expRep.value;
  const expCheck = expRep.check;
  const optional = fixDigitOnly(l2.slice(28, 42));
  const optCheckChar = (() => {
    const c = l2[42] || "<";
    if (c === "<") return "<";
    return fixDigitOnly(c);
  })();
  const compositeChar = fixDigitOnly(l2[43] || "");

  l2 =
    pn +
    pnCheck +
    nat +
    dob +
    dobCheck +
    sex +
    expiry +
    expCheck +
    optional +
    optCheckChar +
    compositeChar;
  l2 = normalizeLine(l2);

  const names = l1.slice(5).split("<<");
  const surname = cleanName(names[0] || "");
  const givenNames = cleanName((names[1] || "").replace(/</g, " "));
  const passportNo = pn.replace(/</g, "");
  const nationality = nat.replace(/</g, "");
  const issuingCountry = l1.slice(2, 5).replace(/</g, "");
  const passportType = (l1[1] === "<" ? "P" : `P${l1[1]}`).replace(/</g, "");

  const checks: MrzChecks = {
    passportNo: pnRep.ok,
    dateOfBirth: dobRep.ok,
    dateOfExpiry: expRep.ok,
    optionalData:
      optCheckChar === "<" ||
      (/^\d$/.test(optCheckChar) && icaoCheckDigit(optional) === +optCheckChar),
    composite: false,
  };

  const compositePayload = pn + pnCheck + dob + dobCheck + expiry + expCheck + optional + optCheckChar;
  checks.composite = /^\d$/.test(compositeChar) && icaoCheckDigit(compositePayload) === +compositeChar;

  const gender = sex === "M" || sex === "F" ? sex : "X";
  const checkScore = scoreChecks(checks);
  const primaryOk = checks.passportNo && checks.dateOfBirth && checks.dateOfExpiry;

  return {
    ok: primaryOk || (checks.composite && passportNo.length >= 5),
    docType: "passport",
    passportType,
    issuingCountry,
    surname,
    givenNames,
    fullName: [givenNames, surname].filter(Boolean).join(" ") || undefined,
    passportNo,
    nationality,
    dateOfBirth: toDate(dob, "dob"),
    sex: gender,
    gender,
    dateOfExpiry: toDate(expiry, "expiry"),
    mrzLine1: l1,
    mrzLine2: l2,
    optionalData: optional.replace(/</g, "") || undefined,
    checks,
    checkScore,
  };
}

/** Build candidates from noisy OCR text (join broken lines, strip spaces). */
function extractTd3Pair(input: string): { l1: string; l2: string } | null {
  const upper = input.toUpperCase().replace(/\u003c/gi, "<");
  // Collapse spaces inside potential MRZ
  const lines = upper
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]/g, "").replace(/[^A-Z0-9<]/g, ""))
    .filter((l) => l.length >= 28);

  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].startsWith("P") && lines[i].length >= 36 && lines[i + 1].length >= 36) {
      return { l1: lines[i], l2: lines[i + 1] };
    }
  }

  // Single-blob: find P…… then next 44 chars
  const flat = upper.replace(/[^A-Z0-9<\n]/g, "");
  const m = flat.match(/P[A-Z<][A-Z0-9<]{34,}[\r\n]+[A-Z0-9<]{36,}/);
  if (m) {
    const parts = m[0].split(/[\r\n]+/);
    if (parts.length >= 2) return { l1: parts[0], l2: parts[1] };
  }

  // Try sliding window on flattened string without newlines
  const compact = flat.replace(/[\r\n]/g, "");
  for (let i = 0; i < compact.length - 88; i++) {
    if (compact[i] === "P") {
      const l1 = compact.slice(i, i + 44);
      const l2 = compact.slice(i + 44, i + 88);
      if (l1.length === 44 && l2.length === 44 && /[A-Z0-9<]{9}/.test(l2.slice(0, 9))) {
        return { l1, l2 };
      }
    }
  }
  return null;
}

/**
 * Parse TD3 MRZ from two lines or a raw OCR blob.
 */
export function parseMrz(input: string): MrzResult {
  const fail: MrzResult = { ok: false, checks: emptyChecks(), checkScore: 0 };
  if (!input?.trim()) return fail;

  // Direct two-line input
  const direct = input
    .toUpperCase()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (direct.length >= 2 && direct[0].replace(/\s/g, "").startsWith("P") && direct[0].replace(/\s/g, "").length >= 36) {
    const parsed = parseTd3(direct[0], direct[1]);
    if (parsed.ok || parsed.checkScore > 0) return parsed;
  }

  const pair = extractTd3Pair(input);
  if (!pair) return fail;
  return parseTd3(pair.l1, pair.l2);
}

/** Helper for tests: build a valid TD3 MRZ for a country. */
export function buildTd3Fixture(opts: {
  issuingCountry: string;
  nationality?: string;
  surname: string;
  givenNames: string;
  passportNo: string;
  dobYymmdd: string;
  expiryYymmdd: string;
  sex?: "M" | "F";
  optional?: string;
}): { line1: string; line2: string; text: string } {
  const type = "P<";
  const iss = opts.issuingCountry.padEnd(3, "<").slice(0, 3);
  const surname = opts.surname.toUpperCase().replace(/[^A-Z]/g, "");
  const given = opts.givenNames
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .trim()
    .replace(/\s+/g, "<");
  let line1 = `${type}${iss}${surname}<<${given}`.padEnd(44, "<").slice(0, 44);

  const pn = opts.passportNo.toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(9, "<").slice(0, 9);
  const pnC = String(icaoCheckDigit(pn));
  const nat = (opts.nationality || opts.issuingCountry).padEnd(3, "<").slice(0, 3);
  const dob = opts.dobYymmdd;
  const dobC = String(icaoCheckDigit(dob));
  const sex = opts.sex || "M";
  const exp = opts.expiryYymmdd;
  const expC = String(icaoCheckDigit(exp));
  const optional = (opts.optional || "").padEnd(14, "<").slice(0, 14);
  const optC =
    optional.replace(/</g, "").length === 0 ? "<" : String(icaoCheckDigit(optional));
  const payload = pn + pnC + dob + dobC + exp + expC + optional + optC;
  const comp = String(icaoCheckDigit(payload));
  const line2 = (pn + pnC + nat + dob + dobC + sex + exp + expC + optional + optC + comp).slice(0, 44);
  return { line1, line2, text: `${line1}\n${line2}` };
}
