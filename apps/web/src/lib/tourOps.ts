import type { ApplicationStage, TourDetail } from "@/lib/types";

export const CONFIRM_STAGE_NAME = "Confirmed";
export const IN_PROGRESS_STAGE_NAME = "In Progress";

export function buildTourQuoteNote(amountBdt: string, detail?: string): string | null {
  const amt = amountBdt.trim();
  if (!amt || Number(amt) <= 0 || Number.isNaN(Number(amt))) return null;
  const extra = (detail || "").trim();
  return `Tour quotation: ৳${amt}${extra ? ` — ${extra}` : ""}`;
}

export function buildTourModificationNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Tour modification: ${d}`;
}

export function buildTourRefundRequestNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Tour refund request: ${d}`;
}

function sorted(stages: ApplicationStage[]) {
  return stages.slice().sort((a, b) => a.stageNo - b.stageNo);
}

/** Advance into Confirmed — requires confirmation number; prior stage active. */
export function canConfirmTour(
  detail: TourDetail | null | undefined,
  stages: ApplicationStage[],
): { ok: boolean; reason?: string } {
  if (!detail?.confirmationNo?.trim()) {
    return { ok: false, reason: "Save a confirmation / voucher number under Tour details first." };
  }
  const list = sorted(stages);
  const target = list.find((s) => s.name === CONFIRM_STAGE_NAME);
  if (!target) return { ok: false, reason: "Workflow is missing the Confirmed stage." };
  if (target.status === "done" || target.status === "active") {
    return { ok: false, reason: "Confirmed is already active or complete." };
  }
  const active = list.find((s) => s.status === "active");
  if (!active) return { ok: false, reason: "No active stage to advance." };
  if (active.stageNo !== target.stageNo - 1) {
    return {
      ok: false,
      reason: `Advance until “${list.find((s) => s.stageNo === target.stageNo - 1)?.name || "Itinerary & Quote"}” is active.`,
    };
  }
  return { ok: true };
}

/** Advance into In Progress (voucher / departure). */
export function canStartTour(stages: ApplicationStage[]): { ok: boolean; reason?: string } {
  const list = sorted(stages);
  const target = list.find((s) => s.name === IN_PROGRESS_STAGE_NAME);
  if (!target) return { ok: false, reason: "Workflow is missing the In Progress stage." };
  if (target.status === "done" || target.status === "active") {
    return { ok: false, reason: "In Progress is already active or complete." };
  }
  const active = list.find((s) => s.status === "active");
  if (!active) return { ok: false, reason: "No active stage to advance." };
  if (active.name !== CONFIRM_STAGE_NAME && active.stageNo !== target.stageNo - 1) {
    return { ok: false, reason: "Confirm the package booking first (Confirmed must be active)." };
  }
  return { ok: true };
}
