/** Phase F1 — Customer portal helpers */

export const PORTAL_SERVICE_TYPES = [
  "visa",
  "air_ticket",
  "hotel",
  "transport",
  "tour",
  "hajj",
  "umrah",
] as const;

export function validatePortalRegister(input: {
  email?: string;
  password?: string;
  fullName?: string;
}): string | null {
  if (!input.fullName?.trim() || input.fullName.trim().length < 2) return "Full name is required";
  if (!input.email?.trim() || !input.email.includes("@")) return "Valid email is required";
  if (!input.password || input.password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export function validatePortalLogin(input: { email?: string; password?: string }): string | null {
  if (!input.email?.trim()) return "Email is required";
  if (!input.password) return "Password is required";
  return null;
}

export function validateSupportRequest(input: { subject?: string; body?: string }): string | null {
  if (!input.subject?.trim() || input.subject.trim().length < 3) return "Subject is required";
  if (!input.body?.trim() || input.body.trim().length < 3) return "Message is required";
  return null;
}

export function validateApplicationRequest(input: { serviceType?: string }): string | null {
  if (!input.serviceType || !(PORTAL_SERVICE_TYPES as readonly string[]).includes(input.serviceType)) {
    return "Select a valid service type";
  }
  return null;
}

export function formatPoisha(n?: number | null, currency = "BDT"): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n / 100).toLocaleString()} ${currency}`;
}
