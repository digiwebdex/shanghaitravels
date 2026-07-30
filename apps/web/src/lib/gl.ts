/** Phase C1 — GL helpers (double-entry, poisha, no hard-coded account IDs). */

export const GL_TYPES = ["asset", "liability", "equity", "income", "expense"] as const;
export const JOURNAL_TYPES = ["standard", "opening", "closing", "adjustment"] as const;
export const JOURNAL_STATUSES = ["draft", "pending_approval", "posted", "rejected", "void"] as const;

export type JournalLineForm = {
  glAccountId: string;
  costCenterId: string;
  debitBdt: string;
  creditBdt: string;
  memo: string;
};

export function emptyLine(): JournalLineForm {
  return { glAccountId: "", costCenterId: "", debitBdt: "", creditBdt: "", memo: "" };
}

export function toPoisha(bdt: string): number {
  const t = bdt.trim();
  if (!t) return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) throw new Error("Invalid amount");
  return Math.round(n * 100);
}

export function fromPoisha(poisha?: number | null): string {
  if (poisha == null) return "";
  return (poisha / 100).toFixed(2);
}

export function formatBdt(poisha?: number | null): string {
  if (poisha == null) return "—";
  return `৳${(poisha / 100).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function validateJournalLines(lines: JournalLineForm[]): string | null {
  const active = lines.filter((l) => l.glAccountId || l.debitBdt || l.creditBdt);
  if (active.length < 2) return "Enter at least two journal lines";
  let td = 0;
  let tc = 0;
  for (let i = 0; i < active.length; i++) {
    const l = active[i];
    if (!l.glAccountId) return `Line ${i + 1}: select an account`;
    let d = 0;
    let c = 0;
    try {
      d = l.debitBdt.trim() ? toPoisha(l.debitBdt) : 0;
      c = l.creditBdt.trim() ? toPoisha(l.creditBdt) : 0;
    } catch {
      return `Line ${i + 1}: invalid amount`;
    }
    if ((d > 0 && c > 0) || (d === 0 && c === 0)) {
      return `Line ${i + 1}: enter either debit or credit`;
    }
    td += d;
    tc += c;
  }
  if (td !== tc) return `Unbalanced: debit ৳${(td / 100).toFixed(2)} ≠ credit ৳${(tc / 100).toFixed(2)}`;
  if (td === 0) return "Journal total cannot be zero";
  return null;
}

export function journalLinesPayload(lines: JournalLineForm[]) {
  return lines
    .filter((l) => l.glAccountId && (l.debitBdt.trim() || l.creditBdt.trim()))
    .map((l) => ({
      glAccountId: l.glAccountId,
      costCenterId: l.costCenterId || undefined,
      debitPoisha: l.debitBdt.trim() ? toPoisha(l.debitBdt) : 0,
      creditPoisha: l.creditBdt.trim() ? toPoisha(l.creditBdt) : 0,
      currencyCode: "BDT",
      memo: l.memo.trim() || undefined,
    }));
}
