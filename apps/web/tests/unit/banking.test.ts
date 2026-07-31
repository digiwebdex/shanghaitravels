import { describe, expect, it } from "vitest";
import { toPoishaBdt, validateMovement } from "@/lib/banking";

describe("banking helpers", () => {
  it("validates transfers and amounts", () => {
    expect(validateMovement({ type: "transfer", amountBdt: "100", fromBankAccountId: "a", toBankAccountId: "a" })).toMatch(
      /differ/,
    );
    expect(validateMovement({ type: "deposit", amountBdt: "100", toBankAccountId: "b" })).toBeNull();
    expect(toPoishaBdt("250.50")).toBe(25050);
  });
});
