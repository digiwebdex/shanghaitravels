import { describe, expect, it } from "vitest";
import { docLinesPayload, toPoishaAmount, validateDocLines } from "@/lib/arap";

describe("arap helpers", () => {
  it("validates lines and builds payload", () => {
    expect(validateDocLines([{ description: "", amountBdt: "" }])).toMatch(/at least one/);
    expect(validateDocLines([{ description: "Fee", amountBdt: "bad" }])).toMatch(/invalid/);
    expect(validateDocLines([{ description: "Fee", amountBdt: "1500.50" }])).toBeNull();
    const payload = docLinesPayload([{ description: "Fee", amountBdt: "1500.50" }]);
    expect(payload[0].amountPoisha).toBe(toPoishaAmount("1500.50"));
    expect(payload[0].amountPoisha).toBe(150050);
  });
});
