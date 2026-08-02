import { FormEvent, useCallback, useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { hajjGroupsApi, hajjPackagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { HajjGroup, HajjUmrahPackageProduct } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { HajjModuleNav } from "@/components/hajj/HajjModuleNav";
import { GROUP_STATUSES, HAJJ_KINDS, fromDateInput, toDateInput } from "@/lib/hajj";

export default function HajjGroupsPage() {
  const [rows, setRows] = useState<HajjGroup[]>([]);
  const [packages, setPackages] = useState<HajjUmrahPackageProduct[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState("hajj");
  const [packageId, setPackageId] = useState("");
  const [season, setSeason] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [leaderName, setLeaderName] = useState("");
  const [leaderPhone, setLeaderPhone] = useState("");
  const [capacity, setCapacity] = useState("");
  const [flightNo, setFlightNo] = useState("");
  const [airline, setAirline] = useState("");
  const [transportNote, setTransportNote] = useState("");
  const [hotelMakkah, setHotelMakkah] = useState("");
  const [hotelMadinah, setHotelMadinah] = useState("");
  const [roomingNote, setRoomingNote] = useState("");
  const [status, setStatus] = useState("forming");
  const [departAt, setDepartAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [g, p] = await Promise.all([
        hajjGroupsApi.list({ q: q || undefined, limit: 200 }),
        hajjPackagesApi.list({ active: "true", limit: 200 }),
      ]);
      setRows(listOf<HajjGroup>(g));
      setPackages(listOf<HajjUmrahPackageProduct>(p));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Code and name are required");
      return;
    }
    setError("");
    setOk("");
    try {
      await hajjGroupsApi.create({
        code: code.trim(),
        name: name.trim(),
        kind,
        packageId: packageId || undefined,
        season: season.trim() || undefined,
        year: year.trim() || undefined,
        leaderName: leaderName.trim() || undefined,
        leaderPhone: leaderPhone.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        flightNo: flightNo.trim() || undefined,
        airline: airline.trim() || undefined,
        transportNote: transportNote.trim() || undefined,
        hotelMakkah: hotelMakkah.trim() || undefined,
        hotelMadinah: hotelMadinah.trim() || undefined,
        roomingNote: roomingNote.trim() || undefined,
        status,
        departAt: fromDateInput(departAt) ?? null,
        returnAt: fromDateInput(returnAt) ?? null,
        notes: notes.trim() || undefined,
      });
      setOk("Group created");
      setCode("");
      setName("");
      setLeaderName("");
      setFlightNo("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={UsersRound}
        title="Group operations"
        subtitle="Leader assignment, flights, hotels, ground transport, rooming, departure / return schedules."
        breadcrumb={[{ label: "Hajj & Umrah", to: "/hajj" }, { label: "Group operations" }]}
      />
      <HajjModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-3">
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">Add group</p>
            </div>
            <div>
              <label className={labelCls}>Code *</label>
              <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Kind</label>
              <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
                {HAJJ_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Package</label>
              <select className={inputCls} value={packageId} onChange={(e) => setPackageId(e.target.value)}>
                <option value="">— optional —</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {GROUP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Season</label>
              <input className={inputCls} value={season} onChange={(e) => setSeason(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <input className={inputCls} value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Capacity</label>
              <input type="number" min="1" className={inputCls} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Leader</label>
              <input className={inputCls} value={leaderName} onChange={(e) => setLeaderName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Leader phone</label>
              <input className={inputCls} value={leaderPhone} onChange={(e) => setLeaderPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Airline</label>
              <input className={inputCls} value={airline} onChange={(e) => setAirline(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Flight no</label>
              <input className={inputCls} value={flightNo} onChange={(e) => setFlightNo(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Depart</label>
              <input type="date" className={inputCls} value={departAt} onChange={(e) => setDepartAt(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Return</label>
              <input type="date" className={inputCls} value={returnAt} onChange={(e) => setReturnAt(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hotel Makkah</label>
              <input className={inputCls} value={hotelMakkah} onChange={(e) => setHotelMakkah(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hotel Madinah</label>
              <input className={inputCls} value={hotelMadinah} onChange={(e) => setHotelMadinah(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Ground transport</label>
              <textarea className={inputCls} rows={2} value={transportNote} onChange={(e) => setTransportNote(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Rooming list notes</label>
              <textarea className={inputCls} rows={2} value={roomingNote} onChange={(e) => setRoomingNote(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Notes</label>
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                Save group
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-[var(--border)] rounded-lg text-[11px]"
              placeholder="Search groups…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search groups"
            />
            <button type="button" onClick={() => void load()} className="px-3 py-2 rounded-lg border border-[var(--border)] text-[11px] font-semibold">
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No groups" hint="Create a group for departure operations." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-[var(--muted-foreground)] border-b border-[var(--border)]">
                    <th className="px-4 py-2 font-bold">Code</th>
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Leader</th>
                    <th className="px-4 py-2 font-bold">Flight</th>
                    <th className="px-4 py-2 font-bold">Depart</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((g) => (
                    <tr key={g.id} className="border-b border-[var(--border)] text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-[var(--primary)]">{g.code}</td>
                      <td className="px-4 py-2.5 text-[var(--primary)]">{g.name}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{g.leaderName || "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">
                        {[g.airline, g.flightNo].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{toDateInput(g.departAt) || "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--muted-foreground)]">{g.status}</td>
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
