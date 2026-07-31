import { describe, expect, it } from "vitest";
import {
  airTicketPayload,
  fromLocalInput,
  toLocalInput,
  validateAirTicketForm,
  emptyAirTicketForm,
} from "@/lib/airTicket";

describe("airTicket helpers", () => {
  it("validates return after depart", () => {
    const f = emptyAirTicketForm();
    f.departAt = "2026-08-01T10:00";
    f.returnAt = "2026-07-01T10:00";
    expect(validateAirTicketForm(f)).toMatch(/Return/);
  });

  it("accepts valid enums and dates", () => {
    const f = emptyAirTicketForm();
    f.tripType = "round_trip";
    f.cabinClass = "business";
    f.departAt = "2026-08-01T10:00";
    f.returnAt = "2026-08-10T10:00";
    expect(validateAirTicketForm(f)).toBeNull();
  });

  it("round-trips local datetime for payload", () => {
    const iso = fromLocalInput("2026-08-01T10:30");
    expect(iso).toBeTruthy();
    expect(toLocalInput(iso)).toMatch(/^2026-08-01T10:30/);
    const payload = airTicketPayload({
      ...emptyAirTicketForm(),
      pnr: "ABC123",
      airline: "CA",
      departAt: "2026-08-01T10:30",
      returnAt: "",
    });
    expect(payload.pnr).toBe("ABC123");
    expect(payload.departAt).toBeTruthy();
    expect(payload.returnAt).toBeNull();
  });
});
