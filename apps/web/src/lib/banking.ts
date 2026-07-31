/** Phase C3 — banking helpers */
export const MOVEMENT_TYPES = [
  "deposit",
  "withdrawal",
  "transfer",
  "bank_charge",
  "interest",
  "cash_receipt",
  "cash_payment",
] as const;

export const ACCOUNT_KINDS = ["cash", "bank", "petty_cash"] as const;

export function validateMovement(input: {
  type: string;
  amountBdt: string;
  fromBankAccountId?: string;
  toBankAccountId?: string;
}): string | null {
  const amt = Number(input.amountBdt);
  if (!Number.isFinite(amt) || amt <= 0) return "Enter a positive amount";
  if (input.type === "transfer") {
    if (!input.fromBankAccountId || !input.toBankAccountId) return "Transfer needs from and to accounts";
    if (input.fromBankAccountId === input.toBankAccountId) return "From and to must differ";
  }
  if (["deposit", "interest", "cash_receipt"].includes(input.type) && !input.toBankAccountId) {
    return "Select destination account";
  }
  if (["withdrawal", "bank_charge", "cash_payment"].includes(input.type) && !input.fromBankAccountId) {
    return "Select source account";
  }
  return null;
}

export function toPoishaBdt(bdt: string): number {
  return Math.round(Number(bdt) * 100);
}
