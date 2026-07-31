import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { fsApi, glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { JournalEntry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";

export default function FinanceJournalDetailPage() {
  const { id } = useParams();
  const [je, setJe] = useState<JournalEntry | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      setJe(await glApi.getJournal(id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load journal");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await action();
      setOk(success);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !je) {
    return (
      <div className="flex justify-center py-20">
        <InlineSpinner />
      </div>
    );
  }
  if (!je) {
    return (
      <div className="p-5">
        <ErrorBanner message={error || "Journal not found"} />
        <Link to="/finance/journals" className="text-[11px] text-amber-600 font-semibold">
          ← Journals
        </Link>
      </div>
    );
  }

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <div>
          <Link to="/finance/journals" className="text-[10px] font-semibold text-amber-600 hover:underline">
            ← Journals
          </Link>
          <h1 className="text-[16px] font-bold text-slate-800 mt-1">{je.journalNo}</h1>
          <p className="text-[11px] text-slate-500">
            {je.type} · {je.status} · {new Date(je.entryDate).toLocaleDateString("en-BD")} · period{" "}
            {je.period?.code || "—"}
          </p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] text-slate-600 mb-3">{je.memo || "No memo"}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="px-3 py-2 font-bold">#</th>
                  <th className="px-3 py-2 font-bold">Account</th>
                  <th className="px-3 py-2 font-bold">Debit</th>
                  <th className="px-3 py-2 font-bold">Credit</th>
                  <th className="px-3 py-2 font-bold">Memo</th>
                </tr>
              </thead>
              <tbody>
                {(je.lines || []).map((l) => (
                  <tr key={l.id || l.lineNo} className="border-b border-slate-50 text-[11px]">
                    <td className="px-3 py-2">{l.lineNo}</td>
                    <td className="px-3 py-2 font-semibold">
                      {l.glAccount ? `${l.glAccount.code} · ${l.glAccount.name}` : l.glAccountId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">{l.debitPoisha ? formatBdt(l.debitPoisha) : "—"}</td>
                    <td className="px-3 py-2">{l.creditPoisha ? formatBdt(l.creditPoisha) : "—"}</td>
                    <td className="px-3 py-2 text-slate-500">{l.memo || "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-[11px] font-bold">
                  <td className="px-3 py-2" colSpan={2}>
                    Totals
                  </td>
                  <td className="px-3 py-2">{formatBdt(je.totalDebitPoisha)}</td>
                  <td className="px-3 py-2">{formatBdt(je.totalCreditPoisha)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-2">
          <Can perm="journal:create">
            {(je.status === "draft" || je.status === "rejected") && (
              <button
                type="button"
                disabled={busy}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
                onClick={() => run(() => glApi.submitJournal(je.id), "Submitted for approval")}
              >
                Submit for approval
              </button>
            )}
          </Can>
          <Can perm="journal:approve">
            {je.status === "pending_approval" && !je.approvedBy && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
                  onClick={() => run(() => glApi.approveJournal(je.id), "Approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-[10.5px] font-semibold text-red-700 disabled:opacity-50"
                  onClick={() => run(() => glApi.rejectJournal(je.id, "Rejected in UI"), "Rejected")}
                >
                  Reject
                </button>
              </>
            )}
            {(je.status === "draft" || (je.status === "pending_approval" && je.approvedBy)) && (
              <button
                type="button"
                disabled={busy}
                className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#10B981,#047857)" }}
                onClick={() => run(() => glApi.postJournal(je.id), "Posted to ledger")}
              >
                Post
              </button>
            )}
            {je.status !== "void" && (
              <button
                type="button"
                disabled={busy}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
                onClick={() => run(() => glApi.voidJournal(je.id, "Voided in UI"), "Voided")}
              >
                Void
              </button>
            )}
            {je.status === "posted" && (
              <button
                type="button"
                disabled={busy}
                className="px-3 py-1.5 rounded-lg border border-amber-200 text-[10.5px] font-semibold text-amber-800 disabled:opacity-50"
                onClick={() => run(() => fsApi.reverseJournal(je.id), "Reversal posted")}
              >
                Reverse (adjustment)
              </button>
            )}
          </Can>
        </section>
      </div>
    </div>
  );
}
