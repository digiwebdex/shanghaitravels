import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FileCheck, User, BookOpen, ArrowRight } from "lucide-react";
import { applicationsApi, customersApi } from "@/lib/services";
import { listOf } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { useAuth } from "@/auth/AuthProvider";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { ErrorBanner } from "@/components/Feedback";

export default function DashboardPage() {
  const { user, can } = useAuth();
  const [customers, setCustomers] = useState(0);
  const [visaCases, setVisaCases] = useState(0);
  const [openCases, setOpenCases] = useState(0);
  const [recent, setRecent] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const tasks: Promise<void>[] = [];
        if (can("customer:read")) {
          tasks.push(
            customersApi.list({ limit: 1 }).then((r) => {
              if (cancelled) return;
              if (r && typeof r === "object" && "total" in r) setCustomers((r as { total: number }).total);
              else setCustomers(listOf<Customer>(r).length);
            }),
          );
        }
        if (can("application:read")) {
          tasks.push(
            applicationsApi.list({ serviceType: "visa", limit: 50 }).then((r) => {
              if (cancelled) return;
              const rows = listOf<Application>(r);
              const total = r && typeof r === "object" && "total" in r ? (r as { total: number }).total : rows.length;
              setVisaCases(total);
              setOpenCases(rows.filter((a) => !["approved", "rejected", "completed", "cancelled"].includes(a.status)).length);
              setRecent(rows.slice(0, 8));
            }),
          );
        }
        await Promise.all(tasks);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [can]);

  const cards = [
    { label: "Customers", value: customers, icon: User, to: "/customers", show: can("customer:read") },
    { label: "Visa cases", value: visaCases, icon: FileCheck, to: "/visa", show: can("application:read") },
    { label: "Open visa cases", value: openCases, icon: BookOpen, to: "/visa", show: can("application:read") },
  ].filter((c) => c.show);

  return (
    <div className="p-5 max-w-[1200px]">
      <div className="mb-5">
        <h1 className="text-[16px] font-bold text-slate-800">Dashboard</h1>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Welcome, {user?.fullName || user?.email}. Phase A — visa vertical (live data).
        </p>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex justify-center py-16">
          <InlineSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {cards.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <c.icon size={14} className="text-amber-600" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</span>
                </div>
                <p className="text-[22px] font-black text-slate-800">{c.value}</p>
              </Link>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-[12px] font-bold text-slate-700">Recent visa cases</p>
              <Link to="/visa" className="text-[10.5px] font-semibold text-amber-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-[11px] text-slate-400 px-4 py-10 text-center">No records yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[9.5px] uppercase tracking-wider text-slate-400 border-b border-slate-50">
                    <th className="px-4 py-2 font-bold">Ref</th>
                    <th className="px-4 py-2 font-bold">Customer</th>
                    <th className="px-4 py-2 font-bold">Stage</th>
                    <th className="px-4 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className="px-4 py-2.5">
                        <Link to={`/visa/${a.id}`} className="text-[11px] font-mono font-bold text-amber-700 hover:underline">
                          {a.referenceNo}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-700">{a.customer?.fullName || "—"}</td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-500">
                        {a.currentStage}/{a.totalStages}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
