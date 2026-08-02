import { useState } from "react";
import { applicationsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { Application, ApplicationStage, HajjDetail } from "@/lib/types";
import { Can } from "@/auth/Can";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  IN_PROGRESS_STAGE,
  PRE_DEPARTURE_STAGE,
  buildHajjInstallmentNote,
  buildHajjModificationNote,
  buildHajjRefundRequestNote,
  buildSupplierPaymentNote,
  canConfirmHajjPackage,
  canMarkDeparted,
} from "@/lib/hajjOps";

export function HajjOpsCard({
  app,
  stages,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  stages: ApplicationStage[];
  detail?: HajjDetail | null;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const [installAmt, setInstallAmt] = useState("");
  const [installNote, setInstallNote] = useState("");
  const [supplierAmt, setSupplierAmt] = useState("");
  const [supplierNote, setSupplierNote] = useState("");
  const [modNote, setModNote] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await action();
      setOk(success);
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const closed = ["cancelled", "completed", "approved", "rejected"].includes(app.status);
  const confirmGate = canConfirmHajjPackage(detail, stages);
  const departGate = canMarkDeparted(stages);

  return (
    <section className="bg-white rounded-xl border border-[var(--border)] p-4" aria-labelledby="hajj-ops-heading">
      <h2 id="hajj-ops-heading" className="text-[12px] font-bold text-[var(--primary)] mb-1">
        Hajj / Umrah operations
      </h2>
      <p className="text-[10px] text-[var(--muted-foreground)] mb-3">
        Installments, supplier payments, pre-departure confirm, departure, modify, refund, cancel.
      </p>

      <div className="space-y-4">
        <Can perm="application:note">
          <div className="border-b border-[var(--border)] pb-3">
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-2">Installment / receipt</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="hj-inst-amt">
                  Amount (৳)
                </label>
                <input
                  id="hj-inst-amt"
                  className={inputCls}
                  type="number"
                  min="0"
                  step="0.01"
                  value={installAmt}
                  onChange={(e) => setInstallAmt(e.target.value)}
                  disabled={busy || closed}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="hj-inst-note">
                  Plan / receipt notes
                </label>
                <input
                  id="hj-inst-note"
                  className={inputCls}
                  value={installNote}
                  onChange={(e) => setInstallNote(e.target.value)}
                  placeholder="Installment 2 of 4 / bank receipt…"
                  disabled={busy || closed}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={busy || closed || !installAmt.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildHajjInstallmentNote(installAmt, installNote);
                  if (!msg) throw new ApiError("Enter an installment amount", 400);
                  await applicationsApi.note(app.id, msg);
                  setInstallAmt("");
                  setInstallNote("");
                }, "Installment recorded")
              }
            >
              Record installment
            </button>
          </div>
        </Can>

        <Can perm="application:note">
          <div className="border-b border-[var(--border)] pb-3">
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-2">Supplier payment</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="hj-sup-amt">
                  Amount (৳)
                </label>
                <input
                  id="hj-sup-amt"
                  className={inputCls}
                  type="number"
                  min="0"
                  step="0.01"
                  value={supplierAmt}
                  onChange={(e) => setSupplierAmt(e.target.value)}
                  disabled={busy || closed}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="hj-sup-note">
                  Supplier notes
                </label>
                <input
                  id="hj-sup-note"
                  className={inputCls}
                  value={supplierNote}
                  onChange={(e) => setSupplierNote(e.target.value)}
                  placeholder="Hotel deposit / visa agent…"
                  disabled={busy || closed}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={busy || closed || !supplierAmt.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildSupplierPaymentNote(supplierAmt, supplierNote);
                  if (!msg) throw new ApiError("Enter a supplier payment amount", 400);
                  await applicationsApi.note(app.id, msg);
                  setSupplierAmt("");
                  setSupplierNote("");
                }, "Supplier payment recorded")
              }
            >
              Record supplier payment
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-[var(--border)] pb-3">
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">Pre-departure confirm</p>
            <p className="text-[10px] text-[var(--muted-foreground)] mb-2">
              Requires confirmation number, then advances to “{PRE_DEPARTURE_STAGE}”.
            </p>
            {!confirmGate.ok && (
              <p className="text-[10px] text-[var(--accent)] mb-2" role="status">
                {confirmGate.reason}
              </p>
            )}
            <button
              type="button"
              disabled={busy || closed || !confirmGate.ok}
              className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              onClick={() =>
                run(async () => {
                  const gate = canConfirmHajjPackage(detail, stages);
                  if (!gate.ok) throw new ApiError(gate.reason || "Cannot confirm", 400);
                  await applicationsApi.advance(
                    app.id,
                    `Package confirmed — ${detail?.confirmationNo?.trim()}`,
                  );
                }, "Advanced to pre-departure")
              }
            >
              Mark package confirmed
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-[var(--border)] pb-3">
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">Departure / in progress</p>
            <p className="text-[10px] text-[var(--muted-foreground)] mb-2">
              Advances to “{IN_PROGRESS_STAGE}” when present (Umrah may use generic Advance).
            </p>
            {!departGate.ok && (
              <p className="text-[10px] text-[var(--accent)] mb-2" role="status">
                {departGate.reason}
              </p>
            )}
            <button
              type="button"
              disabled={busy || closed || !departGate.ok}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(
                  () =>
                    applicationsApi.advance(
                      app.id,
                      `Departed — ${detail?.flightNo?.trim() || detail?.confirmationNo?.trim() || "see documents"}`,
                    ),
                  "Advanced after departure",
                )
              }
            >
              Mark departed
            </button>
          </div>
        </Can>

        <Can perm="application:note">
          <div className="border-b border-[var(--border)] pb-3">
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-2">Modification</p>
            <label className={labelCls} htmlFor="hj-mod">
              Change details
            </label>
            <input
              id="hj-mod"
              className={inputCls}
              value={modNote}
              onChange={(e) => setModNote(e.target.value)}
              placeholder="Room upgrade / flight change / mahram update…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !modNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildHajjModificationNote(modNote);
                  if (!msg) throw new ApiError("Enter modification details", 400);
                  await applicationsApi.note(app.id, msg);
                  setModNote("");
                }, "Modification recorded")
              }
            >
              Record modification
            </button>
          </div>
        </Can>

        <Can perm="application:note">
          <div className="border-b border-[var(--border)] pb-3">
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-2">Refund request</p>
            <label className={labelCls} htmlFor="hj-refund">
              Refund notes
            </label>
            <input
              id="hj-refund"
              className={inputCls}
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              placeholder="Cancellation fee / partial refund…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !refundNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildHajjRefundRequestNote(refundNote);
                  if (!msg) throw new ApiError("Enter refund notes", 400);
                  await applicationsApi.note(app.id, msg);
                  setRefundNote("");
                }, "Refund request recorded")
              }
            >
              Record refund request
            </button>
          </div>
        </Can>

        <Can perm="application:update">
          <div>
            <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-2">Cancellation</p>
            <label className={labelCls} htmlFor="hj-cancel">
              Cancel reason
            </label>
            <input
              id="hj-cancel"
              className={inputCls}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Customer cancel / medical / visa reject…"
              disabled={busy || app.status === "cancelled"}
            />
            <button
              type="button"
              disabled={busy || app.status === "cancelled" || !cancelReason.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-red-200 text-[10.5px] font-semibold text-red-700 disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const reason = cancelReason.trim();
                  if (!reason) throw new ApiError("Enter a cancel reason", 400);
                  await applicationsApi.note(app.id, `Hajj/Umrah cancellation: ${reason}`);
                  await applicationsApi.update(app.id, { status: "cancelled" });
                  setCancelReason("");
                }, "Booking cancelled")
              }
            >
              Cancel booking
            </button>
          </div>
        </Can>
      </div>
    </section>
  );
}
