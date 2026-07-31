import { describe, expect, it } from "vitest";
import {
  AGENT_SERVICE_TYPES,
  formatPoisha,
  validateAgentBooking,
  validateAgentCustomer,
  validateAgentLogin,
  validateAgentSupport,
} from "@/lib/agentPortal";

describe("agent portal helpers", () => {
  it("validates login/booking/customer/support", () => {
    expect(validateAgentLogin({ email: "a@b.com", password: "x" })).toBeNull();
    expect(validateAgentLogin({ email: "", password: "x" })).toMatch(/Email/i);
    expect(validateAgentBooking({ serviceType: "visa", customerName: "Ada", customerPhone: "01710000000" })).toBeNull();
    expect(validateAgentBooking({ serviceType: "nope", customerName: "Ada", customerPhone: "01710000000" })).toMatch(
      /service/i,
    );
    expect(validateAgentCustomer({ fullName: "Ada Lovelace", phone: "01710000000" })).toBeNull();
    expect(validateAgentCustomer({ fullName: "A", phone: "1" })).toMatch(/name|Phone/i);
    expect(validateAgentSupport({ subject: "Help", body: "Need docs" })).toBeNull();
    expect(AGENT_SERVICE_TYPES).toContain("hajj");
    expect(formatPoisha(12500)).toContain("125");
  });
});
