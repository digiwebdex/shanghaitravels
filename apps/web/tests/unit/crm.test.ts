import { describe, expect, it } from "vitest";
import { validateLead, validateQuoteLines, toPoisha, probabilityLabel } from "@/lib/crm";

describe("crm helpers", () => {
  it("validates leads and quote lines", () => {
    expect(validateLead({ name: "" })).toMatch(/required/);
    expect(validateLead({ name: "Amina", source: "whatsapp" })).toBeNull();
    expect(validateQuoteLines([])).toMatch(/line/);
    expect(validateQuoteLines([{ description: "Visa fee", amountBdt: "5000" }])).toBeNull();
    expect(toPoisha("12.50")).toBe(1250);
    expect(probabilityLabel(6000)).toBe("60%");
  });
});
