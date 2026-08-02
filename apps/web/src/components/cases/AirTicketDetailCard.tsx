import { FormEvent, useEffect, useState } from "react";
import { applicationsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { AirTicketDetail } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  CABIN_CLASSES,
  TRIP_TYPES,
  airTicketPayload,
  emptyAirTicketForm,
  toLocalInput,
  validateAirTicketForm,
  type AirTicketForm,
} from "@/lib/airTicket";
import { ScanDocumentPanel, ocrFullName } from "@/components/ocr/ScanDocumentPanel";

export function AirTicketDetailCard({
  appId,
  customerId,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  appId: string;
  customerId?: string;
  detail?: AirTicketDetail | null;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const [form, setForm] = useState<AirTicketForm>(emptyAirTicketForm);

  useEffect(() => {
    setForm({
      pnr: detail?.pnr || "",
      airline: detail?.airline || "",
      flightNo: detail?.flightNo || "",
      origin: detail?.origin || "",
      destination: detail?.destination || "",
      tripType: detail?.tripType || "one_way",
      cabinClass: detail?.cabinClass || "economy",
      passengerName: detail?.passengerName || "",
      ticketNo: detail?.ticketNo || "",
      departAt: toLocalInput(detail?.departAt),
      returnAt: toLocalInput(detail?.returnAt),
      notes: detail?.notes || "",
    });
  }, [detail]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateAirTicketForm(form);
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await applicationsApi.putDetail(appId, "air_ticket", airTicketPayload(form));
      setOk("Air ticket details saved");
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  const set = (k: keyof AirTicketForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const disabled = !can("application:update");

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-1">Air ticket details</h2>
      <p className="text-[10px] text-slate-400 mb-3">
        Manual entry from airline / consolidator — no GDS lookup.
      </p>
      <form onSubmit={(e) => void save(e)} className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={labelCls} htmlFor="at-pnr">
              PNR
            </label>
            <input id="at-pnr" className={inputCls} value={form.pnr} onChange={(e) => set("pnr", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="at-ticket">
              Ticket no
            </label>
            <input id="at-ticket" className={inputCls} value={form.ticketNo} onChange={(e) => set("ticketNo", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="at-airline">
              Airline
            </label>
            <input id="at-airline" className={inputCls} value={form.airline} onChange={(e) => set("airline", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="at-flight">
              Flight no
            </label>
            <input id="at-flight" className={inputCls} value={form.flightNo} onChange={(e) => set("flightNo", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="at-origin">
              Origin
            </label>
            <input id="at-origin" className={inputCls} value={form.origin} onChange={(e) => set("origin", e.target.value)} disabled={disabled} placeholder="DAC" />
          </div>
          <div>
            <label className={labelCls} htmlFor="at-dest">
              Destination
            </label>
            <input id="at-dest" className={inputCls} value={form.destination} onChange={(e) => set("destination", e.target.value)} disabled={disabled} placeholder="PEK" />
          </div>
          <div>
            <label className={labelCls} htmlFor="at-trip">
              Trip type
            </label>
            <select id="at-trip" className={inputCls} value={form.tripType} onChange={(e) => set("tripType", e.target.value)} disabled={disabled}>
              {TRIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="at-cabin">
              Cabin
            </label>
            <select id="at-cabin" className={inputCls} value={form.cabinClass} onChange={(e) => set("cabinClass", e.target.value)} disabled={disabled}>
              {CABIN_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="at-depart">
              Departure
            </label>
            <input id="at-depart" type="datetime-local" className={inputCls} value={form.departAt} onChange={(e) => set("departAt", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="at-return">
              Return
            </label>
            <input id="at-return" type="datetime-local" className={inputCls} value={form.returnAt} onChange={(e) => set("returnAt", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="at-pax">
              Passenger name
            </label>
            <input id="at-pax" className={inputCls} value={form.passengerName} onChange={(e) => set("passengerName", e.target.value)} disabled={disabled} />
            <div className="mt-2">
              <ScanDocumentPanel
                customerId={customerId}
                applicationId={appId}
                defaultDocType="passport"
                title="Scan passenger passport"
                onAutofill={(fields) => {
                  setForm((f) => ({
                    ...f,
                    passengerName: ocrFullName(fields) || f.passengerName,
                    notes: [f.notes, fields.passportNo ? `Passport: ${fields.passportNo}` : "", fields.dateOfBirth ? `DOB: ${fields.dateOfBirth}` : ""]
                      .filter(Boolean)
                      .join("\n"),
                  }));
                }}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="at-notes">
              Notes
            </label>
            <textarea id="at-notes" className={inputCls} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} disabled={disabled} />
          </div>
        </div>
        <Can perm="application:update">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
          >
            Save ticket details
          </button>
        </Can>
      </form>
    </section>
  );
}
