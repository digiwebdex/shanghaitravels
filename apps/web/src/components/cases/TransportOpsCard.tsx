import { useState } from "react";
import { applicationsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { Application, ApplicationStage, TransportDetail } from "@/lib/types";
import { Can } from "@/auth/Can";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  ASSIGNED_STAGE_NAME,
  DISPATCHED_STAGE_NAME,
  buildTransportModificationNote,
  buildTransportQuoteNote,
  buildTransportRefundRequestNote,
  canConfirmSupplier,
  canMarkDispatched,
} from "@/lib/transportOps";

/** Manual transport ops — supplier confirm, voucher/dispatch, modify, cancel. */
export function TransportOpsCard({
  app,
  stages,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  stages: ApplicationStage[];
  detail?: TransportDetail | null;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const [quoteAmt, setQuoteAmt] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
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
  const confirmGate = canConfirmSupplier(detail, stages);
  const dispatchGate = canMarkDispatched(stages);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4" aria-labelledby="transport-ops-heading">
      <h2 id="transport-ops-heading" className="text-[12px] font-bold text-slate-800 mb-1">
        Transport operations
      </h2>
      <p className="text-[10px] text-slate-400 mb-3">
        Quote, supplier confirmation, voucher/dispatch, modify, cancel — purchased from suppliers.
      </p>

      <div className="space-y-4">
        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Supplier quote</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="top-quote-amt">
                  Quote (৳)
                </label>
                <input
                  id="top-quote-amt"
                  className={inputCls}
                  type="number"
                  min="0"
                  step="0.01"
                  value={quoteAmt}
                  onChange={(e) => setQuoteAmt(e.target.value)}
                  disabled={busy || closed}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="top-quote-note">
                  Quote notes
                </label>
                <input
                  id="top-quote-note"
                  className={inputCls}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="Supplier quote ref…"
                  disabled={busy || closed}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={busy || closed || !quoteAmt.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildTransportQuoteNote(quoteAmt, quoteNote);
                  if (!msg) throw new ApiError("Enter a quote amount", 400);
                  await applicationsApi.note(app.id, msg);
                  setQuoteAmt("");
                  setQuoteNote("");
                }, "Transport quote recorded")
              }
            >
              Record quote
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Supplier confirmation</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Requires confirmation number, then advances to “{ASSIGNED_STAGE_NAME}”.
            </p>
            {!confirmGate.ok && (
              <p className="text-[10px] text-amber-700 mb-2" role="status">
                {confirmGate.reason}
              </p>
            )}
            <button
              type="button"
              disabled={busy || closed || !confirmGate.ok}
              className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
              onClick={() =>
                run(async () => {
                  const gate = canConfirmSupplier(detail, stages);
                  if (!gate.ok) throw new ApiError(gate.reason || "Cannot confirm", 400);
                  await applicationsApi.advance(
                    app.id,
                    `Supplier confirmed — ${detail?.confirmationNo?.trim()}`,
                  );
                }, "Advanced to vehicle assigned")
              }
            >
              Mark supplier confirmed
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Transport voucher / dispatch</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Advances to “{DISPATCHED_STAGE_NAME}”. Attach voucher PDF under Documents.
            </p>
            {!dispatchGate.ok && (
              <p className="text-[10px] text-amber-700 mb-2" role="status">
                {dispatchGate.reason}
              </p>
            )}
            <button
              type="button"
              disabled={busy || closed || !dispatchGate.ok}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(
                  () =>
                    applicationsApi.advance(
                      app.id,
                      `Voucher / dispatched — ${detail?.confirmationNo?.trim() || "see documents"}`,
                    ),
                  "Advanced to dispatched",
                )
              }
            >
              Mark voucher / dispatched
            </button>
          </div>
        </Can>

        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Modification</p>
            <label className={labelCls} htmlFor="top-mod">
              Change details
            </label>
            <input
              id="top-mod"
              className={inputCls}
              value={modNote}
              onChange={(e) => setModNote(e.target.value)}
              placeholder="Time change / vehicle upgrade / extra stop…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !modNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildTransportModificationNote(modNote);
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
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Refund request</p>
            <label className={labelCls} htmlFor="top-refund">
              Refund notes
            </label>
            <input
              id="top-refund"
              className={inputCls}
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              placeholder="No-show / supplier credit…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !refundNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildTransportRefundRequestNote(refundNote);
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
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Cancellation</p>
            <label className={labelCls} htmlFor="top-cancel">
              Cancel reason
            </label>
            <input
              id="top-cancel"
              className={inputCls}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Customer cancel / supplier cancel…"
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
                  await applicationsApi.note(app.id, `Transport cancellation: ${reason}`);
                  await applicationsApi.update(app.id, { status: "cancelled" });
                  setCancelReason("");
                }, "Booking cancelled")
              }
            >
              Cancel transport booking
            </button>
          </div>
        </Can>
      </div>
    </section>
  );
}
