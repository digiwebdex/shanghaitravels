import type { ApplicationStage, TransportDetail } from "@/lib/types";

export const ASSIGNED_STAGE_NAME = "Vehicle Assigned";
export const DISPATCHED_STAGE_NAME = "Dispatched";

export function buildTransportQuoteNote(amountBdt: string, detail?: string): string | null {
  const amt = amountBdt.trim();
  if (!amt || Number(amt) <= 0 || Number.isNaN(Number(amt))) return null;
  const extra = (detail || "").trim();
  return `Transport quote: ৳${amt}${extra ? ` — ${extra}` : ""}`;
}

export function buildTransportModificationNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Transport modification: ${d}`;
}

export function buildTransportRefundRequestNote(detail: string): string | null {
  const d = detail.trim();
  if (!d) return null;
  return `Transport refund request: ${d}`;
}

function sorted(stages: ApplicationStage[]) {
  return stages.slice().sort((a, b) => a.stageNo - b.stageNo);
}

/** Advance into Vehicle Assigned — requires supplier confirmation number. */
export function canConfirmSupplier(
  detail: TransportDetail | null | undefined,
  stages: ApplicationStage[],
): { ok: boolean; reason?: string } {
  if (!detail?.confirmationNo?.trim()) {
    return { ok: false, reason: "Save a supplier confirmation number under Transport details first." };
  }
  const list = sorted(stages);
  const target = list.find((s) => s.name === ASSIGNED_STAGE_NAME);
  if (!target) return { ok: false, reason: "Workflow is missing the Vehicle Assigned stage." };
  if (target.status === "done" || target.status === "active") {
    return { ok: false, reason: "Vehicle Assigned is already active or complete." };
  }
  const active = list.find((s) => s.status === "active");
  if (!active) return { ok: false, reason: "No active stage to advance." };
  if (active.stageNo !== target.stageNo - 1) {
    return {
      ok: false,
      reason: `Advance until “${list.find((s) => s.stageNo === target.stageNo - 1)?.name || "Requirement"}” is active.`,
    };
  }
  return { ok: true };
}

/** Advance into Dispatched (voucher / trip start). */
export function canMarkDispatched(stages: ApplicationStage[]): { ok: boolean; reason?: string } {
  const list = sorted(stages);
  const target = list.find((s) => s.name === DISPATCHED_STAGE_NAME);
  if (!target) return { ok: false, reason: "Workflow is missing the Dispatched stage." };
  if (target.status === "done" || target.status === "active") {
    return { ok: false, reason: "Dispatched is already active or complete." };
  }
  const active = list.find((s) => s.status === "active");
  if (!active) return { ok: false, reason: "No active stage to advance." };
  if (active.name !== ASSIGNED_STAGE_NAME && active.stageNo !== target.stageNo - 1) {
    return { ok: false, reason: "Confirm supplier assignment first (Vehicle Assigned must be active)." };
  }
  return { ok: true };
}
