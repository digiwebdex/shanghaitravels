import { FormEvent, useCallback, useEffect, useState } from "react";
import { Route } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { transportRoutesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { TransportRoute } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { TransportModuleNav } from "@/components/transport/TransportModuleNav";
import { SERVICE_KINDS, SERVICE_KIND_LABELS } from "@/lib/transport";

export default function TransportRoutesPage() {
  const [rows, setRows] = useState<TransportRoute[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [kind, setKind] = useState("airport_transfer");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await transportRoutesApi.list({ q: q || undefined, limit: 200 });
      setRows(listOf<TransportRoute>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !origin.trim() || !destination.trim()) {
      setError("Name, origin, and destination are required");
      return;
    }
    setError("");
    setOk("");
    try {
      await transportRoutesApi.create({
        name: name.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        kind,
        notes: notes.trim() || undefined,
      });
      setOk("Route added");
      setName("");
      setOrigin("");
      setDestination("");
      setNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Route}
        title="Route & destination catalog"
        subtitle="Common transfer routes for airport, city, and chauffeur bookings."
        breadcrumb={[{ label: "Transport", to: "/transport" }, { label: "Route & destination catalog" }]}
      />
      <TransportModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form
            onSubmit={(e) => void create(e)}
            className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-2"
          >
            <div className="sm:col-span-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Add route</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="trr-name">
                Name *
              </label>
              <input id="trr-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls} htmlFor="trr-kind">
                Kind
              </label>
              <select id="trr-kind" className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                {SERVICE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {SERVICE_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="trr-origin">
                Origin *
              </label>
              <input
                id="trr-origin"
                className={inputCls}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="trr-dest">
                Destination *
              </label>
              <input
                id="trr-dest"
                className={inputCls}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="trr-notes">
                Notes
              </label>
              <input id="trr-notes" className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              >
                Add route
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-[11px]"
              placeholder="Search routes…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search routes"
            />
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No routes" hint="Add airport / city / chauffeur routes used in bookings." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Kind</th>
                    <th className="px-4 py-2 font-bold">Origin</th>
                    <th className="px-4 py-2 font-bold">Destination</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{r.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {SERVICE_KIND_LABELS[r.kind as keyof typeof SERVICE_KIND_LABELS] || r.kind}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{r.origin}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.destination}</td>
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
