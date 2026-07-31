import { describe, expect, it } from "vitest";
import {
  formatPoisha,
  validateApplicationRequest,
  validatePortalLogin,
  validatePortalRegister,
  validateSupportRequest,
} from "@/lib/portal";

describe("customer portal helpers", () => {
  it("validates register/login/support/application", () => {
    expect(validatePortalRegister({ fullName: "Ada", email: "a@b.com", password: "password1" })).toBeNull();
    expect(validatePortalRegister({ fullName: "A", email: "x", password: "short" })).toMatch(/name|email|Password/i);
    expect(validatePortalLogin({ email: "a@b.com", password: "x" })).toBeNull();
    expect(validateSupportRequest({ subject: "Help", body: "Need docs" })).toBeNull();
    expect(validateApplicationRequest({ serviceType: "visa" })).toBeNull();
    expect(validateApplicationRequest({ serviceType: "nope" })).toMatch(/service/);
    expect(formatPoisha(12500)).toContain("125");
  });
});
