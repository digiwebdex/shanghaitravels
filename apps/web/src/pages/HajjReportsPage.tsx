import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BarChart2 } from "lucide-react";
import {
  PageHeader,
  PageShell,
} from "@/components/enterprise/Page";
import { applicationsApi, hajjGroupsApi, hajjPackagesApi, hajjPilgrimsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Application, HajjGroup, HajjPilgrim, HajjUmrahPackageProduct } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { HajjModuleNav } from "@/components/hajj/HajjModuleNav";
import { fromPoisha, toDateInput } from "@/lib/hajj";

export default function HajjReportsPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [packages, setPackages] = useState<HajjUmrahPackageProduct[]>([]);
  const [pilgrims, setPilgrims] = useState<HajjPilgrim[]>([]);
  const [groups, setGroups] = useState<HajjGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [h, u, p, pil, g] = await Promise.all([
        applicationsApi.list({ serviceType: "hajj", limit: 100 }),
        applicationsApi.list({ serviceType: "umrah", limit: 100 }),
        hajjPackagesApi.list({ limit: 200 }),
        hajjPilgrimsApi.list({ limit: 200 }),
        hajjGroupsApi.list({ limit: 200 }),
      ]);
      setRows([...listOf<Application>(h), ...listOf<Application>(u)]);
      setPackages(listOf<HajjUmrahPackageProduct>(p));
      setPilgrims(listOf<HajjPilgrim>(pil));
      setGroups(listOf<HajjGroup>(g));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load Hajj reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of rows) m.set(a.status, (m.get(a.status) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const visaBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pilgrims) m.set(p.visaStatus || "unknown", (m.get(p.visaStatus || "unknown") || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [pilgrims]);

  const salesPoisha = packages.reduce((s, p) => s + (p.sellingPricePoisha || 0), 0);
  const costPoisha = packages.reduce((s, p) => s + (p.supplierCostPoisha || 0), 0);

  return (
    <PageShell wide>
      <PageHeader
        icon={BarChart2}
        title="Hajj / Umrah reports"
        subtitle="Pilgrims, visa status, flight manifest, rooming, payments, supplier costs, profitability."
        breadcrumb={[{ label: "Hajj & Umrah", to: "/hajj" }, { label: "Hajj / Umrah reports" }]}
      />
      <HajjModuleNav />
        <ErrorBanner message={error} />

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Bookings", value: String(rows.length) },
                { label: "Pilgrims", value: String(pilgrims.length) },
                { label: "Groups", value: String(groups.length) },
                { label: "Packages", value: String(packages.length) },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</p>
                  <p className="text-[22px] font-bold text-slate-800 mt-1">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Catalog sell (sum)", value: `৳${fromPoisha(salesPoisha) || "0.00"}` },
                { label: "Supplier cost (sum)", value: `৳${fromPoisha(costPoisha) || "0.00"}` },
                { label: "Catalog margin", value: `৳${fromPoisha(salesPoisha - costPoisha) || "0.00"}` },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</p>
                  <p className="text-[18px] font-bold text-slate-800 mt-1">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="text-[12px] font-bold text-slate-800 mb-3">Bookings by status</h2>
                {byStatus.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No bookings yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {byStatus.map(([status, n]) => (
                      <li key={status} className="flex justify-between text-[11px] border-b border-slate-50 pb-1.5">
                        <span className="font-semibold text-slate-700">{status}</span>
                        <span className="text-slate-500">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="text-[12px] font-bold text-slate-800 mb-3">Visa status (pilgrims)</h2>
                {visaBreakdown.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No pilgrim profiles yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {visaBreakdown.map(([status, n]) => (
                      <li key={status} className="flex justify-between text-[11px] border-b border-slate-50 pb-1.5">
                        <span className="font-semibold text-slate-700">{status}</span>
                        <span className="text-slate-500">{n}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">Flight manifest (groups)</h2>
              {groups.length === 0 ? (
                <p className="text-[11px] text-slate-400">No groups yet.</p>
              ) : (
                <ul className="space-y-2">
                  {groups.slice(0, 20).map((g) => (
                    <li key={g.id} className="text-[11px] flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-800">{g.code}</span>
                      <span className="text-slate-600">{g.name}</span>
                      <span className="text-slate-500">
                        {[g.airline, g.flightNo].filter(Boolean).join(" ") || "no flight"}
                      </span>
                      <span className="text-slate-400">{toDateInput(g.departAt) || "—"}</span>
                      <span className="text-slate-500">{g.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">Rooming list notes</h2>
              <ul className="space-y-2">
                {groups
                  .filter((g) => g.roomingNote)
                  .slice(0, 15)
                  .map((g) => (
                    <li key={g.id} className="text-[11px] border-b border-slate-50 pb-2">
                      <span className="font-bold text-slate-800">{g.code}</span>
                      <p className="text-slate-600 mt-0.5">{g.roomingNote}</p>
                    </li>
                  ))}
                {groups.every((g) => !g.roomingNote) && (
                  <p className="text-[11px] text-slate-400">No rooming notes yet.</p>
                )}
              </ul>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-3">Recent bookings</h2>
              <ul className="space-y-2">
                {rows.slice(0, 15).map((a) => (
                  <li key={a.id} className="text-[11px] flex flex-wrap gap-x-3 gap-y-1 border-b border-slate-50 pb-2">
                    <Link to={`/hajj/${a.id}`} className="font-bold text-amber-700 hover:underline">
                      {a.referenceNo}
                    </Link>
                    <span className="text-slate-500">{a.serviceType}</span>
                    <span className="text-slate-600">{a.customer?.fullName || "—"}</span>
                    <span className="text-slate-400">
                      stage {a.currentStage}/{a.totalStages}
                    </span>
                    <span className="text-slate-500">{a.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
    </PageShell>
  );
}
