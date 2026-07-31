/** Phase D2 — Sales Automation helpers */

export const PRICE_BOOK_KINDS = ["standard", "customer", "corporate", "agent", "promo"] as const;
export const SALES_TASK_TYPES = ["follow_up", "reminder", "call", "meeting", "escalate"] as const;
export const QUOTE_WORKFLOW = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "sent",
  "accepted",
  "converted",
  "expired",
] as const;

export function validateSalesQuote(input: {
  serviceType?: string;
  lines?: { description: string; unitPriceBdt: string; quantity?: string }[];
}): string | null {
  if (!input.serviceType?.trim()) return "Service type is required";
  if (!input.lines?.length) return "Add at least one line";
  for (const l of input.lines) {
    if (!l.description.trim()) return "Line description required";
    const unit = Number(l.unitPriceBdt);
    if (!Number.isFinite(unit) || unit < 0) return "Invalid unit price";
    if (l.quantity != null && l.quantity !== "") {
      const q = Number(l.quantity);
      if (!Number.isFinite(q) || q < 1) return "Invalid quantity";
    }
  }
  return null;
}

export function validatePriceBook(input: { name?: string; kind?: string }): string | null {
  if (!input.name?.trim()) return "Price book name is required";
  if (input.kind && !(PRICE_BOOK_KINDS as readonly string[]).includes(input.kind)) {
    return "Invalid price book kind";
  }
  return null;
}

export function calcLineAmountPoisha(qty: number, unitPoisha: number, discountPoisha = 0): number {
  return Math.max(0, Math.max(1, qty) * Math.max(0, unitPoisha) - Math.max(0, discountPoisha));
}

export function isQuoteEditable(status: string): boolean {
  return status === "draft" || status === "rejected";
}

export function canSubmitQuote(status: string): boolean {
  return status === "draft" || status === "rejected";
}

export function canApproveQuote(status: string): boolean {
  return status === "pending_approval";
}

export function canConvertQuote(status: string): boolean {
  return status === "approved" || status === "accepted";
}
