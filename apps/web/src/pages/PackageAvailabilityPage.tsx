import { FormEvent, useCallback, useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { packagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { PackageAvailability } from "@/lib/packages";
import { toPoisha } from "@/lib/tour";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { PackageModuleNav } from "@/components/packages/PackageModuleNav";
import { PackagePicker } from "@/components/packages/PackagePicker";
import { formatPrice } from "@/lib/packages";

export default function PackageAvailabilityPage() {
  const [packageId, setPackageId] = useState("");
  const [slots, setSlots] = useState<PackageAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [priceBdt, setPriceBdt] = useState("");

  const loadSlots = useCallback(async () => {
    if (!packageId) {
      setSlots([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setSlots(listOf<PackageAvailability>(await packagesApi.listAvailability(packageId)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  async function addSlot(e: FormEvent) {
    e.preventDefault();
    if (!packageId || !departDate || !totalSeats) {
      setError("Package, depart date, and seats required");
      return;
    }
    try {
      await packagesApi.upsertAvailability(packageId, {
        departDate: new Date(`${departDate}T12:00:00`).toISOString(),
        returnDate: returnDate ? new Date(`${returnDate}T12:00:00`).toISOString() : undefined,
        totalSeats: Number(totalSeats),
        pricePoisha: priceBdt.trim() ? toPoisha(priceBdt) : undefined,
        status: "open",
      });
      setOk("Slot saved");
      setDepartDate("");
      setReturnDate("");
      setTotalSeats("");
      setPriceBdt("");
      await loadSlots();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function removeSlot(slotId: string) {
    if (!packageId) return;
    try {
      await packagesApi.removeAvailability(packageId, slotId);
      await loadSlots();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Calendar}
        title="Package availability"
        breadcrumb={[{ label: "Products", to: "/packages" }, { label: "Package availability" }]}
      />
      <PackageModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <PackagePicker value={packageId} onChange={(id) => setPackageId(id)} label="Select package" required />

        {packageId && (
          <form onSubmit={(e) => void addSlot(e)} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>Depart date *</label>
              <input type="date" className={inputCls} value={departDate} onChange={(e) => setDepartDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Return date</label>
              <input type="date" className={inputCls} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Total seats *</label>
              <input type="number" min="1" className={inputCls} value={totalSeats} onChange={(e) => setTotalSeats(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Price override (BDT)</label>
              <input className={inputCls} value={priceBdt} onChange={(e) => setPriceBdt(e.target.value)} />
            </div>
            <div>
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold">
                Add slot
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <InlineSpinner />
        ) : !packageId ? (
          <EmptyState title="Pick a package" hint="Select a package to manage departure slots." />
        ) : !slots.length ? (
          <EmptyState title="No slots" hint="Add availability slots for this package." />
        ) : (
          <table className="w-full text-[11px] bg-white border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-2">Depart</th>
                <th className="text-left p-2">Return</th>
                <th className="text-left p-2">Seats</th>
                <th className="text-left p-2">Price</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2" />
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="p-2">{s.departDate.slice(0, 10)}</td>
                  <td className="p-2">{s.returnDate?.slice(0, 10) || "—"}</td>
                  <td className="p-2">
                    {s.seatsAvailable ?? s.totalSeats - (s.seatsBooked || 0)} / {s.totalSeats}
                  </td>
                  <td className="p-2">{formatPrice(s.pricePoisha)}</td>
                  <td className="p-2">{s.status || "open"}</td>
                  <td className="p-2">
                    <button type="button" className="text-red-600" onClick={() => void removeSlot(s.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </PageShell>
  );
}
