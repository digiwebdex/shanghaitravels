import { describe, expect, it } from "vitest";
import {
  buildFareQuotationNote,
  buildRefundRequestNote,
  buildReissueNote,
  canMarkTicketIssued,
} from "@/lib/airTicketOps";
import type { ApplicationStage } from "@/lib/types";

const stages = (activeNo: number): ApplicationStage[] =>
  [
    { id: "1", stageNo: 1, name: "Requirement", status: "pending" as const },
    { id: "2", stageNo: 2, name: "Fare & Booking", status: "pending" as const },
    { id: "3", stageNo: 3, name: "Ticket Issued", status: "pending" as const },
    { id: "4", stageNo: 4, name: "Delivered", status: "pending" as const },
  ].map((s) => ({
    ...s,
    status: s.stageNo < activeNo ? "done" : s.stageNo === activeNo ? "active" : "pending",
  }));

describe("airTicketOps", () => {
  it("builds fare / reissue / refund notes", () => {
    expect(buildFareQuotationNote("0")).toBeNull();
    expect(buildFareQuotationNote("12500.50", "SQ fare")).toBe(
      "Fare quotation: ৳12500.50 — SQ fare",
    );
    expect(buildReissueNote("  ")).toBeNull();
    expect(buildReissueNote("new date")).toBe("Reissue request: new date");
    expect(buildRefundRequestNote("void")).toBe("Refund request: void");
  });

  it("gates mark-issued on ticketNo and active stage", () => {
    expect(canMarkTicketIssued({ ticketNo: "" } as never, stages(2)).ok).toBe(false);
    expect(canMarkTicketIssued({ ticketNo: "999" } as never, stages(1)).ok).toBe(false);
    expect(canMarkTicketIssued({ ticketNo: "999" } as never, stages(2)).ok).toBe(true);
    expect(canMarkTicketIssued({ ticketNo: "999" } as never, stages(3)).ok).toBe(false);
  });
});
