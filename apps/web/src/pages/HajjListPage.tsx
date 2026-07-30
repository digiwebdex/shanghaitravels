import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, Moon } from "lucide-react";
import { applicationsApi, customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { STATUS_PILL, inputCls, labelCls } from "@/components/cases/formStyles";
import { HajjModuleNav } from "@/components/hajj/HajjModuleNav";

export default function HajjListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const types = kind ? [kind] : ["hajj", "umrah"];
      const results = await Promise.all(
        types.map((serviceType) =>
          applicationsApi.list({
            serviceType,
            limit: 100,
            q: q || undefined,
            status: status || undefined,
          }),
        ),
      );
      const data = results.flatMap((r) => listOf<Application>(r));
      data.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setRows(data);
      setTotal(data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load Hajj/Umrah bookings");
    } finally {
      setLoading(false);
    }
  }, [q, status, kind]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <DemoBadge moduleKey="hajj" />
      <div className="p-5 max-w-[1200px]">
        <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <Moon size={16} className="text-amber-600" /> Hajj & Umrah
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {total} bookings · pilgrims, packages, groups, visas, flights, hotels, payments
            </p>
          </div>
          <Can perm="application:create">
            <Link
              to="/hajj/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
            >
              <Plus size={13} /> New booking
            </Link>
          </Can>
        </div>

        <HajjModuleNav />
        <ErrorBanner message={error} />

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void load()}
                placeholder="Search ref / customer…"
                className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-400"
                aria-label="Search Hajj bookings"
              />
            </div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="px-2.5 py-2 border border-slate-200 rounded-lg text-[11px] bg-white"
              aria-label="Filter by kind"
            >
              <option value="">Hajj + Umrah</option>
              <option value="hajj">Hajj only</option>
              <option value="umrah">Umrah only</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-2 border border-slate-200 rounded-lg text-[11px] bg-white"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {["draft", "in_progress", "docs_required", "on_hold", "submitted", "approved", "rejected", "completed", "cancelled"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No Hajj/Umrah bookings" hint="Create a booking or adjust filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Reference</th>
                    <th className="px-4 py-2 font-bold">Kind</th>
                    <th className="px-4 py-2 font-bold">Customer</th>
                    <th className="px-4 py-2 font-bold">Title</th>
                    <th className="px-4 py-2 font-bold">Stage</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className="px-4 py-2.5">
                        <Link to={`/hajj/${a.id}`} className="text-[11px] font-bold text-amber-700 hover:underline">
                          {a.referenceNo}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-600">{a.serviceType}</td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-700">
                        {a.customer?.fullName || a.customerId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-600">{a.title || "—"}</td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-500">
                        {a.currentStage}/{a.totalStages}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_PILL[a.status] || STATUS_PILL.draft}`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewHajjCasePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [serviceType, setServiceType] = useState<"hajj" | "umrah">("hajj");
  const [priority, setPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void customersApi
      .list({ limit: 200 })
      .then((r) => setCustomers(listOf<Customer>(r)))
      .catch(() => setCustomers([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Select a customer");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cust = customers.find((c) => c.id === customerId);
      const app = await applicationsApi.create({
        serviceType,
        customerId,
        priority,
        title: title.trim() || `${serviceType === "hajj" ? "Hajj" : "Umrah"} — ${cust?.fullName || "customer"}`,
        direction: "outbound",
      });
      navigate(`/hajj/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 max-w-[640px]">
      <HajjModuleNav />
      <h1 className="text-[16px] font-bold text-slate-800 mb-1">New Hajj / Umrah booking</h1>
      <p className="text-[11px] text-slate-500 mb-4">
        Creates an Application and applies the active hajj or umrah workflow template.
      </p>
      <ErrorBanner message={error} />
      <form onSubmit={(e) => void submit(e)} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <label className={labelCls} htmlFor="hj-kind">
            Kind *
          </label>
          <select
            id="hj-kind"
            className={inputCls}
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as "hajj" | "umrah")}
          >
            <option value="hajj">Hajj</option>
            <option value="umrah">Umrah</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="hj-customer">
            Customer *
          </label>
          <select
            id="hj-customer"
            className={inputCls}
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">— select —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.code})
              </option>
            ))}
          </select>
          <Link to="/customers" className="text-[10px] text-amber-600 font-semibold mt-1 inline-block">
            Create customer first →
          </Link>
        </div>
        <div>
          <label className={labelCls} htmlFor="hj-priority">
            Priority
          </label>
          <select id="hj-priority" className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            {["low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="hj-title">
            Title
          </label>
          <input
            id="hj-title"
            className={inputCls}
            placeholder="Auto if blank"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg text-[11px] font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            {loading ? "Creating…" : "Create booking"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/hajj")}
            className="px-4 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
