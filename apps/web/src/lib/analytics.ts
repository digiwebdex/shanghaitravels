/** Phase D4 — Analytics helpers */

export const ANALYTICS_CATEGORIES = ["executive", "customer", "sales", "comms", "finance"] as const;
export const EXPORT_FORMATS = ["csv", "excel", "html", "pdf"] as const;
export const CRON_PRESETS = [
  { label: "Daily 08:00", value: "0 8 * * *" },
  { label: "Weekly Monday 08:00", value: "0 8 * * 1" },
  { label: "Monthly 1st 08:00", value: "0 8 1 * *" },
] as const;

export function validateAnalyticsFilters(input: { from?: string; to?: string }): string | null {
  if (input.from && Number.isNaN(Date.parse(input.from))) return "Invalid from date";
  if (input.to && Number.isNaN(Date.parse(input.to))) return "Invalid to date";
  if (input.from && input.to && Date.parse(input.from) > Date.parse(input.to)) {
    return "From date must be before to date";
  }
  return null;
}

export function validateReportTemplate(input: { code?: string; name?: string; category?: string }): string | null {
  if (!input.code?.trim()) return "Template code is required";
  if (!input.name?.trim()) return "Template name is required";
  if (!input.category || !(ANALYTICS_CATEGORIES as readonly string[]).includes(input.category)) {
    return "Invalid category";
  }
  return null;
}

export function validateSchedule(input: { templateId?: string; name?: string; cronExpr?: string; format?: string }): string | null {
  if (!input.templateId?.trim()) return "Template is required";
  if (!input.name?.trim()) return "Schedule name is required";
  if (!input.cronExpr?.trim()) return "Cron expression is required";
  if (input.format && !(EXPORT_FORMATS as readonly string[]).includes(input.format)) return "Invalid format";
  return null;
}

export function pct(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n}%`;
}
