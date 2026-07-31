import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Plus, Search, Map } from "lucide-react";
import { applicationsApi, customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { STATUS_PILL, inputCls, labelCls } from "@/components/cases/formStyles";
import { TourModuleNav } from "@/components/tours/TourModuleNav";

export default function TourListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await applicationsApi.list({
        serviceType: "tour",
        limit: 100,
        q: q || undefined,
        status: status || undefined,
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load tour bookings");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <DemoBadge moduleKey="tours" />
      <div className="p-5 max-w-[1200px]">
        <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              <Map size={16} className="text-amber-600" /> Tour Packages
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {total} bookings · supplier-curated packages (not an OTA marketplace)
            </p>
          </div>
          <Can perm="application:create">
            <Link
              to="/tours/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
            >
              <Plus size={13} /> New tour booking
            </Link>
          </Can>
        </div>

        <TourModuleNav />
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
                aria-label="Search tour bookings"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-2 border border-slate-200 rounded-lg text-[11px] bg-white"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {[
                "draft",
                "in_progress",
                "docs_required",
                "on_hold",
                "submitted",
                "approved",
                "rejected",
                "completed",
                "cancelled",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
            <EmptyState title="No tour bookings" hint="Create a booking or adjust filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Reference</th>
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
                        <Link
                          to={`/tours/${a.id}`}
                          className="text-[11px] font-bold text-amber-700 hover:underline"
                        >
                          {a.referenceNo}
                        </Link>
                      </td>
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

export function NewTourCasePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
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
        serviceType: "tour",
        customerId,
        priority,
        title: title.trim() || `Tour — ${cust?.fullName || "customer"}`,
        direction: "outbound",
      });
      navigate(`/tours/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5 max-w-[640px]">
      <TourModuleNav />
      <h1 className="text-[16px] font-bold text-slate-800 mb-1">New tour booking</h1>
      <p className="text-[11px] text-slate-500 mb-4">
        Creates an Application and applies the active tour workflow template.
      </p>
      <ErrorBanner message={error} />
      <form
        onSubmit={(e) => void submit(e)}
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
      >
        <div>
          <label className={labelCls} htmlFor="tr-customer">
            Customer *
          </label>
          <select
            id="tr-customer"
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
          <label className={labelCls} htmlFor="tr-priority">
            Priority
          </label>
          <select
            id="tr-priority"
            className={inputCls}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {["low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="tr-title">
            Title
          </label>
          <input
            id="tr-title"
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
            onClick={() => navigate("/tours")}
            className="px-4 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
