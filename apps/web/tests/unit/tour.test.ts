import { describe, expect, it } from "vitest";
import {
  calcMarginPoisha,
  emptyTourForm,
  parseItineraryDays,
  serializeItineraryDays,
  toPoisha,
  tourPayload,
  validateTourForm,
} from "@/lib/tour";
import { buildTourQuoteNote, canConfirmTour, canStartTour } from "@/lib/tourOps";
import type { ApplicationStage } from "@/lib/types";

const stages = (activeNo: number): ApplicationStage[] =>
  [
    { id: "1", stageNo: 1, name: "Enquiry", status: "pending" as const },
    { id: "2", stageNo: 2, name: "Itinerary & Quote", status: "pending" as const },
    { id: "3", stageNo: 3, name: "Confirmed", status: "pending" as const },
    { id: "4", stageNo: 4, name: "In Progress", status: "pending" as const },
    { id: "5", stageNo: 5, name: "Completed", status: "pending" as const },
  ].map((s) => ({
    ...s,
    status: s.stageNo < activeNo ? "done" : s.stageNo === activeNo ? "active" : "pending",
  }));

describe("tour helpers", () => {
  it("validates dates, types, and builds payload with poisha", () => {
    const f = emptyTourForm();
    f.packageType = "group";
    f.category = "international";
    f.season = "peak";
    f.startDate = "2026-08-10";
    f.endDate = "2026-08-01";
    expect(validateTourForm(f)).toMatch(/End date/);
    f.endDate = "2026-08-15";
    f.supplierCostBdt = "50000";
    f.sellingPriceBdt = "65000";
    f.packageName = "Bali 5D4N";
    expect(validateTourForm(f)).toBeNull();
    const p = tourPayload(f);
    expect(p.packageName).toBe("Bali 5D4N");
    expect(p.supplierCostPoisha).toBe(5_000_000);
    expect(p.sellingPricePoisha).toBe(6_500_000);
    expect(calcMarginPoisha(toPoisha("50000"), toPoisha("65000"))).toBe(1_500_000);
  });

  it("serializes day-by-day itinerary", () => {
    const text = serializeItineraryDays([
      { day: 1, title: "Arrival", body: "Airport meet" },
      { day: 2, title: "City tour", body: "Old town" },
    ]);
    const parsed = parseItineraryDays(text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].title).toBe("Arrival");
    expect(parsed[1].day).toBe(2);
  });
});

describe("tourOps", () => {
  it("gates confirm and in-progress advances", () => {
    expect(buildTourQuoteNote("120000")).toBe("Tour quotation: ৳120000");
    expect(canConfirmTour({ confirmationNo: "" }, stages(2)).ok).toBe(false);
    expect(canConfirmTour({ confirmationNo: "PKG-1" }, stages(2)).ok).toBe(true);
    expect(canStartTour(stages(3)).ok).toBe(true);
    expect(canStartTour(stages(2)).ok).toBe(false);
  });
});
