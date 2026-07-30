import type { ApplicationStage, HajjDetail } from "@/lib/types";

/** Hajj workflow: Registration → Documents & Visa → Package & Payment → Pre-departure → In Progress → Completed */
export const PRE_DEPARTURE_STAGE = "Pre-departure";
export const IN_PROGRESS_STAGE = "In Progress";
export const PACKAGE_PAYMENT_STAGE = "Package & Payment";

export function buildHajjInstallmentNote(amountBdt: string, detail?: string): string | null {
  const amt = amountBdt.trim();
  if (!amt || Number(amt) <= 0 || Number.isNaN(Number(amt))) return null;
  const extra = (detail || "").trim();
  return `Hajj/Umrah installment: ৳${amt}${extra ? ` — ${extra}` : ""}`;
}

export function buildHajjModificationNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Hajj/Umrah modification: ${d}`;
}

export function buildHajjRefundRequestNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Hajj/Umrah refund request: ${d}`;
}

export function buildSupplierPaymentNote(amountBdt: string, detail?: string): string | null {
  const amt = amountBdt.trim();
  if (!amt || Number(amt) <= 0 || Number.isNaN(Number(amt))) return null;
  const extra = (detail || "").trim();
  return `Hajj/Umrah supplier payment: ৳${amt}${extra ? ` — ${extra}` : ""}`;
}

function sorted(stages: ApplicationStage[]) {
  return stages.slice().sort((a, b) => a.stageNo - b.stageNo);
}

/** Confirm package booking — requires confirmation number; advance into Pre-departure when that is next. */
export function canConfirmHajjPackage(
  detail: HajjDetail | null | undefined,
  stages: ApplicationStage[],
): { ok: boolean; reason?: string } {
  if (!detail?.confirmationNo?.trim()) {
    return { ok: false, reason: "Save a confirmation number under booking details first." };
  }
  const list = sorted(stages);
  const target = list.find((s) => s.name === PRE_DEPARTURE_STAGE);
  if (!target) return { ok: false, reason: "Workflow is missing the Pre-departure stage." };
  if (target.status === "done" || target.status === "active") {
    return { ok: false, reason: "Pre-departure is already active or complete." };
  }
  const active = list.find((s) => s.status === "active");
  if (!active) return { ok: false, reason: "No active stage to advance." };
  if (active.stageNo !== target.stageNo - 1) {
    return {
      ok: false,
      reason: `Advance until “${list.find((s) => s.stageNo === target.stageNo - 1)?.name || PACKAGE_PAYMENT_STAGE}” is active.`,
    };
  }
  return { ok: true };
}

/** Mark departed / in progress (hajj has In Progress; umrah may skip). */
export function canMarkDeparted(stages: ApplicationStage[]): { ok: boolean; reason?: string } {
  const list = sorted(stages);
  const target = list.find((s) => s.name === IN_PROGRESS_STAGE);
  if (!target) {
    // Umrah template has no In Progress — allow advance from Pre-departure toward Completed via generic advance
    const pre = list.find((s) => s.name === PRE_DEPARTURE_STAGE);
    if (pre?.status === "active") return { ok: true };
    return { ok: false, reason: "Confirm Pre-departure first (or use Advance stage)." };
  }
  if (target.status === "done" || target.status === "active") {
    return { ok: false, reason: "In Progress is already active or complete." };
  }
  const active = list.find((s) => s.status === "active");
  if (!active) return { ok: false, reason: "No active stage to advance." };
  if (active.name !== PRE_DEPARTURE_STAGE && active.stageNo !== target.stageNo - 1) {
    return { ok: false, reason: "Reach Pre-departure before marking departed." };
  }
  return { ok: true };
}
