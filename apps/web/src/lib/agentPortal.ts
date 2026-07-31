/** Phase G1 — Agent portal helpers */

export const AGENT_SERVICE_TYPES = [
  "visa",
  "air_ticket",
  "hotel",
  "transport",
  "tour",
  "hajj",
  "umrah",
] as const;

export function validateAgentLogin(input: { email?: string; password?: string }): string | null {
  if (!input.email?.trim()) return "Email is required";
  if (!input.password) return "Password is required";
  return null;
}

export function validateAgentBooking(input: {
  serviceType?: string;
  customerName?: string;
  customerPhone?: string;
}): string | null {
  if (!input.serviceType || !(AGENT_SERVICE_TYPES as readonly string[]).includes(input.serviceType)) {
    return "Select a valid service type";
  }
  if (!input.customerName?.trim() || input.customerName.trim().length < 2) return "Customer name is required";
  if (!input.customerPhone?.trim() || input.customerPhone.trim().length < 6) return "Valid customer phone is required";
  return null;
}

export function validateAgentCustomer(input: { fullName?: string; phone?: string }): string | null {
  if (!input.fullName?.trim() || input.fullName.trim().length < 2) return "Full name is required";
  if (!input.phone?.trim() || input.phone.trim().length < 6) return "Phone is required";
  return null;
}

export function validateAgentSupport(input: { subject?: string; body?: string }): string | null {
  if (!input.subject?.trim() || input.subject.trim().length < 3) return "Subject is required";
  if (!input.body?.trim() || input.body.trim().length < 3) return "Message is required";
  return null;
}

export function formatPoisha(n?: number | null, currency = "BDT"): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n / 100).toLocaleString()} ${currency}`;
}
