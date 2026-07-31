import type { ApplicationStage, HotelDetail } from "@/lib/types";

export const CONFIRM_STAGE_NAME = "Booking Confirmed";
export const VOUCHER_STAGE_NAME = "Voucher Delivered";

export function buildHotelQuoteNote(amountBdt: string, detail?: string): string | null {
  const amt = amountBdt.trim();
  if (!amt || Number(amt) <= 0 || Number.isNaN(Number(amt))) return null;
  const extra = (detail || "").trim();
  return `Hotel quote: ৳${amt}${extra ? ` — ${extra}` : ""}`;
}

export function buildModificationNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Hotel modification: ${d}`;
}

export function buildHotelRefundRequestNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Hotel refund request: ${d}`;
}

function sorted(stages: ApplicationStage[]) {
  return stages.slice().sort((a, b) => a.stageNo - b.stageNo);
}

/** Advance into Booking Confirmed — requires confirmation number + active prior stage. */
export function canConfirmBooking(
  detail: HotelDetail | null | undefined,
  stages: ApplicationStage[],
): { ok: boolean; reason?: string } {
  if (!detail?.confirmationNo?.trim()) {
    return { ok: false, reason: "Save a confirmation / voucher number under Hotel details first." };
  }
  const list = sorted(stages);
  const target = list.find((s) => s.name === CONFIRM_STAGE_NAME);
  if (!target) return { ok: false, reason: "Workflow is missing the Booking Confirmed stage." };
  if (target.status === "done" || target.status === "active") {
    return { ok: false, reason: "Booking Confirmed is already active or complete." };
  }
  const active = list.find((s) => s.status === "active");
  if (!active) return { ok: false, reason: "No active stage to advance." };
  if (active.stageNo !== target.stageNo - 1) {
    return {
      ok: false,
      reason: `Advance until “${list.find((s) => s.stageNo === target.stageNo - 1)?.name || "Availability & Quote"}” is active.`,
    };
  }
  return { ok: true };
}

/** Advance into Voucher Delivered — Booking Confirmed must be active. */
export function canIssueVoucher(stages: ApplicationStage[]): { ok: boolean; reason?: string } {
  const list = sorted(stages);
  const target = list.find((s) => s.name === VOUCHER_STAGE_NAME);
  if (!target) return { ok: false, reason: "Workflow is missing the Voucher Delivered stage." };
  if (target.status === "done" || target.status === "active") {
    return { ok: false, reason: "Voucher Delivered is already active or complete." };
  }
  const active = list.find((s) => s.status === "active");
  if (!active) return { ok: false, reason: "No active stage to advance." };
  if (active.name !== CONFIRM_STAGE_NAME && active.stageNo !== target.stageNo - 1) {
    return { ok: false, reason: "Confirm the booking first (Booking Confirmed must be active)." };
  }
  return { ok: true };
}
