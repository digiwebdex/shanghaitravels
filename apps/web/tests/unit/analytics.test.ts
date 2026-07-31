import { describe, expect, it } from "vitest";
import { pct, validateAnalyticsFilters, validateReportTemplate, validateSchedule } from "@/lib/analytics";

describe("analytics helpers", () => {
  it("validates filters, templates, schedules", () => {
    expect(validateAnalyticsFilters({ from: "2026-01-01", to: "2025-01-01" })).toMatch(/before/);
    expect(validateAnalyticsFilters({ from: "2026-01-01", to: "2026-07-01" })).toBeNull();
    expect(validateReportTemplate({ code: "x", name: "X", category: "executive" })).toBeNull();
    expect(validateReportTemplate({ code: "", name: "X", category: "executive" })).toMatch(/code/);
    expect(validateSchedule({ templateId: "t1", name: "Weekly", cronExpr: "0 8 * * 1", format: "csv" })).toBeNull();
    expect(pct(12.5)).toBe("12.5%");
  });
});
