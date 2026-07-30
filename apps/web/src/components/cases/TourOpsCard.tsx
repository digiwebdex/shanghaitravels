import { useState } from "react";
import { applicationsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { Application, ApplicationStage, TourDetail } from "@/lib/types";
import { Can } from "@/auth/Can";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  CONFIRM_STAGE_NAME,
  IN_PROGRESS_STAGE_NAME,
  buildTourModificationNote,
  buildTourQuoteNote,
  buildTourRefundRequestNote,
  canConfirmTour,
  canStartTour,
} from "@/lib/tourOps";

/** Manual tour ops — quotation, confirm, voucher, modify, cancel. */
export function TourOpsCard({
  app,
  stages,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  stages: ApplicationStage[];
  detail?: TourDetail | null;
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
  const confirmGate = canConfirmTour(detail, stages);
  const startGate = canStartTour(stages);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4" aria-labelledby="tour-ops-heading">
      <h2 id="tour-ops-heading" className="text-[12px] font-bold text-slate-800 mb-1">
        Tour operations
      </h2>
      <p className="text-[10px] text-slate-400 mb-3">
        Customer quotation, supplier costing, package voucher, modify, cancel — curated supplier products.
      </p>

      <div className="space-y-4">
        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Customer quotation</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="tour-quote-amt">
                  Quote (৳)
                </label>
                <input
                  id="tour-quote-amt"
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
                <label className={labelCls} htmlFor="tour-quote-note">
                  Quote notes
                </label>
                <input
                  id="tour-quote-note"
                  className={inputCls}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="Validity / inclusions summary…"
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
                  const msg = buildTourQuoteNote(quoteAmt, quoteNote);
                  if (!msg) throw new ApiError("Enter a quote amount", 400);
                  await applicationsApi.note(app.id, msg);
                  setQuoteAmt("");
                  setQuoteNote("");
                }, "Tour quotation recorded")
              }
            >
              Record quotation
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Package confirmation</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Requires confirmation / voucher number, then advances to “{CONFIRM_STAGE_NAME}”.
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
                  const gate = canConfirmTour(detail, stages);
                  if (!gate.ok) throw new ApiError(gate.reason || "Cannot confirm", 400);
                  await applicationsApi.advance(
                    app.id,
                    `Package confirmed — ${detail?.confirmationNo?.trim()}`,
                  );
                }, "Advanced to confirmed")
              }
            >
              Mark package confirmed
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Package voucher / departure</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Advances to “{IN_PROGRESS_STAGE_NAME}”. Attach voucher PDF under Documents.
            </p>
            {!startGate.ok && (
              <p className="text-[10px] text-amber-700 mb-2" role="status">
                {startGate.reason}
              </p>
            )}
            <button
              type="button"
              disabled={busy || closed || !startGate.ok}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(
                  () =>
                    applicationsApi.advance(
                      app.id,
                      `Package voucher / in progress — ${detail?.confirmationNo?.trim() || "see documents"}`,
                    ),
                  "Advanced to in progress",
                )
              }
            >
              Mark voucher / in progress
            </button>
          </div>
        </Can>

        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Modification</p>
            <label className={labelCls} htmlFor="tour-mod">
              Change details
            </label>
            <input
              id="tour-mod"
              className={inputCls}
              value={modNote}
              onChange={(e) => setModNote(e.target.value)}
              placeholder="Date change / hotel upgrade / pax change…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !modNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildTourModificationNote(modNote);
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
            <label className={labelCls} htmlFor="tour-refund">
              Refund notes
            </label>
            <input
              id="tour-refund"
              className={inputCls}
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              placeholder="Supplier credit / cancellation fee…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !refundNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildTourRefundRequestNote(refundNote);
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
            <label className={labelCls} htmlFor="tour-cancel">
              Cancel reason
            </label>
            <input
              id="tour-cancel"
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
                  await applicationsApi.note(app.id, `Tour cancellation: ${reason}`);
                  await applicationsApi.update(app.id, { status: "cancelled" });
                  setCancelReason("");
                }, "Booking cancelled")
              }
            >
              Cancel tour booking
            </button>
          </div>
        </Can>
      </div>
    </section>
  );
}
