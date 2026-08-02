import { FormEvent, useEffect, useState } from "react";
import { applicationsApi, transportRoutesApi, transportVehiclesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { TransportDetail, TransportRoute, TransportVehicleType } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  SERVICE_KINDS,
  SERVICE_KIND_LABELS,
  VEHICLE_CATEGORIES,
  emptyTransportForm,
  toLocalInput,
  transportPayload,
  validateTransportForm,
  type TransportForm,
} from "@/lib/transport";

export function TransportDetailCard({
  appId,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  appId: string;
  detail?: TransportDetail | null;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const [form, setForm] = useState<TransportForm>(emptyTransportForm);
  const [vehicles, setVehicles] = useState<TransportVehicleType[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);

  useEffect(() => {
    setForm({
      serviceKind: detail?.serviceKind || "airport_transfer",
      vehicleType: detail?.vehicleType || "sedan",
      pickupLocation: detail?.pickupLocation || "",
      dropLocation: detail?.dropLocation || "",
      routeName: detail?.routeName || "",
      scheduledAt: toLocalInput(detail?.scheduledAt),
      passengers: detail?.passengers != null ? String(detail.passengers) : "1",
      driverName: detail?.driverName || "",
      vehicleNo: detail?.vehicleNo || "",
      confirmationNo: detail?.confirmationNo || "",
      notes: detail?.notes || "",
    });
  }, [detail]);

  useEffect(() => {
    void transportVehiclesApi
      .list({ active: "true", limit: 200 })
      .then((r) => setVehicles(listOf<TransportVehicleType>(r)))
      .catch(() => setVehicles([]));
    void transportRoutesApi
      .list({ active: "true", limit: 200 })
      .then((r) => setRoutes(listOf<TransportRoute>(r)))
      .catch(() => setRoutes([]));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateTransportForm(form);
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await applicationsApi.putDetail(appId, "transport", transportPayload(form));
      setOk("Transport booking details saved");
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  const set = (k: keyof TransportForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const disabled = !can("application:update");

  function pickVehicle(id: string) {
    const v = vehicles.find((x) => x.id === id);
    if (!v) return;
    setForm((f) => ({ ...f, vehicleType: v.category || f.vehicleType, notes: f.notes || v.name }));
  }

  function pickRoute(id: string) {
    const r = routes.find((x) => x.id === id);
    if (!r) return;
    setForm((f) => ({
      ...f,
      routeName: r.name,
      pickupLocation: r.origin || f.pickupLocation,
      dropLocation: r.destination || f.dropLocation,
      serviceKind: SERVICE_KINDS.includes(r.kind as (typeof SERVICE_KINDS)[number]) ? r.kind : f.serviceKind,
    }));
  }

  return (
    <section className="bg-white rounded-xl border border-[var(--border)] p-4">
      <h2 className="text-[12px] font-bold text-[var(--primary)] mb-1">Transport booking details</h2>
      <p className="text-[10px] text-[var(--muted-foreground)] mb-3">
        Supplier-purchased transfer — no owned fleet or GPS. Driver/plate from supplier confirmation.
      </p>
      <form onSubmit={(e) => void save(e)} className="space-y-2">
        {(vehicles.length > 0 || routes.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vehicles.length > 0 && (
              <div>
                <label className={labelCls} htmlFor="tr-pick-v">
                  Fill from vehicle catalog
                </label>
                <select
                  id="tr-pick-v"
                  className={inputCls}
                  defaultValue=""
                  disabled={disabled}
                  onChange={(e) => {
                    if (e.target.value) pickVehicle(e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">— select offer —</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {routes.length > 0 && (
              <div>
                <label className={labelCls} htmlFor="tr-pick-r">
                  Fill from route catalog
                </label>
                <select
                  id="tr-pick-r"
                  className={inputCls}
                  defaultValue=""
                  disabled={disabled}
                  onChange={(e) => {
                    if (e.target.value) pickRoute(e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">— select route —</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={labelCls} htmlFor="tr-kind">
              Service
            </label>
            <select
              id="tr-kind"
              className={inputCls}
              value={form.serviceKind}
              onChange={(e) => set("serviceKind", e.target.value)}
              disabled={disabled}
            >
              {SERVICE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {SERVICE_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-vtype">
              Vehicle category
            </label>
            <select
              id="tr-vtype"
              className={inputCls}
              value={form.vehicleType}
              onChange={(e) => set("vehicleType", e.target.value)}
              disabled={disabled}
            >
              {VEHICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-pickup">
              Pickup
            </label>
            <input
              id="tr-pickup"
              className={inputCls}
              value={form.pickupLocation}
              onChange={(e) => set("pickupLocation", e.target.value)}
              disabled={disabled}
              placeholder="Airport / hotel / address"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-drop">
              Drop-off
            </label>
            <input
              id="tr-drop"
              className={inputCls}
              value={form.dropLocation}
              onChange={(e) => set("dropLocation", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-route">
              Route name
            </label>
            <input
              id="tr-route"
              className={inputCls}
              value={form.routeName}
              onChange={(e) => set("routeName", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-sched">
              Scheduled at
            </label>
            <input
              id="tr-sched"
              type="datetime-local"
              className={inputCls}
              value={form.scheduledAt}
              onChange={(e) => set("scheduledAt", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-pax">
              Passengers
            </label>
            <input
              id="tr-pax"
              className={inputCls}
              type="number"
              min="1"
              value={form.passengers}
              onChange={(e) => set("passengers", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-conf">
              Supplier confirmation no
            </label>
            <input
              id="tr-conf"
              className={inputCls}
              value={form.confirmationNo}
              onChange={(e) => set("confirmationNo", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-driver">
              Driver name (supplier)
            </label>
            <input
              id="tr-driver"
              className={inputCls}
              value={form.driverName}
              onChange={(e) => set("driverName", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="tr-plate">
              Vehicle / plate (supplier)
            </label>
            <input
              id="tr-plate"
              className={inputCls}
              value={form.vehicleNo}
              onChange={(e) => set("vehicleNo", e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="tr-notes">
              Notes
            </label>
            <textarea
              id="tr-notes"
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
            Save transport details
          </button>
        </Can>
      </form>
    </section>
  );
}
