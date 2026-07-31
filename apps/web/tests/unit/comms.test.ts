import { describe, expect, it } from "vitest";
import { applyMergeFields, validateCommLog, validateSend, validateTemplate } from "@/lib/comms";

describe("comms helpers", () => {
  it("merges template fields", () => {
    expect(applyMergeFields("Hi {{customerName}} — {{referenceNo}}", { customerName: "Amina", referenceNo: "APP-1" })).toBe(
      "Hi Amina — APP-1",
    );
  });

  it("validates log, send, and templates", () => {
    expect(validateCommLog({ relatedType: "lead", relatedId: "x", summary: "" })).toMatch(/Summary/);
    expect(validateCommLog({ relatedType: "lead", relatedId: "x", summary: "Called", channel: "call" })).toBeNull();
    expect(validateSend({ channel: "email", to: "bad", body: "hi" })).toMatch(/email/);
    expect(validateSend({ channel: "whatsapp", to: "8801712345678", templateCode: "wa_booking_update" })).toBeNull();
    expect(validateTemplate({ code: "t1", name: "T", body: "Hello", channel: "sms" })).toBeNull();
  });
});
