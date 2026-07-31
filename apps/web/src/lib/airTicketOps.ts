import type { AirTicketDetail, ApplicationStage } from "@/lib/types";

export const ISSUE_STAGE_NAME = "Ticket Issued";

/** Timeline note for a consolidator/airline fare quote (BDT display amount). */
export function buildFareQuotationNote(amountBdt: string, detail?: string): string | null {
  const amt = amountBdt.trim();
  if (!amt || Number(amt) <= 0 || Number.isNaN(Number(amt))) return null;
  const extra = (detail || "").trim();
  return `Fare quotation: ৳${amt}${extra ? ` — ${extra}` : ""}`;
}

export function buildReissueNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Reissue request: ${d}`;
}

export function buildRefundRequestNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Refund request: ${d}`;
}

/**
 * Gate for advancing into Ticket Issued.
 * Active stage must be immediately before "Ticket Issued" (Fare & Booking),
 * and ticketNo must be present on the saved detail.
 */
export function canMarkTicketIssued(
  detail: AirTicketDetail | null | undefined,
  stages: ApplicationStage[],
): { ok: boolean; reason?: string } {
  const ticketNo = detail?.ticketNo?.trim();
  if (!ticketNo) {
    return { ok: false, reason: "Save a ticket number under Air ticket details first." };
  }
  const sorted = stages.slice().sort((a, b) => a.stageNo - b.stageNo);
  const issue = sorted.find((s) => s.name === ISSUE_STAGE_NAME);
  if (!issue) {
    return { ok: false, reason: "Workflow is missing the Ticket Issued stage." };
  }
  if (issue.status === "done" || issue.status === "active") {
    return { ok: false, reason: "Ticket Issued stage is already active or complete." };
  }
  const active = sorted.find((s) => s.status === "active");
  if (!active) {
    return { ok: false, reason: "No active stage to advance." };
  }
  if (active.stageNo !== issue.stageNo - 1) {
    return {
      ok: false,
      reason: `Advance stages until “${sorted.find((s) => s.stageNo === issue.stageNo - 1)?.name || "Fare & Booking"}” is active, then mark issued.`,
    };
  }
  return { ok: true };
}
