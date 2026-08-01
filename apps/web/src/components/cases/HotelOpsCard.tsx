import { useState } from "react";
import { applicationsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { Application, ApplicationStage, HotelDetail } from "@/lib/types";
import { Can } from "@/auth/Can";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  buildHotelQuoteNote,
  buildHotelRefundRequestNote,
  buildModificationNote,
  canConfirmBooking,
  canIssueVoucher,
  CONFIRM_STAGE_NAME,
  VOUCHER_STAGE_NAME,
} from "@/lib/hotelOps";

/** Manual hotel ops — quote, confirm, voucher, modify, cancel (no GDS). */
export function HotelOpsCard({
  app,
  stages,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  stages: ApplicationStage[];
  detail?: HotelDetail | null;
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
  const confirmGate = canConfirmBooking(detail, stages);
  const voucherGate = canIssueVoucher(stages);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4" aria-labelledby="hotel-ops-heading">
      <h2 id="hotel-ops-heading" className="text-[12px] font-bold text-slate-800 mb-1">
        Hotel operations
      </h2>
      <p className="text-[10px] text-slate-400 mb-3">
        Quote, confirm, voucher, modify, cancel — manual fulfilment on the case spine.
      </p>

      <div className="space-y-4">
        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Availability & quote</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="hop-quote-amt">
                  Quote (৳)
                </label>
                <input
                  id="hop-quote-amt"
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
                <label className={labelCls} htmlFor="hop-quote-note">
                  Quote notes
                </label>
                <input
                  id="hop-quote-note"
                  className={inputCls}
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="Supplier / property quote ref…"
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
                  const msg = buildHotelQuoteNote(quoteAmt, quoteNote);
                  if (!msg) throw new ApiError("Enter a quote amount", 400);
                  await applicationsApi.note(app.id, msg);
                  setQuoteAmt("");
                  setQuoteNote("");
                }, "Hotel quote recorded")
              }
            >
              Record quote
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Booking confirmation</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Requires confirmation number, then advances to “{CONFIRM_STAGE_NAME}”.
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
              style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              onClick={() =>
                run(async () => {
                  const gate = canConfirmBooking(detail, stages);
                  if (!gate.ok) throw new ApiError(gate.reason || "Cannot confirm", 400);
                  await applicationsApi.advance(
                    app.id,
                    `Booking confirmed — ${detail?.confirmationNo?.trim()}`,
                  );
                }, "Advanced to booking confirmed")
              }
            >
              Mark booking confirmed
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Hotel voucher</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Advances to “{VOUCHER_STAGE_NAME}”. Attach the voucher PDF under Documents.
            </p>
            {!voucherGate.ok && (
              <p className="text-[10px] text-amber-700 mb-2" role="status">
                {voucherGate.reason}
              </p>
            )}
            <button
              type="button"
              disabled={busy || closed || !voucherGate.ok}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(
                  () =>
                    applicationsApi.advance(
                      app.id,
                      `Voucher delivered — ${detail?.confirmationNo?.trim() || "see documents"}`,
                    ),
                  "Advanced to voucher delivered",
                )
              }
            >
              Mark voucher delivered
            </button>
          </div>
        </Can>

        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Modification</p>
            <label className={labelCls} htmlFor="hop-mod">
              Change details
            </label>
            <input
              id="hop-mod"
              className={inputCls}
              value={modNote}
              onChange={(e) => setModNote(e.target.value)}
              placeholder="Date change / room upgrade / guest name…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !modNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildModificationNote(modNote);
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
            <label className={labelCls} htmlFor="hop-refund">
              Refund notes
            </label>
            <input
              id="hop-refund"
              className={inputCls}
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              placeholder="No-show / early checkout / supplier credit…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !refundNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildHotelRefundRequestNote(refundNote);
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
            <label className={labelCls} htmlFor="hop-cancel">
              Cancel reason
            </label>
            <input
              id="hop-cancel"
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
                  await applicationsApi.note(app.id, `Hotel cancellation: ${reason}`);
                  await applicationsApi.update(app.id, { status: "cancelled" });
                  setCancelReason("");
                }, "Booking cancelled")
              }
            >
              Cancel hotel booking
            </button>
          </div>
        </Can>
      </div>
    </section>
  );
}
