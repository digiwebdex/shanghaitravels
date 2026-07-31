import { describe, expect, it } from "vitest";
import { statementBalanced, validateDateRange, qs } from "@/lib/statements";

describe("statements helpers", () => {
  it("detects balance sheet balance", () => {
    expect(statementBalanced({ assetsPoisha: 100, liabilitiesAndEquityPoisha: 100, balanced: true })).toBe(true);
    expect(statementBalanced({ assetsPoisha: 100, liabilitiesAndEquityPoisha: 90 })).toBe(false);
    expect(statementBalanced(undefined)).toBe(false);
  });

  it("validates date ranges", () => {
    expect(validateDateRange("2026-02-01", "2026-01-01")).toMatch(/From date/);
    expect(validateDateRange("2026-01-01", "2026-02-01")).toBeNull();
  });

  it("builds query strings", () => {
    expect(qs({ a: "1", b: undefined, c: "" })).toBe("?a=1");
  });
});
