import { FormEvent, useEffect, useMemo, useState } from "react";
import { applicationsApi, hajjGroupsApi, hajjPackagesApi, hajjPilgrimsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { HajjDetail, HajjGroup, HajjPilgrim, HajjUmrahPackageProduct } from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import {
  HAJJ_KINDS,
  PACKAGE_CATEGORIES,
  PASSPORT_STATUSES,
  ROOM_TYPES,
  VISA_STATUSES,
  calcBalancePoisha,
  calcMarginPoisha,
  emptyHajjForm,
  fromPoisha,
  hajjPayload,
  toDateInput,
  toPoisha,
  validateHajjForm,
  type HajjForm,
} from "@/lib/hajj";
import { ScanDocumentPanel, ocrFullName } from "@/components/ocr/ScanDocumentPanel";

export function HajjDetailCard({
  appId,
  customerId,
  serviceType,
  detail,
  onSaved,
  setError,
  setOk,
}: {
  appId: string;
  customerId?: string;
  serviceType: "hajj" | "umrah";
  detail?: HajjDetail | null;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const [form, setForm] = useState<HajjForm>(() => emptyHajjForm(serviceType));
  const [packages, setPackages] = useState<HajjUmrahPackageProduct[]>([]);
  const [pilgrims, setPilgrims] = useState<HajjPilgrim[]>([]);
  const [groups, setGroups] = useState<HajjGroup[]>([]);

  useEffect(() => {
    setForm({
      packageType: detail?.packageType || serviceType,
      year: detail?.year || String(new Date().getFullYear()),
      pilgrimName: detail?.pilgrimName || "",
      passportNo: detail?.passportNo || "",
      mahramName: detail?.mahramName || "",
      packageName: detail?.packageName || "",
      packageCode: detail?.packageCode || "",
      packageCategory: detail?.packageCategory || "standard",
      groupCode: detail?.groupCode || "",
      groupName: detail?.groupName || "",
      leaderName: detail?.leaderName || "",
      nationality: detail?.nationality || "Bangladeshi",
      gender: detail?.gender || "",
      dob: detail?.dob || "",
      phone: detail?.phone || "",
      mahramRelation: detail?.mahramRelation || "",
      healthNotes: detail?.healthNotes || "",
      emergencyContact: detail?.emergencyContact || "",
      emergencyPhone: detail?.emergencyPhone || "",
      visaStatus: detail?.visaStatus || "not_applied",
      visaNo: detail?.visaNo || "",
      passportStatus: detail?.passportStatus || "pending",
      flightNo: detail?.flightNo || "",
      airline: detail?.airline || "",
      transportNote: detail?.transportNote || "",
      roomAllocation: detail?.roomAllocation || "",
      occupancyNote: detail?.occupancyNote || "",
      inclusions: detail?.inclusions || "",
      exclusions: detail?.exclusions || "",
      paymentPlanNote: detail?.paymentPlanNote || "",
      supplierCostBdt: fromPoisha(detail?.supplierCostPoisha),
      sellingPriceBdt: fromPoisha(detail?.sellingPricePoisha),
      paidBdt: fromPoisha(detail?.paidPoisha),
      confirmationNo: detail?.confirmationNo || "",
      departureDate: toDateInput(detail?.departureDate),
      returnDate: toDateInput(detail?.returnDate),
      hotelMakkah: detail?.hotelMakkah || "",
      hotelMadinah: detail?.hotelMadinah || "",
      roomType: detail?.roomType || "quad",
      notes: detail?.notes || "",
    });
  }, [detail, serviceType]);

  useEffect(() => {
    void Promise.all([
      hajjPackagesApi.list({ active: "true", limit: 200 }),
      hajjPilgrimsApi.list({ active: "true", limit: 200 }),
      hajjGroupsApi.list({ active: "true", limit: 200 }),
    ])
      .then(([p, pil, g]) => {
        setPackages(listOf<HajjUmrahPackageProduct>(p));
        setPilgrims(listOf<HajjPilgrim>(pil));
        setGroups(listOf<HajjGroup>(g));
      })
      .catch(() => {
        setPackages([]);
        setPilgrims([]);
        setGroups([]);
      });
  }, []);

  const margin = useMemo(() => {
    const m = calcMarginPoisha(toPoisha(form.supplierCostBdt), toPoisha(form.sellingPriceBdt));
    return m == null ? null : m / 100;
  }, [form.supplierCostBdt, form.sellingPriceBdt]);

  const balance = useMemo(() => {
    const b = calcBalancePoisha(toPoisha(form.sellingPriceBdt), toPoisha(form.paidBdt));
    return b == null ? null : b / 100;
  }, [form.sellingPriceBdt, form.paidBdt]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const bad = validateHajjForm(form);
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await applicationsApi.putDetail(appId, serviceType, hajjPayload(form));
      setOk("Hajj/Umrah booking details saved");
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  const set = (k: keyof HajjForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const disabled = !can("application:update");

  function pickPackage(id: string) {
    const p = packages.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      packageType: p.kind || f.packageType,
      packageName: p.name,
      packageCode: p.code,
      packageCategory: p.category || f.packageCategory,
      year: p.year || f.year,
      hotelMakkah: p.hotelMakkah || f.hotelMakkah,
      hotelMadinah: p.hotelMadinah || f.hotelMadinah,
      roomType: p.roomType || f.roomType,
      occupancyNote: p.occupancyNote || f.occupancyNote,
      inclusions: p.inclusions || f.inclusions,
      exclusions: p.exclusions || f.exclusions,
      supplierCostBdt: fromPoisha(p.supplierCostPoisha) || f.supplierCostBdt,
      sellingPriceBdt: fromPoisha(p.sellingPricePoisha) || f.sellingPriceBdt,
    }));
  }

  function pickPilgrim(id: string) {
    const p = pilgrims.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      pilgrimName: p.fullName,
      passportNo: p.passportNo || f.passportNo,
      nationality: p.nationality || f.nationality,
      gender: p.gender || f.gender,
      dob: p.dob || f.dob,
      phone: p.phone || f.phone,
      mahramName: p.mahramName || f.mahramName,
      mahramRelation: p.mahramRelation || f.mahramRelation,
      healthNotes: p.healthNotes || f.healthNotes,
      emergencyContact: p.emergencyContact || f.emergencyContact,
      emergencyPhone: p.emergencyPhone || f.emergencyPhone,
      visaStatus: p.visaStatus || f.visaStatus,
      visaNo: p.visaNo || f.visaNo,
      passportStatus: p.passportStatus || f.passportStatus,
    }));
  }

  function pickGroup(id: string) {
    const g = groups.find((x) => x.id === id);
    if (!g) return;
    setForm((f) => ({
      ...f,
      groupCode: g.code,
      groupName: g.name,
      leaderName: g.leaderName || f.leaderName,
      flightNo: g.flightNo || f.flightNo,
      airline: g.airline || f.airline,
      transportNote: g.transportNote || f.transportNote,
      hotelMakkah: g.hotelMakkah || f.hotelMakkah,
      hotelMadinah: g.hotelMadinah || f.hotelMadinah,
      roomAllocation: g.roomingNote || f.roomAllocation,
      departureDate: toDateInput(g.departAt) || f.departureDate,
      returnDate: toDateInput(g.returnAt) || f.returnDate,
      packageType: g.kind || f.packageType,
    }));
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-1">Hajj / Umrah booking details</h2>
      <p className="text-[10px] text-slate-400 mb-3">
        Pilgrim, package, group, flights, hotels, transport, rooming, and payment plan — operator booking.
      </p>
      <form onSubmit={(e) => void save(e)} className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {packages.length > 0 && (
            <div>
              <label className={labelCls}>Fill from package</label>
              <select
                className={inputCls}
                defaultValue=""
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.value) pickPackage(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">— select —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {pilgrims.length > 0 && (
            <div>
              <label className={labelCls}>Fill from pilgrim</label>
              <select
                className={inputCls}
                defaultValue=""
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.value) pickPilgrim(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">— select —</option>
                {pilgrims.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {groups.length > 0 && (
            <div>
              <label className={labelCls}>Fill from group</label>
              <select
                className={inputCls}
                defaultValue=""
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.value) pickGroup(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">— select —</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code} · {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase pt-1">Pilgrim</p>
        <div className="mb-2">
          <ScanDocumentPanel
            applicationId={appId}
            customerId={customerId}
            defaultDocType="passport"
            title="Scan pilgrim passport"
            onAutofill={(fields) => {
              setForm((f) => ({
                ...f,
                pilgrimName: ocrFullName(fields) || f.pilgrimName,
                passportNo: fields.passportNo || f.passportNo,
                nationality: fields.nationality || f.nationality,
                gender: fields.gender === "M" || fields.gender === "F" ? fields.gender : f.gender,
                dob: fields.dateOfBirth || f.dob,
                visaNo: fields.visaNumber || f.visaNo,
              }));
            }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Kind</label>
            <select className={inputCls} value={form.packageType} onChange={(e) => set("packageType", e.target.value)} disabled={disabled}>
              {HAJJ_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <input className={inputCls} value={form.year} onChange={(e) => set("year", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Pilgrim name</label>
            <input className={inputCls} value={form.pilgrimName} onChange={(e) => set("pilgrimName", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Passport no</label>
            <input className={inputCls} value={form.passportNo} onChange={(e) => set("passportNo", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Passport status</label>
            <select className={inputCls} value={form.passportStatus} onChange={(e) => set("passportStatus", e.target.value)} disabled={disabled}>
              {PASSPORT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Visa status</label>
            <select className={inputCls} value={form.visaStatus} onChange={(e) => set("visaStatus", e.target.value)} disabled={disabled}>
              {VISA_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Visa no</label>
            <input className={inputCls} value={form.visaNo} onChange={(e) => set("visaNo", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Nationality</label>
            <input className={inputCls} value={form.nationality} onChange={(e) => set("nationality", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Gender</label>
            <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)} disabled={disabled}>
              <option value="">—</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>DOB</label>
            <input className={inputCls} value={form.dob} onChange={(e) => set("dob", e.target.value)} disabled={disabled} placeholder="YYYY-MM-DD" />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Mahram</label>
            <input className={inputCls} value={form.mahramName} onChange={(e) => set("mahramName", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Mahram relation</label>
            <input className={inputCls} value={form.mahramRelation} onChange={(e) => set("mahramRelation", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Health notes</label>
            <textarea className={inputCls} rows={2} value={form.healthNotes} onChange={(e) => set("healthNotes", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Emergency contact</label>
            <input className={inputCls} value={form.emergencyContact} onChange={(e) => set("emergencyContact", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Emergency phone</label>
            <input className={inputCls} value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} disabled={disabled} />
          </div>
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase pt-1">Package & group</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Package name</label>
            <input className={inputCls} value={form.packageName} onChange={(e) => set("packageName", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Package code</label>
            <input className={inputCls} value={form.packageCode} onChange={(e) => set("packageCode", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={form.packageCategory} onChange={(e) => set("packageCategory", e.target.value)} disabled={disabled}>
              {PACKAGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Room type</label>
            <select className={inputCls} value={form.roomType} onChange={(e) => set("roomType", e.target.value)} disabled={disabled}>
              {ROOM_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Group code</label>
            <input className={inputCls} value={form.groupCode} onChange={(e) => set("groupCode", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Group name</label>
            <input className={inputCls} value={form.groupName} onChange={(e) => set("groupName", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Leader</label>
            <input className={inputCls} value={form.leaderName} onChange={(e) => set("leaderName", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Confirmation no</label>
            <input className={inputCls} value={form.confirmationNo} onChange={(e) => set("confirmationNo", e.target.value)} disabled={disabled} />
          </div>
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase pt-1">Ops (flights / hotels / transport / rooming)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Departure</label>
            <input type="date" className={inputCls} value={form.departureDate} onChange={(e) => set("departureDate", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Return</label>
            <input type="date" className={inputCls} value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Airline</label>
            <input className={inputCls} value={form.airline} onChange={(e) => set("airline", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Flight no</label>
            <input className={inputCls} value={form.flightNo} onChange={(e) => set("flightNo", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Hotel Makkah</label>
            <input className={inputCls} value={form.hotelMakkah} onChange={(e) => set("hotelMakkah", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Hotel Madinah</label>
            <input className={inputCls} value={form.hotelMadinah} onChange={(e) => set("hotelMadinah", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Ground transport</label>
            <textarea className={inputCls} rows={2} value={form.transportNote} onChange={(e) => set("transportNote", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Room allocation</label>
            <textarea className={inputCls} rows={2} value={form.roomAllocation} onChange={(e) => set("roomAllocation", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Occupancy</label>
            <textarea className={inputCls} rows={2} value={form.occupancyNote} onChange={(e) => set("occupancyNote", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Inclusions</label>
            <textarea className={inputCls} rows={2} value={form.inclusions} onChange={(e) => set("inclusions", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Exclusions</label>
            <textarea className={inputCls} rows={2} value={form.exclusions} onChange={(e) => set("exclusions", e.target.value)} disabled={disabled} />
          </div>
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase pt-1">Pricing (BDT)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className={labelCls}>Supplier cost (৳)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.supplierCostBdt} onChange={(e) => set("supplierCostBdt", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Selling price (৳)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.sellingPriceBdt} onChange={(e) => set("sellingPriceBdt", e.target.value)} disabled={disabled} />
          </div>
          <div>
            <label className={labelCls}>Paid (৳)</label>
            <input type="number" min="0" step="0.01" className={inputCls} value={form.paidBdt} onChange={(e) => set("paidBdt", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-3 text-[11px] text-slate-600">
            Margin: {margin == null ? "—" : `৳${margin.toFixed(2)}`} · Balance:{" "}
            {balance == null ? "—" : `৳${balance.toFixed(2)}`}
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Payment plan / installments</label>
            <textarea className={inputCls} rows={2} value={form.paymentPlanNote} onChange={(e) => set("paymentPlanNote", e.target.value)} disabled={disabled} />
          </div>
          <div className="sm:col-span-3">
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} disabled={disabled} />
          </div>
        </div>

        <Can perm="application:update">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
          >
            Save booking details
          </button>
        </Can>
      </form>
    </section>
  );
}
