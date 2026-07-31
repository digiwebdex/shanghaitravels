import { describe, expect, it } from "vitest";
import {
  CORPORATE_SERVICE_TYPES,
  formatPoisha,
  validateCorporateLogin,
  validateEmployee,
  validateSupport,
  validateTravelRequest,
} from "@/lib/corporatePortal";

describe("corporate portal helpers", () => {
  it("validates login/employee/travel/support", () => {
    expect(validateCorporateLogin({ email: "a@b.com", password: "x" })).toBeNull();
    expect(validateCorporateLogin({ email: "", password: "x" })).toMatch(/Email/i);
    expect(
      validateEmployee({
        fullName: "Ada Lovelace",
        phone: "01710000000",
        department: "Engineering",
        designation: "Lead",
        passportNo: "AB123456",
      }),
    ).toBeNull();
    expect(validateEmployee({ fullName: "A", phone: "1", department: "", designation: "", passportNo: "x" })).toMatch(
      /name|phone|Department|Designation|Passport/i,
    );
    expect(validateTravelRequest({ serviceType: "visa", purpose: "Conference", employeeId: "emp-1" })).toBeNull();
    expect(validateTravelRequest({ serviceType: "nope", purpose: "x", employeeId: "emp-1" })).toMatch(/service/i);
    expect(validateSupport({ subject: "Help", body: "Need docs" })).toBeNull();
    expect(CORPORATE_SERVICE_TYPES).toContain("tour");
    expect(formatPoisha(12500)).toContain("125");
  });
});
