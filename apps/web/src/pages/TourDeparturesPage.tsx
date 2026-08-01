import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { tourDeparturesApi, tourPackagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { TourDeparture, TourPackageProduct } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { TourModuleNav } from "@/components/tours/TourModuleNav";
import { fromDateInput, toDateInput } from "@/lib/tour";

const STATUSES = ["open", "full", "closed", "cancelled"] as const;

export default function TourDeparturesPage() {
  const [rows, setRows] = useState<TourDeparture[]>([]);
  const [packages, setPackages] = useState<TourPackageProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [packageId, setPackageId] = useState("");
  const [departAt, setDepartAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [seats, setSeats] = useState("");
  const [status, setStatus] = useState("open");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [d, p] = await Promise.all([
        tourDeparturesApi.list({ limit: 200 }),
        tourPackagesApi.list({ active: "true", limit: 200 }),
      ]);
      setRows(listOf<TourDeparture>(d));
      setPackages(listOf<TourPackageProduct>(p));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load departures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!packageId || !departAt) {
      setError("Package and departure date are required");
      return;
    }
    setError("");
    setOk("");
    try {
      await tourDeparturesApi.create({
        packageId,
        departAt: fromDateInput(departAt),
        returnAt: fromDateInput(returnAt) ?? null,
        seats: seats ? Number(seats) : undefined,
        status,
        notes: notes.trim() || undefined,
      });
      setOk("Departure added");
      setDepartAt("");
      setReturnAt("");
      setSeats("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={CalendarDays}
        title="Departure calendar"
        subtitle="Scheduled departures linked to package products (group / fixed-date tours)."
        breadcrumb={[{ label: "Tours", to: "/tours" }, { label: "Departure calendar" }]}
      />
      <TourModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form
            onSubmit={(e) => void create(e)}
            className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            <div className="sm:col-span-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Add departure</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="dep-pkg">
                Package *
              </label>
              <select
                id="dep-pkg"
                className={inputCls}
                required
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
              >
                <option value="">— select —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="dep-status">
                Status
              </label>
              <select id="dep-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="dep-at">
                Depart *
              </label>
              <input
                id="dep-at"
                type="date"
                className={inputCls}
                required
                value={departAt}
                onChange={(e) => setDepartAt(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dep-ret">
                Return
              </label>
              <input
                id="dep-ret"
                type="date"
                className={inputCls}
                value={returnAt}
                onChange={(e) => setReturnAt(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dep-seats">
                Seats
              </label>
              <input
                id="dep-seats"
                type="number"
                min="1"
                className={inputCls}
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="dep-notes">
                Notes
              </label>
              <input id="dep-notes" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              >
                Add departure
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No departures" hint="Add a departure for an active package product." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Package</th>
                    <th className="px-4 py-2 font-bold">Depart</th>
                    <th className="px-4 py-2 font-bold">Return</th>
                    <th className="px-4 py-2 font-bold">Seats</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                    <th className="px-4 py-2 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                        {d.package ? `${d.package.code} · ${d.package.name}` : d.packageId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{toDateInput(d.departAt) || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{toDateInput(d.returnAt) || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.seats ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.status}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </PageShell>
  );
}
