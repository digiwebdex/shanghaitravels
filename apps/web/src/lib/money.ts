/** Money helpers — Nest stores integer minor units (poisha). ৳1 = 100. */

export function toPoisha(taka: number | string): number {
  const n = typeof taka === "string" ? parseFloat(taka) : taka;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromPoisha(poisha: number | null | undefined): number {
  return (Number(poisha) || 0) / 100;
}

export function fmtBDT(poisha: number | null | undefined): string {
  return fromPoisha(poisha).toLocaleString("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  });
}

export function fmtBDTPlain(poisha: number | null | undefined): string {
  return `৳${fromPoisha(poisha).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
