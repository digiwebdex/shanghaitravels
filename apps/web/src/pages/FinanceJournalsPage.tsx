import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { BookOpen } from "lucide-react";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { CostCenter, GlAccount, JournalEntry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { inputCls, labelCls } from "@/components/cases/formStyles";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import {
  JOURNAL_TYPES,
  emptyLine,
  formatBdt,
  journalLinesPayload,
  validateJournalLines,
  type JournalLineForm,
} from "@/lib/gl";

export default function FinanceJournalsPage() {
  const [rows, setRows] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<GlAccount[]>([]);
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("standard");
  const [memo, setMemo] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<JournalLineForm[]>([emptyLine(), emptyLine()]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [j, a, c] = await Promise.all([
        glApi.listJournals({ limit: 100 }),
        glApi.listAccounts({ active: "true" }),
        glApi.listCostCenters(),
      ]);
      setRows(j);
      setAccounts(a.filter((x) => x.isPostable !== false && !x.isHeader));
      setCenters(c);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load journals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    const bad = validateJournalLines(lines);
    if (bad) {
      setError(bad);
      return;
    }
    setError("");
    setOk("");
    try {
      const je = await glApi.createJournal({
        entryDate: new Date(`${entryDate}T12:00:00`).toISOString(),
        type,
        memo: memo.trim() || undefined,
        reference: reference.trim() || undefined,
        currencyCode: "BDT",
        lines: journalLinesPayload(lines),
      });
      setOk(`Journal ${je.journalNo} created as draft`);
      setMemo("");
      setReference("");
      setLines([emptyLine(), emptyLine()]);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <div>
      <DemoBadge moduleKey="finance" />
      <div className="p-5 max-w-[1200px] space-y-4">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={16} className="text-amber-600" /> Journal entries
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Double-entry engine — drafts must balance before submit / approve / post.
          </p>
        </div>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="journal:create">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase">New journal</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className={labelCls}>Entry date</label>
                <input type="date" className={inputCls} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
                  {JOURNAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Reference</label>
                <input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Memo</label>
                <input className={inputCls} value={memo} onChange={(e) => setMemo(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-2 border border-slate-100 rounded-lg p-2">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Account</label>
                    <select
                      className={inputCls}
                      value={l.glAccountId}
                      onChange={(e) =>
                        setLines((prev) => prev.map((x, j) => (j === i ? { ...x, glAccountId: e.target.value } : x)))
                      }
                    >
                      <option value="">— select —</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} · {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Cost center</label>
                    <select
                      className={inputCls}
                      value={l.costCenterId}
                      onChange={(e) =>
                        setLines((prev) => prev.map((x, j) => (j === i ? { ...x, costCenterId: e.target.value } : x)))
                      }
                    >
                      <option value="">—</option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Debit ৳</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={l.debitBdt}
                      onChange={(e) =>
                        setLines((prev) => prev.map((x, j) => (j === i ? { ...x, debitBdt: e.target.value, creditBdt: "" } : x)))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Credit ৳</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputCls}
                      value={l.creditBdt}
                      onChange={(e) =>
                        setLines((prev) => prev.map((x, j) => (j === i ? { ...x, creditBdt: e.target.value, debitBdt: "" } : x)))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Memo</label>
                    <input
                      className={inputCls}
                      value={l.memo}
                      onChange={(e) =>
                        setLines((prev) => prev.map((x, j) => (j === i ? { ...x, memo: e.target.value } : x)))
                      }
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-[10px] font-semibold text-amber-700"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
              >
                + Add line
              </button>
            </div>
            <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
              Save draft journal
            </button>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No journals" hint="Create a balanced draft journal above." />
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-2 font-bold">No</th>
                  <th className="px-4 py-2 font-bold">Date</th>
                  <th className="px-4 py-2 font-bold">Type</th>
                  <th className="px-4 py-2 font-bold">Status</th>
                  <th className="px-4 py-2 font-bold">Debit</th>
                  <th className="px-4 py-2 font-bold">Credit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((j) => (
                  <tr key={j.id} className="border-b border-slate-50 text-[11px]">
                    <td className="px-4 py-2.5">
                      <Link to={`/finance/journals/${j.id}`} className="font-bold text-amber-700 hover:underline">
                        {j.journalNo}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{new Date(j.entryDate).toLocaleDateString("en-BD")}</td>
                    <td className="px-4 py-2.5">{j.type}</td>
                    <td className="px-4 py-2.5">{j.status}</td>
                    <td className="px-4 py-2.5">{formatBdt(j.totalDebitPoisha)}</td>
                    <td className="px-4 py-2.5">{formatBdt(j.totalCreditPoisha)}</td>
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
