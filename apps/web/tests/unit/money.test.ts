import { describe, expect, it } from "vitest";
import { fromPoisha, toPoisha, fmtBDT, fmtBDTPlain } from "@/lib/money";

describe("money (poisha)", () => {
  it("converts taka to integer poisha", () => {
    expect(toPoisha(5000)).toBe(500000);
    expect(toPoisha("12.34")).toBe(1234);
    expect(toPoisha("bad")).toBe(0);
  });

  it("converts poisha to taka", () => {
    expect(fromPoisha(1200000)).toBe(12000);
    expect(fromPoisha(null)).toBe(0);
  });

  it("formats BDT currency", () => {
    expect(fmtBDT(8000000)).toMatch(/BDT|৳|80/);
  });

  it("formats BDT plain", () => {
    expect(fmtBDTPlain(8000000)).toMatch(/৳/);
    expect(fmtBDTPlain(8000000)).toContain("80,000");
  });
});
