/** Phase D3 — Communications helpers */

export const COMM_CHANNELS = ["call", "email", "whatsapp", "sms", "meeting", "note", "internal"] as const;
export const SEND_CHANNELS = ["email", "whatsapp", "sms"] as const;
export const PARTY_KINDS = ["prospect", "customer", "agent", "supplier", "corporate", "internal"] as const;
export const TEMPLATE_CATEGORIES = ["general", "booking", "quotation", "payment", "otp", "reminder"] as const;
export const RECURRENCE_RULES = ["none", "daily", "weekly", "monthly"] as const;

export function applyMergeFields(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => (vars[key] != null ? String(vars[key]) : ""));
}

export function validateCommLog(input: {
  relatedType?: string;
  relatedId?: string;
  summary?: string;
  channel?: string;
}): string | null {
  if (!input.relatedType?.trim()) return "Related type is required";
  if (!input.relatedId?.trim()) return "Related id is required";
  if (!input.summary?.trim()) return "Summary is required";
  if (input.channel && !(COMM_CHANNELS as readonly string[]).includes(input.channel)) return "Invalid channel";
  return null;
}

export function validateSend(input: {
  channel?: string;
  to?: string;
  body?: string;
  templateCode?: string;
}): string | null {
  if (!input.channel || !(SEND_CHANNELS as readonly string[]).includes(input.channel)) {
    return "Channel must be email, whatsapp, or sms";
  }
  if (!input.to?.trim()) return "Recipient is required";
  if (input.channel === "email" && !input.to.includes("@")) return "Valid email required";
  if (!input.body?.trim() && !input.templateCode?.trim()) return "Body or template required";
  return null;
}

export function validateTemplate(input: { code?: string; name?: string; body?: string; channel?: string }): string | null {
  if (!input.code?.trim()) return "Template code is required";
  if (!input.name?.trim()) return "Template name is required";
  if (!input.body?.trim()) return "Template body is required";
  if (input.channel && !(SEND_CHANNELS as readonly string[]).includes(input.channel)) return "Invalid channel";
  return null;
}
