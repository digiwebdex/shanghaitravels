import { describe, expect, it } from "vitest";
import {
  calcLineAmountPoisha,
  canApproveQuote,
  canConvertQuote,
  canSubmitQuote,
  validatePriceBook,
  validateSalesQuote,
} from "@/lib/sales";

describe("sales helpers", () => {
  it("validates quotes and price books", () => {
    expect(validateSalesQuote({ serviceType: "", lines: [] })).toMatch(/Service/);
    expect(
      validateSalesQuote({
        serviceType: "visa",
        lines: [{ description: "Fee", unitPriceBdt: "5000", quantity: "1" }],
      }),
    ).toBeNull();
    expect(validatePriceBook({ name: "", kind: "promo" })).toMatch(/required/);
    expect(validatePriceBook({ name: "Agent VIP", kind: "agent" })).toBeNull();
  });

  it("calculates lines and workflow gates", () => {
    expect(calcLineAmountPoisha(2, 10000, 500)).toBe(19500);
    expect(canSubmitQuote("draft")).toBe(true);
    expect(canApproveQuote("pending_approval")).toBe(true);
    expect(canConvertQuote("approved")).toBe(true);
    expect(canConvertQuote("draft")).toBe(false);
  });
});
