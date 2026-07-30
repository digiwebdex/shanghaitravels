import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Plus, Search } from "lucide-react";
import { applicationsApi, customersApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { VISA_TYPE_OPTIONS } from "@/config/checklist";

const STATUS_PILL: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-800",
  docs_required: "bg-orange-100 text-orange-800",
  on_hold: "bg-slate-200 text-slate-700",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function VisaListPage() {
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
        serviceType: "visa",
        limit: 100,
        q: q || undefined,
        status: status || undefined,
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load visa cases");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <DemoBadge moduleKey="visa" />
      <div className="p-5 max-w-[1200px]">
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h1 className="text-[16px] font-bold text-slate-800">Visa Management</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">{total} China visa cases · CVASC workflow</p>
          </div>
          <Can perm="application:create">
            <Link
              to="/visa/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
            >
              <Plus size={13} /> New Visa Case
            </Link>
          </Can>
        </div>

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
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-2 border border-slate-200 rounded-lg text-[11px] bg-white"
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
              className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No records yet" hint="Create a China visa case to start the CVASC pipeline." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-[9.5px] uppercase tracking-wider text-slate-400 border-b border-slate-50">
                  <th className="px-4 py-2 font-bold">Ref</th>
                  <th className="px-4 py-2 font-bold">Customer</th>
                  <th className="px-4 py-2 font-bold">Title</th>
                  <th className="px-4 py-2 font-bold">Stage</th>
                  <th className="px-4 py-2 font-bold">Priority</th>
                  <th className="px-4 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="px-4 py-2.5">
                      <Link to={`/visa/${a.id}`} className="text-[11px] font-mono font-bold text-amber-700 hover:underline">
                        {a.referenceNo}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-700">{a.customer?.fullName || "—"}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500 max-w-[220px] truncate">{a.title || "—"}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600">
                      {a.currentStage}/{a.totalStages}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500">{a.priority}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${STATUS_PILL[a.status] || "bg-slate-100 text-slate-600"}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewVisaCasePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetCustomer = params.get("customerId") || "";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(presetCustomer);
  const [title, setTitle] = useState("");
  const [visaType, setVisaType] = useState("tourist");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void customersApi.list({ limit: 200 }).then((r) => setCustomers(listOf<Customer>(r))).catch(() => setCustomers([]));
  }, []);

  const selected = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Pick a customer");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const caseTitle =
        title.trim() ||
        `China ${VISA_TYPE_OPTIONS.find((v) => v.value === visaType)?.label || visaType} — ${selected?.fullName || ""}`.trim();
      const app = await applicationsApi.create({
        serviceType: "visa",
        customerId,
        title: caseTitle,
        priority,
        direction: "outbound",
      });
      await applicationsApi.putVisa(app.id, {
        visaType,
        destination: "China",
        entryType: "single",
        embassy: "CVASC Dhaka",
      });
      navigate(`/visa/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create case");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-amber-400";

  return (
    <div className="p-5 max-w-[640px]">
      <h1 className="text-[16px] font-bold text-slate-800 mb-1">New China visa case</h1>
      <p className="text-[11px] text-slate-500 mb-4">Creates an Application and applies the active CVASC workflow template.</p>
      <ErrorBanner message={error} />
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Customer *</label>
          <select className={inputCls} required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
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
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Visa type</label>
          <select className={inputCls} value={visaType} onChange={(e) => setVisaType(e.target.value)}>
            {VISA_TYPE_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Priority</label>
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            {["low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 mb-1">Title</label>
          <input className={inputCls} placeholder="Auto if blank" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg text-[11px] font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            {loading ? "Creating…" : "Create case"}
          </button>
          <button type="button" onClick={() => navigate("/visa")} className="px-4 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
