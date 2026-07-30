import { describe, expect, it } from "vitest";
import { emptyTransportForm, transportPayload, validateTransportForm } from "@/lib/transport";
import {
  buildTransportQuoteNote,
  canConfirmSupplier,
  canMarkDispatched,
} from "@/lib/transportOps";
import type { ApplicationStage } from "@/lib/types";

const stages = (activeNo: number): ApplicationStage[] =>
  [
    { id: "1", stageNo: 1, name: "Requirement", status: "pending" as const },
    { id: "2", stageNo: 2, name: "Vehicle Assigned", status: "pending" as const },
    { id: "3", stageNo: 3, name: "Dispatched", status: "pending" as const },
    { id: "4", stageNo: 4, name: "Completed", status: "pending" as const },
  ].map((s) => ({
    ...s,
    status: s.stageNo < activeNo ? "done" : s.stageNo === activeNo ? "active" : "pending",
  }));

describe("transport helpers", () => {
  it("validates passengers and builds payload", () => {
    const f = emptyTransportForm();
    f.passengers = "0";
    expect(validateTransportForm(f)).toMatch(/Passengers/);
    f.passengers = "2";
    f.serviceKind = "city_transfer";
    f.confirmationNo = "SUP-1";
    const p = transportPayload(f);
    expect(p.serviceKind).toBe("city_transfer");
    expect(p.passengers).toBe(2);
    expect(p.confirmationNo).toBe("SUP-1");
  });
});

describe("transportOps", () => {
  it("gates supplier confirm and dispatch", () => {
    expect(buildTransportQuoteNote("3500")).toBe("Transport quote: ৳3500");
    expect(canConfirmSupplier({ confirmationNo: "" }, stages(1)).ok).toBe(false);
    expect(canConfirmSupplier({ confirmationNo: "C1" }, stages(1)).ok).toBe(true);
    expect(canMarkDispatched(stages(2)).ok).toBe(true);
    expect(canMarkDispatched(stages(1)).ok).toBe(false);
  });
});
