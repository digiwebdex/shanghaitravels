import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { FiscalYear } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";

export default function FinancePeriodsPage() {
  const [years, setYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setYears(await glApi.listFiscalYears());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load fiscal years");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await glApi.createFiscalYear({
        code: code.trim(),
        name: name.trim(),
        startDate,
        endDate,
        createMonthlyPeriods: true,
      });
      setOk("Fiscal year + monthly periods created");
      setCode("");
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  async function closePeriod(id: string) {
    try {
      await glApi.closePeriod(id);
      setOk("Period closed");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Close failed");
    }
  }

  async function reopenPeriod(id: string) {
    try {
      await glApi.reopenPeriod(id);
      setOk("Period reopened");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reopen failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <CalendarRange size={16} className="text-amber-600" /> Fiscal years & periods
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Closing validation blocks posts and unposted journals. Branch-ready periods.
          </p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />
        <Can perm="gl:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className={labelCls}>Code *</label>
              <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required placeholder="FY2026" />
            </div>
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Start *</label>
              <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>End *</label>
              <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div className="sm:col-span-4">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
                Create FY + monthly periods
              </button>
            </div>
          </form>
        </Can>
        {loading ? (
          <div className="flex justify-center py-12">
            <InlineSpinner />
          </div>
        ) : years.length === 0 ? (
          <EmptyState title="No fiscal years" hint="Bootstrap foundation or create a fiscal year." />
        ) : (
          years.map((fy) => (
            <section key={fy.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-[12px] font-bold text-slate-800 mb-2">
                {fy.code} · {fy.name}{" "}
                <span className="text-slate-400 font-semibold">({fy.status})</span>
              </h2>
              <ul className="space-y-1.5">
                {(fy.periods || []).map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-b border-slate-50 pb-1.5">
                    <span>
                      <span className="font-semibold text-slate-800">{p.code}</span>{" "}
                      <span className="text-slate-600">{p.name}</span>{" "}
                      <span className="text-slate-400">{p.status}</span>
                    </span>
                    <Can perm="period:close">
                      {p.status === "open" ? (
                        <button type="button" className="text-amber-700 font-semibold" onClick={() => void closePeriod(p.id)}>
                          Close
                        </button>
                      ) : (
                        <button type="button" className="text-slate-600 font-semibold" onClick={() => void reopenPeriod(p.id)}>
                          Reopen
                        </button>
                      )}
                    </Can>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
