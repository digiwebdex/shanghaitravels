import { useState } from "react";
import { applicationsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { AirTicketDetail, Application, ApplicationStage } from "@/lib/types";
import { Can } from "@/auth/Can";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  buildFareQuotationNote,
  buildReissueNote,
  buildRefundRequestNote,
  canMarkTicketIssued,
  ISSUE_STAGE_NAME,
} from "@/lib/airTicketOps";

/**
 * Manual air-ticket operations (no GDS).
 * Maps Figma Reissue/Cancel/Refund / Issue intents onto case spine notes + status + advance.
 */
export function TicketOpsCard({
  app,
  stages,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  stages: ApplicationStage[];
  detail?: AirTicketDetail | null;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const [fareAmount, setFareAmount] = useState("");
  const [fareNote, setFareNote] = useState("");
  const [reissueNote, setReissueNote] = useState("");
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
  const issueGate = canMarkTicketIssued(detail, stages);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4" aria-labelledby="ticket-ops-heading">
      <h2 id="ticket-ops-heading" className="text-[12px] font-bold text-slate-800 mb-1">
        Ticket operations
      </h2>
      <p className="text-[10px] text-slate-400 mb-3">
        Manual fulfilment actions — fare quote, issue, reissue, cancel, refund request. No GDS.
      </p>

      <div className="space-y-4">
        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Fare quotation</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls} htmlFor="ops-fare-amt">
                  Quoted fare (৳)
                </label>
                <input
                  id="ops-fare-amt"
                  className={inputCls}
                  type="number"
                  min="0"
                  step="0.01"
                  value={fareAmount}
                  onChange={(e) => setFareAmount(e.target.value)}
                  disabled={busy || closed}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="ops-fare-note">
                  Quote notes
                </label>
                <input
                  id="ops-fare-note"
                  className={inputCls}
                  value={fareNote}
                  onChange={(e) => setFareNote(e.target.value)}
                  placeholder="Consolidator / airline quote ref…"
                  disabled={busy || closed}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={busy || closed || !fareAmount.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildFareQuotationNote(fareAmount, fareNote);
                  if (!msg) throw new ApiError("Enter a fare amount", 400);
                  await applicationsApi.note(app.id, msg);
                  setFareAmount("");
                  setFareNote("");
                }, "Fare quotation recorded")
              }
            >
              Record fare quotation
            </button>
          </div>
        </Can>

        <Can perm="application:advance-stage">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ticket issue</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Requires ticket number on Air ticket details, then advances to “{ISSUE_STAGE_NAME}”.
            </p>
            {!issueGate.ok && (
              <p className="text-[10px] text-amber-700 mb-2" role="status">
                {issueGate.reason}
              </p>
            )}
            <button
              type="button"
              disabled={busy || closed || !issueGate.ok}
              className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              onClick={() =>
                run(async () => {
                  const gate = canMarkTicketIssued(detail, stages);
                  if (!gate.ok) throw new ApiError(gate.reason || "Cannot issue", 400);
                  await applicationsApi.advance(
                    app.id,
                    `Ticket issued — ${detail?.ticketNo?.trim()} / PNR ${detail?.pnr?.trim() || "—"}`,
                  );
                }, "Advanced to ticket issued")
              }
            >
              Mark ticket issued
            </button>
          </div>
        </Can>

        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Reissue</p>
            <label className={labelCls} htmlFor="ops-reissue">
              Reissue details
            </label>
            <input
              id="ops-reissue"
              className={inputCls}
              value={reissueNote}
              onChange={(e) => setReissueNote(e.target.value)}
              placeholder="New dates / fare difference / airline authority…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !reissueNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildReissueNote(reissueNote);
                  if (!msg) throw new ApiError("Enter reissue details", 400);
                  await applicationsApi.note(app.id, msg);
                  setReissueNote("");
                }, "Reissue request recorded")
              }
            >
              Record reissue request
            </button>
          </div>
        </Can>

        <Can perm="application:note">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Refund request</p>
            <p className="text-[10px] text-slate-400 mb-2">
              Logs a refund request on the case timeline. Post the money refund under Invoice &amp; payment
              (payment:refund).
            </p>
            <label className={labelCls} htmlFor="ops-refund">
              Refund notes
            </label>
            <input
              id="ops-refund"
              className={inputCls}
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              placeholder="Airline credit / penalty / customer request…"
              disabled={busy || closed}
            />
            <button
              type="button"
              disabled={busy || closed || !refundNote.trim()}
              className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              onClick={() =>
                run(async () => {
                  const msg = buildRefundRequestNote(refundNote);
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
            <label className={labelCls} htmlFor="ops-cancel">
              Cancel reason
            </label>
            <input
              id="ops-cancel"
              className={inputCls}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Customer cancelled / void / airline cancel…"
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
                  await applicationsApi.note(app.id, `Cancellation: ${reason}`);
                  await applicationsApi.update(app.id, { status: "cancelled" });
                  setCancelReason("");
                }, "Case cancelled")
              }
            >
              Cancel ticket case
            </button>
          </div>
        </Can>
      </div>
    </section>
  );
}
