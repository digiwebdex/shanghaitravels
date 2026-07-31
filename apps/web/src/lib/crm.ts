/** Phase D1 — CRM helpers */

export const LEAD_SOURCES = ["web", "walkin", "phone", "whatsapp", "facebook", "referral"] as const;
export const CONTACT_KINDS = ["individual", "family", "corporate"] as const;
export const ORG_TYPES = ["corporate", "travel_agent", "partner_agency"] as const;
export const OPP_STAGES = [
  "qualification",
  "needs_analysis",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "converted",
] as const;
export const ACTIVITY_TYPES = ["call", "meeting", "email", "whatsapp", "task", "follow_up"] as const;
export const QUOTE_SERVICES = ["visa", "air_ticket", "hotel", "tour", "hajj", "umrah"] as const;

export function toPoisha(bdt: string): number {
  const n = Number(String(bdt).trim());
  if (!Number.isFinite(n) || n < 0) throw new Error("Invalid amount");
  return Math.round(n * 100);
}

export function formatBdt(poisha?: number | null): string {
  if (poisha == null) return "—";
  return `৳${(poisha / 100).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function validateLead(input: { name?: string; source?: string }): string | null {
  if (!input.name?.trim()) return "Lead name is required";
  if (input.source && !(LEAD_SOURCES as readonly string[]).includes(input.source)) return "Invalid lead source";
  return null;
}

export function validateQuoteLines(lines: { description: string; amountBdt: string }[]): string | null {
  if (!lines.length) return "Add at least one line";
  for (const l of lines) {
    if (!l.description.trim()) return "Line description required";
    try {
      toPoisha(l.amountBdt || "0");
    } catch {
      return "Invalid line amount";
    }
  }
  return null;
}

export function probabilityLabel(bps?: number | null): string {
  if (bps == null) return "—";
  return `${(bps / 100).toFixed(0)}%`;
}
