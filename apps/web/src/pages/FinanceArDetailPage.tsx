import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { arApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { ArDocument } from "@/lib/types";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";
import { formatBdt } from "@/lib/gl";

export default function FinanceArDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<ArDocument | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setDoc(await arApi.getDocument(id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
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

  if (loading && !doc) {
    return (
      <div className="flex justify-center py-20">
        <InlineSpinner />
      </div>
    );
  }
  if (!doc) {
    return (
      <div className="p-5">
        <ErrorBanner message={error || "Not found"} />
      </div>
    );
  }

  return (
    <div>
      <div className="p-5 max-w-[1100px] space-y-4">
        <Link to="/finance/ar" className="text-[10px] font-semibold text-[var(--accent)] hover:underline">
          ← AR
        </Link>
        <h1 className="text-[16px] font-bold text-[var(--primary)]">{doc.docNo}</h1>
        <p className="text-[11px] text-[var(--muted-foreground)]">
          {doc.type} · {doc.status} · {doc.customer?.fullName} · {formatBdt(doc.totalPoisha)}
          {doc.journal ? ` · GL ${doc.journal.journalNo}` : ""}
          {doc.application ? ` · Case ${doc.application.referenceNo}` : ""}
        </p>
        <FinanceModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="ar:manage">
          <div className="flex flex-wrap gap-2">
            {["draft", "rejected"].includes(doc.status) && (
              <button disabled={busy} type="button" onClick={() => void run(() => arApi.submit(doc.id), "Submitted")} className="px-3 py-1.5 rounded-lg border text-[10.5px] font-semibold">
                Submit
              </button>
            )}
            {doc.status === "pending_approval" && !doc.approvedBy && (
              <>
                <button disabled={busy} type="button" onClick={() => void run(() => arApi.approve(doc.id), "Approved")} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                  Approve
                </button>
                <button disabled={busy} type="button" onClick={() => void run(() => arApi.reject(doc.id, "Rejected"), "Rejected")} className="px-3 py-1.5 rounded-lg border border-red-200 text-[10.5px] font-semibold text-red-700">
                  Reject
                </button>
              </>
            )}
            {(doc.status === "approved" || doc.status === "draft" || (doc.status === "pending_approval" && doc.approvedBy)) && (
              <button disabled={busy} type="button" onClick={() => void run(() => arApi.post(doc.id), "Posted to GL")} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#059669,#047857)" }}>
                Post to GL
              </button>
            )}
            {doc.status !== "posted" && doc.status !== "void" && (
              <button disabled={busy} type="button" onClick={() => void run(() => arApi.void(doc.id, "Voided"), "Voided")} className="px-3 py-1.5 rounded-lg border text-[10.5px] font-semibold">
                Void
              </button>
            )}
          </div>
        </Can>

        <div className="bg-white rounded-xl border border-[var(--border)] overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase text-[var(--muted-foreground)] border-b">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(doc.lines || []).map((l) => (
                <tr key={l.lineNo} className="border-b border-[var(--border)] text-[11px]">
                  <td className="px-3 py-2">{l.lineNo}</td>
                  <td className="px-3 py-2">{l.description}</td>
                  <td className="px-3 py-2">{formatBdt(l.amountPoisha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--muted-foreground)]">Open balance: {formatBdt(doc.balancePoisha)}</p>
      </div>
    </div>
  );
}
