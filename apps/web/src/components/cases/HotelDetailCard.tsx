import { FormEvent, useEffect, useState } from "react";
import { applicationsApi, hotelsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { HotelDetail, HotelProperty } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  MEAL_PLANS,
  MEAL_PLAN_LABELS,
  ROOM_TYPES,
  calcNights,
  emptyHotelForm,
  hotelPayload,
  toDateInput,
  validateHotelForm,
  type HotelForm,
} from "@/lib/hotel";
import { ScanDocumentPanel, ocrFullName } from "@/components/ocr/ScanDocumentPanel";

export function HotelDetailCard({
  appId,
  detail,
  onSaved,
  setError,
  setOk,
  customerId,
}: {
  appId: string;
  detail?: HotelDetail | null;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
  customerId?: string;
}) {
  const { can } = useAuth();
  const [form, setForm] = useState<HotelForm>(emptyHotelForm);
  const [catalog, setCatalog] = useState<HotelProperty[]>([]);

  useEffect(() => {
    setForm({
      hotelName: detail?.hotelName || "",
      city: detail?.city || "",
      country: detail?.country || "",
      checkIn: toDateInput(detail?.checkIn),
      checkOut: toDateInput(detail?.checkOut),
      nights: detail?.nights != null ? String(detail.nights) : "",
      roomType: detail?.roomType || "Standard",
      mealPlan: detail?.mealPlan || "BB",
      rooms: detail?.rooms != null ? String(detail.rooms) : "1",
      guests: detail?.guests != null ? String(detail.guests) : "2",
      confirmationNo: detail?.confirmationNo || "",
      notes: detail?.notes || "",
    });
  }, [detail]);

  useEffect(() => {
    void hotelsApi
      .list({ active: "true", limit: 200 })
      .then((r) => setCatalog(listOf<HotelProperty>(r)))
      .catch(() => setCatalog([]));
  }, []);

  function setDates(which: "checkIn" | "checkOut", v: string) {
    setForm((f) => {
      const next = { ...f, [which]: v };
      const n = calcNights(
        which === "checkIn" ? v : f.checkIn,
        which === "checkOut" ? v : f.checkOut,
      );
      if (n != null) next.nights = String(n);
      return next;
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateHotelForm(form);
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await applicationsApi.putDetail(appId, "hotel", hotelPayload(form));
      setOk("Hotel booking details saved");
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  const set = (k: keyof HotelForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const disabled = !can("application:update");

  function pickProperty(id: string) {
    const h = catalog.find((x) => x.id === id);
    if (!h) return;
    setForm((f) => ({
      ...f,
      hotelName: h.name,
      city: h.city || f.city,
      country: h.country || f.country,
    }));
  }

  return (
    <section className="bg-white rounded-xl border border-[var(--border)] p-4">
      <h2 className="text-[12px] font-bold text-[var(--primary)] mb-1">Hotel booking details</h2>
      <p className="text-[10px] text-[var(--muted-foreground)] mb-3">
        Manual booking from supplier / property — no live hotel search.
      </p>
      <Can perm="ocr:use">
        <div className="mb-3">
          <ScanDocumentPanel
            customerId={customerId}
            applicationId={appId}
            defaultDocType="passport"
            savePassportOnConfirm={Boolean(customerId)}
            title="Guest passport (passenger documents)"
            compact
            onAutofill={(fields) => {
              const name = ocrFullName(fields);
              setForm((f) => ({
                ...f,
                notes: [f.notes, name ? `Guest: ${name}` : "", fields.passportNo ? `Passport: ${fields.passportNo}` : ""]
                  .filter(Boolean)
                  .join(" · "),
              }));
              setOk(name ? `Guest OCR: ${name}` : "Guest OCR ready");
            }}
          />
        </div>
      </Can>
      <form onSubmit={(e) => void save(e)} className="space-y-2">
        {catalog.length > 0 && (
          <div>
            <label className={labelCls} htmlFor="ht-pick">
              Fill from hotel master
            </label>
            <select
              id="ht-pick"
              className={inputCls}
              defaultValue=""
              disabled={disabled}
              onChange={(e) => {
                if (e.target.value) pickProperty(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">— select property —</option>
              {catalog.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                  {h.city ? ` · ${h.city}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="ht-name">
              Hotel name
            </label>
            <input
              id="ht-name"
              className={inputCls}
              value={form.hotelName}
              onChange={(e) => set("hotelName", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-city">
              City
            </label>
            <input id="ht-city" className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-country">
              Country
            </label>
            <input
              id="ht-country"
              className={inputCls}
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-in">
              Check-in
            </label>
            <input
              id="ht-in"
              type="date"
              className={inputCls}
              value={form.checkIn}
              onChange={(e) => setDates("checkIn", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-out">
              Check-out
            </label>
            <input
              id="ht-out"
              type="date"
              className={inputCls}
              value={form.checkOut}
              onChange={(e) => setDates("checkOut", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-nights">
              Nights
            </label>
            <input
              id="ht-nights"
              className={inputCls}
              type="number"
              min="0"
              value={form.nights}
              onChange={(e) => set("nights", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-conf">
              Confirmation / voucher no
            </label>
            <input
              id="ht-conf"
              className={inputCls}
              value={form.confirmationNo}
              onChange={(e) => set("confirmationNo", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-room">
              Room type
            </label>
            <select
              id="ht-room"
              className={inputCls}
              value={form.roomType}
              onChange={(e) => set("roomType", e.target.value)}
              disabled={disabled}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-meal">
              Meal plan
            </label>
            <select
              id="ht-meal"
              className={inputCls}
              value={form.mealPlan}
              onChange={(e) => set("mealPlan", e.target.value)}
              disabled={disabled}
            >
              {MEAL_PLANS.map((m) => (
                <option key={m} value={m}>
                  {m} — {MEAL_PLAN_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-rooms">
              Rooms
            </label>
            <input
              id="ht-rooms"
              className={inputCls}
              type="number"
              min="1"
              value={form.rooms}
              onChange={(e) => set("rooms", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="ht-guests">
              Guests
            </label>
            <input
              id="ht-guests"
              className={inputCls}
              type="number"
              min="1"
              value={form.guests}
              onChange={(e) => set("guests", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="ht-notes">
              Notes
            </label>
            <textarea
              id="ht-notes"
              className={inputCls}
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
        <Can perm="application:update">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
          >
            Save hotel details
          </button>
        </Can>
      </form>
    </section>
  );
}
