import { describe, expect, it } from "vitest";
import {
  calcNights,
  emptyHotelForm,
  hotelPayload,
  validateHotelForm,
} from "@/lib/hotel";
import {
  buildHotelQuoteNote,
  buildModificationNote,
  canConfirmBooking,
  canIssueVoucher,
} from "@/lib/hotelOps";
import type { ApplicationStage } from "@/lib/types";

const stages = (activeNo: number): ApplicationStage[] =>
  [
    { id: "1", stageNo: 1, name: "Requirement", status: "pending" as const },
    { id: "2", stageNo: 2, name: "Availability & Quote", status: "pending" as const },
    { id: "3", stageNo: 3, name: "Booking Confirmed", status: "pending" as const },
    { id: "4", stageNo: 4, name: "Voucher Delivered", status: "pending" as const },
  ].map((s) => ({
    ...s,
    status: s.stageNo < activeNo ? "done" : s.stageNo === activeNo ? "active" : "pending",
  }));

describe("hotel helpers", () => {
  it("calculates nights and validates dates", () => {
    expect(calcNights("2026-08-01", "2026-08-04")).toBe(3);
    const f = emptyHotelForm();
    f.checkIn = "2026-08-10";
    f.checkOut = "2026-08-01";
    expect(validateHotelForm(f)).toMatch(/Check-out/);
  });

  it("builds payload with meal plan", () => {
    const f = emptyHotelForm();
    f.hotelName = "Grand";
    f.mealPlan = "HB";
    f.checkIn = "2026-08-01";
    f.checkOut = "2026-08-03";
    f.nights = "";
    const p = hotelPayload(f);
    expect(p.hotelName).toBe("Grand");
    expect(p.mealPlan).toBe("HB");
    expect(p.nights).toBe(2);
  });
});

describe("hotelOps", () => {
  it("builds notes and gates confirm/voucher", () => {
    expect(buildHotelQuoteNote("8000", "BB")).toBe("Hotel quote: ৳8000 — BB");
    expect(buildModificationNote("late checkout")).toBe("Hotel modification: late checkout");
    expect(canConfirmBooking({ confirmationNo: "" }, stages(2)).ok).toBe(false);
    expect(canConfirmBooking({ confirmationNo: "CNF1" }, stages(2)).ok).toBe(true);
    expect(canIssueVoucher(stages(3)).ok).toBe(true);
    expect(canIssueVoucher(stages(2)).ok).toBe(false);
  });
});
