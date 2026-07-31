/** Phase C4 — financial statement helpers (posted journals only). */

export const FS_REPORTS = ["balance-sheet", "profit-loss", "cash-flow", "equity", "trial-balance", "ledger"] as const;
export type FsReport = (typeof FS_REPORTS)[number];

export function qs(params: Record<string, string | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && String(v).trim() !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function statementBalanced(totals?: {
  assetsPoisha?: number;
  liabilitiesAndEquityPoisha?: number;
  balanced?: boolean;
}): boolean {
  if (!totals) return false;
  if (typeof totals.balanced === "boolean") return totals.balanced;
  if (totals.assetsPoisha == null || totals.liabilitiesAndEquityPoisha == null) return false;
  return totals.assetsPoisha === totals.liabilitiesAndEquityPoisha;
}

export function validateDateRange(from?: string, to?: string): string | null {
  if (!from || !to) return null;
  if (new Date(from) > new Date(to)) return "From date must be on or before To date";
  return null;
}

export function downloadBlob(filename: string, body: BlobPart, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
