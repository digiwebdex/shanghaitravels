/** Phase C2 — AR/AP helpers (poisha, validation). */

export const AR_TYPES = ["invoice", "receipt", "advance", "credit_note", "debit_note", "refund"] as const;
export const AP_TYPES = ["bill", "payment", "advance", "credit_note", "debit_note"] as const;

export function toPoishaAmount(bdt: string): number {
  const n = Number(bdt.trim());
  if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid amount");
  return Math.round(n * 100);
}

export function validateDocLines(lines: { description: string; amountBdt: string }[]): string | null {
  const active = lines.filter((l) => l.description.trim() || l.amountBdt.trim());
  if (active.length < 1) return "Enter at least one line";
  for (let i = 0; i < active.length; i++) {
    if (!active[i].description.trim()) return `Line ${i + 1}: description required`;
    try {
      toPoishaAmount(active[i].amountBdt);
    } catch {
      return `Line ${i + 1}: invalid amount`;
    }
  }
  return null;
}

export function docLinesPayload(lines: { description: string; amountBdt: string }[]) {
  return lines
    .filter((l) => l.description.trim() && l.amountBdt.trim())
    .map((l) => {
      const amountPoisha = toPoishaAmount(l.amountBdt);
      return {
        description: l.description.trim(),
        quantity: 1,
        unitPricePoisha: amountPoisha,
        amountPoisha,
      };
    });
}
