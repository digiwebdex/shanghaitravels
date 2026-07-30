import { describe, expect, it } from "vitest";
import { listOf, validateUploadFile, UPLOAD_MAX_BYTES } from "@/lib/api";
import { passportExpiry, type Passport } from "@/lib/types";

describe("listOf", () => {
  it("unwraps paginated and array shapes", () => {
    expect(listOf([1, 2])).toEqual([1, 2]);
    expect(listOf({ data: ["a"] })).toEqual(["a"]);
    expect(listOf(null)).toEqual([]);
  });
});

describe("validateUploadFile", () => {
  it("rejects oversized files", () => {
    const f = new File([new Uint8Array(UPLOAD_MAX_BYTES + 1)], "big.pdf", { type: "application/pdf" });
    expect(validateUploadFile(f)).toMatch(/too large/i);
  });

  it("rejects bad mime", () => {
    const f = new File(["x"], "x.exe", { type: "application/x-msdownload" });
    expect(validateUploadFile(f)).toMatch(/JPG|PDF/i);
  });

  it("allows pdf/jpeg", () => {
    expect(validateUploadFile(new File(["x"], "a.pdf", { type: "application/pdf" }))).toBeNull();
    expect(validateUploadFile(new File(["x"], "a.jpg", { type: "image/jpeg" }))).toBeNull();
  });
});

describe("passportExpiry", () => {
  it("prefers Prisma expiryDate", () => {
    const p = { id: "1", passportNo: "X", expiryDate: "2028-01-01", dateOfExpiry: "2020-01-01" } as Passport;
    expect(passportExpiry(p)).toBe("2028-01-01");
  });
});
