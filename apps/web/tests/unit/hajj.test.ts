import { describe, expect, it } from "vitest";
import {
  calcBalancePoisha,
  calcMarginPoisha,
  emptyHajjForm,
  hajjPayload,
  toPoisha,
  validateHajjForm,
} from "@/lib/hajj";
import {
  buildHajjInstallmentNote,
  canConfirmHajjPackage,
  canMarkDeparted,
} from "@/lib/hajjOps";
import type { ApplicationStage } from "@/lib/types";

const stages = (activeNo: number): ApplicationStage[] =>
  [
    { id: "1", stageNo: 1, name: "Registration", status: "pending" as const },
    { id: "2", stageNo: 2, name: "Documents & Visa", status: "pending" as const },
    { id: "3", stageNo: 3, name: "Package & Payment", status: "pending" as const },
    { id: "4", stageNo: 4, name: "Pre-departure", status: "pending" as const },
    { id: "5", stageNo: 5, name: "In Progress", status: "pending" as const },
    { id: "6", stageNo: 6, name: "Completed", status: "pending" as const },
  ].map((s) => ({
    ...s,
    status: s.stageNo < activeNo ? "done" : s.stageNo === activeNo ? "active" : "pending",
  }));

describe("hajj helpers", () => {
  it("validates dates and builds payload with poisha", () => {
    const f = emptyHajjForm("hajj");
    f.departureDate = "2026-06-10";
    f.returnDate = "2026-06-01";
    expect(validateHajjForm(f)).toMatch(/Return date/);
    f.returnDate = "2026-07-01";
    f.supplierCostBdt = "200000";
    f.sellingPriceBdt = "280000";
    f.paidBdt = "100000";
    f.pilgrimName = "Abdul Rahman";
    expect(validateHajjForm(f)).toBeNull();
    const p = hajjPayload(f);
    expect(p.pilgrimName).toBe("Abdul Rahman");
    expect(p.packageType).toBe("hajj");
    expect(p.supplierCostPoisha).toBe(20_000_000);
    expect(calcMarginPoisha(toPoisha("200000"), toPoisha("280000"))).toBe(8_000_000);
    expect(calcBalancePoisha(toPoisha("280000"), toPoisha("100000"))).toBe(18_000_000);
  });
});

describe("hajjOps", () => {
  it("gates pre-departure confirm and departure", () => {
    expect(buildHajjInstallmentNote("50000")).toBe("Hajj/Umrah installment: ৳50000");
    expect(canConfirmHajjPackage({ confirmationNo: "" }, stages(3)).ok).toBe(false);
    expect(canConfirmHajjPackage({ confirmationNo: "HU-1" }, stages(3)).ok).toBe(true);
    expect(canMarkDeparted(stages(4)).ok).toBe(true);
    expect(canMarkDeparted(stages(3)).ok).toBe(false);
  });
});
