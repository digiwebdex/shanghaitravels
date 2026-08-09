/**
 * V16 — canonical amount-to-words for printed commercial documents.
 *
 * Presentation only: it formats a value that has already been calculated
 * elsewhere. It never rounds, re-derives or alters any amount.
 *
 * Input is minor units (poisha), matching the rest of the finance layer.
 * Uses the South-Asian numbering system (crore / lakh / thousand) because the
 * company invoices in BDT.
 *
 * NOTE: BankingService has a private `amountInWords()` that returns digits
 * ("Taka 58,320 only") rather than words. It is intentionally left untouched —
 * changing printed cheque wording is a finance decision, not a UI one.
 */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

/** 0–99 → words. */
function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? ` ${ONES[o]}` : "");
}

/** 0–999 → words. */
function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (r) parts.push(twoDigits(r));
  return parts.join(" ");
}

/** Whole number → words using crore / lakh / thousand grouping. */
export function numberToWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  // Crore can exceed 999, so recurse for very large values.
  if (crore) parts.push(`${crore > 999 ? numberToWords(crore) : threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(" ");
}

/**
 * Minor units (poisha) → "Taka <words> and <words> Poisha only".
 * Poisha are shown only when non-zero, matching invoice conventions.
 */
export function amountInWords(minorUnits: number, currencyWord = "Taka"): string {
  const neg = (minorUnits ?? 0) < 0;
  const abs = Math.abs(Math.round(minorUnits ?? 0));
  const major = Math.floor(abs / 100);
  const minor = abs % 100;
  let out = `${currencyWord} ${numberToWords(major)}`;
  if (minor) out += ` and ${numberToWords(minor)} Poisha`;
  out += " only";
  return neg ? `Minus ${out}` : out;
}
