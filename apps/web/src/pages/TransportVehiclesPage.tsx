import { FormEvent, useCallback, useEffect, useState } from "react";
import { Car } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { transportVehiclesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { TransportVehicleType } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { TransportModuleNav } from "@/components/transport/TransportModuleNav";
import { VEHICLE_CATEGORIES } from "@/lib/transport";

export default function TransportVehiclesPage() {
  const [rows, setRows] = useState<TransportVehicleType[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("sedan");
  const [capacity, setCapacity] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await transportVehiclesApi.list({ q: q || undefined, limit: 200 });
      setRows(listOf<TransportVehicleType>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load vehicle catalog");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setOk("");
    try {
      await transportVehiclesApi.create({
        name: name.trim(),
        category,
        capacity: capacity ? Number(capacity) : undefined,
        notes: notes.trim() || undefined,
      });
      setOk("Vehicle offer added");
      setName("");
      setCapacity("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Car}
        title="Vehicle catalog"
        subtitle="Supplier vehicle offers by category. Not owned fleet inventory."
        breadcrumb={[{ label: "Transport", to: "/transport" }, { label: "Vehicle catalog" }]}
      />
      <TransportModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form
            onSubmit={(e) => void create(e)}
            className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            <div className="sm:col-span-3">
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">Add vehicle offer</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="tv-name">
                Name *
              </label>
              <input id="tv-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls} htmlFor="tv-cat">
                Category
              </label>
              <select id="tv-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {VEHICLE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="tv-cap">
                Capacity
              </label>
              <input
                id="tv-cap"
                className={inputCls}
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="tv-notes">
                Notes
              </label>
              <input id="tv-notes" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              >
                Add vehicle offer
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-[var(--border)] rounded-lg text-[11px]"
              placeholder="Search vehicles…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search vehicle catalog"
            />
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-[11px] font-semibold"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No vehicle offers" hint="Add supplier vehicle types used for transfers." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Category</th>
                    <th className="px-4 py-2 font-bold">Capacity</th>
                    <th className="px-4 py-2 font-bold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((v) => (
                    <tr key={v.id} className="border-b border-[var(--border)] text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-[var(--primary)]">{v.name}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{v.category}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{v.capacity ?? "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{v.notes || "—"}</td>
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
