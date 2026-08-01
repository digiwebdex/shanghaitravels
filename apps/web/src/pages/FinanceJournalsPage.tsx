import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { BookOpen, RefreshCw } from "lucide-react";
import { glApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { CostCenter, GlAccount, JournalEntry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import {
  JOURNAL_TYPES,
  emptyLine,
  formatBdt,
  journalLinesPayload,
  validateJournalLines,
  type JournalLineForm,
} from "@/lib/gl";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";

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

  const stats = useMemo(() => {
    const drafts = rows.filter((j) => j.status === "draft").length;
    const posted = rows.filter((j) => j.status === "posted").length;
    return { drafts, posted };
  }, [rows]);

  const columns: Column<JournalEntry>[] = [
    {
      key: "no",
      header: "No",
      render: (j) => (
        <Link to={`/finance/journals/${j.id}`} className="font-bold text-[var(--accent)] hover:underline">
          {j.journalNo}
        </Link>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (j) => new Date(j.entryDate).toLocaleDateString("en-BD"),
    },
    { key: "type", header: "Type", render: (j) => j.type },
    { key: "status", header: "Status", render: (j) => <Pill value={j.status} tone={statusTone(j.status)} /> },
    {
      key: "debit",
      header: "Debit",
      className: "text-right tabular-nums",
      render: (j) => formatBdt(j.totalDebitPoisha),
    },
    {
      key: "credit",
      header: "Credit",
      className: "text-right tabular-nums",
      render: (j) => formatBdt(j.totalCreditPoisha),
    },
  ];

  return (
    <PageShell wide>
      <PageHeader
        icon={BookOpen}
        title="Journal entries"
        subtitle="Double-entry engine — drafts must balance before submit / approve / post."
        breadcrumb={[{ label: "Finance ERP" }, { label: "Journals" }]}
        actions={
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
        }
      />
      <FinanceModuleNav />
      <StatStrip>
        <KpiCard label="Journals" value={rows.length} />
        <KpiCard label="Drafts" value={stats.drafts} tone="warning" />
        <KpiCard label="Posted" value={stats.posted} tone="success" />
      </StatStrip>
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <Can perm="journal:create">
        <Surface>
          <SurfaceHeader title="New journal" />
          <form onSubmit={(e) => void create(e)} className="space-y-3 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
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
                <div key={i} className="grid grid-cols-1 gap-2 rounded-lg p-2 ring-1 ring-[var(--ring-card)] sm:grid-cols-6">
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
                className="text-[11px] font-semibold text-[var(--accent)]"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
              >
                + Add line
              </button>
            </div>
            <button type="submit" className={btnPrimary} style={btnPrimaryStyle}>
              Save draft journal
            </button>
          </form>
        </Surface>
      </Can>

      <Surface>
        <SurfaceHeader title={`${rows.length} journal${rows.length === 1 ? "" : "s"}`} />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No journals"
          emptyHint="Create a balanced draft journal above."
        />
      </Surface>
    </PageShell>
  );
}
