/**
 * Integration suite — re-exports API smoke as Vitest-friendly documentation.
 * Executable smoke lives in tests/api/smoke.mjs (staging + prod).
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("integration artifacts", () => {
  it("API smoke script exists", () => {
    const p = path.resolve(__dirname, "../api/smoke.mjs");
    expect(fs.existsSync(p)).toBe(true);
  });

  it("e2e auth/visa spec exists", () => {
    const p = path.resolve(__dirname, "../e2e/auth-and-visa.spec.ts");
    expect(fs.existsSync(p)).toBe(true);
  });
});
