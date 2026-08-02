import { FormEvent, useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { fsApi, glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { FiscalYear } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";

type ReopenReq = {
  id: string;
  periodId: string;
  reason: string;
  status: string;
  period?: { code: string; name: string; status: string };
};

export default function FinanceClosingPage() {
  const [years, setYears] = useState<FiscalYear[]>([]);
  const [requests, setRequests] = useState<ReopenReq[]>([]);
  const [runs, setRuns] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [reason, setReason] = useState("");
  const [targetPeriod, setTargetPeriod] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [fy, reqs, cr] = await Promise.all([
        glApi.listFiscalYears(),
        fsApi.listReopenRequests().catch(() => [] as ReopenReq[]),
        fsApi.closingRuns().catch(() => [] as unknown[]),
      ]);
      setYears(fy);
      setRequests(reqs as ReopenReq[]);
      setRuns(cr as unknown[]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load closing console");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function lock(id: string) {
    try {
      await fsApi.lockPeriod(id);
      setOk("Period locked");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Lock failed");
    }
  }

  async function requestReopen(e: FormEvent) {
    e.preventDefault();
    if (!targetPeriod || !reason.trim()) {
      setError("Period and reason required");
      return;
    }
    try {
      await fsApi.reopenRequest(targetPeriod, reason.trim());
      setOk("Reopen request submitted");
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    }
  }

  async function yearEnd(fyId: string) {
    try {
      await fsApi.yearEndClose(fyId);
      setOk("Year-end close completed");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Year-end failed");
    }
  }

  async function rollForward(fyId: string) {
    try {
      await fsApi.rollForward(fyId);
      setOk("Opening balances rolled forward");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Roll-forward failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Lock}
        title="Period closing & year-end"
        subtitle="Lock closed periods, approve reopenals, year-end close, and OB roll-forward."
        breadcrumb={[{ label: "Finance ERP", to: "/finance" }, { label: "Period closing & year-end" }]}
      />
      <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        {loading ? (
          <div className="flex justify-center py-16">
            <InlineSpinner />
          </div>
        ) : (
          <>
            <section className="bg-white rounded-xl border border-[var(--border)] p-4 space-y-3">
              <h2 className="text-[12px] font-bold text-[var(--primary)]">Fiscal years</h2>
              {years.map((y) => (
                <div key={y.id} className="border-b border-[var(--border)] pb-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[12px] font-bold text-[var(--primary)]">
                      {y.code} · {y.name}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{y.status}</span>
                    <Can perm="period:close">
                      {y.status !== "closed" && (
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg border border-[var(--border)] text-[10px] font-semibold"
                          onClick={() => void yearEnd(y.id)}
                        >
                          Year-end close
                        </button>
                      )}
                      {y.status === "closed" && (
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg border border-amber-200 text-[10px] font-semibold text-amber-800"
                          onClick={() => void rollForward(y.id)}
                        >
                          Roll forward OB
                        </button>
                      )}
                    </Can>
                  </div>
                  <ul className="space-y-1">
                    {(y.periods || []).map((p) => (
                      <li key={p.id} className="text-[11px] flex flex-wrap gap-2 items-center">
                        <span className="font-semibold w-20">{p.code}</span>
                        <span className="text-[var(--muted-foreground)]">{p.status}</span>
                        <Can perm="period:lock">
                          {p.status === "closed" && (
                            <button
                              type="button"
                              className="text-[10px] font-semibold text-[var(--accent)]"
                              onClick={() => void lock(p.id)}
                            >
                              Lock
                            </button>
                          )}
                        </Can>
                        {(p.status === "closed" || p.status === "locked") && (
                          <button
                            type="button"
                            className="text-[10px] text-[var(--muted-foreground)]"
                            onClick={() => setTargetPeriod(p.id)}
                          >
                            Request reopen
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <Can perm="period:close">
              <form onSubmit={(e) => void requestReopen(e)} className="bg-white rounded-xl border border-[var(--border)] p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className={labelCls}>Period ID</label>
                  <input className={inputCls} value={targetPeriod} onChange={(e) => setTargetPeriod(e.target.value)} required />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Reason *</label>
                  <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} required />
                </div>
                <div className="sm:col-span-3">
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                    Submit reopen request
                  </button>
                </div>
              </form>
            </Can>

            <Can perm="period:reopen-approve">
              <section className="bg-white rounded-xl border border-[var(--border)] p-4">
                <h2 className="text-[12px] font-bold text-[var(--primary)] mb-2">Pending reopen approvals</h2>
                {requests.filter((r) => r.status === "pending").length === 0 ? (
                  <p className="text-[11px] text-[var(--muted-foreground)]">No pending requests.</p>
                ) : (
                  <ul className="space-y-2">
                    {requests
                      .filter((r) => r.status === "pending")
                      .map((r) => (
                        <li key={r.id} className="text-[11px] flex flex-wrap gap-2 items-center border-b border-[var(--border)] pb-2">
                          <span className="font-semibold">{r.period?.code || r.periodId}</span>
                          <span className="text-[var(--muted-foreground)]">{r.reason}</span>
                          <button
                            type="button"
                            className="text-emerald-700 font-semibold"
                            onClick={() =>
                              void fsApi
                                .reopenApprove(r.periodId)
                                .then(() => load())
                                .catch((e) => setError(e instanceof ApiError ? e.message : "Approve failed"))
                            }
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="text-red-700 font-semibold"
                            onClick={() =>
                              void fsApi
                                .reopenReject(r.periodId, "Rejected in UI")
                                .then(() => load())
                                .catch((e) => setError(e instanceof ApiError ? e.message : "Reject failed"))
                            }
                          >
                            Reject
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </section>
            </Can>

            <section className="bg-white rounded-xl border border-[var(--border)] p-4">
              <h2 className="text-[12px] font-bold text-[var(--primary)] mb-2">Closing runs</h2>
              {runs.length === 0 ? (
                <p className="text-[11px] text-[var(--muted-foreground)]">None yet.</p>
              ) : (
                <pre className="text-[10px] bg-[var(--muted)] p-3 rounded-lg overflow-auto max-h-64">{JSON.stringify(runs, null, 2)}</pre>
              )}
            </section>
          </>
        )}
    </PageShell>
  );
}
