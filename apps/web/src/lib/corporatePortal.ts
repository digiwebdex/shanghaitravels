/** Phase H1 — Corporate portal helpers */

export const CORPORATE_SERVICE_TYPES = [
  "visa",
  "air_ticket",
  "hotel",
  "transport",
  "tour",
] as const;

export function validateCorporateLogin(input: { email?: string; password?: string }): string | null {
  if (!input.email?.trim()) return "Email is required";
  if (!input.password) return "Password is required";
  return null;
}

export function validateEmployee(input: {
  fullName?: string;
  phone?: string;
  department?: string;
  designation?: string;
  passportNo?: string;
}): string | null {
  if (!input.fullName?.trim() || input.fullName.trim().length < 2) return "Full name is required";
  if (!input.phone?.trim() || input.phone.trim().length < 6) return "Valid phone is required";
  if (!input.department?.trim()) return "Department is required";
  if (!input.designation?.trim()) return "Designation is required";
  if (!input.passportNo?.trim() || input.passportNo.trim().length < 4) return "Passport number is required";
  return null;
}

export function validateTravelRequest(input: {
  serviceType?: string;
  purpose?: string;
  employeeId?: string;
}): string | null {
  if (!input.serviceType || !(CORPORATE_SERVICE_TYPES as readonly string[]).includes(input.serviceType)) {
    return "Select a valid service type";
  }
  if (!input.purpose?.trim() || input.purpose.trim().length < 3) return "Purpose is required";
  if (!input.employeeId?.trim()) return "Employee is required";
  return null;
}

export function validateSupport(input: { subject?: string; body?: string }): string | null {
  if (!input.subject?.trim() || input.subject.trim().length < 3) return "Subject is required";
  if (!input.body?.trim() || input.body.trim().length < 3) return "Message is required";
  return null;
}

export function formatPoisha(n?: number | null, currency = "BDT"): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n / 100).toLocaleString()} ${currency}`;
}
