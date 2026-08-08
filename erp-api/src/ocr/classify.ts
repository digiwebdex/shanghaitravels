/**
 * Document classification from OCR text (no ML model — keyword + MRZ heuristics).
 */
export type DocClass =
  | "passport"
  | "national_id"
  | "visa"
  | "air_ticket"
  | "driving_license"
  | "birth_certificate"
  | "trade_license"
  | "bank_statement"
  | "other";

export function classifyDocument(rawText: string, hinted?: string): { docType: DocClass; confidence: number } {
  const t = (rawText || "").toUpperCase();
  if (!t.trim()) return { docType: (hinted as DocClass) || "other", confidence: 0 };

  const scores: Record<DocClass, number> = {
    passport: 0,
    national_id: 0,
    visa: 0,
    air_ticket: 0,
    driving_license: 0,
    birth_certificate: 0,
    trade_license: 0,
    bank_statement: 0,
    other: 0,
  };

  if (/P[A-Z<][A-Z]{3}[A-Z<]+<<|\bMRZ\b|PASSPORT|PASSEPORT|PASAPORTE/.test(t)) scores.passport += 5;
  if (/\bBGD\b/.test(t) && /PASSPORT/.test(t)) scores.passport += 2;

  if (/NATIONAL\s*ID|NID\s*NO|SMART\s*NID|জাতীয়\s*পরিচয়|NATIONAL IDENTITY/.test(t)) scores.national_id += 5;
  if (/FATHER|MOTHER|পিতা|মাতা/.test(t) && /NID|IDENTITY/.test(t)) scores.national_id += 2;

  if (/\bVISA\b|ENTRY\s*PERMIT|CVASC|VFS|SCHENGEN\s*VISA/.test(t)) scores.visa += 5;
  if (/NUMBER OF ENTRIES|VALID FOR|DURATION OF STAY/.test(t)) scores.visa += 2;

  if (/E[-\s]?TICKET|ELECTRONIC\s*TICKET|\bPNR\b|BOOKING\s*REF|BOARDING\s*PASS|FLIGHT/.test(t)) scores.air_ticket += 5;
  if (/DEPARTURE|ARRIVAL|AIRLINE|PASSENGER\s*NAME/.test(t) && /FLIGHT|PNR|TICKET/.test(t)) scores.air_ticket += 2;

  if (/DRIVING\s*LICEN[CS]E|DRIVER.?S\s*LICEN[CS]E|DL\s*NO/.test(t)) scores.driving_license += 5;

  if (/BIRTH\s*CERTIFICATE|REGISTRATION\s*OF\s*BIRTH|জন্ম\s*নিবন্ধন/.test(t)) scores.birth_certificate += 5;

  if (/TRADE\s*LICEN[CS]E|বাণিজ্যিক\s*লাইসেন্স|CITY\s*CORPORATION/.test(t)) scores.trade_license += 5;

  if (/BANK\s*STATEMENT|ACCOUNT\s*STATEMENT|OPENING\s*BALANCE|CLOSING\s*BALANCE|TRANSACTION/.test(t))
    scores.bank_statement += 5;

  let best: DocClass = "other";
  let bestScore = 0;
  for (const [k, v] of Object.entries(scores) as [DocClass, number][]) {
    if (v > bestScore) {
      bestScore = v;
      best = k;
    }
  }

  if (hinted && hinted !== "other" && hinted !== "auto") {
    const h = hinted as DocClass;
    if (scores[h] >= bestScore - 1) {
      return { docType: h, confidence: Math.min(0.99, 0.7 + scores[h] * 0.05) };
    }
  }

  if (bestScore === 0) return { docType: (hinted as DocClass) || "other", confidence: 0.35 };
  return { docType: best, confidence: Math.min(0.98, 0.55 + bestScore * 0.08) };
}
